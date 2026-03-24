'use client';

import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
  TooltipItem,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { FunnelStep, ReguaPoint } from '@/lib/types';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler);

export function ReguaOpenRateChart({ points }: { points: ReguaPoint[] }) {
  return (
    <div style={{ position: 'relative', height: 240 }}>
      <Line
        data={{
          labels: points.map((point) => point.label),
          datasets: [
            {
              label: 'Taxa de abertura',
              data: points.map((point) => point.openRate),
              borderColor: '#E07A1F',
              backgroundColor: 'rgba(224,122,31,.14)',
              pointBackgroundColor: '#C76412',
              pointBorderColor: '#fff',
              pointBorderWidth: 1.5,
              pointRadius: 4,
              pointHoverRadius: 5,
              fill: true,
              tension: 0.28,
            },
          ],
        }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              displayColors: false,
              backgroundColor: 'rgba(31,41,55,.96)',
              callbacks: {
                title(items: TooltipItem<'line'>[]) {
                  return items[0]?.label ?? '';
                },
                label(context: TooltipItem<'line'>) {
                  const point = points[context.dataIndex];
                  if (!point) return '';
                  return `Taxa de abertura: ${point.openRate}%`;
                },
                afterBody(items: TooltipItem<'line'>[]) {
                  const point = points[items[0]?.dataIndex ?? -1];
                  if (!point) return [];

                  return [
                    `Enviados: ${point.enviados.toLocaleString('pt-BR')}`,
                    `Abertos: ${point.abertos.toLocaleString('pt-BR')}`,
                    `Etapas: ${point.etapas.join(' • ') || 'Sem etapa'}`,
                  ];
                },
              },
            },
          },
          scales: {
            x: {
              ticks: { color: '#8A7D6A', font: { size: 10 } },
              grid: { color: 'rgba(31,41,55,.06)' },
            },
            y: {
              beginAtZero: true,
              suggestedMax: 100,
              ticks: {
                color: '#8A7D6A',
                font: { size: 10 },
                callback(value) {
                  return `${value}%`;
                },
              },
              grid: { color: 'rgba(31,41,55,.06)' },
            },
          },
        }}
      />
    </div>
  );
}

export function FunnelChart({ steps }: { steps: FunnelStep[] }) {
  const maxValue = steps[0]?.value || 1;

  return (
    <div className="funnel-stack">
      {steps.map((step, index) => {
        const width = Math.max(44, Math.round((step.value / maxValue) * 100));
        const accent = ['var(--org)', 'var(--tel)', '#22C55E', '#3B82F6'][index] ?? 'var(--org)';

        return (
          <div
            key={step.key}
            className="funnel-step"
            style={{ width: `${width}%`, background: `linear-gradient(90deg, ${accent}, color-mix(in srgb, ${accent} 22%, white))` }}
          >
            <div className="funnel-step-copy">
              <span className="funnel-step-label">{step.label}</span>
              <strong>{step.value.toLocaleString('pt-BR')}</strong>
            </div>
            <div className="funnel-step-copy">
              <span>{index === 0 ? 'Base total' : 'Conversão etapa anterior'}</span>
              <strong>{index === 0 ? '100%' : `${step.rateFromPrevious}%`}</strong>
            </div>
          </div>
        );
      })}
    </div>
  );
}
