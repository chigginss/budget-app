import { useState } from 'react'
import { upload, post } from '../api/client'

const CATEGORIES = ['general', 'shopping', 'food', 'bills', 'rent', 'travel', 'gifts', 'entertainment', 'health']

export default function OcrReview({ monthId, onSaved }) {
  const [file, setFile] = useState(null)
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)

  const handleUpload = async () => {
    if (!file) return
    setLoading(true)
    const fd = new FormData()
    fd.append('screenshot', file)
    const parsed = await upload(`/months/${monthId}/parse-screenshot`, fd)
    setRows(parsed.map((r, i) => ({ ...r, id: i, category: 'general' })))
    setLoading(false)
  }

  const update = (id, field, value) => setRows(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r))
  const remove = (id) => setRows(prev => prev.filter(r => r.id !== id))

  const handleSave = async () => {
    const payload = rows.map(({ name, category, currency, value, date }) => ({ name, category, currency, value: parseFloat(value), date }))
    await post(`/months/${monthId}/transactions`, payload)
    onSaved()
  }

  return (
    <div className="mb-6">
      <div className="flex gap-3 items-center mb-4">
        <input type="file" accept="image/*" onChange={e => setFile(e.target.files[0])} className="text-sm" />
        <button onClick={handleUpload} disabled={!file || loading}
          className="bg-gray-800 text-white px-4 py-2 rounded text-sm disabled:opacity-50">
          {loading ? 'Parsing...' : 'Parse Screenshot'}
        </button>
      </div>

      {rows.length > 0 && (
        <>
          <div className="overflow-x-auto mb-3">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="pb-2 font-medium">Merchant</th>
                  <th className="pb-2 font-medium">Amount</th>
                  <th className="pb-2 font-medium">Date</th>
                  <th className="pb-2 font-medium">Currency</th>
                  <th className="pb-2 font-medium">Category</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {rows.map(r => (
                  <tr key={r.id} className="border-b last:border-0">
                    <td className="py-2 pr-2">
                      <input value={r.name} onChange={e => update(r.id, 'name', e.target.value)}
                        className="border rounded px-2 py-1 text-sm w-full" />
                    </td>
                    <td className="py-2 pr-2">
                      <input type="number" step="0.01" value={r.value} onChange={e => update(r.id, 'value', e.target.value)}
                        className="border rounded px-2 py-1 text-sm w-24" />
                    </td>
                    <td className="py-2 pr-2">
                      <input type="date" value={r.date} onChange={e => update(r.id, 'date', e.target.value)}
                        className="border rounded px-2 py-1 text-sm" />
                    </td>
                    <td className="py-2 pr-2">
                      <select value={r.currency} onChange={e => update(r.id, 'currency', e.target.value)}
                        className="border rounded px-2 py-1 text-sm">
                        <option>NZD</option>
                        <option>USD</option>
                      </select>
                    </td>
                    <td className="py-2 pr-2">
                      <select value={r.category} onChange={e => update(r.id, 'category', e.target.value)}
                        className="border rounded px-2 py-1 text-sm">
                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </td>
                    <td className="py-2">
                      <button onClick={() => remove(r.id)} className="text-red-400 hover:text-red-600 text-xs">Remove</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button onClick={handleSave}
            className="bg-green-700 text-white px-4 py-2 rounded text-sm hover:bg-green-800">
            Save {rows.length} Transaction{rows.length !== 1 ? 's' : ''}
          </button>
        </>
      )}
    </div>
  )
}
