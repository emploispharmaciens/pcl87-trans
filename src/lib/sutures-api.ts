import { evaluerFiche } from "@/lib/sutures-completude";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Suture = Tables<"sutures">;
export type Protocole = Tables<"protocoles">;

export type SutureFamily =
  | "resorbable_tresse"
  | "resorbable_monobrin"
  | "non_resorbable_monobrin"
  | "non_resorbable_tresse"
  | "haute_resistance"
  | "agrafe_cutanee"
  | "accessoire";

export const SUTURE_FAMILIES: SutureFamily[] = [
  "resorbable_tresse",
  "resorbable_monobrin",
  "non_resorbable_monobrin",
  "non_resorbable_tresse",
  "haute_resistance",
  "agrafe_cutanee",
  "accessoire",
];

export const FAMILY_LABELS: Record<string, string> = {
  resorbable_tresse: "Résorbable tressé",
  resorbable_monobrin: "Résorbable monobrin",
  non_resorbable_monobrin: "Non résorbable monobrin",
  non_resorbable_tresse: "Non résorbable tressé",
  haute_resistance: "Haute résistance",
  agrafe_cutanee: "Agrafes cutanées",
  accessoire: "Accessoire (pas un fil)",
};

/**
 * Couleur de chaque famille. Elle reprend, quand c'est possible, la teinte réelle
 * du fil : violet pour les résorbables tressés, bleu pour les monobrins non
 * résorbables, vert pour les polyesters tressés.
 */
export const FAMILY_COLORS: Record<string, string> = {
  resorbable_tresse: "#7c3aed",
  resorbable_monobrin: "#0891b2",
  non_resorbable_monobrin: "#2563eb",
  non_resorbable_tresse: "#16a34a",
  haute_resistance: "#ea580c",
  agrafe_cutanee: "#475569",
  accessoire: "#a8a29e",
};

export function familyColor(famille: string | null | undefined): string {
  return FAMILY_COLORS[famille ?? ""] ?? "#9ca3af";
}

/** Plans de suture : où le fil est utilisé. Plusieurs plans possibles par fil. */
export const PLANS = ["os", "tendon_ligament", "profond", "sous_cutane", "peau"] as const;
export type Plan = (typeof PLANS)[number];

export const PLAN_LABELS: Record<string, string> = {
  os: "Os et cerclage",
  tendon_ligament: "Tendon et ligament",
  profond: "Plan profond",
  sous_cutane: "Sous-cutané",
  peau: "Peau",
};

export const PLAN_ICONS: Record<string, string> = {
  os: "bi-diagram-2",
  tendon_ligament: "bi-bezier",
  profond: "bi-layers",
  sous_cutane: "bi-layers-half",
  peau: "bi-bandaid",
};

export const FAMILY_SHORT: Record<string, string> = {
  resorbable_tresse: "Résorbable tressé",
  resorbable_monobrin: "Résorbable mono",
  non_resorbable_monobrin: "Non résorb. mono",
  non_resorbable_tresse: "Non résorb. tressé",
  haute_resistance: "Haute résistance",
  agrafe_cutanee: "Agrafes",
  accessoire: "Accessoire",
};

/** Avertissement à afficher en tête du module. */

export type LienInfos = {
  quantite: string | null;
  note: string | null;
  plan: string | null;
  disponibilite: string | null;
  a_valider: boolean;
  source: string | null;
};

export type SutureUsage = LienInfos & { protocole: Protocole };

export type Chirurgien = {
  id: string;
  nom: string;
  initiales: string | null;
  specialite: string | null;
  a_valider: boolean;
};

export type SutureChirurgien = {
  chirurgien: Chirurgien;
  note: string | null;
  a_valider: boolean;
};

export type SutureNom = { id: string; nom: string; source: string | null };

export type SutureWithUsage = Suture & {
  usages: SutureUsage[];
  noms: SutureNom[];
  chirurgiens: SutureChirurgien[];
};

export type ProtocoleWithFils = Protocole & {
  fils: (LienInfos & { suture: Suture })[];
};

type LinkRow = LienInfos & {
  suture_id: string;
  protocole_id: string;
};

type ChirLinkRow = {
  suture_id: string;
  chirurgien_id: string;
  note: string | null;
  a_valider: boolean;
};
type NomRow = SutureNom & { suture_id: string };

/** Ordre de fermeture : de la profondeur vers la peau. */
export const PLAN_ORDER = ["os", "tendon_ligament", "profond", "sous_cutane", "peau"];

export const DISPONIBILITE_LABELS: Record<string, string> = {
  a_sortir: "À sortir",
  a_la_demande: "À la demande",
};

function lienInfos(l: LinkRow): LienInfos {
  return {
    quantite: l.quantite,
    note: l.note,
    plan: l.plan ?? null,
    disponibilite: l.disponibilite ?? null,
    a_valider: Boolean(l.a_valider),
    source: l.source ?? null,
  };
}

