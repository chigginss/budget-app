import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { get, post, put, del } from '../api/client'
import ReactMarkdown from 'react-markdown'

export default function Blobs() {
  const [list, setList] = useState(null)
  const [form, setForm] = useState({ title: '', description: '' })
  const [editId, setEditId] = useState(null)
  const [editForm, setEditForm] = useState({ title: '', description: '' })

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

  const startEdit = (idea) => {
    setEditId(idea._id)
    setEditForm({ title: idea.title, description: idea.description || '' })
  }

  const saveEdit = async () => {
    if (!editForm.title.trim()) return
    await put(`/ideas/${editId}`, { title: editForm.title.trim(), description: editForm.description.trim() })
    setEditId(null)
    load()
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Link to="/" className="text-sm text-gray-500 hover:text-gray-800 mb-6 inline-block">← Dashboard</Link>
      <h1 className="text-3xl font-bold mb-8 text-gray-900">Blobs</h1>

      <div className="border border-indigo-200 rounded-lg p-5 mb-8">
        <div className="mb-3">
          <input
            placeholder="Title"
            value={form.title}
            onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && addIdea()}
            className="border border-indigo-300 rounded px-3 py-2 text-sm w-full mb-2"
          />
          <textarea
            placeholder="Description (optional)"
            value={form.description}
            onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
            rows={10}
            className="border border-indigo-300 rounded px-3 py-2 text-sm w-full resize-y"
          />
        </div>
        <button onClick={addIdea} className="bg-indigo-600 text-white px-4 py-2 rounded text-sm hover:bg-indigo-700">
          + Add
        </button>
      </div>

      <div className="space-y-4">
        {(list?.ideas || []).map(idea => (
          <div key={idea._id} className="border border-indigo-200 rounded-lg p-5">
            {editId === idea._id ? (
              <>
                <input
                  autoFocus
                  value={editForm.title}
                  onChange={e => setEditForm(p => ({ ...p, title: e.target.value }))}
                  className="border border-indigo-300 rounded px-3 py-2 text-sm w-full mb-2 font-semibold"
                />
                <textarea
                  value={editForm.description}
                  onChange={e => setEditForm(p => ({ ...p, description: e.target.value }))}
                  rows={10}
                  className="border border-indigo-300 rounded px-3 py-2 text-sm w-full resize-y mb-3"
                />
                <div className="flex gap-2">
                  <button onClick={saveEdit} className="bg-indigo-600 text-white px-3 py-1 rounded text-xs hover:bg-indigo-700">Save</button>
                  <button onClick={() => setEditId(null)} className="border border-indigo-300 px-3 py-1 rounded text-xs text-gray-600">Cancel</button>
                </div>
              </>
            ) : (
              <>
                <div className="flex justify-between items-start gap-4">
                  <h3 className="font-semibold text-gray-900">{idea.title}</h3>
                  <div className="flex gap-3 shrink-0">
                    <button onClick={() => startEdit(idea)} className="text-xs text-gray-400 hover:text-gray-700">Edit</button>
                    <button onClick={() => remove(idea._id)} className="text-xs text-gray-400 hover:text-red-500">✕</button>
                  </div>
                </div>
                {idea.description && (
                  <div className="mt-2 prose prose-sm text-gray-600 max-w-none">
                    <ReactMarkdown>{idea.description}</ReactMarkdown>
                  </div>
                )}
              </>
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
