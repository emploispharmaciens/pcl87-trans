/**
 * Lecture d'une écriture de fiche de picking selon la convention de nommage.
 * Les règles d'aiguille sont des repères, pas des murs : elles orientent un
 * classement de candidats, elles ne décident jamais seules.
 * Ordre de confiance : ce que dit la fiche > habitude du chirurgien > repère.
 * Module sans dépendance : utilisé par l'accès des agents et testable seul.
 */

export type FilResolution = {
  id: string;
  slug: string | null;
  marque: string | null;
  calibre: string | null;
  type_aiguille: string | null;
  reference: string | null;
  statut: string | null;
};

export type NomTerrain = { suture_id: string; nom: string };

export type Candidat = {
  slug: string | null;
  marque: string | null;
  statut: string | null;
  score: number;
  raisons: string[];
};

export type Resolution = {
  ecriture: string;
  lu: {
    produit: string | null;
    calibre: string | null;
    aiguille_mm: string | null;
    reference: string | null;
  };
  statut: "exact" | "probable" | "ambigu" | "hors_service" | "inconnu" | "pas_un_fil";
  meilleur: Candidat | null;
  alternatives: Candidat[];
};

const PRODUITS: [RegExp, string][] = [
  [/v[iy]cr[iy]l\s*rapide/, "VICRYL RAPIDE"],
  [/v[iy]cr[iy]l/, "VICRYL"],
  [/polysor[bd]/, "POLYSORB"],
  [/dafilon/, "DAFILON"],
  [/\bpds\b/, "PDS II"],
  [/mon[o]?syn/, "MONOSYN"],
  [/monocryl/, "MONOCRYL"],
  [/mersuture|mersilene/, "MERSILENE"],
  [/pr[ée]micron/, "PREMICRON"],
  [/hs\s*fiber\s*loop|\bloop\b.*\bhs\b|\bhs\s*524\b/, "HS FIBER LOOP"],
  [/hs\s*fiber\s*tape|hs\s*(?:fiber\s*)?2[.,]2|hs\s*2\s*tape|hs\s*tape|tape\s*hs/, "HS FIBER TAPE"],
  [/hs[\s-]*fiber|\bhs\s*\d|\bhs\d/, "HS FIBER"],
  [/agrafe/, "AGRAFEUSE"],
  [/ethilon/, "ETHILON"],
  [/prol[eè]ne/, "PROLENE"],
  [/stratafix/, "STRATAFIX"],
  [/fibertape|fiber\s*tape/, "FIBERTAPE"],
  [/ultrabraid/, "ULTRABRAID"],
  [/biosyn|byosin/, "BIOSYN"],
  [/sutup/, "SUTUP"],
  [/surgical\s*loop/, "SURGICAL LOOP"],
];

const PAS_UN_FIL =
  /colle|optiskin|pansement|b[ée]tadine|compress|bourdonnet|\bdmi\b|panier|implant|non renseign/;

/** Deux références concordent : identiques, ou mêmes chiffres avec la même première lettre (J251 / JV251). */
function memeReference(lue: string, fiche: string | null): boolean {
  const a = normaliser(lue).replace(/[\s-]/g, "");
  const b = normaliser(fiche ?? "").replace(/[\s-]/g, "");
  if (!b) return false;
  if (a === b) return true;
  const chiffres = (x: string) => x.replace(/\D/g, "");
  return a[0] === b[0] && chiffres(a) !== "" && chiffres(a) === chiffres(b);
}

