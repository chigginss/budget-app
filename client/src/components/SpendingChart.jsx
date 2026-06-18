import { Pie } from 'react-chartjs-2'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'

ChartJS.register(ArcElement, Tooltip, Legend)

const COLORS = {
  shopping: '#eab308',
  food: '#22c55e',
  bills: '#f59e0b',
  rent: '#8b5cf6',
  travel: '#3b82f6',
  gifts: '#ec4899',
  general: '#9ca3af',
  entertainment: '#ef4444',
  health: '#14b8a6',
}

export default function SpendingChart({ transactions, exchangeRate }) {
  const totals = transactions.reduce((acc, t) => {
    const nzd = t.currency === 'USD' ? t.value * exchangeRate : t.value
    acc[t.category] = (acc[t.category] || 0) + nzd
    return acc
  }, {})

  const categories = Object.keys(totals)
  if (!categories.length) return null

  const data = {
    labels: categories.map(c => c.charAt(0).toUpperCase() + c.slice(1)),
    datasets: [{
      data: categories.map(c => parseFloat(totals[c].toFixed(2))),
      backgroundColor: categories.map(c => COLORS[c] || '#9ca3af'),
    }],
  }

  return (
    <div className="max-w-xs">
      <h3 className="font-semibold text-gray-700 mb-3">Spending by Category</h3>
      <Pie data={data} />
    </div>
  )
}
