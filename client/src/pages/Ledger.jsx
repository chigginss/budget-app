import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { get, post, del } from '../api/client'
import TransactionList from '../components/TransactionList'
import TransactionForm from '../components/TransactionForm'
import OcrReview from '../components/OcrReview'
import SpendingChart from '../components/SpendingChart'
import CategoryTotals from '../components/CategoryTotals'
import NotesField from '../components/NotesField'

export default function Ledger() {
  const [months, setMonths] = useState([])
  const [activeId, setActiveId] = useState(null)
  const [monthData, setMonthData] = useState(null)
  const [showAddMonth, setShowAddMonth] = useState(false)
  const [newMonth, setNewMonth] = useState({ name: '', startDate: '', endDate: '', exchangeRate: 1.65 })
  const [showOcr, setShowOcr] = useState(false)
  const [showNotes, setShowNotes] = useState(false)

  useEffect(() => {
    get('/months').then(data => {
      setMonths(data)
      if (data.length) setActiveId(data[0]._id)
    }).catch(console.error)
  }, [])

  useEffect(() => {
    if (!activeId) return
    setShowNotes(false)
    get(`/months/${activeId}`).then(setMonthData).catch(console.error)
  }, [activeId])

  const addMonth = async (e) => {
    e.preventDefault()
    const month = await post('/months', newMonth)
    setMonths(prev => [month, ...prev])
    setActiveId(month._id)
    setShowAddMonth(false)
    setNewMonth({ name: '', startDate: '', endDate: '', exchangeRate: 1.65 })
  }

  const deleteDuration = async (id) => {
    if (!confirm('Delete this duration and all its transactions?')) return
    await del(`/months/${id}`)
    const remaining = months.filter(m => m._id !== id)
    setMonths(remaining)
    if (activeId === id) {
      setActiveId(remaining[0]?._id || null)
      setMonthData(null)
    }
  }

  const onTransactionSaved = () => {
    get(`/months/${activeId}`).then(setMonthData)
  }

  const grouped = months.reduce((acc, m) => {
    const year = new Date(m.startDate).getFullYear()
    if (!acc[year]) acc[year] = []
    acc[year].push(m)
    return acc
  }, {})

  return (
    <div className="max-w-5xl mx-auto p-6">
      <Link to="/" className="text-sm text-gray-500 hover:text-gray-800 mb-6 inline-block">← Dashboard</Link>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Ledger</h1>
        <button
          onClick={() => setShowAddMonth(!showAddMonth)}
          className="bg-indigo-600 text-white px-4 py-2 rounded text-sm hover:bg-indigo-700"
        >
          + Add Duration
        </button>
      </div>

      {showAddMonth && (
        <form onSubmit={addMonth} className="border border-indigo-200 rounded-lg p-4 mb-6 grid grid-cols-2 gap-3">
          <input required placeholder="Name (e.g. June 2026 or Bali Trip)" value={newMonth.name}
            onChange={e => setNewMonth(p => ({ ...p, name: e.target.value }))}
            className="border border-indigo-300 rounded px-3 py-2 text-sm col-span-2" />
          <input required type="date" value={newMonth.startDate}
            onChange={e => setNewMonth(p => ({ ...p, startDate: e.target.value }))}
            className="border border-indigo-300 rounded px-3 py-2 text-sm" />
          <input required type="date" value={newMonth.endDate}
            onChange={e => setNewMonth(p => ({ ...p, endDate: e.target.value }))}
            className="border border-indigo-300 rounded px-3 py-2 text-sm" />
          <div className="col-span-2 flex items-center gap-2">
            <label className="text-sm text-gray-600">NZD per USD:</label>
            <input type="number" step="0.01" value={newMonth.exchangeRate}
              onChange={e => setNewMonth(p => ({ ...p, exchangeRate: parseFloat(e.target.value) }))}
              className="border rounded px-3 py-2 text-sm w-28" />
          </div>
          <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded text-sm">Save</button>
          <button type="button" onClick={() => setShowAddMonth(false)} className="border border-indigo-300 rounded px-4 py-2 text-sm">Cancel</button>
        </form>
      )}

      {/* Duration tabs */}
      <div className="mb-6">
        {Object.keys(grouped).sort((a, b) => b - a).map(year => (
          <div key={year} className="mb-2">
            <div className="text-xs font-semibold text-gray-400 uppercase mb-1">{year}</div>
            <div className="flex flex-wrap gap-2">
              {grouped[year].map(m => (
                <div key={m._id} className={`flex items-center rounded text-sm border ${activeId === m._id ? 'bg-indigo-600 text-white border-indigo-600' : 'border-indigo-300'}`}>
                  <button onClick={() => setActiveId(m._id)} className="px-4 py-2">{m.name}</button>
                  <button
                    onClick={() => deleteDuration(m._id)}
                    className={`pr-3 pl-1 py-2 ${activeId === m._id ? 'text-gray-400 hover:text-white' : 'text-gray-300 hover:text-red-500'}`}
                  >✕</button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {monthData && (
        <>
          {/* Notes collapsible */}
          <div className="border border-indigo-200 rounded-lg mb-6 overflow-hidden">
            <button
              onClick={() => setShowNotes(o => !o)}
              className="w-full flex justify-between items-center px-5 py-3 bg-indigo-50 hover:bg-indigo-100 text-left"
            >
              <span className="text-sm font-medium text-gray-700">Notes</span>
              <span className="text-gray-400 text-sm">{showNotes ? '▲' : '▼'}</span>
            </button>
            {showNotes && (
              <div className="p-4 border-t border-indigo-200">
                <NotesField key={activeId} monthId={activeId} initialValue={monthData.details} />
              </div>
            )}
          </div>

          {/* Chart + totals */}
          {monthData.transactions?.length > 0 && (
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <SpendingChart transactions={monthData.transactions} exchangeRate={monthData.exchangeRate} />
              <CategoryTotals transactions={monthData.transactions} exchangeRate={monthData.exchangeRate} />
            </div>
          )}

          {/* Entry toggle + form */}
          <div className="flex gap-3 mb-4">
            <button
              onClick={() => setShowOcr(false)}
              className={`px-4 py-2 rounded text-sm ${!showOcr ? 'bg-indigo-600 text-white' : 'border border-indigo-300'}`}
            >
              Manual Entry
            </button>
            <button
              onClick={() => setShowOcr(true)}
              className={`px-4 py-2 rounded text-sm ${showOcr ? 'bg-indigo-600 text-white' : 'border border-indigo-300'}`}
            >
              Upload Screenshot
            </button>
          </div>

          {showOcr
            ? <OcrReview monthId={activeId} onSaved={() => { setShowOcr(false); onTransactionSaved() }} />
            : <TransactionForm monthId={activeId} onSaved={onTransactionSaved} />
          }

          <TransactionList
            transactions={monthData.transactions || []}
            exchangeRate={monthData.exchangeRate}
            onUpdate={onTransactionSaved}
          />
        </>
      )}

      {!months.length && (
        <p className="text-gray-500 text-sm">No durations yet. Add one to get started.</p>
      )}
    </div>
  )
}
