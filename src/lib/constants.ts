export const CONTENT_TYPE = "transmissions" as const;

export const RULES = {
  titleMin: 3,
  titleMax: 100,
  contentMin: 10,
  maxImages: 3,
  maxImageBytes: 5 * 1024 * 1024,
  maxTags: 5,
  listLimit: 100,
  essentialTarget: 20,
} as const;

export const TAG_TYPES = [
  "libre",
  "fonction",
  "anatomie",
  "intervention",
  "materiel",
  "personne",
  "marque",
] as const;

export const TAG_TYPE_LABELS: Record<string, string> = {
  libre: "Libre",
  fonction: "Fonction",
  anatomie: "Anatomie",
  intervention: "Intervention",
  materiel: "Matériel",
  personne: "Personne",
  marque: "Marque",
};

export const APPROVAL_LABELS: Record<string, string> = {
  en_attente: "En attente",
  approuve: "Approuvé",
  refuse: "Refusé",
  desactive: "Désactivé",
};

export const STATUS_LABELS: Record<string, string> = {
  ouvert: "Active",
  archive: "Archivée",
  supprime: "Masquée",
};

export const ROLE_LABELS: Record<string, string> = {
  membre: "Membre",
  moderateur: "Modérateur",
  admin: "Admin",
};
