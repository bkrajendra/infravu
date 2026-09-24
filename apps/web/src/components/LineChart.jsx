import { Line } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip } from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip)

export default function LineChart({ labels, values, unit = '%', lineColor = '#3478f6', fillColor = 'rgba(52,120,246,.10)', min = 0, max = 100 }) {
  const data = {
    labels,
    datasets: [{ data: values, tension: .38, borderColor: lineColor, backgroundColor: fillColor, fill: true, pointRadius: 0, pointHoverRadius: 4, borderWidth: 2 }],
  }
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { displayColors: false, callbacks: { label: (ctx) => `${ctx.parsed.y.toFixed(1)}${unit}` } } },
    scales: {
      x: { grid: { display: false }, border: { display: false }, ticks: { color: '#7b879b', maxTicksLimit: 6, font: { size: 10 } } },
      y: { min, max, border: { display: false }, grid: { color: '#edf1f6' }, ticks: { color: '#8590a3', maxTicksLimit: 5, font: { size: 10 }, callback: (v) => `${v}${unit}` } },
    },
  }
  return <Line data={data} options={options} />
}