export function normaliser(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function produitDe(texte: string): string | null {
  for (const [re, nom] of PRODUITS) if (re.test(texte)) return nom;
  return null;
}

function produitDuFil(marque: string | null): string | null {
  return produitDe(normaliser(marque ?? ""));
}

/** Lit le calibre, l'aiguille en mm et une éventuelle référence dans une écriture. */
export function lireEcriture(ecriture: string) {
  const t = normaliser(ecriture)
    .replace(/(\d)\s*\/\s*\(?\s*0/g, "$1/0")
    .replace(/(\d)\s*-\s*0\b/g, "$1/0");
  const produit = produitDe(t);
  const apres = produit ? t.slice(t.search(/[a-z]/)) : t;
  const sansQuantite = apres.replace(/\bx\s*\d+\b|:\s*x\d+/g, " ");

  let calibre: string | null = null;
  if (produit === "AGRAFEUSE") {
    calibre = /35\s*r|petit/.test(t) ? "35R" : /35\s*w/.test(t) ? "35W" : null;
  } else if (produit !== "HS FIBER TAPE" && produit !== "HS FIBER LOOP") {
    const corps = sansQuantite.replace(/^[^a-z]*[a-z][a-z\s-]*?(?=\d)/, "");
    const m = /(?:^|[^\d/])(\d\/0|\d)(?![\d/]|\s*mm)/.exec(" " + corps);
    calibre = m?.[1] ?? null;
  }

  const mmMatch =
    /(\d{2})\s*mm|\baig(?:uille)?s?\s*(?:de\s*)?(\d{2})\b|\bds\s*(\d{2})\b|\*\s*(\d{2})\b|\baig(\d{2})\b|\b(\d{2})\s*m\b/.exec(
      t,
    );
  const aiguilleMm = mmMatch ? (mmMatch.slice(1).find(Boolean) ?? null) : null;

  const refMatch = /\b(cl|sl|gl)\s*-?\s*(\d{3})\b|\bhs\s*(\d{3,4})\b|\bj\s*(\d{3,4})\b/.exec(t);
  const reference = refMatch ? refMatch[0].replace(/\s|-/g, "").toUpperCase() : null;

  return { texte: t, produit, calibre, aiguilleMm, reference };
}

function memeCalibre(a: string | null, b: string | null) {
  return (a ?? "").replace(/\s/g, "").toLowerCase() === (b ?? "").replace(/\s/g, "").toLowerCase();
}

/**
 * Classe les fils candidats pour une écriture.
 * chirurgien : facultatif, oriente les repères propres à un chirurgien.
 */
export function resoudreEcriture(
  ecriture: string,
  fils: FilResolution[],
  noms: NomTerrain[],
  chirurgien?: string | null,
): Resolution {
  const brut = ecriture.trim();
  const lu = lireEcriture(brut);
  const resultat = (statut: Resolution["statut"], classes: Candidat[] = []): Resolution => ({
    ecriture: brut,
    lu: {
      produit: lu.produit,
      calibre: lu.calibre,
      aiguille_mm: lu.aiguilleMm,
      reference: lu.reference,
    },
    statut,
    meilleur: classes[0] ?? null,
    alternatives: classes.slice(1, 4),
  });

  // 1. Écriture déjà connue : nom du fil ou nom de terrain.
  const cible = normaliser(brut);
  const exact =
    fils.find((f) => normaliser(f.marque ?? "") === cible) ??
    fils.find((f) => noms.some((n) => n.suture_id === f.id && normaliser(n.nom) === cible));
  if (exact) {
    const c = {
      slug: exact.slug,
      marque: exact.marque,
      statut: exact.statut,
      score: 100,
      raisons: ["écriture déjà connue"],
    };
    return resultat(exact.statut === "retire" ? "hors_service" : "exact", [c]);
  }

  if (!lu.produit) return resultat(PAS_UN_FIL.test(lu.texte) ? "pas_un_fil" : "inconnu");

  // 2. Candidats : même produit, et même calibre si la fiche en donne un.
  let candidats = fils.filter((f) => produitDuFil(f.marque) === lu.produit);
  if (lu.produit === "AGRAFEUSE") {
    const taille = lu.calibre ?? "35W"; // Agrafeuse sans taille = 35W
    candidats = candidats.filter((f) => (f.marque ?? "").toUpperCase().includes(taille));
  } else if (lu.calibre) {
    candidats = candidats.filter((f) => memeCalibre(f.calibre, lu.calibre));
  }
  if (candidats.length === 0) return resultat("inconnu");

  // 3. Classement par indices.
  const chir = normaliser(chirurgien ?? "");
  const classes: Candidat[] = candidats.map((f) => {
    let score = 50;
    const raisons: string[] = ["même produit et même calibre"];
    const aig = f.type_aiguille ?? "";
    if (lu.reference && memeReference(lu.reference, f.reference)) {
      score += 40;
      raisons.push("même référence");
    }
    const aiguilleConnue =
      lu.aiguilleMm !== null &&
      candidats.some((c) => (c.type_aiguille ?? "").includes(`${lu.aiguilleMm}mm`));
    if (lu.aiguilleMm && aiguilleConnue) {
      if (aig.includes(`${lu.aiguilleMm}mm`) || aig.includes(`${lu.aiguilleMm} mm`)) {
        score += 30;
        raisons.push(`aiguille de ${lu.aiguilleMm} mm`);
      }
    } else {
      if (lu.aiguilleMm)
        raisons.push(`aiguille de ${lu.aiguilleMm} mm absente des fiches : repère appliqué`);
      // Repères de la convention quand la fiche ne précise pas l'aiguille.
      if (lu.produit === "DAFILON" && lu.calibre === "2/0" && aig.includes("21mm")) {
        score += 10;
        raisons.push("repère : Dafilon 2/0 sans aiguille = 21 mm");
      }
      if (lu.produit === "DAFILON" && lu.calibre === "3/0") {
        if (chir.includes("louisia") && aig.includes("16mm")) {
          score += 15;
          raisons.push("repère : Dr Louisia = 16 mm");
        } else if (!chir.includes("louisia") && aig.includes("24mm")) {
          score += 10;
          raisons.push("repère : Dafilon 3/0 sans aiguille = 24 mm");
        }
      }
      if (/redon/.test(lu.texte) && aig.includes("30mm")) {
        score += 5;
        raisons.push("repère : redon = 30 mm (selon l'habitude du chirurgien)");
      }
      if (/peau|cutan/.test(lu.texte) && aig.includes("24mm")) {
        score += 5;
        raisons.push("repère : fermeture cutanée = 24 mm");
      }
      if (/petite aiguille|\bpa\b/.test(lu.texte))
        raisons.push("« petite aiguille » sans longueur");
    }
    if (f.statut === "retire") {
      score -= 30;
      raisons.push("fil hors service");
    }
    return { slug: f.slug, marque: f.marque, statut: f.statut, score, raisons };
  });
  classes.sort((a, b) => b.score - a.score);

  const [premier, second] = classes;
  if (!premier) return resultat("inconnu");
  if (premier.statut === "retire") return resultat("hors_service", classes);
  if (second && second.score === premier.score) return resultat("ambigu", classes);
  return resultat("probable", classes);
}
