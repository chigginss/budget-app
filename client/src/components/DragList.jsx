import { useState, useEffect } from 'react'
import { put, del } from '../api/client'
import { getItemStyle } from '../utils/gradient'

export default function DragList({ listId, items: initialItems, onUpdate }) {
  const [items, setItems] = useState(initialItems)
  const [draggedId, setDraggedId] = useState(null)

  useEffect(() => {
    setItems(initialItems)
  }, [initialItems])

  const pending = items.filter(i => i.status === 'pending')
  const completed = items.filter(i => i.status === 'completed')

  const handleDragStart = (id) => setDraggedId(id)
  const handleDragOver = (e) => e.preventDefault()

  const handleDrop = async (targetId) => {
    if (!draggedId || draggedId === targetId) return
    const draggedIdx = pending.findIndex(i => i._id === draggedId)
    const targetIdx = pending.findIndex(i => i._id === targetId)
    const reordered = [...pending]
    const [moved] = reordered.splice(draggedIdx, 1)
    reordered.splice(targetIdx, 0, moved)
    const withOrder = reordered.map((item, idx) => ({ ...item, order: idx }))
    setItems([...withOrder, ...completed])
    setDraggedId(null)
    await put(`/lists/${listId}/reorder`, withOrder.map(({ _id, order }) => ({ id: _id, order })))
  }

  const toggleDone = async (item) => {
    const newStatus = item.status === 'pending' ? 'completed' : 'pending'
    await put(`/items/${item._id}`, { status: newStatus })
    onUpdate()
  }

  const remove = async (id) => {
    await del(`/items/${id}`)
    onUpdate()
  }

  return (
    <div>
      {pending.map((item, idx) => (
        <div
          key={item._id}
          draggable
          onDragStart={() => handleDragStart(item._id)}
          onDragOver={handleDragOver}
          onDrop={() => handleDrop(item._id)}
          style={getItemStyle(idx, pending.length)}
          className={`flex items-center gap-3 px-4 py-3 rounded mb-1 cursor-grab active:cursor-grabbing ${idx < 3 ? 'font-semibold' : ''}`}
        >
          <input type="checkbox" onChange={() => toggleDone(item)} className="shrink-0" />
          <span className="flex-1">{item.name}</span>
          <button onClick={() => remove(item._id)} className="text-xs text-gray-400 hover:text-red-500">✕</button>
        </div>
      ))}

      {completed.length > 0 && (
        <div className="mt-4">
          <div className="text-xs font-semibold text-gray-400 uppercase mb-2">Done</div>
          {completed.map(item => (
            <div key={item._id} className="flex items-center gap-3 px-4 py-2 text-gray-400 line-through mb-1">
              <input type="checkbox" checked onChange={() => toggleDone(item)} className="shrink-0" />
              <span className="flex-1">{item.name}</span>
              <button onClick={() => remove(item._id)} className="text-xs hover:text-red-500">✕</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
