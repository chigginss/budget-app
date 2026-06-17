import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { get, post, del } from '../api/client'

export default function Blobs() {
  const [list, setList] = useState(null)
  const [form, setForm] = useState({ title: '', description: '' })

  const load = () =>
    get('/lists?type=ideas').then(lists => {
      if (lists.length) return get(`/lists/${lists[0]._id}`)
      return post('/lists', { name: 'Blobs', type: 'ideas' }).then(l => ({ ...l, ideas: [] }))
    }).then(setList).catch(console.error)

  useEffect(() => { load() }, [])

  const addIdea = async () => {
    if (!form.title.trim() || !list) return
    await post(`/lists/${list._id}/ideas`, { title: form.title.trim(), description: form.description.trim() })
    setForm({ title: '', description: '' })
    load()
  }

  const remove = async (id) => {
    await del(`/ideas/${id}`)
    load()
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Link to="/" className="text-sm text-gray-500 hover:text-gray-800 mb-6 inline-block">← Dashboard</Link>
      <h1 className="text-3xl font-bold mb-8 text-gray-900">Blobs</h1>

      <div className="border border-gray-200 rounded-lg p-5 mb-8">
        <div className="mb-3">
          <input
            placeholder="Title"
            value={form.title}
            onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
            onKeyDown={e => e.key === 'Enter' && e.shiftKey === false && addIdea()}
            className="border rounded px-3 py-2 text-sm w-full mb-2"
          />
          <textarea
            placeholder="Description (optional)"
            value={form.description}
            onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
            rows={4}
            className="border rounded px-3 py-2 text-sm w-full resize-y"
          />
        </div>
        <button
          onClick={addIdea}
          className="bg-gray-800 text-white px-4 py-2 rounded text-sm hover:bg-gray-700"
        >
          + Add
        </button>
      </div>

      <div className="space-y-4">
        {(list?.ideas || []).map(idea => (
          <div key={idea._id} className="border border-gray-200 rounded-lg p-5">
            <div className="flex justify-between items-start gap-4">
              <h3 className="font-semibold text-gray-900">{idea.title}</h3>
              <button
                onClick={() => remove(idea._id)}
                className="text-xs text-gray-400 hover:text-red-500 shrink-0"
              >
                Delete
              </button>
            </div>
            {idea.description && (
              <p className="mt-2 text-sm text-gray-600 whitespace-pre-wrap">{idea.description}</p>
            )}
          </div>
        ))}
        {list && (list.ideas || []).length === 0 && (
          <p className="text-sm text-gray-400">No blobs yet.</p>
        )}
      </div>
    </div>
  )
}
