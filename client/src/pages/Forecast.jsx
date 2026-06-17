import { Fragment, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { get, put } from '../api/client'

export default function Forecast() {
  const [settings, setSettings] = useState(null)
  const [durations, setDurations] = useState([])
  const [fixedOpen, setFixedOpen] = useState(false)
  const [newCost, setNewCost] = useState({ name: '', amount: '' })
  const [expandedMonth, setExpandedMonth] = useState(null)
  const [newVariableCost, setNewVariableCost] = useState({ name: '', amount: '' })
  const [importId, setImportId] = useState('')

  useEffect(() => {
    get('/forecast').then(setSettings).catch(console.error)
    get('/months').then(setDurations).catch(console.error)
  }, [])

  const saveSettings = async (patch) => {
    const updated = await put('/forecast', patch)
    setSettings(updated)
  }

  const addFixedCost = async () => {
    if (!newCost.name || !newCost.amount) return
    const updated = [...(settings.fixedCosts || []), { name: newCost.name, amount: parseFloat(newCost.amount) }]
    await saveSettings({ fixedCosts: updated })
    setNewCost({ name: '', amount: '' })
  }

  const removeFixedCost = async (index) => {
    const updated = settings.fixedCosts.filter((_, i) => i !== index)
    await saveSettings({ fixedCosts: updated })
  }

  const updateMonthVariableCosts = async (monthIndex, variableCosts) => {
    const updated = await put(`/forecast/months/${monthIndex}`, { variableCosts })
    setSettings(updated)
  }

  const addVariableCost = async (monthIndex) => {
    if (!newVariableCost.name || !newVariableCost.amount) return
    const month = settings.months.find(m => m.index === monthIndex)
    const updated = [...(month.variableCosts || []), { name: newVariableCost.name, amount: parseFloat(newVariableCost.amount) }]
    await updateMonthVariableCosts(monthIndex, updated)
    setNewVariableCost({ name: '', amount: '' })
  }

  const removeVariableCost = async (monthIndex, costIndex) => {
    const month = settings.months.find(m => m.index === monthIndex)
    const updated = (month.variableCosts || []).filter((_, i) => i !== costIndex)
    await updateMonthVariableCosts(monthIndex, updated)
  }

  const importFromDuration = async (monthIndex) => {
    if (!importId) return
    const duration = await get(`/months/${importId}`)
    const total = (duration.transactions || []).reduce((sum, t) => {
      return sum + (t.currency === 'USD' ? t.value * duration.exchangeRate : t.value)
    }, 0)
    const month = settings.months.find(m => m.index === monthIndex)
    const updated = [...(month.variableCosts || []), { name: duration.name, amount: parseFloat(total.toFixed(2)) }]
    await updateMonthVariableCosts(monthIndex, updated)
    setImportId('')
  }

  if (!settings) return <div className="p-6 text-gray-500">Loading...</div>

  const { income, currentBalance, fixedCosts, months } = settings
  const fixedCostsTotal = (fixedCosts || []).reduce((s, c) => s + c.amount, 0)

  const monthsWithBalance = months.reduce((acc, m) => {
    const prevBalance = acc.length === 0 ? (currentBalance || 0) : acc[acc.length - 1].balance
    const variableCostsTotal = (m.variableCosts || []).reduce((s, c) => s + c.amount, 0)
    const net = (income || 0) - fixedCostsTotal - variableCostsTotal
    acc.push({ ...m, variableCostsTotal, net, balance: prevBalance + net })
    return acc
  }, [])

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Link to="/" className="text-sm text-gray-500 hover:text-gray-800 mb-6 inline-block">← Dashboard</Link>
      <h1 className="text-3xl font-bold mb-6 text-gray-900">Forecast</h1>

      {/* Fixed Costs Collapsible */}
      <div className="border border-gray-200 rounded-lg mb-6 overflow-hidden">
        <button
          onClick={() => setFixedOpen(o => !o)}
          className="w-full flex justify-between items-center px-5 py-4 bg-gray-50 hover:bg-gray-100 text-left"
        >
          <span className="font-semibold text-gray-800">Fixed Costs</span>
          <div className="flex items-center gap-4">
            <span className="font-semibold text-gray-700">${fixedCostsTotal.toFixed(2)} / mo</span>
            <span className="text-gray-400 text-sm">{fixedOpen ? '▲' : '▼'}</span>
          </div>
        </button>
        {fixedOpen && (
          <div className="p-5 border-t border-gray-200">
            <div className="space-y-2 mb-4">
              {(fixedCosts || []).map((c, i) => (
                <div key={i} className="flex justify-between items-center px-3 py-2 bg-gray-50 rounded">
                  <span className="text-gray-700">{c.name}</span>
                  <div className="flex items-center gap-3">
                    <span className="font-medium">${c.amount.toFixed(2)}</span>
                    <button onClick={() => removeFixedCost(i)} className="text-gray-400 hover:text-red-500 text-sm">✕</button>
                  </div>
                </div>
              ))}
              {(fixedCosts || []).length === 0 && <p className="text-sm text-gray-400">No fixed costs yet.</p>}
            </div>
            <div className="flex gap-2">
              <input placeholder="e.g. Netflix" value={newCost.name}
                onChange={e => setNewCost(p => ({ ...p, name: e.target.value }))}
                className="border rounded px-3 py-2 text-sm flex-1" />
              <input type="number" step="0.01" placeholder="Amount" value={newCost.amount}
                onChange={e => setNewCost(p => ({ ...p, amount: e.target.value }))}
                className="border rounded px-3 py-2 text-sm w-28" />
              <button onClick={addFixedCost} className="bg-gray-800 text-white px-4 py-2 rounded text-sm hover:bg-gray-700">
                + Add
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Income + Savings */}
      <div className="grid grid-cols-2 gap-4 mb-8 max-w-md">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Income (NZD)</label>
          <input type="number" step="0.01" defaultValue={income}
            onBlur={e => saveSettings({ income: parseFloat(e.target.value) || 0 })}
            className="border rounded px-3 py-2 text-sm w-full" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Current Savings (NZD)</label>
          <input type="number" step="0.01" defaultValue={currentBalance}
            onBlur={e => saveSettings({ currentBalance: parseFloat(e.target.value) || 0 })}
            className="border rounded px-3 py-2 text-sm w-full" />
        </div>
      </div>

      {/* Monthly running balance table */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 uppercase text-xs tracking-wider">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Month</th>
              <th className="px-4 py-3 text-right font-medium">Variable</th>
              <th className="px-4 py-3 text-right font-medium">Net</th>
              <th className="px-4 py-3 text-right font-medium">Balance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {monthsWithBalance.map(m => (
              <Fragment key={m.index}>
                <tr
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => setExpandedMonth(expandedMonth === m.index ? null : m.index)}
                >
                  <td className="px-4 py-3 font-medium text-gray-800">{m.label}</td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-gray-700">${m.variableCostsTotal.toFixed(2)}</span>
                    <span className="text-gray-400 text-xs ml-2">{expandedMonth === m.index ? '▲' : '▼'}</span>
                  </td>
                  <td className={`px-4 py-3 text-right font-medium ${m.net >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {m.net >= 0 ? '+' : ''}${m.net.toFixed(2)}
                  </td>
                  <td className={`px-4 py-3 text-right font-semibold ${m.balance >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                    ${m.balance.toFixed(2)}
                  </td>
                </tr>
                {expandedMonth === m.index && (
                  <tr>
                    <td colSpan={4} className="px-4 pb-4 pt-2 bg-gray-50">
                      <div className="space-y-2 mb-3">
                        {(m.variableCosts || []).map((c, i) => (
                          <div key={i} className="flex justify-between items-center px-3 py-2 bg-white rounded border border-gray-100">
                            <span className="text-gray-700 text-sm">{c.name}</span>
                            <div className="flex items-center gap-3">
                              <span className="font-medium text-sm">${c.amount.toFixed(2)}</span>
                              <button onClick={e => { e.stopPropagation(); removeVariableCost(m.index, i) }} className="text-gray-400 hover:text-red-500 text-sm">✕</button>
                            </div>
                          </div>
                        ))}
                        {(m.variableCosts || []).length === 0 && <p className="text-sm text-gray-400">No variable costs yet.</p>}
                      </div>
                      <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                        <input placeholder="e.g. Haircut" value={newVariableCost.name}
                          onChange={e => setNewVariableCost(p => ({ ...p, name: e.target.value }))}
                          className="border rounded px-3 py-2 text-sm flex-1" />
                        <input type="number" step="0.01" placeholder="Amount" value={newVariableCost.amount}
                          onChange={e => setNewVariableCost(p => ({ ...p, amount: e.target.value }))}
                          className="border rounded px-3 py-2 text-sm w-28" />
                        <button onClick={() => addVariableCost(m.index)}
                          className="bg-gray-800 text-white px-4 py-2 rounded text-sm hover:bg-gray-700">
                          + Add
                        </button>
                      </div>
                      {durations.length > 0 && (
                        <div className="flex gap-2 mt-2 pt-2 border-t border-gray-200" onClick={e => e.stopPropagation()}>
                          <select value={importId} onChange={e => setImportId(e.target.value)}
                            className="border rounded px-3 py-2 text-sm flex-1 text-gray-600">
                            <option value="">Import total from duration...</option>
                            {durations.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                          </select>
                          <button onClick={() => importFromDuration(m.index)} disabled={!importId}
                            className="border border-gray-300 px-4 py-2 rounded text-sm hover:bg-gray-100 disabled:opacity-40">
                            Import
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
