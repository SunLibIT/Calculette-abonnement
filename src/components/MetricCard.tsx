import { CalendarCheck, CalendarX } from 'lucide-react';
import { formatSavings } from '../utils/calculations';
import { SERIES, type SeriesKey, MONEY_INK } from '../theme';

interface MetricCardProps {
  seriesKey: SeriesKey;
  /** Année où le cumul repasse au-dessus du scénario « sans photovoltaïque ». */
  switchYear: number | null;
  totalSavings: number;
  duration: number;
}

/**
 * Carte de résumé d'un scénario (charte §4).
 *
 * La métrique d'ancrage est l'ANNÉE DE BASCULE, pas le cumul. Un cumul négatif
 * en gros et en rouge, doublé d'un badge d'alerte, empilait trois signaux
 * d'alarme sur un résultat structurellement attendu quand on additionne des
 * mensualités : le client, lui, demande « à partir de quand j'y gagne ». Le
 * cumul reste affiché, en ligne secondaire.
 */
export function MetricCard({ seriesKey, switchYear, totalSavings, duration }: MetricCardProps) {
  const series = SERIES[seriesKey];
  const hasSwitch = switchYear !== null;

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

      {/* Métrique reine : l'année de bascule. */}
      <p
        className={`mt-2 flex items-center gap-1.5 text-2xl font-extrabold tracking-[-0.02em] ${
          hasSwitch ? 'text-ink' : 'text-muted'
        }`}
      >
        {hasSwitch ? (
          <CalendarCheck size={20} strokeWidth={2} aria-hidden="true" className="flex-none text-green-ink" />
        ) : (
          <CalendarX size={20} strokeWidth={2} aria-hidden="true" className="flex-none" />
        )}
        {hasSwitch ? `Année ${switchYear}` : 'Au-delà de 25 ans'}
      </p>
      <p className="mt-0.5 text-xs text-muted">
        {hasSwitch ? 'Bascule en faveur du client' : 'Pas de bascule sur la projection'}
      </p>

      <p className="mt-2.5 text-xs text-muted">
        Cumul à l'an {duration} ·{' '}
        <span
          className="num font-bold"
          style={{ color: totalSavings >= 0 ? MONEY_INK.positive : MONEY_INK.negative }}
        >
          {formatSavings(totalSavings)}
        </span>
      </p>
    </div>
  );
}
