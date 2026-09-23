import { supabase } from "@/integrations/supabase/client";
import type { ProtocoleWithFils, SutureWithUsage } from "@/lib/sutures-api";

/* ------------------------------------------------------------------ */
/* Contenu de la formation (rangé en base, table formation_blocs)       */
/* ------------------------------------------------------------------ */

export type Etape = "motivation" | "explication" | "methode";

export type FormationBloc = {
  id: string;
  etape: Etape;
  ordre: number;
  titre: string;
  points: string[];
};

/** Titres affichés des grandes parties, dans l'ordre de lecture. */
export const ETAPES: { etape: Etape; titre: string }[] = [
  { etape: "motivation", titre: "Pourquoi savoir lire un fil ?" },
  { etape: "explication", titre: "Les cinq critères qui décrivent un fil" },
  { etape: "methode", titre: "Comment faire, étape par étape" },
];

export async function fetchFormationBlocs(): Promise<FormationBloc[]> {
  const { data, error } = await supabase
    .from("formation_blocs")
    .select("id, etape, ordre, titre, points")
    .eq("module", "sutures")
    .order("ordre");
  if (error) throw error;
  return (data ?? []) as FormationBloc[];
}

export type FicheFab = {
  famille: string;
  f: string;
  a: string;
  b: string;
};

/** Les trois premières lettres (Feature, Avantage, Bénéfice). Le 3R est calculé sur la base. */
export const FAB_FAMILLES: FicheFab[] = [
  {
    famille: "resorbable_tresse",
    f: "Fil tressé que l'organisme dégrade.",
    a: "Souple, il tient bien le nœud.",
    b: "Il ferme les plans profonds sans laisser de fil à retirer.",
  },
  {
    famille: "resorbable_monobrin",
    f: "Fil à un seul brin que l'organisme dégrade.",
    a: "Lisse, il glisse dans les tissus.",
    b: "Il convient aux surjets et aux sutures sous la peau.",
  },
  {
    famille: "non_resorbable_monobrin",
    f: "Fil à un seul brin qui reste en place.",
    a: "Lisse, il se retire facilement.",
    b: "Il sert aux points de peau que l'on enlève plus tard.",
  },
  {
    famille: "non_resorbable_tresse",
    f: "Fil tressé qui reste en place.",
    a: "Très solide, le nœud tient.",
    b: "Il sert quand la tenue doit durer.",
  },
  {
    famille: "haute_resistance",
    f: "Fil ou ruban tressé à très haute résistance.",
    a: "Il supporte de fortes tractions.",
    b: "Il sert à réinsérer un tendon ou un ligament.",
  },
];

/* ------------------------------------------------------------------ */
/* Calibres                                                             */
/* ------------------------------------------------------------------ */

/**
 * Épaisseur relative d'un calibre USP : plus le nombre est grand, plus le fil est gros.
 * « 0 » vaut 0, « 2/0 » vaut -1, « 4/0 » vaut -3, « 2 » vaut 2.
 * Renvoie null pour un calibre non reconnu (ex. « 2,5 »).
 */
export function calibreScore(calibre: string | null | undefined): number | null {
  const value = (calibre ?? "").trim();
  const slash = /^(\d+)\/0$/.exec(value);
  if (slash) return 1 - Number(slash[1]);
  if (/^\d+$/.test(value)) return Number(value);
  return null;
}

/* ------------------------------------------------------------------ */
/* Exercices générés à partir des fils en service                       */
/* ------------------------------------------------------------------ */

export type Question = {
  id: string;
  enonce: string;
  options: string[];
  bonne: number;
  explication: string;
};

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j] as T, copy[i] as T];
  }
  return copy;
}

function pick<T>(items: T[]): T | undefined {
  return items[Math.floor(Math.random() * items.length)];
}

function withAnswer(
  enonce: string,
  bonne: string,
  fausses: string[],
  explication: string,
  id: string,
): Question {
  const options = shuffle([bonne, ...fausses]);
  return { id, enonce, options, bonne: options.indexOf(bonne), explication };
}

const RESORBABLES = ["resorbable_tresse", "resorbable_monobrin"];
const NON_RESORBABLES = ["non_resorbable_tresse", "non_resorbable_monobrin"];
const MONOBRINS = ["resorbable_monobrin", "non_resorbable_monobrin"];
const TRESSES = ["resorbable_tresse", "non_resorbable_tresse"];

function nom(s: { marque: string | null }): string {
  return s.marque ?? "Ce fil";
}

