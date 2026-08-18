export type ClientType = 'Particulier' | 'Pro';
export type ContractType = 'Fixe' | 'Variable';
export type Duration = 10 | 15 | 20 | 25;
export type BatteryDuration = 10 | 15;
export type ChartMode = 'comparaison' | 'cumul' | 'annuel';

export interface SimulatorParams {
  clientType: ClientType;
  contractType: ContractType;
  duration: Duration;
  batteryDuration: BatteryDuration;
  installPrice: number;
  batteryPrice: number;
  batteryCapacity: number;
  peakPower: number;
  initialPayment: number;
  annualConsumption: number;
  pvgisProduction: number;
  avgKwhPrice: number;
  autoConsoRate: number;
  batteryAutoConsoBoost: number;
}

export interface Subscription {
  monthly: number;
  monthlyHT: number;
  annual: number;
}

export interface ScenarioResult {
  totalSavings: number;
  /**
   * Première année dont le FLUX annuel est positif : l'année où la facture
   * évitée dépasse l'abonnement. Ce n'est PAS le retour sur investissement.
   */
  breakEvenYear: number | null;
  /**
   * Année de bascule : première année où le CUMUL repasse au-dessus de zéro,
   * c'est-à-dire où le client a rattrapé tout ce qu'il a payé de plus que
   * s'il n'avait rien installé. C'est la réponse à « à partir de quand
   * est-ce que j'y gagne ? ».
   */
  switchYear: number | null;
  yearlyData: number[];
  cumulativeData: number[];
}

export interface YearBreakdown {
  directConsumption: number;
  batteryBoostConsumption?: number;
  virtualBatteryOrResale: number;
  subscriptionCost: number;
  batteryCost: number;
  netSavings: number;
}

export interface Results {
  subscriptionPV: Subscription | null;
  subscriptionBattery: Subscription | null;
  scenarioBV: ScenarioResult;
  scenarioPV: ScenarioResult;
  scenarioBP: ScenarioResult;
  breakdownBV: YearBreakdown;
  breakdownPV: YearBreakdown;
  breakdownBP: YearBreakdown;
  /**
   * Facture fournisseur cumulée SANS photovoltaïque, année par année.
   * C'est la référence à laquelle le client compare : les scénarios SunLib
   * s'en déduisent par `referenceCumulative[i] - cumulativeData[i]`, puisque
   * les données de scénario sont déjà un différentiel « avec » vs « sans ».
   */
  referenceCumulative: number[];
  /** Somme des abonnements versés sur toute la durée du contrat. */
  totalContractCost: number;
  outOfRange: boolean;
  isVirtualBatteryEligible: boolean;
}
