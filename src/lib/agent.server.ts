/**
 * Accès des agents (Letta) au module Sutures.
 * Règle actuelle : un agent ne remplit que des cases vides, et ne supprime rien.
 * Chaque écriture est inscrite dans le journal des agents.
 */
import { createHash } from "node:crypto";
import { z } from "zod";
import {
  MAX_SUTURE_PHOTOS,
  SUTURE_CONTENT_TYPE,
  downloadImage,
  storeSutureImage,
} from "@/lib/suture-images.server";

/** Champs d'un fil qu'un agent peut compléter (jamais marque, calibre, famille, statut). */
export const CHAMPS_COMPLETABLES = [
  "composition",
  "couleur",
  "type_aiguille",
  "longueur",
  "reference",
  "usage_notes",
  "note_qualite",
  "cours",
] as const;

type Champ = (typeof CHAMPS_COMPLETABLES)[number];

const ETAPES = ["motivation", "explication", "methode"] as const;

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

function estVide(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === "string") return value.trim() === "";
  if (Array.isArray(value)) return value.length === 0;
  return false;
}

/** Vérifie la clé envoyée par l'agent. Renvoie le nom de l'agent, ou null. */
export async function authentifierAgent(cle: string): Promise<string | null> {
  if (!cle || cle.length < 32) return null;
  const hash = createHash("sha256").update(cle, "utf8").digest("hex");
  const db = await admin();
  const { data } = await db
    .from("agent_cles")
    .select("id, nom, actif")
    .eq("cle_hash", hash)
    .maybeSingle();
  if (!data || !data.actif) return null;
  await db.from("agent_cles").update({ last_used_at: new Date().toISOString() }).eq("id", data.id);
  return data.nom;
}

async function journaliser(
  agent: string,
  entry: {
    action: string;
    table_cible: string;
    ligne_id?: string | null;
    champ?: string | null;
    avant?: string | null;
    apres?: string | null;
  },
) {
  const db = await admin();
  await db.from("agent_journal").insert({ agent, ...entry });
}

/* ------------------------------------------------------------------ */
/* Actions                                                              */
/* ------------------------------------------------------------------ */

const AIDE = {
  regles: [
    "Tu ne remplis que des cases vides. Une case déjà remplie est refusée.",
    "Tu ne peux modifier ni la marque, ni le calibre, ni la famille, ni le statut d'un fil.",
    "Tu ne peux rien supprimer.",
    "Le calibre « 2 » et le calibre « 2/0 » sont deux fils différents.",
    "N'écris que des informations vérifiées. Si tu n'es pas sûr, laisse la case vide.",
    "Chaque écriture est journalisée avec l'avant et l'après.",
  ],
  actions: {
    aide: "Affiche ce mode d'emploi.",
    lister_fils: "Liste les fils, avec leurs cases vides et leur nombre de photos.",
    lire_fil: "Détail d'un fil. Paramètre : id ou slug.",
    completer_fil: `Remplit des cases vides d'un fil. Paramètres : id, champs (objet). Champs autorisés : ${CHAMPS_COMPLETABLES.join(", ")}.`,
    ajouter_photo: `Ajoute une photo depuis une adresse https. Paramètres : id, url, source (texte obligatoire : d'où vient l'image). ${MAX_SUTURE_PHOTOS} photos au maximum par fil.`,
    lire_formation: "Contenu de la formation, bloc par bloc.",
    completer_formation:
      "Soit remplit un bloc vide (paramètres : bloc_id, points), soit ajoute un nouveau bloc (paramètres : etape, titre, points). Étapes : motivation, explication, methode.",
  },
};

const schemas = {
  lire_fil: z
    .object({ id: z.string().uuid().optional(), slug: z.string().min(1).optional() })
    .refine((v) => v.id || v.slug, "Donne id ou slug"),
  completer_fil: z.object({
    id: z.string().uuid(),
    champs: z.record(z.string(), z.string().max(20000)),
  }),
  ajouter_photo: z.object({
    id: z.string().uuid(),
    url: z.string().url().max(2000),
    source: z.string().min(3).max(500),
  }),
  completer_formation: z.union([
    z.object({
      bloc_id: z.string().uuid(),
      points: z.array(z.string().min(1).max(1000)).min(1).max(30),
    }),
    z.object({
      etape: z.enum(ETAPES),
      titre: z.string().min(3).max(200),
      points: z.array(z.string().min(1).max(1000)).min(1).max(30),
    }),
  ]),
};

async function listerFils() {
  const db = await admin();
  const [{ data: fils, error }, { data: images }] = await Promise.all([
    db
      .from("sutures")
      .select(`id, slug, marque, calibre, famille, statut, ${CHAMPS_COMPLETABLES.join(", ")}`)
      .order("marque"),
    db.from("content_images").select("content_id").eq("content_type_code", SUTURE_CONTENT_TYPE),
  ]);
  if (error) throw new Error(error.message);
  return (fils ?? []).map((f) => {
    const row = f as unknown as Record<string, unknown>;
    return {
      id: row["id"],
      slug: row["slug"],
      marque: row["marque"],
      calibre: row["calibre"],
      famille: row["famille"],
      statut: row["statut"],
      cases_vides: CHAMPS_COMPLETABLES.filter((c) => estVide(row[c])),
      nb_photos: (images ?? []).filter((i) => i.content_id === row["id"]).length,
    };
  });
}

