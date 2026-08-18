import type { SimulatorParams, Results, ScenarioResult, YearBreakdown, Subscription } from '../types/simulator';

const TAUX_FIXE: Record<number, number[]> = {
  25: [10.00, 10.00, 10.00, 10.60, 10.70, 10.80, 10.84, 10.89, 11.00, 11.10, 11.21, 11.30, 11.35, 11.39, 11.50, 11.60, 11.72, 11.80, 11.85, 11.90, 11.98, 12.10, 12.20, 12.30, 12.40, 12.50],
  20: [10.30, 10.30, 10.30, 10.90, 11.00, 11.10, 11.14, 11.19, 11.30, 11.40, 11.51, 11.60, 11.65, 11.69, 11.80, 11.90, 12.02, 12.10, 12.15, 12.20, 12.28, 12.40, 12.50, 12.60, 12.70, 12.80],
  15: [10.50, 10.50, 10.50, 11.10, 11.20, 11.30, 11.34, 11.39, 11.50, 11.60, 11.71, 11.80, 11.85, 11.89, 12.00, 12.10, 12.22, 12.30, 12.35, 12.40, 12.48, 12.60, 12.70, 12.80, 12.90, 13.00],
  10: [11.20, 11.20, 11.20, 11.80, 11.90, 12.00, 12.04, 12.09, 12.20, 12.30, 12.41, 12.50, 12.55, 12.59, 12.70, 12.80, 12.92, 13.00, 13.05, 13.10, 13.18, 13.30, 13.40, 13.50, 13.60, 13.70]
};

const TAUX_VAR: Record<number, number[]> = {
  25: [8.50, 8.50, 8.50, 9.10, 9.20, 9.30, 9.34, 9.39, 9.50, 9.60, 9.71, 9.80, 9.85, 9.89, 10.00, 10.10, 10.22, 10.30, 10.35, 10.40, 10.48, 10.60, 10.70, 10.80, 10.90, 11.00],
  20: [8.75, 8.75, 8.75, 9.35, 9.45, 9.55, 9.59, 9.64, 9.75, 9.85, 9.96, 10.05, 10.10, 10.14, 10.25, 10.35, 10.47, 10.55, 10.60, 10.65, 10.73, 10.85, 10.95, 11.05, 11.15, 11.25],
  15: [9.10, 9.10, 9.10, 9.70, 9.80, 9.90, 9.94, 9.99, 10.10, 10.20, 10.31, 10.40, 10.45, 10.49, 10.60, 10.70, 10.82, 10.90, 10.95, 11.00, 11.08, 11.20, 11.30, 11.40, 11.50, 11.60],
  10: [10.00, 10.00, 10.00, 10.60, 10.70, 10.80, 10.84, 10.89, 11.00, 11.10, 11.21, 11.30, 11.35, 11.39, 11.50, 11.60, 11.72, 11.80, 11.85, 11.90, 11.98, 12.10, 12.20, 12.30, 12.40, 12.50]
};

const TAUX_FIXE_MAX: Record<number, number> = { 25: 12.50, 20: 12.80, 15: 13.00, 10: 13.70 };
const TAUX_VAR_MAX: Record<number, number> = { 25: 11.00, 20: 11.25, 15: 11.60, 10: 12.50 };

const PRIX_MAX = [5200, 5500, 6290, 6750, 7542, 8333, 9250, 10083, 10833, 11417, 12000, 12500, 13083, 13667, 14167, 14635, 15170, 15700, 16230, 16765, 17300, 17833, 18380, 18900, 19450, 20000, 20700, 21390, 22080, 22770, 23460, 24150, 24840, 25530, 26220, 26910, 27600, 28290, 28980, 29670, 30360, 31050, 31740, 32430, 33120, 33810, 34500, 35190, 35880, 36570, 37260, 37950, 38640, 39330, 40020, 40710, 41400, 42090, 42780, 43470, 44160, 44850, 45540, 46230, 46920, 47610, 48300, 48990, 49680];

