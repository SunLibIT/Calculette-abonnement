/**
 * Couleurs des trois scénarios comparés.
 *
 * Source unique : le graphique, les puces de légende et les cartes de
 * décomposition lisent toutes ce module. « Une même notion = une même
 * couleur, partout » (charte §1).
 *
 * - `fill` : aplat de la série (barres du graphique, puce de légende).
 * - `ink`  : la même famille assombrie, pour du TEXTE sur blanc — `fill` seul
 *            ne passe pas le contraste AA (charte §3, non négociable).
 * - `post` : la même teinte atténuée, pour les années hors contrat.
 */
export const SERIES = {
  pv: {
    label: 'PV Seul',
    fill: '#60B830', // vert aplat (charte)
    ink: '#0D7A3C',
    post: 'rgba(96,184,48,0.28)',
    fillRgba: 'rgba(96,184,48,0.85)',
  },
  bv: {
    label: 'PV + Batt. Virtuelle',
    fill: '#13A3AC', // teal (charte)
    ink: '#0B7880',
    post: 'rgba(19,163,172,0.28)',
    fillRgba: 'rgba(19,163,172,0.85)',
  },
  bp: {
    label: 'PV + Batt. Physique',
    // Bleu neutre, et non l'orange « solar » du gabarit CRM : l'orange se lit
    // comme un avertissement alors qu'il ne désigne que l'autre scénario.
    // Une couleur de catégorie ne doit pas emprunter un signal d'urgence
    // (charte §1 : « ne pas confondre couleur de catégorie et d'urgence »).
    fill: '#3B6FD4',
    ink: '#2B54A8',
    post: 'rgba(59,111,212,0.28)',
    fillRgba: 'rgba(59,111,212,0.85)',
  },
} as const;

export type SeriesKey = keyof typeof SERIES;

/**
 * Teinte des valeurs NÉGATIVES dans le graphique.
 *
 * Une barre verte qui descend vers −50 k€ raconte l'inverse de son message :
 * le vert est la couleur du positif dans toute la charte. Les valeurs
 * négatives passent donc en gris-bleu neutre, et la couleur de série n'est
 * conservée que là où le résultat est réellement favorable au client.
 */
export const NEGATIVE = {
  fillRgba: 'rgba(100,116,139,0.80)',
  post: 'rgba(100,116,139,0.26)',
} as const;

/** Référence « sans photovoltaïque » — neutre, jamais une couleur de marque. */
export const REFERENCE = {
  label: 'Sans photovoltaïque',
  line: '#5B6472',
} as const;

/** Encres monétaires : gain = vert lisible, perte = rouge de la charte. */
export const MONEY_INK = {
  positive: '#0D7A3C',
  negative: '#B91C1C',
} as const;
