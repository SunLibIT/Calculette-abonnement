import type { YearBreakdown } from '../types/simulator';
import { formatSavings } from '../utils/calculations';
import { SERIES, type SeriesKey, MONEY_INK } from '../theme';

interface DecompositionCardProps {
  seriesKey: SeriesKey;
  breakdown: YearBreakdown;
  labels: {
    direct: string;
    secondary: string;
    subscription?: boolean;
    battery?: boolean;
    batteryBoostPercent?: string;
  };
}

/** Une ligne libellé / montant : libellé à gauche, montant aligné à droite. */
function Row({ label, amount, tone }: { label: string; amount: number; tone: 'gain' | 'cost' }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-line py-1.5 text-[13px] last:border-b-0">
      <span className="min-w-0 text-muted">{label}</span>
      <span
        className="num flex-none font-semibold"
        style={{ color: tone === 'gain' ? MONEY_INK.positive : MONEY_INK.negative }}
      >
        {formatSavings(amount)}
      </span>
    </div>
  );
}

/**
 * Décomposition de la première année pour un scénario.
 * Montants alignés à droite (alignement numérique, charte §2).
 */
export function DecompositionCard({ seriesKey, breakdown, labels }: DecompositionCardProps) {
  const series = SERIES[seriesKey];
  const showBoost =
    breakdown.batteryBoostConsumption !== undefined &&
    breakdown.batteryBoostConsumption > 0 &&
    labels.batteryBoostPercent;

  return (
    <div className="rounded-control border border-line bg-canvas p-4">
      <div className="mb-1.5 flex items-center gap-2">
        <span
          aria-hidden="true"
          className="h-2.5 w-2.5 flex-none rounded-full"
          style={{ backgroundColor: series.fill }}
        />
        <h3 className="truncate text-xs font-bold uppercase tracking-[0.05em]" style={{ color: series.ink }}>
          {series.label}
        </h3>
      </div>

      <Row label={labels.direct} amount={breakdown.directConsumption} tone="gain" />
      {showBoost && (
        <Row
          label={`Gain autoconso batterie (${labels.batteryBoostPercent})`}
          amount={breakdown.batteryBoostConsumption as number}
          tone="gain"
        />
      )}
      <Row label={labels.secondary} amount={breakdown.virtualBatteryOrResale} tone="gain" />
      {labels.battery && <Row label="Abonnement batterie" amount={breakdown.batteryCost} tone="cost" />}
      {labels.subscription !== false && (
        <Row label="Abonnement PV" amount={breakdown.subscriptionCost} tone="cost" />
      )}

      <div className="mt-2 flex items-baseline justify-between gap-3 border-t-2 border-line pt-2 text-sm">
        <span className="font-bold text-ink">Net année 1</span>
        <span
          className="num font-extrabold"
          style={{ color: breakdown.netSavings >= 0 ? MONEY_INK.positive : MONEY_INK.negative }}
        >
          {formatSavings(breakdown.netSavings)}
        </span>
      </div>
    </div>
  );
}