const TARIFS = [0.194, 0.20758, 0.22834, 0.24432, 0.25654, 0.26936, 0.28283, 0.29132, 0.30006, 0.30906, 0.31833, 0.32788, 0.33772, 0.34447, 0.35136, 0.35839, 0.36556, 0.37287, 0.38032, 0.38793, 0.39569, 0.40360, 0.41168, 0.41991, 0.42831];

const EVO_ABO = 0.015;
const FRAIS_BV_KWH = 0.10;
const TVA = 1.20;
const DUREE_CHART = 25;

// Prime d'investissement versée en année 2 (€/Wc)
function getPrimeInvestissement(peakPowerKwc: number): number {
  const peakPowerWc = peakPowerKwc * 1000;
  let primeParWc = 0;

  if (peakPowerKwc <= 9) {
    primeParWc = 0.08;
  } else if (peakPowerKwc <= 36) {
    primeParWc = 0.14;
  } else if (peakPowerKwc <= 100) {
    primeParWc = 0.07;
  }

  return peakPowerWc * primeParWc;
}

function getTarifRevente(peakPower: number): number {
  if (peakPower < 9) {
    return 0.0400;
  } else if (peakPower <= 100) {
    return 0.0536;
  } else {
    return 0.0400;
  }
}

function getTaux(duration: number, peakPower: number, isFixe: boolean): number {
  const idx = Math.floor((peakPower - 2) / 0.5);
  const clampedIdx = Math.max(0, Math.min(idx, 68));
  const table = isFixe ? TAUX_FIXE : TAUX_VAR;
  const maxTable = isFixe ? TAUX_FIXE_MAX : TAUX_VAR_MAX;
  const arr = table[duration];
  return (clampedIdx < arr.length ? arr[clampedIdx] : maxTable[duration]) / 100;
}

function calculateMonthlyPayment(capital: number, rate: number, months: number): number {
  const monthlyRate = rate / 12;
  return Math.round(capital * monthlyRate / (1 - Math.pow(1 + monthlyRate, -months)) * 100) / 100;
}

function getPriceLimit(peakPower: number): number {
  if (peakPower > 36) {
    return Infinity;
  }
  const idx = Math.round((peakPower - 2) / 0.5);
  const clampedIdx = Math.max(0, Math.min(idx, 68));
  return PRIX_MAX[clampedIdx];
}

