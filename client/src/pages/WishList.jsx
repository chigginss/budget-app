import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { get, post, put, del } from '../api/client'

export default function WishList() {
  const [list, setList] = useState(null)
  const [newItem, setNewItem] = useState('')
  const [draggedId, setDraggedId] = useState(null)

  const load = () =>
    get('/lists?type=toBuy').then(lists => {
      if (lists.length) return get(`/lists/${lists[0]._id}`)
      return post('/lists', { name: 'Wish List', type: 'toBuy' }).then(l => ({ ...l, items: [] }))
    }).then(setList).catch(console.error)

  useEffect(() => { load() }, [])

  const addItem = async () => {
    if (!newItem.trim() || !list) return
    await post(`/lists/${list._id}/items`, { name: newItem.trim() })
    setNewItem('')
    load()
  }

  const remove = async (id) => {
    await del(`/items/${id}`)
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
    await put(`/lists/${list._id}/reorder`, withOrder.map(({ _id, order }) => ({ id: _id, order })))
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Link to="/" className="text-sm text-gray-500 hover:text-gray-800 mb-6 inline-block">← Dashboard</Link>
      <h1 className="text-3xl font-bold mb-6 text-gray-900">Wish List</h1>
      <div className="flex gap-2 mb-6">
        <input
          value={newItem}
          onChange={e => setNewItem(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addItem()}
          placeholder="Add something to buy..."
          className="border border-indigo-300 rounded px-3 py-2 flex-1 text-sm"
        />
        <button onClick={addItem} className="bg-indigo-600 text-white px-4 py-2 rounded text-sm hover:bg-indigo-700">
          Add
        </button>
      </div>
      {list?.items?.map(item => (
        <div
          key={item._id}
          draggable
          onDragStart={() => setDraggedId(item._id)}
          onDragOver={e => e.preventDefault()}
          onDrop={() => handleDrop(item._id)}
          className="flex items-center justify-between py-2 border-b border-indigo-100 last:border-0 cursor-grab active:cursor-grabbing"
        >
          <span className="text-gray-800">{item.name}</span>
          <button onClick={() => remove(item._id)} className="text-xs text-red-400 hover:text-red-600">Delete</button>
        </div>
      ))}
    </div>
  )
}
