import { useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
  type ChartOptions,
  type Plugin,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import type { ChartMode, ScenarioResult } from '../types/simulator';
import { SERIES } from '../theme';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const FONT = "'Plus Jakarta Sans', system-ui, sans-serif";
const INK = '#0F1729';
const MUTED = '#5B6472';
const LINE = '#E6EAEF';

interface ChartComponentProps {
  mode: ChartMode;
  duration: number;
  scenarioBV: ScenarioResult;
  scenarioPV: ScenarioResult;
  scenarioBP: ScenarioResult;
  hasBattery: boolean;
  visibleDatasets: {
    bv: boolean;
    pv: boolean;
    bp: boolean;
  };
}

export function ChartComponent({
  mode,
  duration,
  scenarioBV,
  scenarioPV,
  scenarioBP,
  hasBattery,
  visibleDatasets,
}: ChartComponentProps) {
  const chartRef = useRef<ChartJS<'bar'>>(null);

  const isCumulative = mode === 'cumul';
  const labels = Array.from({ length: 25 }, (_, i) => `An ${i + 1}`);

  const datasets = [];

  if (visibleDatasets.pv) {
    datasets.push({
      label: SERIES.pv.label,
      data: isCumulative ? scenarioPV.cumulativeData : scenarioPV.yearlyData,
      backgroundColor: scenarioPV.colors,
      borderRadius: 4,
      borderSkipped: false as const,
    });
  }

  if (visibleDatasets.bv) {
    datasets.push({
      label: SERIES.bv.label,
      data: isCumulative ? scenarioBV.cumulativeData : scenarioBV.yearlyData,
      backgroundColor: scenarioBV.colors,
      borderRadius: 4,
      borderSkipped: false as const,
    });
  }

  if (hasBattery && visibleDatasets.bp) {
    datasets.push({
      label: SERIES.bp.label,
      data: isCumulative ? scenarioBP.cumulativeData : scenarioBP.yearlyData,
      backgroundColor: scenarioBP.colors,
      borderRadius: 4,
      borderSkipped: false as const,
    });
  }

  /**
   * Repère de fin de contrat. Tracé en encre neutre, pas en rouge : la fin du
   * contrat est une borne temporelle, pas une anomalie (charte §2 — « le rouge
   * n'apparaît que pour un vrai problème »).
   */
  const endLinePlugin: Plugin<'bar'> = {
    id: 'endLine',
    afterDraw: (chart) => {
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
      ctx.font = `700 12px ${FONT}`;
      ctx.textAlign = 'center';
      ctx.fillText('Fin du contrat', xPos, y.top + 14);

      ctx.font = `500 11px ${FONT}`;
      ctx.fillStyle = MUTED;
      ctx.fillText('au-delà : sans abonnement', xPos, y.top + 29);
      ctx.restore();
    },
  };

  const zeroLinePlugin: Plugin<'bar'> = {
    id: 'zeroLine',
    afterDraw: (chart) => {
      const {
        ctx,
        scales: { x, y },
      } = chart;
      if (y.min < 0 && y.max > 0) {
        const yPos = y.getPixelForValue(0);
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(x.left, yPos);
        ctx.lineTo(x.right, yPos);
        ctx.strokeStyle = '#C7CDD6';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.restore();
      }
    },
  };

  const options: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: INK,
        titleFont: { family: FONT, weight: 700, size: 12 },
        bodyFont: { family: FONT, size: 12 },
        padding: 10,
        cornerRadius: 8,
        displayColors: true,
        boxPadding: 4,
        callbacks: {
          title: (items) => {
            const year = parseInt(items[0].label.replace('An ', ''), 10);
            return `${items[0].label} — ${year > duration ? 'après contrat' : 'sous contrat'}`;
          },
          label: (context) => {
            const value = context.raw as number;
            const sign = value >= 0 ? '+' : '';
            return ` ${context.dataset.label} : ${sign}${Math.round(value).toLocaleString('fr-FR')} €`;
          },
        },
      },
    },
    scales: {
      x: {
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
          callback: (value) => {
            const v = typeof value === 'number' ? value : 0;
            const abs = Math.abs(v);
            const sign = v < 0 ? '-' : '+';
            if (v === 0) return '0';
            return abs >= 1000 ? `${sign}${Math.round(abs / 1000)} k€` : `${sign}${abs} €`;
          },
        },
        grid: { color: LINE },
        border: { display: false },
      },
    },
  };

  return (
    <div className="chart-box relative h-[300px] w-full">
      <Bar
        ref={chartRef}
        data={{ labels, datasets }}
        options={options}
        plugins={[zeroLinePlugin, endLinePlugin]}
      />
    </div>
  );
}
