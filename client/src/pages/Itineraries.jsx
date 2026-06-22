import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { get, post, del } from '../api/client'

const formatDateRange = (start, end) => {
  const fmt = d => new Date(d).toLocaleDateString('en-NZ', {
    day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC',
  })
  return `${fmt(start)} – ${fmt(end)}`
}

export default function Itineraries() {
  const [itineraries, setItineraries] = useState([])
  const [form, setForm] = useState({ name: '', startDate: '', endDate: '' })
  const navigate = useNavigate()

  useEffect(() => {
    get('/itineraries').then(setItineraries).catch(console.error)
  }, [])

  const create = async () => {
    if (!form.name.trim() || !form.startDate || !form.endDate) return
    const it = await post('/itineraries', {
      name: form.name.trim(),
      startDate: form.startDate,
      endDate: form.endDate,
    })
    navigate(`/itineraries/${it._id}`)
  }

  const remove = async (id) => {
    if (!confirm('Delete this itinerary and all its activities?')) return
    await del(`/itineraries/${id}`)
    setItineraries(prev => prev.filter(i => i._id !== id))
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Link to="/" className="text-sm text-gray-500 hover:text-gray-800 mb-6 inline-block">← Dashboard</Link>
      <h1 className="text-3xl font-bold mb-6 text-gray-900">Itineraries</h1>

      <div className="border border-indigo-200 rounded-lg p-5 mb-8">
        <h2 className="font-semibold text-gray-800 mb-3">New Itinerary</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
          <input
            placeholder="Trip name"
            value={form.name}
            onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
            onKeyDown={e => e.key === 'Enter' && create()}
            className="border border-indigo-300 rounded px-3 py-2 text-sm"
          />
          <input
            type="date"
            value={form.startDate}
            onChange={e => setForm(p => ({ ...p, startDate: e.target.value }))}
            className="border border-indigo-300 rounded px-3 py-2 text-sm"
          />
          <input
            type="date"
            value={form.endDate}
            onChange={e => setForm(p => ({ ...p, endDate: e.target.value }))}
            className="border border-indigo-300 rounded px-3 py-2 text-sm"
          />
        </div>
        <button
          onClick={create}
          className="bg-indigo-600 text-white px-4 py-2 rounded text-sm hover:bg-indigo-700"
        >
          Create
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {itineraries.map(it => (
          <div key={it._id} className="relative border border-indigo-200 rounded-lg p-4">
            <Link
              to={`/itineraries/${it._id}`}
              className="font-medium text-gray-800 hover:underline block mb-1"
            >
              {it.name}
            </Link>
            <p className="text-xs text-gray-400">{formatDateRange(it.startDate, it.endDate)}</p>
            <button
              onClick={() => remove(it._id)}
              className="absolute top-2 right-2 text-xs text-red-500 hover:text-red-700"
            >
              ✕
            </button>
          </div>
        ))}
        {itineraries.length === 0 && (
          <p className="text-sm text-gray-400 col-span-full">No itineraries yet.</p>
        )}
      </div>
    </div>
  )
}