/** Construit une série d'exercices tirés au hasard dans les fils en service. */
export function buildQuiz(
  sutures: SutureWithUsage[],
  protocoles: ProtocoleWithFils[],
  total = 10,
): Question[] {
  const actifs = sutures.filter((s) => s.statut !== "retire");
  const questions: Question[] = [];

  // Question fixe : le piège du calibre.
  questions.push({
    id: "piege-calibre",
    enonce: "« Polysorb 2 » et « Polysorb 2/0 » : est-ce le même fil ?",
    options: ["Oui, c'est le même fil", "Non : le 2 est gros, le 2/0 est fin"],
    bonne: 1,
    explication: "Sans « /0 », 2 est plus gros que 0. Avec « /0 », 2/0 est plus fin que 0.",
  });

  const calibres = actifs.filter((s) => calibreScore(s.calibre) !== null);
  const resorption = actifs.filter((s) =>
    [...RESORBABLES, ...NON_RESORBABLES].includes(s.famille ?? ""),
  );
  const structure = actifs.filter((s) => [...MONOBRINS, ...TRESSES].includes(s.famille ?? ""));
  const avecFils = protocoles.filter((p) => p.fils.length > 0);

  let guard = 0;
  while (questions.length < total && guard < 200) {
    guard += 1;
    const kind = questions.length % 4;

    if (kind === 0 && calibres.length >= 2) {
      const a = pick(calibres);
      const b = pick(calibres.filter((s) => calibreScore(s.calibre) !== calibreScore(a?.calibre)));
      if (!a || !b) continue;
      const fin = (calibreScore(a.calibre) ?? 0) < (calibreScore(b.calibre) ?? 0) ? a : b;
      questions.push(
        withAnswer(
          "Lequel de ces deux fils est le plus fin ?",
          `Calibre ${fin.calibre}`,
          [`Calibre ${(fin === a ? b : a).calibre}`],
          "Avec « /0 », plus le chiffre monte, plus le fil est fin. Sans « /0 », plus le chiffre monte, plus il est gros.",
          `calibre-${a.id}-${b.id}`,
        ),
      );
    } else if (kind === 1 && resorption.length > 0) {
      const s = pick(resorption);
      if (!s) continue;
      const oui = RESORBABLES.includes(s.famille ?? "");
      questions.push(
        withAnswer(
          `${nom(s)} ${s.calibre ?? ""} est-il résorbable ?`.replace(/\s+/g, " "),
          oui ? "Oui, il est résorbable" : "Non, il n'est pas résorbable",
          [oui ? "Non, il n'est pas résorbable" : "Oui, il est résorbable"],
          oui
            ? "L'organisme le dégrade : il n'y a rien à retirer."
            : "Il reste en place. En surface, on le retire après cicatrisation.",
          `resorption-${s.id}`,
        ),
      );
    } else if (kind === 2 && structure.length > 0) {
      const s = pick(structure);
      if (!s) continue;
      const mono = MONOBRINS.includes(s.famille ?? "");
      questions.push(
        withAnswer(
          `${nom(s)} est-il monobrin ou tressé ?`,
          mono ? "Monobrin" : "Tressé",
          [mono ? "Tressé" : "Monobrin"],
          mono
            ? "Un seul brin lisse : il glisse bien dans les tissus."
            : "Plusieurs brins entrelacés : il est souple et le nœud tient bien.",
          `structure-${s.id}`,
        ),
      );
    } else if (kind === 3 && avecFils.length > 0) {
      const p = pick(avecFils);
      if (!p) continue;
      const bon = pick(p.fils)?.suture;
      const ids = new Set(p.fils.map((f) => f.suture.id));
      const noms = new Set(p.fils.map((f) => nom(f.suture)));
      const fausses = [
        ...new Set(
          shuffle(actifs.filter((s) => !ids.has(s.id)))
            .map(nom)
            .filter((n) => !noms.has(n)),
        ),
      ].slice(0, 3);
      if (!bon || fausses.length < 2) continue;
      questions.push(
        withAnswer(
          `Au bloc, lequel de ces fils est préparé pour « ${p.nom} » ?`,
          nom(bon),
          fausses,
          "Réponse tirée des habitudes enregistrées pour cette intervention (onglet « Interventions »).",
          `intervention-${p.id}-${bon.id}`,
        ),
      );
    }
  }

  const seen = new Set<string>();
  return questions.filter((q) => (seen.has(q.id) ? false : (seen.add(q.id), true))).slice(0, total);
}

/* ------------------------------------------------------------------ */
/* 3R calculé sur les fils en service                                   */
/* ------------------------------------------------------------------ */

export function realiteFamille(famille: string, sutures: SutureWithUsage[]) {
  const rows = sutures.filter((s) => s.famille === famille && s.statut !== "retire");
  const plusDemande = [...rows].sort((a, b) => b.usages.length - a.usages.length)[0];
  return {
    nombre: rows.length,
    plusDemande:
      plusDemande && plusDemande.usages.length > 0
        ? `${plusDemande.marque} (${plusDemande.usages.length} intervention${plusDemande.usages.length > 1 ? "s" : ""})`
        : null,
  };
}
