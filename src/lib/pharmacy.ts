export type PharmaSite = "ORTHO" | "SSPI";

export type PharmaProduct = {
  label: string;
  dci: string;
  classe: string;
  unite: string;
  risque: boolean;
  /** Dotation de la salle d'orthopédie (null = non doté). */
  ortho: number | null;
  /** Dotation de la SSPI (null = non doté). */
  sspi: number | null;
};

/** Référentiel pharmaceutique du bloc (données de démonstration, hors dossier patient). */
export const PHARMA_PRODUCTS: PharmaProduct[] = [
  { label: "ACIDE TRANEXAMIQUE 500MG/5ML AMP INJ", dci: "ACIDE TRANEXAMIQUE", classe: "hemostatiques", unite: "Inject", risque: false, ortho: 30, sspi: 10 },
  { label: "ADRENALINE 1MG/1ML AMP INJ", dci: "ADRENALINE", classe: "catecholamines", unite: "Inject", risque: true, ortho: 30, sspi: 30 },
  { label: "ADRENALINE 5MG/5ML SER INJ", dci: "ADRENALINE", classe: "catecholamines", unite: "Inject", risque: true, ortho: 10, sspi: 10 },
  { label: "ADRENALINE NEBUL 1MG/1ML AMP", dci: "ADRENALINE", classe: "respiratoire", unite: "Inject", risque: true, ortho: null, sspi: 10 },
  { label: "AIGUILLE 21G PRELEVEMENT", dci: "AIGUILLE 21G", classe: "dispositifs", unite: "Unite", risque: false, ortho: 100, sspi: 80 },
  { label: "ALCOOL MODIFIE 70% 125ML FL", dci: "ALCOOL", classe: "antiseptiques", unite: "Flacon", risque: false, ortho: 10, sspi: 10 },
  { label: "ALFENTANIL 1MG/2ML AMP INJ", dci: "ALFENTANIL", classe: "morphiniques", unite: "Inject", risque: true, ortho: 10, sspi: 5 },
  { label: "AMIODARONE 150MG/3ML AMP INJ", dci: "AMIODARONE", classe: "cardiovasculaires", unite: "Inject", risque: true, ortho: 10, sspi: 10 },
  { label: "AMOXICILLINE/AC CLAV 2G FL PDR INJ", dci: "AMOXICILLINE ACIDE CLAVULANIQUE", classe: "antibiotiques", unite: "Inject", risque: false, ortho: 20, sspi: 10 },
  { label: "ATENOLOL 5MG/10ML AMP INJ", dci: "ATENOLOL", classe: "cardiovasculaires", unite: "Inject", risque: false, ortho: 5, sspi: 5 },
  { label: "ATRACURIUM 50MG/5ML AMP INJ", dci: "ATRACURIUM", classe: "curares", unite: "Inject", risque: true, ortho: 20, sspi: null },
  { label: "ATROPINE 0,5MG/1ML AMP INJ", dci: "ATROPINE", classe: "cardiovasculaires", unite: "Inject", risque: false, ortho: 40, sspi: 30 },
  { label: "ATROPINE 1MG/1ML SER INJ", dci: "ATROPINE", classe: "cardiovasculaires", unite: "Inject", risque: false, ortho: 10, sspi: 10 },
  { label: "BICARBONATE DE SODIUM 4,2% 250ML POCHE", dci: "BICARBONATE DE SODIUM", classe: "solutes", unite: "Poche", risque: false, ortho: 5, sspi: 10 },
  { label: "BUDESONIDE 0,5MG/2ML UNIDOSE NEBUL", dci: "BUDESONIDE", classe: "respiratoire", unite: "Unidose", risque: false, ortho: null, sspi: 10 },
  { label: "BUPIVACAINE HYPERBARE 5MG/ML 4ML AMP INJ", dci: "BUPIVACAINE", classe: "anesthesiques locaux", unite: "Inject", risque: true, ortho: 30, sspi: null },
  { label: "CATHETER IV 18G", dci: "CATHETER IV 18G", classe: "dispositifs", unite: "Unite", risque: false, ortho: 50, sspi: 40 },
  { label: "CATHETER IV 20G", dci: "CATHETER IV 20G", classe: "dispositifs", unite: "Unite", risque: false, ortho: 50, sspi: 40 },
  { label: "CEFAZOLINE 2G FL PDR INJ", dci: "CEFAZOLINE", classe: "antibiotiques", unite: "Inject", risque: false, ortho: 40, sspi: 10 },
  { label: "CEFTRIAXONE 1G FL PDR INJ", dci: "CEFTRIAXONE", classe: "antibiotiques", unite: "Inject", risque: false, ortho: 10, sspi: 10 },
  { label: "CEFUROXIME 1,5G FL PDR INJ", dci: "CEFUROXIME", classe: "antibiotiques", unite: "Inject", risque: false, ortho: 20, sspi: 5 },
  { label: "CHLORHEXIDINE ALCOOLIQUE 0,5% 250ML FL", dci: "CHLORHEXIDINE", classe: "antiseptiques", unite: "Flacon", risque: false, ortho: 20, sspi: 10 },
  { label: "CHLORURE DE POTASSIUM 10% 10ML AMP INJ", dci: "CHLORURE DE POTASSIUM", classe: "electrolytes", unite: "Inject", risque: true, ortho: 10, sspi: 10 },
  { label: "CHLORURE DE SODIUM 0,9% 100ML POCHE", dci: "CHLORURE DE SODIUM", classe: "solutes", unite: "Poche", risque: false, ortho: 80, sspi: 60 },
  { label: "CHLORURE DE SODIUM 0,9% 500ML POCHE", dci: "CHLORURE DE SODIUM", classe: "solutes", unite: "Poche", risque: false, ortho: 40, sspi: 30 },
  { label: "CISATRACURIUM 10MG/5ML AMP INJ", dci: "CISATRACURIUM", classe: "curares", unite: "Inject", risque: true, ortho: 30, sspi: 5 },
  { label: "CLINDAMYCINE 600MG/4ML AMP INJ", dci: "CLINDAMYCINE", classe: "antibiotiques", unite: "Inject", risque: false, ortho: 10, sspi: 5 },
  { label: "CLONAZEPAM 1MG/1ML AMP INJ", dci: "CLONAZEPAM", classe: "antiepileptiques", unite: "Inject", risque: true, ortho: 5, sspi: 10 },
  { label: "CLONIDINE 0,15MG/1ML AMP INJ", dci: "CLONIDINE", classe: "cardiovasculaires", unite: "Inject", risque: false, ortho: 10, sspi: 10 },
  { label: "CREME ANESTHESIANTE LIDO/PRILO 5G TUBE", dci: "LIDOCAINE PRILOCAINE", classe: "anesthesiques locaux", unite: "Tube", risque: false, ortho: 10, sspi: 10 },
  { label: "DESFLURANE 240ML FL INHAL", dci: "DESFLURANE", classe: "halogenes", unite: "Flacon", risque: false, ortho: 4, sspi: null },
  { label: "DEXAMETHASONE 4MG/1ML AMP INJ", dci: "DEXAMETHASONE", classe: "corticoides", unite: "Inject", risque: false, ortho: 30, sspi: 20 },
  { label: "DEXMEDETOMIDINE 200MCG/2ML AMP INJ", dci: "DEXMEDETOMIDINE", classe: "hypnotiques", unite: "Inject", risque: true, ortho: 5, sspi: 10 },
  { label: "DOBUTAMINE 250MG/20ML FL INJ", dci: "DOBUTAMINE", classe: "catecholamines", unite: "Inject", risque: true, ortho: 5, sspi: 5 },
  { label: "DOPAMINE 200MG/5ML AMP INJ", dci: "DOPAMINE", classe: "catecholamines", unite: "Inject", risque: true, ortho: 5, sspi: null },
  { label: "DROPERIDOL 1,25MG/1ML AMP INJ", dci: "DROPERIDOL", classe: "antiemetiques", unite: "Inject", risque: false, ortho: 20, sspi: 20 },
  { label: "EAU POUR PREPARATION INJECTABLE 10ML AMP", dci: "EAU PPI", classe: "solutes", unite: "Inject", risque: false, ortho: 60, sspi: 40 },
  { label: "ENOXAPARINE 4000UI/0,4ML SER INJ", dci: "ENOXAPARINE", classe: "anticoagulants", unite: "Inject", risque: true, ortho: 20, sspi: 20 },
  { label: "EPHEDRINE 30MG/10ML SER INJ", dci: "EPHEDRINE", classe: "vasopresseurs", unite: "Inject", risque: false, ortho: 60, sspi: 30 },
  { label: "ESMOLOL 100MG/10ML FL INJ", dci: "ESMOLOL", classe: "cardiovasculaires", unite: "Inject", risque: true, ortho: 10, sspi: 5 },
  { label: "ETIQUETTE SERINGUE ANESTHESIE ROULEAU", dci: "ETIQUETTES SERINGUES", classe: "dispositifs", unite: "Rouleau", risque: false, ortho: 10, sspi: 5 },
  { label: "ETOMIDATE 20MG/10ML AMP INJ", dci: "ETOMIDATE", classe: "hypnotiques", unite: "Inject", risque: true, ortho: 20, sspi: 5 },
  { label: "FILTRE ANTIBACTERIEN RESPIRATOIRE", dci: "FILTRE ANTIBACTERIEN", classe: "dispositifs", unite: "Unite", risque: false, ortho: 40, sspi: 20 },
  { label: "FLUMAZENIL 0,5MG/5ML AMP INJ", dci: "FLUMAZENIL", classe: "antidotes", unite: "Inject", risque: false, ortho: 5, sspi: 10 },
  { label: "FUROSEMIDE 20MG/2ML AMP INJ", dci: "FUROSEMIDE", classe: "diuretiques", unite: "Inject", risque: false, ortho: 10, sspi: 20 },
  { label: "GEL ECHOGRAPHIE STERILE 20G UNIDOSE", dci: "GEL ECHOGRAPHIE", classe: "dispositifs", unite: "Unidose", risque: false, ortho: 20, sspi: 10 },
  { label: "GELATINE FLUIDE 500ML POCHE", dci: "GELATINE", classe: "solutes", unite: "Poche", risque: false, ortho: 10, sspi: 5 },
  { label: "GENTAMICINE 80MG/2ML AMP INJ", dci: "GENTAMICINE", classe: "antibiotiques", unite: "Inject", risque: true, ortho: 10, sspi: 5 },
  { label: "GLUCONATE DE CALCIUM 10% 10ML AMP INJ", dci: "GLUCONATE DE CALCIUM", classe: "electrolytes", unite: "Inject", risque: false, ortho: 5, sspi: 10 },
  { label: "GLUCOSE 30% 10ML AMP INJ", dci: "GLUCOSE", classe: "solutes", unite: "Inject", risque: true, ortho: 10, sspi: 20 },
  { label: "GLUCOSE 5% 500ML POCHE", dci: "GLUCOSE", classe: "solutes", unite: "Poche", risque: false, ortho: 20, sspi: 20 },
  { label: "HEPARINE 5000UI/1ML FL INJ", dci: "HEPARINE SODIQUE", classe: "anticoagulants", unite: "Inject", risque: true, ortho: 10, sspi: 5 },
  { label: "HYDROCORTISONE 100MG FL PDR INJ", dci: "HYDROCORTISONE", classe: "corticoides", unite: "Inject", risque: false, ortho: 10, sspi: 10 },
  { label: "INSULINE RAPIDE 100UI/ML 10ML FL INJ", dci: "INSULINE HUMAINE RAPIDE", classe: "antidiabetiques", unite: "Flacon", risque: true, ortho: 5, sspi: 5 },
  { label: "IPRATROPIUM 0,5MG/2ML UNIDOSE NEBUL", dci: "IPRATROPIUM", classe: "respiratoire", unite: "Unidose", risque: false, ortho: 5, sspi: 10 },
  { label: "KETAMINE 50MG/5ML AMP INJ", dci: "KETAMINE", classe: "hypnotiques", unite: "Inject", risque: true, ortho: 20, sspi: 10 },
  { label: "KETOPROFENE 100MG FL PDR INJ", dci: "KETOPROFENE", classe: "antalgiques", unite: "Inject", risque: false, ortho: 20, sspi: 30 },
  { label: "LEVETIRACETAM 500MG/5ML FL INJ", dci: "LEVETIRACETAM", classe: "antiepileptiques", unite: "Inject", risque: false, ortho: 5, sspi: 5 },
  { label: "LEVOBUPIVACAINE 5MG/ML 10ML AMP INJ", dci: "LEVOBUPIVACAINE", classe: "anesthesiques locaux", unite: "Inject", risque: true, ortho: 20, sspi: null },
  { label: "LIDOCAINE 1% 20ML FL INJ", dci: "LIDOCAINE", classe: "anesthesiques locaux", unite: "Inject", risque: false, ortho: 40, sspi: 20 },
  { label: "LIDOCAINE 2% 20ML FL INJ", dci: "LIDOCAINE", classe: "anesthesiques locaux", unite: "Inject", risque: true, ortho: 30, sspi: 10 },
  { label: "LIDOCAINE ADRENALINEE 1% 20ML FL INJ", dci: "LIDOCAINE ADRENALINE", classe: "anesthesiques locaux", unite: "Inject", risque: true, ortho: 20, sspi: null },
  { label: "LUNETTES A OXYGENE ADULTE", dci: "LUNETTES O2", classe: "dispositifs", unite: "Unite", risque: false, ortho: 20, sspi: 50 },
  { label: "MANNITOL 20% 250ML POCHE", dci: "MANNITOL", classe: "diuretiques", unite: "Poche", risque: false, ortho: 5, sspi: 5 },
  { label: "MASQUE OXYGENE HAUTE CONCENTRATION", dci: "MASQUE O2 HC", classe: "dispositifs", unite: "Unite", risque: false, ortho: 20, sspi: 40 },
  { label: "MEPIVACAINE 10MG/ML 20ML FL INJ", dci: "MEPIVACAINE", classe: "anesthesiques locaux", unite: "Inject", risque: false, ortho: 20, sspi: null },
  { label: "METHYLPREDNISOLONE 120MG FL INJ", dci: "METHYLPREDNISOLONE", classe: "corticoides", unite: "Inject", risque: false, ortho: 10, sspi: 10 },
  { label: "METOCLOPRAMIDE 10MG/2ML AMP INJ", dci: "METOCLOPRAMIDE", classe: "antiemetiques", unite: "Inject", risque: false, ortho: 10, sspi: 20 },
  { label: "METRONIDAZOLE 500MG/100ML POCHE INJ", dci: "METRONIDAZOLE", classe: "antibiotiques", unite: "Poche", risque: false, ortho: 10, sspi: 5 },
  { label: "MIDAZOLAM 50MG/10ML AMP INJ", dci: "MIDAZOLAM", classe: "hypnotiques", unite: "Inject", risque: true, ortho: 10, sspi: 5 },
  { label: "MIDAZOLAM 5MG/1ML AMP INJ", dci: "MIDAZOLAM", classe: "hypnotiques", unite: "Inject", risque: true, ortho: 40, sspi: 20 },
  { label: "MORPHINE 10MG/1ML AMP INJ", dci: "MORPHINE", classe: "morphiniques", unite: "Inject", risque: true, ortho: 20, sspi: 40 },
  { label: "MORPHINE 1MG/1ML AMP INJ", dci: "MORPHINE", classe: "morphiniques", unite: "Inject", risque: true, ortho: 10, sspi: 30 },
  { label: "NALBUPHINE 20MG/2ML AMP INJ", dci: "NALBUPHINE", classe: "morphiniques", unite: "Inject", risque: false, ortho: 10, sspi: 20 },
  { label: "NALOXONE 0,4MG/1ML AMP INJ", dci: "NALOXONE", classe: "antidotes", unite: "Inject", risque: false, ortho: 10, sspi: 20 },
  { label: "NEFOPAM 20MG/2ML AMP INJ", dci: "NEFOPAM", classe: "antalgiques", unite: "Inject", risque: false, ortho: 20, sspi: 40 },
  { label: "NEOSTIGMINE 0,5MG/1ML AMP INJ", dci: "NEOSTIGMINE", classe: "antidotes", unite: "Inject", risque: false, ortho: 10, sspi: 10 },
  { label: "NICARDIPINE 10MG/10ML AMP INJ", dci: "NICARDIPINE", classe: "cardiovasculaires", unite: "Inject", risque: true, ortho: 10, sspi: 20 },
  { label: "NORADRENALINE 8MG/4ML AMP INJ", dci: "NORADRENALINE", classe: "catecholamines", unite: "Inject", risque: true, ortho: 20, sspi: 20 },
  { label: "ONDANSETRON 4MG/2ML AMP INJ", dci: "ONDANSETRON", classe: "antiemetiques", unite: "Inject", risque: false, ortho: 30, sspi: 40 },
  { label: "OXYCODONE 10MG/1ML AMP INJ", dci: "OXYCODONE", classe: "morphiniques", unite: "Inject", risque: true, ortho: null, sspi: 20 },
  { label: "OXYTOCINE 5UI/1ML AMP INJ", dci: "OXYTOCINE", classe: "uterotoniques", unite: "Inject", risque: true, ortho: 10, sspi: 10 },
  { label: "PARACETAMOL 1G/100ML FL INJ", dci: "PARACETAMOL", classe: "antalgiques", unite: "Flacon", risque: false, ortho: 60, sspi: 80 },
  { label: "PARECOXIB 40MG FL PDR INJ", dci: "PARECOXIB", classe: "antalgiques", unite: "Inject", risque: false, ortho: 10, sspi: 10 },
  { label: "PHENYLEPHRINE 50MCG/ML 10ML SER INJ", dci: "PHENYLEPHRINE", classe: "vasopresseurs", unite: "Inject", risque: false, ortho: 40, sspi: 20 },
  { label: "PHENYLEPHRINE COLLYRE 10% 10ML FL", dci: "PHENYLEPHRINE", classe: "divers", unite: "Flacon", risque: false, ortho: 5, sspi: null },
  { label: "PIPERACILLINE/TAZOBACTAM 4G FL PDR INJ", dci: "PIPERACILLINE TAZOBACTAM", classe: "antibiotiques", unite: "Inject", risque: false, ortho: 10, sspi: 5 },
  { label: "POVIDONE IODEE 10% 125ML FL", dci: "POVIDONE IODEE", classe: "antiseptiques", unite: "Flacon", risque: false, ortho: 20, sspi: 10 },
  { label: "PROLONGATEUR ROBINET 3 VOIES", dci: "ROBINET 3 VOIES", classe: "dispositifs", unite: "Unite", risque: false, ortho: 60, sspi: 50 },
  { label: "PROPOFOL 10MG/ML 20ML AMP INJ", dci: "PROPOFOL", classe: "hypnotiques", unite: "Inject", risque: true, ortho: 120, sspi: 20 },
  { label: "PROPOFOL 20MG/ML 50ML FL INJ", dci: "PROPOFOL", classe: "hypnotiques", unite: "Inject", risque: true, ortho: 40, sspi: null },
  { label: "PROTAMINE 1000UI/1ML AMP INJ", dci: "PROTAMINE", classe: "antidotes", unite: "Inject", risque: true, ortho: 5, sspi: null },
  { label: "REMIFENTANIL 2MG FL PDR INJ", dci: "REMIFENTANIL", classe: "morphiniques", unite: "Inject", risque: true, ortho: 30, sspi: null },
  { label: "RINGER LACTATE 500ML POCHE", dci: "RINGER LACTATE", classe: "solutes", unite: "Poche", risque: false, ortho: 40, sspi: 30 },
  { label: "ROCURONIUM 50MG/5ML AMP INJ", dci: "ROCURONIUM", classe: "curares", unite: "Inject", risque: true, ortho: 40, sspi: 5 },
  { label: "ROPIVACAINE 10MG/ML 20ML AMP INJ", dci: "ROPIVACAINE", classe: "anesthesiques locaux", unite: "Inject", risque: true, ortho: 20, sspi: null },
  { label: "ROPIVACAINE 2MG/ML 100ML POCHE INJ", dci: "ROPIVACAINE", classe: "anesthesiques locaux", unite: "Poche", risque: true, ortho: 20, sspi: 10 },
  { label: "ROPIVACAINE 7,5MG/ML 20ML AMP INJ", dci: "ROPIVACAINE", classe: "anesthesiques locaux", unite: "Inject", risque: true, ortho: 30, sspi: null },
  { label: "SALBUTAMOL 5MG/5ML FL NEBUL", dci: "SALBUTAMOL", classe: "respiratoire", unite: "Flacon", risque: false, ortho: 5, sspi: 10 },
  { label: "SERINGUE 10ML LUER LOCK", dci: "SERINGUE 10ML", classe: "dispositifs", unite: "Unite", risque: false, ortho: 100, sspi: 80 },
  { label: "SERINGUE 50ML LUER LOCK", dci: "SERINGUE 50ML", classe: "dispositifs", unite: "Unite", risque: false, ortho: 50, sspi: 50 },
  { label: "SERINGUE 5ML LUER LOCK", dci: "SERINGUE 5ML", classe: "dispositifs", unite: "Unite", risque: false, ortho: 100, sspi: 80 },
  { label: "SEVOFLURANE 250ML FL INHAL", dci: "SEVOFLURANE", classe: "halogenes", unite: "Flacon", risque: false, ortho: 6, sspi: null },
  { label: "SOLUTION HYDROALCOOLIQUE 500ML FL", dci: "SOLUTION HYDROALCOOLIQUE", classe: "antiseptiques", unite: "Flacon", risque: false, ortho: 20, sspi: 20 },
  { label: "SONDE ASPIRATION CH14", dci: "SONDE ASPIRATION CH14", classe: "dispositifs", unite: "Unite", risque: false, ortho: 40, sspi: 40 },
  { label: "SUFENTANIL 10MCG/2ML AMP INJ", dci: "SUFENTANIL", classe: "morphiniques", unite: "Inject", risque: true, ortho: 60, sspi: 20 },
  { label: "SUFENTANIL 50MCG/10ML AMP INJ", dci: "SUFENTANIL", classe: "morphiniques", unite: "Inject", risque: true, ortho: 20, sspi: 5 },
  { label: "SUGAMMADEX 200MG/2ML FL INJ", dci: "SUGAMMADEX", classe: "antidotes", unite: "Inject", risque: false, ortho: 10, sspi: 10 },
  { label: "SULFATE DE MAGNESIUM 15% 10ML AMP INJ", dci: "SULFATE DE MAGNESIUM", classe: "electrolytes", unite: "Inject", risque: true, ortho: 10, sspi: 10 },
  { label: "SUXAMETHONIUM 100MG/2ML AMP INJ", dci: "SUXAMETHONIUM", classe: "curares", unite: "Inject", risque: true, ortho: 20, sspi: 10 },
  { label: "THIOPENTAL 500MG FL PDR INJ", dci: "THIOPENTAL", classe: "hypnotiques", unite: "Inject", risque: true, ortho: 10, sspi: null },
  { label: "TRAMADOL 100MG/2ML AMP INJ", dci: "TRAMADOL", classe: "antalgiques", unite: "Inject", risque: false, ortho: 10, sspi: 30 },
  { label: "TRINITRINE 3MG/2ML AMP INJ", dci: "TRINITRINE", classe: "cardiovasculaires", unite: "Inject", risque: true, ortho: 5, sspi: 5 },
  { label: "URAPIDIL 25MG/5ML AMP INJ", dci: "URAPIDIL", classe: "cardiovasculaires", unite: "Inject", risque: false, ortho: 10, sspi: 20 },
  { label: "VANCOMYCINE 1G FL PDR INJ", dci: "VANCOMYCINE", classe: "antibiotiques", unite: "Inject", risque: true, ortho: 10, sspi: 5 },
  { label: "VITAMINE K1 10MG/1ML AMP INJ", dci: "PHYTOMENADIONE", classe: "hemostatiques", unite: "Inject", risque: false, ortho: 5, sspi: 5 },
];

