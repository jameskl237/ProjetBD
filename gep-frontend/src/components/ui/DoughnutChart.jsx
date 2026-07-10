import React from 'react'
import { Doughnut } from 'react-chartjs-2'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'

ChartJS.register(ArcElement, Tooltip, Legend)

export default function DoughnutChart({ labels = [], dataPoints = [], colors = [], options = {} }) {
  const data = {
    labels,
    datasets: [
      {
        data: dataPoints,
        backgroundColor: colors,
        borderWidth: 0,
      },
    ],
  }

  const defaultOptions = { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right' } } }

  return (
    <div className="chart-card">
      <Doughnut data={data} options={{ ...defaultOptions, ...options }} />
    </div>
  )
}
