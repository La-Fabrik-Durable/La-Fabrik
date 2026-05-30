export const SITE_CONFIG = {
  backgroundImage: "/assets/bg-site.png",
  forcedName: "Danyl",
} as const;

export interface SiteCardConfig {
  id: string;
  label: string;
  imagePath?: string;
  disabled: boolean;
}

/**
 * Cards for screen 1: "Choisissez une expérience"
 */
export const EXPERIENCE_CARDS: readonly SiteCardConfig[] = [
  { id: "exp-fabrik", label: "La Fabrik", disabled: false },
  { id: "exp-ferme", label: "La Ferme verticale", disabled: true },
  { id: "exp-energie", label: "La Zone d'énergie", disabled: true },
  { id: "exp-ecole", label: "L'École", disabled: true },
];

/**
 * Cards for screen 2: "Quelle est votre situation ?"
 */
export const SITUATION_CARDS: readonly SiteCardConfig[] = [
  { id: "sit-habitants", label: "Habitants d'Altera", disabled: true },
  { id: "sit-apprentis", label: "Apprentis-Citoyens", disabled: true },
  {
    id: "sit-refugies",
    label: "Réfugiés Climatiques arrivants",
    disabled: false,
  },
  { id: "sit-seniors", label: "Seniors Hyper-Connectés", disabled: true },
];
