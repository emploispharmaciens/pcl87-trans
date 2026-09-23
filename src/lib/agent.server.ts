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
  "plans",
] as const;

/** Valeurs autorisées pour le champ « plans » (plusieurs possibles). */
const PLANS_AUTORISES = ["os", "tendon_ligament", "profond", "sous_cutane", "peau"];

type Champ = (typeof CHAMPS_COMPLETABLES)[number];

const ETAPES = ["motivation", "explication", "methode"] as const;

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

function normaliser(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function versSlug(value: string): string {
  return normaliser(value)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function slugLibre(table: "sutures" | "protocoles", base: string): Promise<string> {
  const db = await admin();
  const racine = base || "element";
  const { data } = await db.from(table).select("slug").like("slug", `${racine}%`);
  const pris = new Set((data ?? []).map((r) => r.slug));
  if (!pris.has(racine)) return racine;
  let n = 2;
  while (pris.has(`${racine}-${n}`)) n += 1;
  return `${racine}-${n}`;
}

const FAMILLES = [
  "resorbable_tresse",
  "resorbable_monobrin",
  "non_resorbable_monobrin",
  "non_resorbable_tresse",
  "haute_resistance",
  "agrafe_cutanee",
  "accessoire",
] as const;

const DISPONIBILITES = ["a_sortir", "a_la_demande"] as const;

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
    "Tu peux créer des fils, des protocoles, des chirurgiens et des liens : tout ce que tu crées porte l'étiquette « à valider ». Tu ne modifies ni ne supprimes jamais un élément existant.",
    "Chaque création porte sa source : le nom de la fiche de picking et la phrase exacte d'où vient l'information.",
    "Avant de créer un fil, appelle « trouver_fil » : il existe peut-être sous un autre nom. Applique la convention de nommage : https://github.com/emploispharmaciens/pcl87-trans/blob/main/docs/convention-nommage-fils.md",
    "Cours : une idée par ligne, séparée par un saut de ligne. Première ligne = ce qu'est le fil. Une ligne « Piège : … ». Dernière ligne « Source : … ».",
  ],
  actions: {
    aide: "Affiche ce mode d'emploi.",
    lister_fils: "Liste les fils, avec leurs cases vides et leur nombre de photos.",
    lire_fil: "Détail d'un fil. Paramètre : id ou slug.",
    completer_fil: `Remplit des cases vides d'un fil. Paramètres : id, champs (objet). Champs autorisés : ${CHAMPS_COMPLETABLES.join(", ")}. « plans » est une liste parmi : ${PLANS_AUTORISES.join(", ")}.`,
    ajouter_photo: `Ajoute une photo depuis une adresse https. Paramètres : id, url, source (texte obligatoire : d'où vient l'image). ${MAX_SUTURE_PHOTOS} photos au maximum par fil.`,
    trouver_fil:
      "Retrouve un fil à partir de ce qui est écrit dans une fiche de picking. Paramètre : nom. Cherche dans les noms des fils et dans leurs noms de terrain. Renvoie les correspondances exactes puis proches.",
    ajouter_nom_terrain:
      "Rattache une écriture de fiche de picking à un fil. Paramètres : id (du fil), nom, source. Refusé si ce nom est déjà rattaché.",
    creer_fil:
      "Crée un fil absent de l'appli, marqué « à valider ». Paramètres : marque, calibre, famille, source, et en option les champs complétables. Refusé si un fil de même marque et même calibre existe.",
    lister_protocoles: "Liste les protocoles opératoires et leur nombre de fils.",
    lire_protocole: "Détail d'un protocole opératoire et de ses fils. Paramètre : id ou slug.",
    creer_protocole:
      "Crée un protocole opératoire absent de l'appli, marqué « à valider ». Paramètres : nom, source, et en option region, description.",
    creer_lien:
      "Relie un fil à un protocole opératoire, marqué « à valider ». Paramètres : fil_id, protocole_id, source, et en option quantite, plan, disponibilite (a_sortir ou a_la_demande), note. Refusé si le lien existe déjà.",
    completer_lien:
      "Remplit les cases vides d'un lien existant. Paramètres : fil_id, protocole_id, champs (quantite, plan, disponibilite, note).",
    lister_chirurgiens: "Liste les chirurgiens.",
    creer_chirurgien:
      "Crée un chirurgien, marqué « à valider ». Paramètres : nom (ex. « Dr Dupont »), source, et en option initiales, specialite.",
    lier_chirurgien:
      "Relie un fil à un chirurgien quand ce fil lui est propre, marqué « à valider ». Paramètres : fil_id, chirurgien_id, source, et en option note.",
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
    champs: z.record(z.string(), z.union([z.string().max(20000), z.array(z.string()).max(10)])),
  }),
  ajouter_photo: z.object({
    id: z.string().uuid(),
    url: z.string().url().max(2000),
    source: z.string().min(3).max(500),
  }),
  trouver_fil: z.object({ nom: z.string().min(1).max(200) }),
  ajouter_nom_terrain: z.object({
    id: z.string().uuid(),
    nom: z.string().min(1).max(200),
    source: z.string().min(3).max(1000),
  }),
  creer_fil: z.object({
    marque: z.string().min(2).max(200),
    calibre: z.string().max(20).nullable().optional(),
    famille: z.enum(FAMILLES),
    source: z.string().min(3).max(1000),
    champs: z
      .record(z.string(), z.union([z.string().max(20000), z.array(z.string()).max(10)]))
      .optional(),
  }),
  lire_protocole: z
    .object({ id: z.string().uuid().optional(), slug: z.string().min(1).optional() })
    .refine((v) => v.id || v.slug, "Donne id ou slug"),
  creer_protocole: z.object({
    nom: z.string().min(3).max(200),
    source: z.string().min(3).max(1000),
    region: z.string().max(50).optional(),
    description: z.string().max(2000).optional(),
  }),
  creer_lien: z.object({
    fil_id: z.string().uuid(),
    protocole_id: z.string().uuid(),
    source: z.string().min(3).max(1000),
    quantite: z.string().max(50).optional(),
    plan: z.enum(["os", "tendon_ligament", "profond", "sous_cutane", "peau"]).optional(),
    disponibilite: z.enum(DISPONIBILITES).optional(),
    note: z.string().max(1000).optional(),
  }),
  completer_lien: z.object({
    fil_id: z.string().uuid(),
    protocole_id: z.string().uuid(),
    champs: z.record(z.string(), z.string().max(1000)),
  }),
  creer_chirurgien: z.object({
    nom: z.string().min(2).max(200),
    source: z.string().min(3).max(1000),
    initiales: z.string().max(10).optional(),
    specialite: z.string().max(100).optional(),
  }),
  lier_chirurgien: z.object({
    fil_id: z.string().uuid(),
    chirurgien_id: z.string().uuid(),
    source: z.string().min(3).max(1000),
    note: z.string().max(1000).optional(),
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
  const update: Partial<Record<Exclude<Champ, "plans">, string>> & { plans?: string[] } = {};

  for (const [champ, brut] of Object.entries(params.champs)) {
    if (!(CHAMPS_COMPLETABLES as readonly string[]).includes(champ)) {
      refuses.push({ champ, raison: "Champ non autorisé pour un agent" });
      continue;
    }
    if (!estVide(row[champ])) {
      refuses.push({ champ, raison: "Case déjà remplie : seules les cases vides sont complétées" });
      continue;
    }
    if (champ === "plans") {
      const plans = (Array.isArray(brut) ? brut : [brut]).map((p) => p.trim()).filter(Boolean);
      const inconnus = plans.filter((p) => !PLANS_AUTORISES.includes(p));
      if (plans.length === 0) {
        refuses.push({ champ, raison: "Valeur vide" });
      } else if (inconnus.length > 0) {
        refuses.push({
          champ,
          raison: `Plan inconnu : ${inconnus.join(", ")}. Valeurs possibles : ${PLANS_AUTORISES.join(", ")}`,
        });
      } else {
        update.plans = [...new Set(plans)];
        remplis.push(champ);
      }
      continue;
    }
    if (Array.isArray(brut)) {
      refuses.push({ champ, raison: "Ce champ attend un texte, pas une liste" });
      continue;
    }
    const valeur = brut.trim();
    if (valeur === "") {
      refuses.push({ champ, raison: "Valeur vide" });
    } else {
      update[champ as Exclude<Champ, "plans">] = valeur;
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
        apres: [update[champ as Champ] ?? ""].flat().join(", ") || null,
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

/* ------------------------------------------------------------------ */
/* Phase 4a : fils, protocoles, chirurgiens, liens                      */
/* ------------------------------------------------------------------ */

async function trouverFil(params: z.infer<typeof schemas.trouver_fil>) {
  const db = await admin();
  const cible = normaliser(params.nom);
  const [{ data: fils }, { data: noms }] = await Promise.all([
    db.from("sutures").select("id, slug, marque, calibre, famille, statut"),
    db.from("suture_noms").select("suture_id, nom"),
  ]);
  const parId = new Map((fils ?? []).map((f) => [f.id, f]));
  const exacts = new Map<string, { fil: unknown; via: string }>();
  const proches = new Map<string, { fil: unknown; via: string }>();
  for (const f of fils ?? []) {
    const n = normaliser(f.marque ?? "");
    if (n === cible) exacts.set(f.id, { fil: f, via: "nom du fil" });
    else if (n && (n.includes(cible) || cible.includes(n)))
      proches.set(f.id, { fil: f, via: "nom du fil" });
  }
  for (const nom of noms ?? []) {
    const f = parId.get(nom.suture_id);
    if (!f) continue;
    const n = normaliser(nom.nom);
    if (n === cible) exacts.set(f.id, { fil: f, via: `nom de terrain « ${nom.nom} »` });
    else if (!exacts.has(f.id) && (n.includes(cible) || cible.includes(n)))
      proches.set(f.id, { fil: f, via: `nom de terrain « ${nom.nom} »` });
  }
  for (const id of exacts.keys()) proches.delete(id);
  return { exacts: [...exacts.values()], proches: [...proches.values()] };
}

async function ajouterNomTerrain(
  agent: string,
  params: z.infer<typeof schemas.ajouter_nom_terrain>,
) {
  const db = await admin();
  const nom = params.nom.trim();
  const { data: fil } = await db
    .from("sutures")
    .select("id, marque")
    .eq("id", params.id)
    .maybeSingle();
  if (!fil) throw new Error("Fil introuvable");
  const { data: existants } = await db.from("suture_noms").select("suture_id, nom");
  const deja = (existants ?? []).find((e) => normaliser(e.nom) === normaliser(nom));
  if (deja) {
    throw new Error(
      deja.suture_id === params.id
        ? "Ce nom de terrain est déjà rattaché à ce fil"
        : "Ce nom de terrain est déjà rattaché à un AUTRE fil : signale-le à Manu",
    );
  }
  const { data: row, error } = await db
    .from("suture_noms")
    .insert({ suture_id: params.id, nom, source: params.source.trim() })
    .select("id")
    .single();
  if (error || !row) throw new Error(error?.message ?? "Création impossible");
  await journaliser(agent, {
    action: "ajouter_nom_terrain",
    table_cible: "suture_noms",
    ligne_id: row.id,
    champ: fil.marque,
    avant: null,
    apres: `${nom} — ${params.source.trim()}`,
  });
  return { nom_id: row.id };
}

async function creerFil(agent: string, params: z.infer<typeof schemas.creer_fil>) {
  const db = await admin();
  const marque = params.marque.trim().toUpperCase();
  const calibre = params.calibre?.trim() || null;
  const { data: fils } = await db.from("sutures").select("id, marque, calibre");
  const doublon = (fils ?? []).find(
    (f) =>
      normaliser(f.marque ?? "") === normaliser(marque) &&
      normaliser(f.calibre ?? "") === normaliser(calibre ?? ""),
  );
  if (doublon) throw new Error(`Ce fil existe déjà (id ${doublon.id}) : utilise-le`);

  const extra: Record<string, string | string[]> = {};
  for (const [champ, valeur] of Object.entries(params.champs ?? {})) {
    if (!(CHAMPS_COMPLETABLES as readonly string[]).includes(champ)) continue;
    if (champ === "plans") {
      const plans = (Array.isArray(valeur) ? valeur : [valeur]).filter((p) =>
        PLANS_AUTORISES.includes(p),
      );
      if (plans.length > 0) extra["plans"] = plans;
    } else if (typeof valeur === "string" && valeur.trim()) {
      extra[champ] = valeur.trim();
    }
  }
  const slug = await slugLibre("sutures", versSlug(`${marque} ${calibre ?? ""}`));
  const { data: row, error } = await db
    .from("sutures")
    .insert({
      ...extra,
      marque,
      calibre,
      famille: params.famille,
      slug,
      statut: "actif",
      a_valider: true,
      source: `agent:${agent}`,
    })
    .select("id, slug")
    .single();
  if (error || !row) throw new Error(error?.message ?? "Création impossible");
  await journaliser(agent, {
    action: "creer_fil",
    table_cible: "sutures",
    ligne_id: row.id,
    champ: "nouveau fil",
    avant: null,
    apres: `${marque} ${calibre ?? ""} — ${params.source.trim()}`,
  });
  return { fil_id: row.id, slug: row.slug };
}

async function listerProtocoles() {
  const db = await admin();
  const [{ data: protocoles, error }, { data: liens }] = await Promise.all([
    db.from("protocoles").select("id, slug, nom, region, a_valider").order("nom"),
    db.from("suture_protocoles").select("protocole_id"),
  ]);
  if (error) throw new Error(error.message);
  return (protocoles ?? []).map((p) => ({
    ...p,
    nb_fils: (liens ?? []).filter((l) => l.protocole_id === p.id).length,
  }));
}

async function lireProtocole(params: z.infer<typeof schemas.lire_protocole>) {
  const db = await admin();
  let query = db.from("protocoles").select("*");
  query = params.id ? query.eq("id", params.id) : query.eq("slug", params.slug ?? "");
  const { data: protocole } = await query.maybeSingle();
  if (!protocole) throw new Error("Protocole introuvable");
  const { data: liens } = await db
    .from("suture_protocoles")
    .select(
      "quantite, plan, disponibilite, note, a_valider, source, fil:sutures(id, slug, marque, calibre)",
    )
    .eq("protocole_id", protocole.id);
  return { protocole, fils: liens ?? [] };
}

async function creerProtocole(agent: string, params: z.infer<typeof schemas.creer_protocole>) {
  const db = await admin();
  const nom = params.nom.trim();
  const { data: existants } = await db.from("protocoles").select("id, nom");
  const doublon = (existants ?? []).find((p) => normaliser(p.nom) === normaliser(nom));
  if (doublon) throw new Error(`Ce protocole existe déjà (id ${doublon.id}) : utilise-le`);
  const slug = await slugLibre("protocoles", versSlug(nom));
  const { data: row, error } = await db
    .from("protocoles")
    .insert({
      nom,
      slug,
      region: params.region?.trim() || null,
      description: params.description?.trim() || null,
      a_valider: true,
      source: params.source.trim(),
    })
    .select("id, slug")
    .single();
  if (error || !row) throw new Error(error?.message ?? "Création impossible");
  await journaliser(agent, {
    action: "creer_protocole",
    table_cible: "protocoles",
    ligne_id: row.id,
    champ: "nouveau protocole",
    avant: null,
    apres: `${nom} — ${params.source.trim()}`,
  });
  return { protocole_id: row.id, slug: row.slug };
}

async function creerLien(agent: string, params: z.infer<typeof schemas.creer_lien>) {
  const db = await admin();
  const { data: existant } = await db
    .from("suture_protocoles")
    .select("suture_id")
    .eq("suture_id", params.fil_id)
    .eq("protocole_id", params.protocole_id)
    .maybeSingle();
  if (existant)
    throw new Error("Ce lien existe déjà : utilise « completer_lien » pour ses cases vides");
  const { error } = await db.from("suture_protocoles").insert({
    suture_id: params.fil_id,
    protocole_id: params.protocole_id,
    quantite: params.quantite?.trim() || null,
    plan: params.plan ?? null,
    disponibilite: params.disponibilite ?? null,
    note: params.note?.trim() || null,
    a_valider: true,
    source: params.source.trim(),
  });
  if (error) throw new Error(error.message);
  await journaliser(agent, {
    action: "creer_lien",
    table_cible: "suture_protocoles",
    ligne_id: params.fil_id,
    champ: `protocole ${params.protocole_id}`,
    avant: null,
    apres: params.source.trim(),
  });
  return { statut: "lien créé, à valider" };
}

async function completerLien(agent: string, params: z.infer<typeof schemas.completer_lien>) {
  const db = await admin();
  const { data: lien } = await db
    .from("suture_protocoles")
    .select("quantite, plan, disponibilite, note")
    .eq("suture_id", params.fil_id)
    .eq("protocole_id", params.protocole_id)
    .maybeSingle();
  if (!lien) throw new Error("Lien introuvable");
  const row = lien as Record<string, string | null>;
  const remplis: string[] = [];
  const refuses: { champ: string; raison: string }[] = [];
  const update: Partial<Record<"quantite" | "plan" | "disponibilite" | "note", string>> = {};
  for (const [champ, brut] of Object.entries(params.champs)) {
    const valeur = brut.trim();
    if (!["quantite", "plan", "disponibilite", "note"].includes(champ)) {
      refuses.push({ champ, raison: "Champ non autorisé" });
    } else if (!valeur) {
      refuses.push({ champ, raison: "Valeur vide" });
    } else if (!estVide(row[champ])) {
      refuses.push({ champ, raison: "Case déjà remplie : seules les cases vides sont complétées" });
    } else if (champ === "plan" && !PLANS_AUTORISES.includes(valeur)) {
      refuses.push({
        champ,
        raison: `Plan inconnu. Valeurs possibles : ${PLANS_AUTORISES.join(", ")}`,
      });
    } else if (
      champ === "disponibilite" &&
      !(DISPONIBILITES as readonly string[]).includes(valeur)
    ) {
      refuses.push({ champ, raison: "Valeurs possibles : a_sortir, a_la_demande" });
    } else {
      update[champ as "quantite" | "plan" | "disponibilite" | "note"] = valeur;
      remplis.push(champ);
    }
  }
  if (remplis.length > 0) {
    const { error } = await db
      .from("suture_protocoles")
      .update(update)
      .eq("suture_id", params.fil_id)
      .eq("protocole_id", params.protocole_id);
    if (error) throw new Error(error.message);
    for (const champ of remplis) {
      await journaliser(agent, {
        action: "completer_lien",
        table_cible: "suture_protocoles",
        ligne_id: params.fil_id,
        champ: `${champ} (protocole ${params.protocole_id})`,
        avant: null,
        apres: update[champ as keyof typeof update] ?? null,
      });
    }
  }
  return { remplis, refuses };
}

async function listerChirurgiens() {
  const db = await admin();
  const { data, error } = await db
    .from("chirurgiens")
    .select("id, nom, initiales, specialite, a_valider")
    .order("nom");
  if (error) throw new Error(error.message);
  return data ?? [];
}

async function creerChirurgien(agent: string, params: z.infer<typeof schemas.creer_chirurgien>) {
  const db = await admin();
  const nom = params.nom.trim();
  const { data: existants } = await db.from("chirurgiens").select("id, nom");
  const doublon = (existants ?? []).find((c) => normaliser(c.nom) === normaliser(nom));
  if (doublon) throw new Error(`Ce chirurgien existe déjà (id ${doublon.id}) : utilise-le`);
  const { data: row, error } = await db
    .from("chirurgiens")
    .insert({
      nom,
      initiales: params.initiales?.trim() || null,
      specialite: params.specialite?.trim() || null,
      a_valider: true,
      source: params.source.trim(),
    })
    .select("id")
    .single();
  if (error || !row) throw new Error(error?.message ?? "Création impossible");
  await journaliser(agent, {
    action: "creer_chirurgien",
    table_cible: "chirurgiens",
    ligne_id: row.id,
    champ: "nouveau chirurgien",
    avant: null,
    apres: `${nom} — ${params.source.trim()}`,
  });
  return { chirurgien_id: row.id };
}

async function lierChirurgien(agent: string, params: z.infer<typeof schemas.lier_chirurgien>) {
  const db = await admin();
  const { data: existant } = await db
    .from("suture_chirurgiens")
    .select("suture_id")
    .eq("suture_id", params.fil_id)
    .eq("chirurgien_id", params.chirurgien_id)
    .maybeSingle();
  if (existant) throw new Error("Ce lien fil-chirurgien existe déjà");
  const { error } = await db.from("suture_chirurgiens").insert({
    suture_id: params.fil_id,
    chirurgien_id: params.chirurgien_id,
    note: params.note?.trim() || null,
    a_valider: true,
    source: params.source.trim(),
  });
  if (error) throw new Error(error.message);
  await journaliser(agent, {
    action: "lier_chirurgien",
    table_cible: "suture_chirurgiens",
    ligne_id: params.fil_id,
    champ: `chirurgien ${params.chirurgien_id}`,
    avant: null,
    apres: params.source.trim(),
  });
  return { statut: "lien créé, à valider" };
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
    case "trouver_fil":
      return trouverFil(schemas.trouver_fil.parse(params ?? {}));
    case "ajouter_nom_terrain":
      return ajouterNomTerrain(agent, schemas.ajouter_nom_terrain.parse(params ?? {}));
    case "creer_fil":
      return creerFil(agent, schemas.creer_fil.parse(params ?? {}));
    case "lister_protocoles":
      return listerProtocoles();
    case "lire_protocole":
      return lireProtocole(schemas.lire_protocole.parse(params ?? {}));
    case "creer_protocole":
      return creerProtocole(agent, schemas.creer_protocole.parse(params ?? {}));
    case "creer_lien":
      return creerLien(agent, schemas.creer_lien.parse(params ?? {}));
    case "completer_lien":
      return completerLien(agent, schemas.completer_lien.parse(params ?? {}));
    case "lister_chirurgiens":
      return listerChirurgiens();
    case "creer_chirurgien":
      return creerChirurgien(agent, schemas.creer_chirurgien.parse(params ?? {}));
    case "lier_chirurgien":
      return lierChirurgien(agent, schemas.lier_chirurgien.parse(params ?? {}));
    case "lire_formation":
      return lireFormation();
    case "completer_formation":
      return completerFormation(agent, schemas.completer_formation.parse(params ?? {}));
    default:
      throw new Error(`Action inconnue : ${action}. Utilise l'action « aide ».`);
  }
}
