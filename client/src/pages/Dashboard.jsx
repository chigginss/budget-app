import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import NavCard from '../components/NavCard'
import { get, post, del } from '../api/client'

const MAIN_PAGES = [
  { label: 'Ledger', path: '/ledger', description: 'Track your spending' },
  { label: 'Forecast', path: '/forecast', description: 'Project your savings' },
  { label: 'Focus List', path: '/focus', description: 'Your top priorities' },
  { label: 'Wish List', path: '/wishlist', description: 'Things to buy' },
  { label: 'Dreaming', path: '/dreaming', description: 'Long-term goals' },
  { label: 'Blobs', path: '/blobs', description: 'Ideas & thoughts' },
]

export default function Dashboard() {
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
      <h1 className="text-3xl font-bold mb-8 text-gray-900">Hi, Cierra</h1>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-10">
        {MAIN_PAGES.map(p => <NavCard key={p.path} {...p} />)}
      </div>

      <h2 className="text-xl font-semibold mb-4 text-gray-800">Custom Lists</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        {customLists.map(list => (
          <div key={list._id} className="relative border border-gray-200 rounded-lg p-4">
            <Link to={`/lists/${list._id}`} className="font-medium text-gray-800 hover:underline block">
              {list.name}
            </Link>
            <button
              onClick={() => deleteList(list._id)}
              className="absolute top-2 right-2 text-xs text-red-500 hover:text-red-700"
            >
              Delete
            </button>
          </div>
        ))}
      </div>

      <div className="flex gap-2 max-w-sm">
        <input
          value={newName}
          onChange={e => setNewName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && createList()}
          placeholder="New list name..."
          className="border border-gray-300 rounded px-3 py-2 flex-1 text-sm"
        />
        <button
          onClick={createList}
          className="bg-gray-800 text-white px-4 py-2 rounded text-sm hover:bg-gray-700"
        >
          + New List
        </button>
      </div>
    </div>
  )
}
