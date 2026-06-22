import { Fragment, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { get, put } from '../api/client'

function ExpandedPanel({ m, durations, importId, setImportId, newVariableCost, setNewVariableCost, addVariableCost, removeVariableCost, importFromDuration }) {
  return (
    <div className="px-4 pb-4 pt-2 bg-indigo-50">
      <div className="space-y-2 mb-3">
        {(m.variableCosts || []).map((c, i) => (
          <div key={i} className="flex justify-between items-center px-3 py-2 bg-white rounded border border-indigo-100">
            <span className="text-gray-700 text-sm">{c.name}</span>
            <div className="flex items-center gap-3">
              <span className={`font-medium text-sm ${c.amount < 0 ? 'text-green-600' : ''}`}>
                {c.amount < 0 ? '+' : ''}${Math.abs(c.amount).toFixed(2)}
              </span>
              <button
                onClick={e => { e.stopPropagation(); removeVariableCost(m.index, i) }}
                className="text-gray-400 hover:text-red-500 text-sm"
              >✕</button>
            </div>
          </div>
        ))}
        {(m.variableCosts || []).length === 0 && <p className="text-sm text-gray-400">No variable costs yet.</p>}
      </div>
      <div className="flex gap-2" onClick={e => e.stopPropagation()}>
        <input
          placeholder="e.g. Haircut"
          value={newVariableCost.name}
          onChange={e => setNewVariableCost(p => ({ ...p, name: e.target.value }))}
          className="border border-indigo-300 rounded px-3 py-2 text-sm flex-1"
        />
        <input
          type="number" step="0.01" placeholder="Amount (− = income)"
          value={newVariableCost.amount}
          onChange={e => setNewVariableCost(p => ({ ...p, amount: e.target.value }))}
          className="border border-indigo-300 rounded px-3 py-2 text-sm w-28"
        />
        <button
          onClick={() => addVariableCost(m.index)}
          className="bg-indigo-600 text-white px-4 py-2 rounded text-sm hover:bg-indigo-700"
        >+ Add</button>
      </div>
      {durations.length > 0 && (
        <div className="flex gap-2 mt-2 pt-2 border-t border-indigo-200" onClick={e => e.stopPropagation()}>
          <select
            value={importId}
            onChange={e => setImportId(e.target.value)}
            className="border border-indigo-300 rounded px-3 py-2 text-sm flex-1 text-gray-600"
          >
            <option value="">Import total from duration...</option>
            {durations.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
          </select>
          <button
            onClick={() => importFromDuration(m.index)}
            disabled={!importId}
            className="border border-indigo-300 px-4 py-2 rounded text-sm hover:bg-indigo-100 disabled:opacity-40"
          >Import</button>
        </div>
      )}
    </div>
  )
}

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

  const { income, currentBalance, checkingBalance, creditCardBalance, usdExchangeRate, fixedCosts, months } = settings
  const rate = usdExchangeRate || 1.65
  const checkingNZD = (checkingBalance || 0) * rate
  const creditCardNZD = (creditCardBalance || 0) * rate
  const startingBalance = (currentBalance || 0) + checkingNZD - creditCardNZD
  const fixedCostsTotal = (fixedCosts || []).reduce((s, c) => s + (c.amount || 0), 0)

  const monthsWithBalance = months.reduce((acc, m) => {
    const prevBalance = acc.length === 0 ? startingBalance : acc[acc.length - 1].balance
    const variableCostsTotal = (m.variableCosts || []).reduce((s, c) => s + (c.amount || 0), 0)
    const net = (income || 0) - fixedCostsTotal - variableCostsTotal
    acc.push({ ...m, variableCostsTotal, net, balance: prevBalance + net })
    return acc
  }, [])

  const panelProps = { durations, importId, setImportId, newVariableCost, setNewVariableCost, addVariableCost, removeVariableCost, importFromDuration }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Link to="/" className="text-sm text-gray-500 hover:text-gray-800 mb-6 inline-block">← Dashboard</Link>
      <h1 className="text-3xl font-bold mb-6 text-gray-900">Forecast</h1>

      {/* Fixed Costs Collapsible */}
      <div className="border border-indigo-200 rounded-lg mb-6 overflow-hidden">
        <button
          onClick={() => setFixedOpen(o => !o)}
          className="w-full flex justify-between items-center px-5 py-4 bg-indigo-50 hover:bg-indigo-100 text-left"
        >
          <span className="font-semibold text-gray-800">Fixed Costs</span>
          <div className="flex items-center gap-4">
            <span className="font-semibold text-gray-700">${fixedCostsTotal.toFixed(2)} / mo</span>
            <span className="text-gray-400 text-sm">{fixedOpen ? '▲' : '▼'}</span>
          </div>
        </button>
        {fixedOpen && (
          <div className="p-5 border-t border-indigo-200">
            <div className="space-y-2 mb-4">
              {(fixedCosts || []).map((c, i) => (
                <div key={i} className="flex justify-between items-center px-3 py-2 bg-indigo-50 rounded">
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
                className="border border-indigo-300 rounded px-3 py-2 text-sm flex-1" />
              <input type="number" step="0.01" placeholder="Amount" value={newCost.amount}
                onChange={e => setNewCost(p => ({ ...p, amount: e.target.value }))}
                className="border border-indigo-300 rounded px-3 py-2 text-sm w-28" />
              <button onClick={addFixedCost} className="bg-indigo-600 text-white px-4 py-2 rounded text-sm hover:bg-indigo-700">
                + Add
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Income + Account Balances */}
      <div className="border border-indigo-200 rounded-lg p-5 mb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Income (NZD)</label>
            <input type="number" step="0.01" defaultValue={income}
              onBlur={e => saveSettings({ income: parseFloat(e.target.value) || 0 })}
              className="border border-indigo-300 rounded px-3 py-2 text-sm w-full" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Savings Account (NZD)</label>
            <input type="number" step="0.01" defaultValue={currentBalance}
              onBlur={e => saveSettings({ currentBalance: parseFloat(e.target.value) || 0 })}
              className="border border-indigo-300 rounded px-3 py-2 text-sm w-full" />
          </div>
        </div>

        <div className="border-t border-indigo-100 pt-4 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm font-medium text-gray-700">USD Accounts</span>
            <span className="text-xs text-gray-400">NZD per USD:</span>
            <input type="number" step="0.01" defaultValue={rate}
              onBlur={e => saveSettings({ usdExchangeRate: parseFloat(e.target.value) || 1.65 })}
              className="border border-indigo-300 rounded px-2 py-1 text-xs w-20" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Second Bank Account (USD)</label>
              <input type="number" step="0.01" defaultValue={checkingBalance}
                onBlur={e => saveSettings({ checkingBalance: parseFloat(e.target.value) || 0 })}
                className="border border-indigo-300 rounded px-3 py-2 text-sm w-full" />
              <p className="text-xs text-gray-400 mt-1">= ${checkingNZD.toFixed(2)} NZD</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Credit Card Balance (USD)</label>
              <input type="number" step="0.01" defaultValue={creditCardBalance}
                onBlur={e => saveSettings({ creditCardBalance: parseFloat(e.target.value) || 0 })}
                className="border border-indigo-300 rounded px-3 py-2 text-sm w-full" />
              <p className="text-xs text-gray-400 mt-1">= ${creditCardNZD.toFixed(2)} NZD (debt)</p>
            </div>
          </div>
        </div>

        <div className="border-t border-indigo-100 pt-3 flex justify-between items-center">
          <span className="text-sm text-gray-500">Starting balance (NZD savings + USD accounts − credit card)</span>
          <span className={`font-semibold ${startingBalance >= 0 ? 'text-green-700' : 'text-red-600'}`}>
            ${startingBalance.toFixed(2)} NZD
          </span>
        </div>
      </div>

      <div className="text-sm text-gray-500 mb-3">
        <span className="font-medium text-gray-700">${(income || 0).toFixed(2)}</span> income
        {' − '}
        <span className="font-medium text-gray-700">${fixedCostsTotal.toFixed(2)}</span> fixed
        {' = '}
        <span className={`font-semibold ${(income || 0) - fixedCostsTotal >= 0 ? 'text-green-700' : 'text-red-600'}`}>
          ${((income || 0) - fixedCostsTotal).toFixed(2)}
        </span>
        {' base net/month '}
        <span className="text-gray-400">(± variable costs per month)</span>
      </div>

      {/* Desktop table — hidden below sm */}
      <div className="hidden sm:block border border-indigo-200 rounded-lg overflow-x-auto">
        <table className="w-full text-sm min-w-[500px]">
          <thead className="bg-indigo-50 text-gray-500 uppercase text-xs tracking-wider">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Month</th>
              <th className="px-4 py-3 text-right font-medium">Variable</th>
              <th className="px-4 py-3 text-right font-medium">Net</th>
              <th className="px-4 py-3 text-right font-medium">Balance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-indigo-100">
            {monthsWithBalance.map(m => (
              <Fragment key={m.index}>
                <tr
                  className="hover:bg-indigo-50 cursor-pointer"
                  onClick={() => setExpandedMonth(expandedMonth === m.index ? null : m.index)}
                >
                  <td className="px-4 py-3 font-medium text-gray-800">{m.label}</td>
                  <td className="px-4 py-3 text-right">
                    <span className={m.variableCostsTotal < 0 ? 'text-green-600' : 'text-gray-700'}>
                      {m.variableCostsTotal < 0 ? '+' : ''}${Math.abs(m.variableCostsTotal).toFixed(2)}
                    </span>
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
                    <td colSpan={4} className="p-0">
                      <ExpandedPanel m={m} {...panelProps} />
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards — hidden at sm and above */}
      <div className="sm:hidden border border-indigo-200 rounded-lg overflow-hidden divide-y divide-indigo-100">
        {monthsWithBalance.map(m => (
          <Fragment key={m.index}>
            <div
              className="px-4 py-3 cursor-pointer hover:bg-indigo-50"
              onClick={() => setExpandedMonth(expandedMonth === m.index ? null : m.index)}
            >
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium text-gray-800">{m.label}</span>
                <span className="text-gray-400 text-xs">{expandedMonth === m.index ? '▲' : '▼'}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <div className="text-gray-400 uppercase tracking-wider mb-0.5">Variable</div>
                  <span className={`font-medium ${m.variableCostsTotal < 0 ? 'text-green-600' : 'text-gray-700'}`}>
                    {m.variableCostsTotal < 0 ? '+' : ''}${Math.abs(m.variableCostsTotal).toFixed(2)}
                  </span>
                </div>
                <div>
                  <div className="text-gray-400 uppercase tracking-wider mb-0.5">Net</div>
                  <span className={`font-medium ${m.net >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {m.net >= 0 ? '+' : ''}${m.net.toFixed(2)}
                  </span>
                </div>
                <div>
                  <div className="text-gray-400 uppercase tracking-wider mb-0.5">Balance</div>
                  <span className={`font-semibold ${m.balance >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                    ${m.balance.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
            {expandedMonth === m.index && <ExpandedPanel m={m} {...panelProps} />}
          </Fragment>
        ))}
      </div>
    </div>
  )
}
