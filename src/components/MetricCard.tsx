import { CalendarCheck, TrendingDown, TrendingUp, AlertTriangle } from 'lucide-react';
import { formatNumber } from '../utils/calculations';
import { SERIES, type SeriesKey, MONEY_INK } from '../theme';

interface MetricCardProps {
  seriesKey: SeriesKey;
  totalSavings: number;
  breakEvenYear: number | null;
  duration: number;
}

/**
 * Carte de résumé d'un scénario (charte §4).
 *
 * Une métrique d'ancrage (l'économie à fin de contrat), une micro-légende de
 * contexte dessous, puis le point de rentabilité en pastille. Le signe est
 * porté par l'icône ET par le « + / − » : jamais par la couleur seule (§3).
 */
export function MetricCard({ seriesKey, totalSavings, breakEvenYear, duration }: MetricCardProps) {
  const series = SERIES[seriesKey];
  const isPositive = totalSavings >= 0;
  const TrendIcon = isPositive ? TrendingUp : TrendingDown;

  return (
    <div className="rounded-control border border-line bg-canvas p-4">
      <div className="flex items-center gap-2">
        <span
          aria-hidden="true"
          className="h-2.5 w-2.5 flex-none rounded-full"
          style={{ backgroundColor: series.fill }}
        />
        <h3 className="truncate text-xs font-bold uppercase tracking-[0.05em]" style={{ color: series.ink }}>
          {series.label}
        </h3>
      </div>

      {/* Métrique reine */}
      <p
        className="mt-2 flex items-center gap-1.5 text-2xl font-extrabold tracking-[-0.02em]"
        style={{ color: isPositive ? MONEY_INK.positive : MONEY_INK.negative }}
      >
        <TrendIcon size={20} strokeWidth={2} aria-hidden="true" className="flex-none" />
        {isPositive ? '+' : ''}
        {formatNumber(totalSavings)} €
      </p>
      <p className="mt-0.5 text-xs text-muted">À fin de contrat (an {duration})</p>

      {breakEvenYear ? (
        <p className="mt-2.5 inline-flex items-center gap-1.5 rounded-full bg-green-soft px-2.5 py-1 text-xs font-semibold text-green-ink">
          <CalendarCheck size={13} strokeWidth={2} aria-hidden="true" />
          Rentable dès l'année {breakEvenYear}
        </p>
      ) : (
        <p className="mt-2.5 inline-flex items-center gap-1.5 rounded-full bg-amber-soft px-2.5 py-1 text-xs font-semibold text-amber">
          <AlertTriangle size={13} strokeWidth={2} aria-hidden="true" />
          Pas de rentabilité sur {duration} ans
        </p>
      )}
    </div>
  );
}
