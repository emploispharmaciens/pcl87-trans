export type ModuleStatus = "actif" | "bientot";

export type ModuleFamily = "Savoir" | "Pratique" | "Équipe" | "Personnel";

export type ModuleDef = {
  slug: string;
  name: string;
  description: string;
  icon: string;
  family: ModuleFamily;
  status: ModuleStatus;
  /** Route interne quand le module est déjà livré. */
  path?: string;
};

/** Catalogue des modules Des Blocs & Moi (repris de la stack vanilla). */
export const MODULES: ModuleDef[] = [
  {
    slug: "transmissions",
    name: "Transmissions",
    description: "Consigner et consulter les transmissions d'équipe.",
    icon: "bi-chat-left-text",
    family: "Équipe",
    status: "actif",
    path: "/transmissions",
  },
  {
    slug: "profil",
    name: "Mon Profil",
    description: "Modifier mon profil, mes informations et préférences.",
    icon: "bi-person-circle",
    family: "Personnel",
    status: "actif",
    path: "/profile",
  },
  {
    slug: "pharmacie",
    name: "Pharmacie",
    description: "Rechercher un médicament ou dispositif : classe, dotation ORTHO/SSPI, risque.",
    icon: "bi-capsule",
    family: "Pratique",
    status: "actif",
    path: "/pharmacie",
  },
  {
    slug: "sutures",
    name: "Sutures",
    description: "Les fils du bloc orthopédique : familles, calibres et usage par intervention.",
    icon: "bi-bezier2",
    family: "Savoir",
    status: "actif",
    path: "/sutures",
  },
  {
    slug: "sutures",
    name: "Sutures",
    description: "Les fils du bloc : famille, calibre, aiguille et usage par intervention.",
    icon: "bi-bezier2",
    family: "Pratique",
    status: "actif",
    path: "/sutures",
  },
  {
    slug: "documents",
    name: "Documents",
    description: "Consulter les documents institutionnels et protocoles PDF.",
    icon: "bi-folder2-open",
    family: "Savoir",
    status: "bientot",
  },
  {
    slug: "pedagogie",
    name: "Pédagogie",
    description: "Parcours de formation en ligne, leçons et quiz.",
    icon: "bi-mortarboard",
    family: "Savoir",
    status: "bientot",
  },
  {
    slug: "modules-formation",
    name: "Modules de formation",
    description: "Protocoles, chirurgie et never events.",
    icon: "bi-journal-bookmark",
    family: "Savoir",
    status: "bientot",
  },
  {
    slug: "recueil-situation",
    name: "Recueil de Situation",
    description: "Décrire et analyser les situations rencontrées au bloc.",
    icon: "bi-clipboard-pulse",
    family: "Pratique",
    status: "bientot",
  },
  {
    slug: "boite-a-idees",
    name: "Boîte à idées",
    description: "Proposer et voter les idées d'amélioration du bloc.",
    icon: "bi-lightbulb",
    family: "Équipe",
    status: "bientot",
  },
  {
    slug: "carnet-de-bord",
    name: "Carnet de Bord",
    description: "Suivre sa progression et valider ses compétences clés.",
    icon: "bi-journal-check",
    family: "Personnel",
    status: "bientot",
  },
  {
    slug: "interview",
    name: "Interview",
    description: "Recueillir la parole et l'expérience des professionnels.",
    icon: "bi-mic",
    family: "Équipe",
    status: "bientot",
  },
  {
    slug: "annuaire",
    name: "Annuaire",
    description: "Répertoire de l'équipe soignante et préférences.",
    icon: "bi-people",
    family: "Équipe",
    status: "bientot",
  },
  {
    slug: "fiches-intervention",
    name: "Fiches Intervention",
    description: "Protocoles et fiches techniques par chirurgien et acte.",
    icon: "bi-file-medical",
    family: "Pratique",
    status: "bientot",
  },
  {
    slug: "preferences-chirurgien",
    name: "Préférences Chirurgien",
    description: "Préférences opératoires par chirurgien et intervention.",
    icon: "bi-person-badge",
    family: "Pratique",
    status: "bientot",
  },
  {
    slug: "glossaire",
    name: "Glossaire",
    description: "Termes et abréviations chirurgicales du bloc.",
    icon: "bi-book",
    family: "Savoir",
    status: "bientot",
  },
  {
    slug: "organisateur",
    name: "Organisateur",
    description: "Organisation personnelle et suivi des tâches.",
    icon: "bi-check2-square",
    family: "Personnel",
    status: "bientot",
  },
  {
    slug: "integration-ide",
    name: "Intégration IDE",
    description: "Livret d'accueil, suivi de progression et onboarding.",
    icon: "bi-person-plus",
    family: "Savoir",
    status: "bientot",
  },
  {
    slug: "installation-patient",
    name: "Installation Patient",
    description: "Positions et installations par type d'intervention.",
    icon: "bi-hospital",
    family: "Pratique",
    status: "bientot",
  },
  {
    slug: "arsenal",
    name: "Arsenal",
    description: "Localiser et identifier le matériel chirurgical du bloc.",
    icon: "bi-box-seam",
    family: "Pratique",
    status: "bientot",
  },
  {
    slug: "fiches-picking",
    name: "Fiches de picking",
    description: "Listes de matériel à préparer par intervention.",
    icon: "bi-list-check",
    family: "Pratique",
    status: "bientot",
  },
  {
    slug: "disc",
    name: "DISC",
    description: "Profil comportemental et communication d'équipe.",
    icon: "bi-diagram-3",
    family: "Équipe",
    status: "bientot",
  },
  {
    slug: "thesaurus",
    name: "Thésaurus",
    description: "Glossaire du bloc — termes, matériel, abréviations.",
    icon: "bi-tags",
    family: "Savoir",
    status: "bientot",
  },
  {
    slug: "anatomie",
    name: "Anatomie",
    description: "Repères anatomiques essentiels pour l'équipe de bloc.",
    icon: "bi-activity",
    family: "Savoir",
    status: "bientot",
  },
];

export const MODULE_FAMILIES: ModuleFamily[] = ["Savoir", "Pratique", "Équipe", "Personnel"];

export function getModule(slug: string): ModuleDef | undefined {
  return MODULES.find((m) => m.slug === slug);
}
