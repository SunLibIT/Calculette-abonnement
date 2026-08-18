import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  LineController,
  BarController,
  Tooltip,
  Legend,
  type ChartOptions,
  type ChartData,
  type Plugin,
  type TooltipPositionerFunction,
} from 'chart.js';
import { Chart } from 'react-chartjs-2';
import type { ChartMode, ScenarioResult } from '../types/simulator';
import { formatNumber, formatSavings } from '../utils/calculations';
import { SERIES, NEGATIVE, REFERENCE, type SeriesKey } from '../theme';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  LineController,
  BarController,
  Tooltip,
  Legend
);

/**
 * Positionneur d'infobulle « suivi du curseur ».
 *
 * Le positionneur par défaut (`average`) ancre l'infobulle au barycentre des
 * points de l'index, ce qui la fait stationner au milieu du graphe et masquer
 * le bas des barres et les libellés d'axe. Chart.js recale ensuite lui-même
 * l'infobulle pour qu'elle reste dans le canvas, ce qui donne le « flip »
 * près des bords.
 */
declare module 'chart.js' {
  interface TooltipPositionerMap {
    cursor: TooltipPositionerFunction<'bar' | 'line'>;
  }
}
Tooltip.positioners.cursor = (_items, eventPosition) => eventPosition;

const FONT = "'Plus Jakarta Sans', system-ui, sans-serif";
const INK = '#0F1729';
const MUTED = '#5B6472';
const LINE = '#E6EAEF';

// Formateurs partagés avec le reste de l'app : ils portent déjà le correctif
// d'espace fine insécable (U+202F illisible dans Plus Jakarta Sans).
const euro = (v: number) => formatSavings(v);
const euroAbs = (v: number) => `${formatNumber(v)} €`;

const kEuroTick = (value: string | number, signed: boolean) => {
  const v = typeof value === 'number' ? value : 0;
  if (v === 0) return '0';
  const abs = Math.abs(v);
  const sign = v < 0 ? '-' : signed ? '+' : '';
  return abs >= 1000 ? `${sign}${Math.round(abs / 1000)} k€` : `${sign}${abs} €`;
};

interface ChartComponentProps {
  mode: ChartMode;
  duration: number;
  scenarioBV: ScenarioResult;
  scenarioPV: ScenarioResult;
  scenarioBP: ScenarioResult;
  referenceCumulative: number[];
  hasBattery: boolean;
  visibleDatasets: { bv: boolean; pv: boolean; bp: boolean };
  /** Hauteur du cadre. Le document imprimé en demande une plus basse. */
  heightClass?: string;
}

