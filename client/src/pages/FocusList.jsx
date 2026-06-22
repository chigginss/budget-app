import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { get, post } from '../api/client'
import DragList from '../components/DragList'

export default function FocusList() {
  const [list, setList] = useState(null)
  const [newItem, setNewItem] = useState('')

  const load = () =>
    get('/lists?type=todo').then(lists => {
      if (lists.length) return get(`/lists/${lists[0]._id}`)
      return post('/lists', { name: 'To-do List', type: 'todo' }).then(l => ({ ...l, items: [] }))
    }).then(setList).catch(console.error)

  useEffect(() => { load() }, [])

  const addItem = async () => {
    if (!newItem.trim() || !list) return
    await post(`/lists/${list._id}/items`, { name: newItem.trim() })
    setNewItem('')
    load()
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Link to="/" className="text-sm text-gray-500 hover:text-gray-800 mb-6 inline-block">← Dashboard</Link>
      <h1 className="text-3xl font-bold mb-6 text-gray-900">To-do List</h1>
      <div className="flex gap-2 mb-6">
        <input
          value={newItem}
          onChange={e => setNewItem(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addItem()}
          placeholder="Add a task..."
          className="border border-indigo-300 rounded px-3 py-2 flex-1 text-sm"
        />
        <button onClick={addItem} className="bg-indigo-600 text-white px-4 py-2 rounded text-sm hover:bg-indigo-700">
          Add
        </button>
      </div>
      {list && (
        <DragList listId={list._id} items={list.items || []} onUpdate={load} />
      )}
    </div>
  )
}