async function fetchRaw() {
  const [sutures, protocoles, links, chirurgiens, chirLinks, noms] = await Promise.all([
    supabase.from("sutures").select("*").order("marque", { ascending: true }),
    supabase.from("protocoles").select("*").order("nom", { ascending: true }),
    supabase.from("suture_protocoles").select("*"),
    supabase.from("chirurgiens").select("id, nom, initiales, specialite, a_valider").order("nom"),
    supabase.from("suture_chirurgiens").select("suture_id, chirurgien_id, note, a_valider"),
    supabase.from("suture_noms").select("id, suture_id, nom, source").order("nom"),
  ]);
  if (sutures.error) throw sutures.error;
  if (protocoles.error) throw protocoles.error;
  if (links.error) throw links.error;
  // Tables de la phase 4a : absentes tant que la migration n'est pas passée.
  return {
    sutures: (sutures.data ?? []) as Suture[],
    protocoles: (protocoles.data ?? []) as Protocole[],
    links: (links.data ?? []) as unknown as LinkRow[],
    chirurgiens: (chirurgiens.error ? [] : (chirurgiens.data ?? [])) as Chirurgien[],
    chirLinks: (chirLinks.error ? [] : (chirLinks.data ?? [])) as ChirLinkRow[],
    noms: (noms.error ? [] : (noms.data ?? [])) as NomRow[],
  };
}

/** Liste des fils avec leurs protocoles, noms de terrain et chirurgiens. */
export async function fetchSutures(): Promise<SutureWithUsage[]> {
  const { sutures, protocoles, links, chirurgiens, chirLinks, noms } = await fetchRaw();
  const byProtocole = new Map(protocoles.map((p) => [p.id, p]));
  const byChirurgien = new Map(chirurgiens.map((c) => [c.id, c]));
  return sutures.map((suture) => ({
    ...suture,
    usages: links
      .filter((l) => l.suture_id === suture.id)
      .flatMap((l) => {
        const protocole = byProtocole.get(l.protocole_id);
        return protocole ? [{ protocole, ...lienInfos(l) }] : [];
      })
      .sort((a, b) => a.protocole.nom.localeCompare(b.protocole.nom, "fr")),
    noms: noms
      .filter((n) => n.suture_id === suture.id)
      .map(({ id, nom, source }) => ({ id, nom, source })),
    chirurgiens: chirLinks
      .filter((l) => l.suture_id === suture.id)
      .flatMap((l) => {
        const chirurgien = byChirurgien.get(l.chirurgien_id);
        return chirurgien ? [{ chirurgien, note: l.note, a_valider: Boolean(l.a_valider) }] : [];
      }),
  }));
}

function planRank(plan: string | null): number {
  const index = plan ? PLAN_ORDER.indexOf(plan) : -1;
  return index === -1 ? PLAN_ORDER.length : index;
}

/** Protocoles opératoires avec leurs fils, rangés dans l'ordre de fermeture. */
export async function fetchProtocoles(): Promise<ProtocoleWithFils[]> {
  const { sutures, protocoles, links } = await fetchRaw();
  const bySuture = new Map(sutures.map((s) => [s.id, s]));
  return protocoles.map((protocole) => ({
    ...protocole,
    fils: links
      .filter((l) => l.protocole_id === protocole.id)
      .flatMap((l) => {
        const suture = bySuture.get(l.suture_id);
        return suture ? [{ suture, ...lienInfos(l) }] : [];
      })
      .sort(
        (a, b) =>
          planRank(a.plan) - planRank(b.plan) ||
          (a.suture.marque ?? "").localeCompare(b.suture.marque ?? "", "fr"),
      ),
  }));
}

/* Validation par un admin des éléments créés par Letta ------------------ */

async function checkUpdate(query: PromiseLike<{ data: unknown[] | null; error: unknown }>) {
  const { data, error } = await query;
  if (error || !data || data.length === 0) throw new Error(DB_ERROR_MESSAGE);
}

export function validerLien(sutureId: string, protocoleId: string) {
  return checkUpdate(
    supabase
      .from("suture_protocoles")
      .update({ a_valider: false })
      .eq("suture_id", sutureId)
      .eq("protocole_id", protocoleId)
      .select("suture_id"),
  );
}

export function validerLienChirurgien(sutureId: string, chirurgienId: string) {
  return checkUpdate(
    supabase
      .from("suture_chirurgiens")
      .update({ a_valider: false })
      .eq("suture_id", sutureId)
      .eq("chirurgien_id", chirurgienId)
      .select("suture_id"),
  );
}

export function validerFil(id: string) {
  return checkUpdate(
    supabase.from("sutures").update({ a_valider: false }).eq("id", id).select("id"),
  );
}

export function validerProtocole(id: string) {
  return checkUpdate(
    supabase.from("protocoles").update({ a_valider: false }).eq("id", id).select("id"),
  );
}