export function ChartComponent({
  mode,
  duration,
  scenarioBV,
  scenarioPV,
  scenarioBP,
  referenceCumulative,
  hasBattery,
  visibleDatasets,
  heightClass = 'h-[340px]',
}: ChartComponentProps) {
  const labels = Array.from({ length: 25 }, (_, i) => `An ${i + 1}`);
  const isComparison = mode === 'comparaison';
  const isCumulative = mode === 'cumul';

  /**
   * Comparaison et cumul se lisent en LIGNES, pas en barres.
   *
   * Deux scénarios cumulés sur 25 ans, c'est 50 barres appariées dont les
   * paires sont quasi identiques : beaucoup d'encre pour un écart de quelques
   * pour cent, et l'écart — qui est justement l'objet de la comparaison — ne
   * se voit pas. Deux lignes fines le donnent d'un coup d'œil.
   * Le mode annuel garde des barres : un flux annuel est une grandeur
   * discrète par année, et les valeurs y varient assez pour être lisibles.
   */
  const asLines = isComparison || isCumulative;

  const active: { key: SeriesKey; scenario: ScenarioResult }[] = [];
  if (visibleDatasets.pv) active.push({ key: 'pv', scenario: scenarioPV });
  if (visibleDatasets.bv) active.push({ key: 'bv', scenario: scenarioBV });
  if (hasBattery && visibleDatasets.bp) active.push({ key: 'bp', scenario: scenarioBP });

  // Hors tarif, les scénarios ne sont pas produits : leurs séries sont vides.
  // Sans ce filtre, la courbe « avec SunLib » se confondrait avec la
  // référence et laisserait croire que l'offre ne change rien.
  const plotted = active.filter((a) => a.scenario.cumulativeData.length > 0);

  /**
   * Couleur d'une barre : la teinte de série n'est portée que par les valeurs
   * POSITIVES ; les négatives passent en gris-bleu. Après la fin du contrat,
   * la teinte est atténuée.
   */
  const barColors = (data: number[], key: SeriesKey) =>
    data.map((v, i) => {
      const palette = v >= 0 ? SERIES[key] : NEGATIVE;
      return i + 1 <= duration ? palette.fillRgba : palette.post;
    });

  const data: ChartData<'bar' | 'line'> = isComparison
    ? {
        labels,
        datasets: [
          {
            type: 'line' as const,
            label: REFERENCE.label,
            data: referenceCumulative,
            borderColor: REFERENCE.line,
            backgroundColor: REFERENCE.line,
            borderWidth: 2,
            borderDash: [6, 4],
            pointRadius: 0,
            pointHoverRadius: 4,
            tension: 0.15,
          },
          ...plotted.map(({ key, scenario }) => ({
            type: 'line' as const,
            label: `Avec SunLib — ${SERIES[key].label}`,
            // Les données de scénario sont un différentiel « avec » vs « sans » :
            // le coût réel se retrouve en le retranchant de la référence.
            data: referenceCumulative.map((ref, i) => ref - (scenario.cumulativeData[i] ?? 0)),
            borderColor: SERIES[key].fill,
            backgroundColor: SERIES[key].fill,
            borderWidth: 2.5,
            pointRadius: 0,
            pointHoverRadius: 4,
            tension: 0.15,
          })),
        ],
      }
    : isCumulative
      ? {
          labels,
          datasets: plotted.map(({ key, scenario }) => ({
            type: 'line' as const,
            label: SERIES[key].label,
            data: scenario.cumulativeData,
            borderColor: SERIES[key].fill,
            backgroundColor: SERIES[key].fill,
            borderWidth: 2,
            pointRadius: 0,
            pointHoverRadius: 4,
            tension: 0.15,
          })),
        }
      : {
          labels,
          datasets: plotted.map(({ key, scenario }) => ({
            type: 'bar' as const,
            label: SERIES[key].label,
            data: scenario.yearlyData,
            backgroundColor: barColors(scenario.yearlyData, key),
            borderRadius: 4,
            borderSkipped: false as const,
          })),
        };

  /** Repère de fin de contrat — encre neutre : une borne, pas une anomalie. */
  const endLinePlugin: Plugin<'bar' | 'line'> = {
    id: 'endLine',
    afterDatasetsDraw: (chart) => {
      if (duration >= 25) return;
      const {
        ctx,
        scales: { x, y },
      } = chart;
      const xPos = x.getPixelForValue(duration - 0.5);

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(xPos, y.top);
      ctx.lineTo(xPos, y.bottom);
      ctx.strokeStyle = MUTED;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 4]);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = INK;
      ctx.font = `700 11px ${FONT}`;
      ctx.textAlign = xPos > (x.left + x.right) / 2 ? 'right' : 'left';
      const pad = xPos > (x.left + x.right) / 2 ? -6 : 6;
      ctx.fillText(`Fin du contrat — an ${duration}`, xPos + pad, y.top + 11);
      ctx.restore();
    },
  };

  /** Ligne du zéro, uniquement utile quand les valeurs changent de signe. */
  const zeroLinePlugin: Plugin<'bar' | 'line'> = {
    id: 'zeroLine',
    afterDatasetsDraw: (chart) => {
      const {
        ctx,
        scales: { x, y },
      } = chart;
      if (y.min >= 0 || y.max <= 0) return;
      const yPos = y.getPixelForValue(0);
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(x.left, yPos);
      ctx.lineTo(x.right, yPos);
      ctx.strokeStyle = '#C7CDD6';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();
    },
  };

  const options: ChartOptions<'bar' | 'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    // Marges interieures : sans elles, « 100 k€ » et « An 25 » collent aux
    // bords du cadre et se font rogner a l'impression.
    layout: { padding: { top: 6, right: 12, bottom: 0, left: 6 } },
    plugins: {
      legend: { display: false },
      tooltip: {
        position: 'cursor',
        backgroundColor: INK,
        titleFont: { family: FONT, weight: 700, size: 12 },
        bodyFont: { family: FONT, size: 12 },
        padding: 10,
        cornerRadius: 8,
        caretPadding: 12,
        boxPadding: 4,
        callbacks: {
          title: (items) => {
            const year = parseInt(items[0].label.replace('An ', ''), 10);
            return `${items[0].label} — ${year > duration ? 'après contrat' : 'sous contrat'}`;
          },
          label: (context) => {
            const value = context.raw as number;
            return ` ${context.dataset.label} : ${isComparison ? euroAbs(value) : euro(value)}`;
          },
          footer: (items) => {
            if (!isComparison || items.length < 2) return '';
            const ref = items[0].raw as number;
            const best = Math.min(...items.slice(1).map((i) => i.raw as number));
            const delta = ref - best;
            return delta >= 0
              ? `Économisé à ce stade : ${euroAbs(delta)}`
              : `Surcoût à ce stade : ${euroAbs(-delta)}`;
          },
        },
        footerFont: { family: FONT, size: 11, weight: 600 },
      },
    },
    scales: {
      x: {
        stacked: false,
        ticks: {
          color: MUTED,
          font: { family: FONT, size: 11, weight: 500 },
          autoSkip: true,
          maxTicksLimit: 13,
          maxRotation: 0,
        },
        grid: { display: false },
        border: { color: LINE },
      },
      y: {
        ticks: {
          color: MUTED,
          font: { family: FONT, size: 11, weight: 500 },
          maxTicksLimit: 7,
          callback: (value) => kEuroTick(value, !isComparison),
        },
        grid: { color: LINE },
        border: { display: false },
      },
    },
  };

  return (
    <div className={`chart-box relative w-full ${heightClass}`}>
      <Chart
        type={asLines ? 'line' : 'bar'}
        data={data}
        options={options}
        plugins={[zeroLinePlugin, endLinePlugin]}
      />
    </div>
  );
}
