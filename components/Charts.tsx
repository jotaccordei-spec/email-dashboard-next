'use client';

import {
  ArcElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
} from 'chart.js';
import { Doughnut, Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Tooltip, Legend, Filler);

export function EvolutionChart({ labels, enviados, abertos, cliques }: { labels: string[]; enviados: number[]; abertos: number[]; cliques: number[] }) {
  return (
    <div style={{ position: 'relative', height: 218 }}>
      <Line
        data={{
          labels,
          datasets: [
            { label: 'Enviados', data: enviados, borderColor: '#FF6D00', backgroundColor: 'rgba(255,109,0,.18)', fill: true, tension: 0.35 },
            { label: 'Abertos', data: abertos, borderColor: '#00BFA5', backgroundColor: 'rgba(0,191,165,.12)', fill: true, tension: 0.35 },
            { label: 'Cliques', data: cliques, borderColor: '#00C853', fill: false, tension: 0.35, borderDash: [5, 3] },
          ],
        }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { ticks: { color: '#9AA0B5', font: { size: 9 } }, grid: { color: 'rgba(255,255,255,.04)' } },
            y: { ticks: { color: '#9AA0B5', font: { size: 9 } }, grid: { color: 'rgba(255,255,255,.04)' } },
          },
        }}
      />
    </div>
  );
}

export function PhaseDonut({ labels, values }: { labels: string[]; values: number[] }) {
  const palette = ['#FF6D00CC', '#FF9038CC', '#00BFA5CC', '#1DE9B6CC', '#7C6AF9CC', '#A78BFACC', '#00C853CC', '#FFD740CC'];

  return (
    <div style={{ position: 'relative', height: 258 }}>
      <Doughnut
        data={{
          labels,
          datasets: [
            { data: values, backgroundColor: palette.slice(0, labels.length), borderColor: palette.slice(0, labels.length).map((c) => c.slice(0, 7)), borderWidth: 1.5 },
          ],
        }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          cutout: '62%',
          plugins: {
            legend: { position: 'bottom', labels: { color: '#9AA0B5', padding: 8, font: { size: 10 }, boxWidth: 8, boxHeight: 8 } },
          },
        }}
      />
    </div>
  );
}