async function lireFil(params: z.infer<typeof schemas.lire_fil>) {
  const db = await admin();
  let query = db.from("sutures").select("*");
  query = params.id ? query.eq("id", params.id) : query.eq("slug", params.slug ?? "");
  const { data: fil } = await query.maybeSingle();
  if (!fil) throw new Error("Fil introuvable");

  const [{ data: liens }, { data: images }] = await Promise.all([
    db
      .from("suture_protocoles")
      .select("quantite, note, protocole:protocoles(nom, region)")
      .eq("suture_id", fil.id),
    db
      .from("content_images")
      .select("id, position, source")
      .eq("content_type_code", SUTURE_CONTENT_TYPE)
      .eq("content_id", fil.id)
      .order("position"),
  ]);
  const row = fil as unknown as Record<string, unknown>;
  return {
    fil,
    cases_vides: CHAMPS_COMPLETABLES.filter((c) => estVide(row[c])),
    interventions: liens ?? [],
    photos: images ?? [],
  };
}

async function completerFil(agent: string, params: z.infer<typeof schemas.completer_fil>) {
  const db = await admin();
  const { data: fil } = await db.from("sutures").select("*").eq("id", params.id).maybeSingle();
  if (!fil) throw new Error("Fil introuvable");
  const row = fil as unknown as Record<string, unknown>;

  const remplis: string[] = [];
  const refuses: { champ: string; raison: string }[] = [];
  const update: Partial<Record<Champ, string>> = {};

  for (const [champ, brut] of Object.entries(params.champs)) {
    const valeur = brut.trim();
    if (!(CHAMPS_COMPLETABLES as readonly string[]).includes(champ)) {
      refuses.push({ champ, raison: "Champ non autorisé pour un agent" });
    } else if (valeur === "") {
      refuses.push({ champ, raison: "Valeur vide" });
    } else if (!estVide(row[champ])) {
      refuses.push({ champ, raison: "Case déjà remplie : seules les cases vides sont complétées" });
    } else {
      update[champ as Champ] = valeur;
      remplis.push(champ);
    }
  }

  if (remplis.length > 0) {
    const { error } = await db.from("sutures").update(update).eq("id", params.id);
    if (error) throw new Error(error.message);
    for (const champ of remplis) {
      await journaliser(agent, {
        action: "completer_fil",
        table_cible: "sutures",
        ligne_id: params.id,
        champ,
        avant: null,
        apres: update[champ as Champ] ?? null,
      });
    }
  }
  return { remplis, refuses };
}

async function ajouterPhoto(agent: string, params: z.infer<typeof schemas.ajouter_photo>) {
  const image = await downloadImage(params.url);
  const row = await storeSutureImage({
    sutureId: params.id,
    ...image,
    source: params.source.trim(),
  });
  await journaliser(agent, {
    action: "ajouter_photo",
    table_cible: "content_images",
    ligne_id: row.id,
    champ: "source",
    avant: null,
    apres: `${params.source.trim()} — ${params.url}`,
  });
  return { photo_id: row.id, position: row.position };
}

async function lireFormation() {
  const db = await admin();
  const { data, error } = await db
    .from("formation_blocs")
    .select("id, etape, ordre, titre, points")
    .eq("module", "sutures")
    .order("etape")
    .order("ordre");
  if (error) throw new Error(error.message);
  return data ?? [];
}

async function completerFormation(
  agent: string,
  params: z.infer<typeof schemas.completer_formation>,
) {
  const db = await admin();
  const points = params.points.map((p) => p.trim()).filter(Boolean);

  if ("bloc_id" in params) {
    const { data: bloc } = await db
      .from("formation_blocs")
      .select("id, points")
      .eq("id", params.bloc_id)
      .maybeSingle();
    if (!bloc) throw new Error("Bloc introuvable");
    if (!estVide(bloc.points)) {
      throw new Error("Bloc déjà rempli : seules les cases vides sont complétées");
    }
    const { error } = await db.from("formation_blocs").update({ points }).eq("id", bloc.id);
    if (error) throw new Error(error.message);
    await journaliser(agent, {
      action: "completer_formation",
      table_cible: "formation_blocs",
      ligne_id: bloc.id,
      champ: "points",
      avant: null,
      apres: points.join("\n"),
    });
    return { bloc_id: bloc.id, statut: "bloc rempli" };
  }

  const { data: derniers } = await db
    .from("formation_blocs")
    .select("ordre")
    .eq("module", "sutures")
    .eq("etape", params.etape)
    .order("ordre", { ascending: false })
    .limit(1);
  const ordre = (derniers?.[0]?.ordre ?? 0) + 10;
  const { data: bloc, error } = await db
    .from("formation_blocs")
    .insert({ module: "sutures", etape: params.etape, ordre, titre: params.titre.trim(), points })
    .select("id")
    .single();
  if (error || !bloc) throw new Error(error?.message ?? "Création impossible");
  await journaliser(agent, {
    action: "completer_formation",
    table_cible: "formation_blocs",
    ligne_id: bloc.id,
    champ: "nouveau bloc",
    avant: null,
    apres: `${params.titre.trim()}\n${points.join("\n")}`,
  });
  return { bloc_id: bloc.id, statut: "bloc ajouté" };
}

/** Exécute une action demandée par un agent authentifié. */
export async function executerAction(agent: string, action: string, params: unknown) {
  switch (action) {
    case "aide":
      return AIDE;
    case "lister_fils":
      return listerFils();
    case "lire_fil":
      return lireFil(schemas.lire_fil.parse(params ?? {}));
    case "completer_fil":
      return completerFil(agent, schemas.completer_fil.parse(params ?? {}));
    case "ajouter_photo":
      return ajouterPhoto(agent, schemas.ajouter_photo.parse(params ?? {}));
    case "lire_formation":
      return lireFormation();
    case "completer_formation":
      return completerFormation(agent, schemas.completer_formation.parse(params ?? {}));
    default:
      throw new Error(`Action inconnue : ${action}. Utilise l'action « aide ».`);
  }
}
