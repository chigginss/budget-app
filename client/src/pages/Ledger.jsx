import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { get, post } from '../api/client'
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

  useEffect(() => {
    get('/months').then(data => {
      setMonths(data)
      if (data.length) setActiveId(data[0]._id)
    }).catch(console.error)
  }, [])

  useEffect(() => {
    if (!activeId) return
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

  const onTransactionSaved = () => {
    get(`/months/${activeId}`).then(setMonthData)
  }

  // Group months by year for display
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
          className="bg-gray-800 text-white px-4 py-2 rounded text-sm hover:bg-gray-700"
        >
          + Add Duration
        </button>
      </div>

      {showAddMonth && (
        <form onSubmit={addMonth} className="border border-gray-200 rounded-lg p-4 mb-6 grid grid-cols-2 gap-3">
          <input required placeholder="Name (e.g. June 2026 or Bali Trip)" value={newMonth.name}
            onChange={e => setNewMonth(p => ({ ...p, name: e.target.value }))}
            className="border rounded px-3 py-2 text-sm col-span-2" />
          <input required type="date" value={newMonth.startDate}
            onChange={e => setNewMonth(p => ({ ...p, startDate: e.target.value }))}
            className="border rounded px-3 py-2 text-sm" />
          <input required type="date" value={newMonth.endDate}
            onChange={e => setNewMonth(p => ({ ...p, endDate: e.target.value }))}
            className="border rounded px-3 py-2 text-sm" />
          <div className="col-span-2 flex items-center gap-2">
            <label className="text-sm text-gray-600">NZD per USD:</label>
            <input type="number" step="0.01" value={newMonth.exchangeRate}
              onChange={e => setNewMonth(p => ({ ...p, exchangeRate: parseFloat(e.target.value) }))}
              className="border rounded px-3 py-2 text-sm w-28" />
          </div>
          <button type="submit" className="bg-gray-800 text-white px-4 py-2 rounded text-sm">Save</button>
          <button type="button" onClick={() => setShowAddMonth(false)} className="border rounded px-4 py-2 text-sm">Cancel</button>
        </form>
      )}

      {/* Year/month tabs */}
      <div className="mb-6">
        {Object.keys(grouped).sort((a, b) => b - a).map(year => (
          <div key={year} className="mb-2">
            <div className="text-xs font-semibold text-gray-400 uppercase mb-1">{year}</div>
            <div className="flex flex-wrap gap-2">
              {grouped[year].map(m => (
                <button
                  key={m._id}
                  onClick={() => setActiveId(m._id)}
                  className={`px-4 py-2 rounded text-sm border ${activeId === m._id ? 'bg-gray-800 text-white border-gray-800' : 'border-gray-300 hover:bg-gray-50'}`}
                >
                  {m.name}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {monthData && (
        <>
          <div className="flex gap-3 mb-4">
            <button
              onClick={() => setShowOcr(false)}
              className={`px-4 py-2 rounded text-sm ${!showOcr ? 'bg-gray-800 text-white' : 'border border-gray-300'}`}
            >
              Manual Entry
            </button>
            <button
              onClick={() => setShowOcr(true)}
              className={`px-4 py-2 rounded text-sm ${showOcr ? 'bg-gray-800 text-white' : 'border border-gray-300'}`}
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

          {monthData.transactions?.length > 0 && (
            <div className="mt-8 grid md:grid-cols-2 gap-6">
              <SpendingChart transactions={monthData.transactions} exchangeRate={monthData.exchangeRate} />
              <CategoryTotals transactions={monthData.transactions} exchangeRate={monthData.exchangeRate} />
            </div>
          )}

          <NotesField key={activeId} monthId={activeId} initialValue={monthData.details} />
        </>
      )}

      {!months.length && (
        <p className="text-gray-500 text-sm">No durations yet. Add one to get started.</p>
      )}
    </div>
  )
}
