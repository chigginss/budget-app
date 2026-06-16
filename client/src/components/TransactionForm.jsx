import { useState } from 'react'
import { post } from '../api/client'

const CATEGORIES = ['general', 'shopping', 'food', 'bills', 'rent', 'travel', 'gifts', 'entertainment', 'health']

export default function TransactionForm({ monthId, onSaved }) {
  const empty = { name: '', category: 'general', currency: 'NZD', value: '', date: new Date().toISOString().split('T')[0] }
  const [form, setForm] = useState(empty)
  const [saving, setSaving] = useState(false)

  const set = (field, value) => setForm(p => ({ ...p, [field]: value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name || !form.value || !form.date) return
    setSaving(true)
    await post(`/months/${monthId}/transactions`, { ...form, value: parseFloat(form.value) })
    setForm(empty)
    setSaving(false)
    onSaved()
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap gap-2 mb-4 items-end">
      <input required placeholder="Merchant" value={form.name} onChange={e => set('name', e.target.value)}
        className="border rounded px-3 py-2 text-sm flex-1 min-w-32" />
      <select value={form.category} onChange={e => set('category', e.target.value)}
        className="border rounded px-3 py-2 text-sm">
        {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
      </select>
      <select value={form.currency} onChange={e => set('currency', e.target.value)}
        className="border rounded px-3 py-2 text-sm">
        <option value="NZD">NZD</option>
        <option value="USD">USD</option>
      </select>
      <input required type="number" step="0.01" placeholder="Amount" value={form.value}
        onChange={e => set('value', e.target.value)}
        className="border rounded px-3 py-2 text-sm w-28" />
      <input required type="date" value={form.date} onChange={e => set('date', e.target.value)}
        className="border rounded px-3 py-2 text-sm" />
      <button type="submit" disabled={saving}
        className="bg-gray-800 text-white px-4 py-2 rounded text-sm hover:bg-gray-700 disabled:opacity-50">
        Add
      </button>
    </form>
  )
}
