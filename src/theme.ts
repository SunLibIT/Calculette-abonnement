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
    // La charte ne définit pas de 3e couleur catégorielle. On reprend le token
    // « solar » du gabarit CRM plutôt que l'ambre sémantique, qui signifie
    // « attention » : une série de données n'est pas une alerte (charte §1).
    fill: '#F59E0B',
    ink: '#D97706',
    post: 'rgba(245,158,11,0.28)',
    fillRgba: 'rgba(245,158,11,0.85)',
  },
} as const;

export type SeriesKey = keyof typeof SERIES;

/** Encres monétaires : gain = vert lisible, perte = rouge de la charte. */
export const MONEY_INK = {
  positive: '#0D7A3C',
  negative: '#B91C1C',
} as const;
