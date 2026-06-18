import { useState } from 'react'
import { put, del } from '../api/client'

const CATEGORIES = ['general', 'shopping', 'food', 'bills', 'rent', 'travel', 'gifts', 'entertainment', 'health']

export default function TransactionList({ transactions, exchangeRate, onUpdate }) {
  const [editId, setEditId] = useState(null)
  const [editName, setEditName] = useState('')

  const nzd = (t) => t.currency === 'USD' ? (t.value * exchangeRate).toFixed(2) : t.value.toFixed(2)

  const startEdit = (t) => { setEditId(t._id); setEditName(t.name) }

  const saveEdit = async (t) => {
    await put(`/transactions/${t._id}`, { name: editName })
    setEditId(null)
    onUpdate()
  }

  const changeCategory = async (t, category) => {
    await put(`/transactions/${t._id}`, { category })
    onUpdate()
  }

  const remove = async (id) => {
    if (!confirm('Delete transaction?')) return
    await del(`/transactions/${id}`)
    onUpdate()
  }

  if (!transactions.length) return <p className="text-sm text-gray-400 mb-4">No transactions yet.</p>

  return (
    <div className="overflow-x-auto mb-4">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="text-left text-gray-500 border-b border-indigo-200">
            <th className="pb-2 font-medium">Merchant</th>
            <th className="pb-2 font-medium">Category</th>
            <th className="pb-2 font-medium">Date</th>
            <th className="pb-2 font-medium text-right">Amount</th>
            <th className="pb-2 font-medium text-right">NZD</th>
            <th className="pb-2" />
          </tr>
        </thead>
        <tbody>
          {transactions.map(t => (
            <tr key={t._id} className="border-b border-indigo-100 last:border-0">
              <td className="py-2 pr-2">
                {editId === t._id
                  ? <input autoFocus value={editName} onChange={e => setEditName(e.target.value)}
                      onBlur={() => saveEdit(t)} onKeyDown={e => e.key === 'Enter' && saveEdit(t)}
                      className="border border-indigo-300 rounded px-2 py-1 text-sm w-full" />
                  : <button onClick={() => startEdit(t)} className="text-left hover:underline">{t.name}</button>
                }
              </td>
              <td className="py-2 pr-2">
                <select value={t.category} onChange={e => changeCategory(t, e.target.value)}
                  className="border border-indigo-300 rounded px-2 py-1 text-xs">
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </td>
              <td className="py-2 pr-2 text-gray-500">{t.date ? new Date(t.date).toLocaleDateString() : '—'}</td>
              <td className={`py-2 pr-2 text-right ${t.value < 0 ? 'text-green-600' : ''}`}>
                {t.value < 0 ? '+' : ''}{Math.abs(t.value).toFixed(2)} {t.currency}
              </td>
              <td className={`py-2 pr-2 text-right font-medium ${t.value < 0 ? 'text-green-600' : ''}`}>
                {t.value < 0 ? '+' : ''}${Math.abs(parseFloat(nzd(t))).toFixed(2)}
              </td>
              <td className="py-2 text-right">
                <button onClick={() => remove(t._id)} className="text-red-400 hover:text-red-600 text-xs">Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
