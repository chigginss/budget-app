import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { get, put } from '../api/client'

export default function Forecast() {
  const [settings, setSettings] = useState(null)
  const [activeIdx, setActiveIdx] = useState(0)
  const [ledgerAverages, setLedgerAverages] = useState({ bills: 0, rent: 0 })

  useEffect(() => {
    get('/forecast').then(setSettings).catch(console.error)
    get('/months/ledger-averages').then(setLedgerAverages).catch(console.error)
  }, [])

  const updateSettings = async (field, value) => {
    const updated = await put('/forecast', { [field]: parseFloat(value) || 0 })
    setSettings(updated)
  }

  const updateMonth = async (index, unexpectedCosts) => {
    const updated = await put(`/forecast/months/${index}`, { unexpectedCosts: parseFloat(unexpectedCosts) || 0 })
    setSettings(updated)
  }

  if (!settings) return <div className="p-6 text-gray-500">Loading...</div>

  const { income, fixedCosts, months } = settings

  const projectedSavings = months.map(m => {
    const saving = income - fixedCosts - (m.unexpectedCosts || 0)
    return Math.max(0, saving)
  })

  const yearlySavings = projectedSavings.reduce((s, v) => s + v, 0)

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Link to="/" className="text-sm text-gray-500 hover:text-gray-800 mb-6 inline-block">← Dashboard</Link>
      <h1 className="text-3xl font-bold mb-2 text-gray-900">Forecast</h1>
      <div className="text-2xl font-semibold text-green-700 mb-6">
        Projected yearly savings: ${yearlySavings.toFixed(2)} NZD
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8 max-w-md">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Income (NZD)</label>
          <input
            type="number" step="0.01" defaultValue={income}
            onBlur={e => updateSettings('income', e.target.value)}
            className="border rounded px-3 py-2 text-sm w-full"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Fixed Costs (NZD)
            {(ledgerAverages.bills + ledgerAverages.rent) > 0 && (
              <span className="text-xs text-gray-400 ml-1">
                (ledger avg: ${(ledgerAverages.bills + ledgerAverages.rent).toFixed(0)})
              </span>
            )}
          </label>
          <input
            type="number" step="0.01" defaultValue={fixedCosts}
            onBlur={e => updateSettings('fixedCosts', e.target.value)}
            className="border rounded px-3 py-2 text-sm w-full"
          />
        </div>
      </div>

      {/* Month tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {months.map(m => (
          <button key={m.index} onClick={() => setActiveIdx(m.index)}
            className={`px-3 py-1 rounded text-sm border ${activeIdx === m.index ? 'bg-gray-800 text-white border-gray-800' : 'border-gray-300 hover:bg-gray-50'}`}>
            {m.label}
          </button>
        ))}
      </div>

      {months.filter(m => m.index === activeIdx).map(m => (
        <div key={m.index} className="border border-gray-200 rounded-lg p-5">
          <h2 className="font-semibold text-lg mb-4">{m.label}</h2>
          <div className="grid grid-cols-2 gap-4 max-w-sm mb-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Unexpected Costs (NZD)</label>
              <input type="number" step="0.01" defaultValue={m.unexpectedCosts}
                key={`${m.index}-${m.unexpectedCosts}`}
                onBlur={e => updateMonth(m.index, e.target.value)}
                className="border rounded px-3 py-2 text-sm w-full" />
            </div>
          </div>
          <div className="text-sm text-gray-600 space-y-1">
            <div>Income: <span className="font-medium">${income.toFixed(2)}</span></div>
            <div>Fixed costs: <span className="font-medium">-${fixedCosts.toFixed(2)}</span></div>
            {m.unexpectedCosts > 0 && <div>Unexpected: <span className="font-medium">-${m.unexpectedCosts.toFixed(2)}</span></div>}
            <div className="text-base font-semibold text-green-700 pt-1">
              Projected savings: ${projectedSavings[m.index]?.toFixed(2)}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
