import type { Duration, Results, ScenarioResult, SimulatorParams } from '../types/simulator';
import type { SeriesKey } from '../theme';
import { calculateResults } from './calculations';

export interface Lever {
  /** Le réglage à changer, formulé comme une action. */
  action: string;
  /** Ce que ça donne. */
  outcome: string;
}

const scenarioOf = (results: Results, key: SeriesKey): ScenarioResult =>
  key === 'pv' ? results.scenarioPV : key === 'bv' ? results.scenarioBV : results.scenarioBP;

const DURATIONS: Duration[] = [10, 15, 20, 25];

/**
 * Cherche les réglages qui feraient basculer un scénario qui ne bascule pas.
 *
 * Constater « pas de rentabilité sur 25 ans » laisse le commercial sans
 * réponse devant son client. On teste donc les deux leviers dont il dispose
 * réellement — la durée du contrat et le taux d'autoconsommation — en
 * rejouant la simulation, plutôt qu'en énonçant une règle approximative.
 *
 * Le calcul est pur et borné (au plus 12 simulations de 25 itérations) ;
 * l'appelant le mémoïse et ne l'invoque que lorsqu'aucune bascule n'existe.
 */
export function findLevers(params: SimulatorParams, key: SeriesKey): Lever[] {
  const levers: Lever[] = [];

  // Durée : une durée plus courte coûte plus cher au mois mais libère des
  // années sans abonnement avant la 25e.
  for (const duration of DURATIONS) {
    if (duration === params.duration) continue;
    const switchYear = scenarioOf(calculateResults({ ...params, duration }), key).switchYear;
    if (switchYear !== null) {
      levers.push({ action: `passer à ${duration} ans`, outcome: `bascule en année ${switchYear}` });
      break;
    }
  }

  // Autoconsommation : par paliers de 10 points jusqu'à 100 %.
  for (let rate = params.autoConsoRate + 0.1; rate <= 1.0001; rate += 0.1) {
    const autoConsoRate = Math.min(1, Math.round(rate * 100) / 100);
    const switchYear = scenarioOf(calculateResults({ ...params, autoConsoRate }), key).switchYear;
    if (switchYear !== null) {
      levers.push({
        action: `porter l'autoconso à ${Math.round(autoConsoRate * 100)} %`,
        outcome: `bascule en année ${switchYear}`,
      });
      break;
    }
  }

  return levers;
}