export function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function matchesSuture(
  suture: Suture & { noms?: { nom: string }[] },
  query: string,
): boolean {
  const q = normalize(query);
  if (!q) return true;
  return [
    ...(suture.noms ?? []).map((n) => n.nom),
    suture.marque,
    suture.calibre,
    suture.reference,
    suture.composition,
    suture.famille,
    suture.type_aiguille,
    suture.couleur,
  ]
    .filter(Boolean)
    .some((field) => normalize(String(field)).includes(q));
}

/** Fiche en service avec au moins une case à compléter qui a un sens pour ce fil. */
export function isIncomplete(suture: Suture & { usages?: unknown[] }): boolean {
  return evaluerFiche(suture, suture.usages?.length ?? 0).casesManquantes.length > 0;
}

/* ------------------------------------------------------------------ */
/* Gestion des fils (réservée aux admins, contrôlée aussi en base)     */
/* ------------------------------------------------------------------ */

export const STATUT_ACTIF = "actif";
export const STATUT_RETIRE = "retire";

export const STATUT_LABELS: Record<string, string> = {
  [STATUT_ACTIF]: "En service",
  [STATUT_RETIRE]: "Retiré du service",
};

export function isRetired(suture: Pick<Suture, "statut">): boolean {
  return suture.statut === STATUT_RETIRE;
}

/** Champs modifiables depuis le formulaire. */
export type SutureInput = {
  marque: string;
  calibre: string | null;
  famille: string | null;
  composition: string | null;
  reference: string | null;
  type_aiguille: string | null;
  longueur: string | null;
  couleur: string | null;
  usage_notes: string | null;
  note_qualite: string | null;
  plans: string[] | null;
  statut: string;
};

export const DB_ERROR_MESSAGE =
  "Enregistrement refusé : vous n'avez pas les droits ou la donnée est invalide.";

/** Retire les espaces en début et fin. Un champ vide devient null. */
export function cleanField(value: string | null | undefined): string | null {
  const trimmed = (value ?? "").trim();
  return trimmed === "" ? null : trimmed;
}

/** Identifiant d'URL : minuscules, sans accents, mots séparés par des tirets. */
export function slugify(value: string): string {
  return normalize(value)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function uniqueSlug(base: string): Promise<string> {
  const root = base || "fil";
  const { data, error } = await supabase.from("sutures").select("slug").like("slug", `${root}%`);
  if (error) throw new Error(DB_ERROR_MESSAGE);
  const taken = new Set((data ?? []).map((row) => row.slug));
  if (!taken.has(root)) return root;
  let n = 2;
  while (taken.has(`${root}-${n}`)) n += 1;
  return `${root}-${n}`;
}

/** Crée un fil et renvoie son identifiant d'URL. */
export async function createSuture(input: SutureInput): Promise<string> {
  const slug = await uniqueSlug(slugify(`${input.marque} ${input.calibre ?? ""}`));
  const { data, error } = await supabase
    .from("sutures")
    .insert({ ...input, slug, source: "saisie_admin" })
    .select("slug")
    .single();
  if (error || !data) throw new Error(DB_ERROR_MESSAGE);
  return data.slug ?? slug;
}

export async function updateSuture(id: string, input: SutureInput): Promise<void> {
  const { data, error } = await supabase.from("sutures").update(input).eq("id", id).select("id");
  if (error || !data || data.length === 0) throw new Error(DB_ERROR_MESSAGE);
}

export async function setSutureStatut(id: string, statut: string): Promise<void> {
  const { data, error } = await supabase
    .from("sutures")
    .update({ statut })
    .eq("id", id)
    .select("id");
  if (error || !data || data.length === 0) throw new Error(DB_ERROR_MESSAGE);
}

/** Supprime le fil. Ses liens avec les interventions sont effacés en base (cascade). */
export async function deleteSuture(id: string): Promise<void> {
  const { data, error } = await supabase.from("sutures").delete().eq("id", id).select("id");
  if (error || !data || data.length === 0) throw new Error(DB_ERROR_MESSAGE);
}

/* ------------------------------------------------------------------ */
/* Photos des fils                                                      */
/* ------------------------------------------------------------------ */

export const SUTURE_IMAGE_TYPE = "sutures";

export type SutureImage = {
  id: string;
  content_id: string;
  storage_path: string;
  position: number;
  source: string | null;
};

/** Photos d'un fil, ou de tous les fils si aucun identifiant n'est donné. */
export async function fetchSutureImages(sutureId?: string): Promise<SutureImage[]> {
  let query = supabase
    .from("content_images")
    .select("id, content_id, storage_path, position, source")
    .eq("content_type_code", SUTURE_IMAGE_TYPE)
    .order("position");
  if (sutureId) query = query.eq("content_id", sutureId);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as SutureImage[];
}

/** Adresse de recherche d'images pour un fil (ouverte dans un nouvel onglet). */
export function webImageSearchUrl(suture: Pick<Suture, "marque" | "calibre" | "reference">) {
  const terms = [suture.marque, suture.calibre, suture.reference, "suture"]
    .filter(Boolean)
    .join(" ");
  return `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(terms)}`;
}