export function calculateResults(params: SimulatorParams): Results {
  const {
    clientType,
    contractType,
    duration,
    batteryDuration,
    installPrice,
    batteryPrice,
    peakPower,
    initialPayment,
    annualConsumption,
    pvgisProduction,
    avgKwhPrice,
    autoConsoRate,
    batteryAutoConsoBoost
  } = params;

  const tvaCoef = clientType === 'Particulier' ? TVA : 1.0;
  const hasBattery = batteryPrice > 0;
  const priceLimit = getPriceLimit(peakPower);
  const outOfRange = installPrice > priceLimit;
  const isVirtualBatteryEligible = peakPower <= 36;

  let subscriptionPV: Subscription | null = null;
  let subscriptionBattery: Subscription | null = null;

  if (!outOfRange) {
    const minPayment = clientType === 'Particulier' ? 500 : 5000;
    const validatedPayment = initialPayment > 0 && initialPayment < minPayment ? minPayment : initialPayment;
    const initialPaymentHT = clientType === 'Particulier' ? validatedPayment / TVA : validatedPayment;
    const capital = Math.max(0, installPrice - initialPaymentHT);
    const ratePV = getTaux(duration, peakPower, contractType === 'Fixe');
    const monthlyPV_HT = calculateMonthlyPayment(capital, ratePV, duration * 12);
    subscriptionPV = {
      monthlyHT: monthlyPV_HT,
      monthly: monthlyPV_HT * tvaCoef,
      annual: monthlyPV_HT * tvaCoef * 12
    };

    if (hasBattery) {
      const rateBP = getTaux(batteryDuration, peakPower, contractType === 'Fixe');
      const monthlyBP_HT = calculateMonthlyPayment(batteryPrice, rateBP, batteryDuration * 12);
      subscriptionBattery = {
        monthlyHT: monthlyBP_HT,
        monthly: monthlyBP_HT * tvaCoef,
        annual: monthlyBP_HT * tvaCoef * 12
      };
    }
  }

  const prod0 = peakPower * pvgisProduction;
  const scale = avgKwhPrice / 0.194;
  const tarifRevente = getTarifRevente(peakPower);
  const primeInvestissement = getPrimeInvestissement(peakPower);

  const emptyScenario = (): ScenarioResult => ({
    totalSavings: 0,
    breakEvenYear: null,
    switchYear: null,
    yearlyData: [],
    cumulativeData: []
  });

  const scenarioBV = emptyScenario();
  const scenarioPV = emptyScenario();
  const scenarioBP = emptyScenario();

  // Référence client : ce que coûterait l'électricité sans rien installer.
  // Calculée hors de la boucle principale pour rester disponible même quand
  // l'installation est hors tarif et qu'aucun scénario n'est produit.
  const referenceCumulative: number[] = [];
  let cumReference = 0;
  for (let y = 1; y <= DUREE_CHART; y++) {
    cumReference += annualConsumption * TARIFS[Math.min(y, 25) - 1] * scale;
    referenceCumulative.push(Math.round(cumReference));
  }

  let totalContractCost = 0;

  let breakdownBV: YearBreakdown = { directConsumption: 0, virtualBatteryOrResale: 0, subscriptionCost: 0, batteryCost: 0, netSavings: 0 };
  let breakdownPV: YearBreakdown = { directConsumption: 0, virtualBatteryOrResale: 0, subscriptionCost: 0, batteryCost: 0, netSavings: 0 };
  let breakdownBP: YearBreakdown = { directConsumption: 0, virtualBatteryOrResale: 0, subscriptionCost: 0, batteryCost: 0, netSavings: 0 };

  let cumBV = 0, cumPV = 0, cumBP = 0;

  if (!outOfRange && subscriptionPV) {
    for (let y = 1; y <= DUREE_CHART; y++) {
      const ti = Math.min(y, 25) - 1;
      const tarif = TARIFS[ti] * scale;
      const prod = prod0;
      const inContract = y <= duration;
      const abo_pv_ann = inContract ? subscriptionPV.monthly * 12 * Math.pow(1 + EVO_ABO, y - 1) : 0;
      const abo_bp_ann = hasBattery && subscriptionBattery && y <= batteryDuration
        ? subscriptionBattery.monthly * 12 * Math.pow(1 + EVO_ABO, y - 1)
        : 0;

      const dir_bv = Math.min(prod * autoConsoRate, annualConsumption);
      const sto_bv = Math.min(prod * (1 - autoConsoRate), annualConsumption - dir_bv);
      const eco_dir_bv = dir_bv * tarif;
      const eco_bv_net = sto_bv * (tarif - FRAIS_BV_KWH);
      // Pas de prime d'investissement pour la batterie virtuelle
      const net_bv = eco_dir_bv + eco_bv_net - abo_pv_ann;

      const dir_pv = Math.min(prod * autoConsoRate, annualConsumption);
      const sur_pv = prod * (1 - autoConsoRate);
      const eco_dir_pv = dir_pv * tarif;
      const eco_rev_pv = sur_pv * tarifRevente;
      const prime_pv = (y === 2) ? primeInvestissement : 0;
      const net_pv = eco_dir_pv + eco_rev_pv - abo_pv_ann + prime_pv;

      const autoConsoWithBoost = Math.min(1.0, autoConsoRate + batteryAutoConsoBoost);
      const dir_bp_base = Math.min(prod * autoConsoRate, annualConsumption);
      const dir_bp_boost = Math.min(prod * batteryAutoConsoBoost, Math.max(0, annualConsumption - dir_bp_base));
      const sur_bp = prod * Math.max(0, 1 - autoConsoWithBoost);
      const eco_dir_bp_base = dir_bp_base * tarif;
      const eco_dir_bp_boost = dir_bp_boost * tarif;
      const eco_dir_bp = eco_dir_bp_base + eco_dir_bp_boost;
      const eco_rev_bp = sur_bp * tarifRevente;
      const prime_bp = (y === 2) ? primeInvestissement : 0;
      const net_bp = eco_dir_bp + eco_rev_bp - abo_pv_ann - abo_bp_ann + prime_bp;

      cumBV += net_bv;
      cumPV += net_pv;
      cumBP += net_bp;

      totalContractCost += abo_pv_ann + abo_bp_ann;

      scenarioBV.yearlyData.push(Math.round(net_bv));
      scenarioBV.cumulativeData.push(Math.round(cumBV));

      scenarioPV.yearlyData.push(Math.round(net_pv));
      scenarioPV.cumulativeData.push(Math.round(cumPV));

      scenarioBP.yearlyData.push(Math.round(net_bp));
      scenarioBP.cumulativeData.push(Math.round(cumBP));

      // Année de bascule : le cumul repasse au-dessus de la référence.
      if (scenarioBV.switchYear === null && cumBV >= 0) scenarioBV.switchYear = y;
      if (scenarioPV.switchYear === null && cumPV >= 0) scenarioPV.switchYear = y;
      if (scenarioBP.switchYear === null && cumBP >= 0) scenarioBP.switchYear = y;

      // Batterie virtuelle: rentabilité basée sur les économies annuelles
      if (scenarioBV.breakEvenYear === null && net_bv >= 0) scenarioBV.breakEvenYear = y;

      // PV seul: exclure année 2 (prime) et chercher première année avec économie annuelle positive
      if (scenarioPV.breakEvenYear === null && y !== 2 && net_pv >= 0) scenarioPV.breakEvenYear = y;

      // PV+ batterie physique: exclure année 2 (prime) et chercher première année avec économie annuelle positive
      if (scenarioBP.breakEvenYear === null && y !== 2 && net_bp >= 0) scenarioBP.breakEvenYear = y;

      if (y === duration) {
        scenarioBV.totalSavings = cumBV;
        scenarioPV.totalSavings = cumPV;
        scenarioBP.totalSavings = cumBP;
      }

      if (y === 1) {
        breakdownBV = {
          directConsumption: eco_dir_bv,
          virtualBatteryOrResale: eco_bv_net,
          subscriptionCost: -abo_pv_ann,
          batteryCost: 0,
          netSavings: net_bv
        };
        breakdownPV = {
          directConsumption: eco_dir_pv,
          virtualBatteryOrResale: eco_rev_pv,
          subscriptionCost: -abo_pv_ann,
          batteryCost: 0,
          netSavings: net_pv
        };
        breakdownBP = {
          directConsumption: eco_dir_bp_base,
          batteryBoostConsumption: eco_dir_bp_boost,
          virtualBatteryOrResale: eco_rev_bp,
          subscriptionCost: -abo_pv_ann,
          batteryCost: -abo_bp_ann,
          netSavings: net_bp
        };
      }
    }
  }

  return {
    subscriptionPV,
    subscriptionBattery,
    scenarioBV,
    scenarioPV,
    scenarioBP,
    breakdownBV,
    breakdownPV,
    breakdownBP,
    referenceCumulative,
    totalContractCost,
    outOfRange,
    isVirtualBatteryEligible
  };
}

export function formatCurrency(value: number): string {
  return value.toFixed(2).replace('.', ',') + ' €';
}

export function formatNumber(value: number): string {
  return Math.round(value).toLocaleString('fr-FR');
}

export function formatSavings(value: number): string {
  const rounded = Math.round(value);
  return (rounded >= 0 ? '+' : '') + rounded.toLocaleString('fr-FR') + ' €';
}