export const PHARMA_CLASSES: string[] = Array.from(
  new Set(PHARMA_PRODUCTS.map((p) => p.classe)),
).sort((a, b) => a.localeCompare(b, "fr"));

export type PharmaFamily = "ANTISEPTIQUES" | "DISPOSITIFS" | "MEDICAMENTS" | "SOLUTES";

export const PHARMA_FAMILIES: PharmaFamily[] = [
  "ANTISEPTIQUES",
  "DISPOSITIFS",
  "MEDICAMENTS",
  "SOLUTES",
];

/** Famille logistique déduite de la classe pharmaco-thérapeutique. */
export function familyOf(product: PharmaProduct): PharmaFamily {
  if (product.classe === "antiseptiques") return "ANTISEPTIQUES";
  if (product.classe === "dispositifs") return "DISPOSITIFS";
  if (product.classe === "solutes") return "SOLUTES";
  return "MEDICAMENTS";
}

export const PHARMA_MAX_DOTATION = PHARMA_PRODUCTS.reduce(
  (max, p) => Math.max(max, p.ortho ?? 0, p.sspi ?? 0),
  0,
);

export function normalizeSearch(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export const SIGNALEMENT_KINDS = [
  "rupture",
  "peremption",
  "erreur dotation",
  "autre",
] as const;
export type SignalementKind = (typeof SIGNALEMENT_KINDS)[number];

/** Identifiant d'URL stable d'un produit (dérivé du libellé). */
export function productSlug(label: string): string {
  return normalizeSearch(label)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function findProductBySlug(slug: string): PharmaProduct | undefined {
  return PHARMA_PRODUCTS.find((p) => productSlug(p.label) === slug);
}

/** Contenu structuré d'une fiche produit (généré par IA, stocké en base). */
export type FicheContent = {
  resume: string;
  indications: string[];
  posologie: string[];
  dilution: string[];
  contre_indications: string[];
  effets_indesirables: string[];
  surveillance: string[];
  antidote: string[];
  vigilance_bloc: string[];
  conservation: string[];
};

export const FICHE_SECTIONS: { key: keyof Omit<FicheContent, "resume">; label: string; icon: string }[] = [
  { key: "indications", label: "Indications au bloc", icon: "bi-clipboard-pulse" },
  { key: "posologie", label: "Posologie usuelle adulte", icon: "bi-eyedropper" },
  { key: "dilution", label: "Dilution & administration", icon: "bi-droplet-half" },
  { key: "contre_indications", label: "Contre-indications", icon: "bi-slash-circle" },
  { key: "effets_indesirables", label: "Effets indésirables", icon: "bi-exclamation-circle" },
  { key: "surveillance", label: "Surveillance", icon: "bi-activity" },
  { key: "antidote", label: "Antidote / conduite à tenir", icon: "bi-shield-plus" },
  { key: "vigilance_bloc", label: "Points de vigilance bloc", icon: "bi-cone-striped" },
  { key: "conservation", label: "Conservation & stockage", icon: "bi-thermometer-half" },
];
