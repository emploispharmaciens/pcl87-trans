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

export type SutureUsage = {
  protocole: Protocole;
  quantite: string | null;
  note: string | null;
};

export type SutureWithUsage = Suture & {
  usages: SutureUsage[];
};

export type ProtocoleWithFils = Protocole & {
  fils: { suture: Suture; quantite: string | null; note: string | null }[];
};

type LinkRow = {
  suture_id: string;
  protocole_id: string;
  quantite: string | null;
  note: string | null;
};

async function fetchRaw() {
  const [sutures, protocoles, links] = await Promise.all([
    supabase.from("sutures").select("*").order("marque", { ascending: true }),
    supabase.from("protocoles").select("*").order("nom", { ascending: true }),
    supabase.from("suture_protocoles").select("suture_id, protocole_id, quantite, note"),
  ]);

  if (sutures.error) throw sutures.error;
  if (protocoles.error) throw protocoles.error;
  if (links.error) throw links.error;

  return {
    sutures: (sutures.data ?? []) as Suture[],
    protocoles: (protocoles.data ?? []) as Protocole[],
    links: (links.data ?? []) as LinkRow[],
  };
}

/** Liste des fils avec le décompte de leurs interventions. */
export async function fetchSutures(): Promise<SutureWithUsage[]> {
  const { sutures, protocoles, links } = await fetchRaw();
  const byProtocole = new Map(protocoles.map((p) => [p.id, p]));

  return sutures.map((suture) => ({
    ...suture,
    usages: links
      .filter((l) => l.suture_id === suture.id)
      .flatMap((l) => {
        const protocole = byProtocole.get(l.protocole_id);
        return protocole ? [{ protocole, quantite: l.quantite, note: l.note }] : [];
      })
      .sort((a, b) => a.protocole.nom.localeCompare(b.protocole.nom, "fr")),
  }));
}

/** Liste des interventions avec les fils qu'elles consomment. */
export async function fetchProtocoles(): Promise<ProtocoleWithFils[]> {
  const { sutures, protocoles, links } = await fetchRaw();
  const bySuture = new Map(sutures.map((s) => [s.id, s]));

  return protocoles.map((protocole) => ({
    ...protocole,
    fils: links
      .filter((l) => l.protocole_id === protocole.id)
      .flatMap((l) => {
        const suture = bySuture.get(l.suture_id);
        return suture ? [{ suture, quantite: l.quantite, note: l.note }] : [];
      })
      .sort((a, b) => (a.suture.marque ?? "").localeCompare(b.suture.marque ?? "", "fr")),
  }));
}

export function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function matchesSuture(suture: Suture, query: string): boolean {
  const q = normalize(query);
  if (!q) return true;
  return [
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

export function isIncomplete(suture: Suture): boolean {
  return !suture.calibre || !suture.composition || !suture.reference;
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
};

/** Photos d'un fil, ou de tous les fils si aucun identifiant n'est donné. */
export async function fetchSutureImages(sutureId?: string): Promise<SutureImage[]> {
  let query = supabase
    .from("content_images")
    .select("id, content_id, storage_path, position")
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
