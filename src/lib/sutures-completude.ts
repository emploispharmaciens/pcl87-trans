/**
 * Complétude d'une fiche de fil.
 * Une case ne compte comme « à compléter » que si elle a un sens pour ce fil :
 * - une agrafe n'a ni couleur, ni aiguille, ni longueur de fil ;
 * - un accessoire n'a pas de plan de suture ;
 * - la note d'usage n'a de sens que si le fil est relié à au moins un protocole ;
 * - un fil hors service n'est plus à compléter.
 * Module sans dépendance : utilisé par l'interface et par l'accès des agents.
 */

export const CHAMPS_FICHE = [
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

export type ChampFiche = (typeof CHAMPS_FICHE)[number];

export const CHAMP_LABELS: Record<ChampFiche, string> = {
  composition: "composition",
  couleur: "couleur",
  type_aiguille: "aiguille",
  longueur: "longueur",
  reference: "référence",
  usage_notes: "notes d'usage",
  note_qualite: "point de vigilance",
  cours: "cours",
  plans: "plans",
};

/** Cases sans objet selon la famille du fil. */
export const SANS_OBJET_PAR_FAMILLE: Record<string, ChampFiche[]> = {
  agrafe_cutanee: ["couleur", "type_aiguille", "longueur"],
  accessoire: ["plans"],
};

function estVide(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === "string") return value.trim() === "";
  if (Array.isArray(value)) return value.length === 0;
  return false;
}

export type EvaluationFiche = {
  horsService: boolean;
  casesManquantes: ChampFiche[];
  casesSansObjet: ChampFiche[];
  complete: boolean;
};

export function evaluerFiche(
  fil: { famille: string | null; statut: string | null } & Partial<Record<ChampFiche, unknown>>,
  nbProtocoles: number,
): EvaluationFiche {
  const horsService = fil.statut === "retire";
  const sansObjet = new Set<ChampFiche>(SANS_OBJET_PAR_FAMILLE[fil.famille ?? ""] ?? []);
  if (nbProtocoles === 0) sansObjet.add("usage_notes");

  const casesSansObjet = CHAMPS_FICHE.filter((c) => sansObjet.has(c) && estVide(fil[c]));
  const casesManquantes = horsService
    ? []
    : CHAMPS_FICHE.filter((c) => !sansObjet.has(c) && estVide(fil[c]));

  return {
    horsService,
    casesManquantes,
    casesSansObjet,
    complete: !horsService && casesManquantes.length === 0,
  };
}
