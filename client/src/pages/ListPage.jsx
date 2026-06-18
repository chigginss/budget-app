import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { get, post, put, del } from '../api/client'

export default function ListPage() {
  const { id } = useParams()
  const [list, setList] = useState(null)
  const [newItem, setNewItem] = useState('')
  const [draggedId, setDraggedId] = useState(null)

  const load = () => get(`/lists/${id}`).then(setList).catch(console.error)

  useEffect(() => { load() }, [id])

  const addItem = async () => {
    if (!newItem.trim()) return
    await post(`/lists/${id}/items`, { name: newItem.trim() })
    setNewItem('')
    load()
  }

  const toggle = async (item) => {
    await put(`/items/${item._id}`, { status: item.status === 'pending' ? 'completed' : 'pending' })
    load()
  }

  const remove = async (itemId) => {
    await del(`/items/${itemId}`)
    load()
  }

  const handleDrop = async (targetId) => {
    if (!draggedId || draggedId === targetId || !list) return
    const items = [...(list.items || [])]
    const fromIdx = items.findIndex(i => i._id === draggedId)
    const toIdx = items.findIndex(i => i._id === targetId)
    const [moved] = items.splice(fromIdx, 1)
    items.splice(toIdx, 0, moved)
    const withOrder = items.map((item, idx) => ({ ...item, order: idx }))
    setList(prev => ({ ...prev, items: withOrder }))
    setDraggedId(null)
    await put(`/lists/${id}/reorder`, withOrder.map(({ _id, order }) => ({ id: _id, order })))
  }

  if (!list) return <div className="p-6 text-gray-500">Loading...</div>

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Link to="/" className="text-sm text-gray-500 hover:text-gray-800 mb-6 inline-block">← Dashboard</Link>
      <h1 className="text-3xl font-bold text-gray-900">{list.name}</h1>
      {list.description && <p className="text-gray-500 mt-1 mb-6">{list.description}</p>}

      <div className="flex gap-2 mb-6 mt-4">
        <input
          value={newItem}
          onChange={e => setNewItem(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addItem()}
          placeholder="Add an item..."
          className="border border-indigo-300 rounded px-3 py-2 flex-1 text-sm"
        />
        <button onClick={addItem} className="bg-indigo-600 text-white px-4 py-2 rounded text-sm hover:bg-indigo-700">
          Add
        </button>
      </div>

      {list.items?.map(item => (
        <div
          key={item._id}
          draggable
          onDragStart={() => setDraggedId(item._id)}
          onDragOver={e => e.preventDefault()}
          onDrop={() => handleDrop(item._id)}
          className="flex items-center gap-3 py-2 border-b border-indigo-100 last:border-0 cursor-grab active:cursor-grabbing"
        >
          <input type="checkbox" checked={item.status === 'completed'} onChange={() => toggle(item)} />
          <span className={`flex-1 ${item.status === 'completed' ? 'line-through text-gray-400' : 'text-gray-800'}`}>
            {item.name}
          </span>
          <button onClick={() => remove(item._id)} className="text-xs text-red-400 hover:text-red-600">Delete</button>
        </div>
      ))}
    </div>
  )
}
