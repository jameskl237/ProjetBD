import React from 'react'
import { Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend)

export default function BarChart({ labels = [], datasets = [], options = {} }) {
  const data = { labels, datasets }
  const defaultOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'top' }, tooltip: { mode: 'index', intersect: false } },
    interaction: { intersect: false, mode: 'index' },
    scales: { y: { beginAtZero: true } },
  }

  return (
    <div className="chart-card">
      <Bar data={data} options={{ ...defaultOptions, ...options }} />
    </div>
  )
}