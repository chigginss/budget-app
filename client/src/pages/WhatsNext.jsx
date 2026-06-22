import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { get, post, del } from '../api/client'

export default function WhatsNext() {
  const [customLists, setCustomLists] = useState([])
  const [newName, setNewName] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    get('/lists?type=custom').then(setCustomLists).catch(console.error)
  }, [])

  const createList = async () => {
    if (!newName.trim()) return
    const list = await post('/lists', { name: newName.trim(), type: 'custom' })
    setNewName('')
    navigate(`/lists/${list._id}`)
  }

  const deleteList = async (id) => {
    if (!confirm('Delete this list?')) return
    await del(`/lists/${id}`)
    setCustomLists(prev => prev.filter(l => l._id !== id))
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Link to="/" className="text-sm text-gray-500 hover:text-gray-800 mb-6 inline-block">← Dashboard</Link>
      <h1 className="text-3xl font-bold mb-6 text-gray-900">What's Next</h1>

      <div className="flex gap-2 max-w-sm mb-8">
        <input
          value={newName}
          onChange={e => setNewName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && createList()}
          placeholder="New list name..."
          className="border border-indigo-300 rounded px-3 py-2 flex-1 text-sm"
        />
        <button
          onClick={createList}
          className="bg-indigo-600 text-white px-4 py-2 rounded text-sm hover:bg-indigo-700"
        >
          + New List
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {customLists.map(list => (
          <div key={list._id} className="relative border border-indigo-200 rounded-lg p-4">
            <Link to={`/lists/${list._id}`} className="font-medium text-gray-800 hover:underline block">
              {list.name}
            </Link>
            <button
              onClick={() => deleteList(list._id)}
              className="absolute top-2 right-2 text-xs text-red-500 hover:text-red-700"
            >
              ✕
            </button>
          </div>
        ))}
        {customLists.length === 0 && (
          <p className="text-sm text-gray-400 col-span-full">No lists yet.</p>
        )}
      </div>
    </div>
  )
}
