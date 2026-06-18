import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { get, post, put, del } from '../api/client'
import ReactMarkdown from 'react-markdown'

export default function Dreaming() {
  const [list, setList] = useState(null)
  const [forecast, setForecast] = useState(null)
  const [newItem, setNewItem] = useState('')
  const [goal, setGoal] = useState({ savingGoal: '', goalDate: '' })
  const [editingId, setEditingId] = useState(null)
  const [editingText, setEditingText] = useState('')
  const [draggedId, setDraggedId] = useState(null)

  const load = () =>
    get('/lists?type=longTermPlan').then(lists => {
      if (lists.length) return get(`/lists/${lists[0]._id}`)
      return post('/lists', { name: 'Dreaming', type: 'longTermPlan' }).then(l => ({ ...l, items: [] }))
    }).then(data => {
      setList(data)
      setGoal({ savingGoal: data.savingGoal || '', goalDate: data.goalDate ? data.goalDate.split('T')[0] : '' })
    }).catch(console.error)

  useEffect(() => {
    load()
    get('/forecast').then(setForecast).catch(console.error)
  }, [])

  const saveGoal = async () => {
    if (!list) return
    const updated = await put(`/lists/${list._id}`, {
      savingGoal: parseFloat(goal.savingGoal) || 0,
      goalDate: goal.goalDate || null,
    })
    setList(prev => ({ ...prev, ...updated }))
  }

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

  const startEdit = (item) => {
    setEditingId(item._id)
    setEditingText(item.name)
  }

  const saveEdit = async (id) => {
    if (!editingText.trim()) return
    await put(`/items/${id}`, { name: editingText.trim() })
    setEditingId(null)
    setEditingText('')
    load()
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditingText('')
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

  const projectedByGoalDate = () => {
    if (!forecast || !goal.goalDate) return null
    const target = new Date(goal.goalDate)
    const months = forecast.months.filter(m => new Date(m.date) <= target)
    return months.reduce((sum, m) => {
      return sum + Math.max(0, forecast.income - forecast.fixedCosts - (m.unexpectedCosts || 0))
    }, 0)
  }

  const projected = projectedByGoalDate()
  const savingGoal = parseFloat(goal.savingGoal) || 0
  const diff = projected !== null ? projected - savingGoal : null

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Link to="/" className="text-sm text-gray-500 hover:text-gray-800 mb-6 inline-block">← Dashboard</Link>
      <h1 className="text-3xl font-bold mb-6 text-gray-900">Dreaming</h1>

      <div className="border border-indigo-200 rounded-lg p-5 mb-8">
        <h2 className="font-semibold text-gray-800 mb-3">Saving Goal</h2>
        <div className="grid grid-cols-2 gap-4 mb-3">
          <div>
            <label className="text-sm text-gray-600 block mb-1">Goal Amount (NZD)</label>
            <input type="number" step="0.01" value={goal.savingGoal}
              onChange={e => setGoal(p => ({ ...p, savingGoal: e.target.value }))}
              onBlur={saveGoal}
              className="border border-indigo-300 rounded px-3 py-2 text-sm w-full" />
          </div>
          <div>
            <label className="text-sm text-gray-600 block mb-1">Target Date</label>
            <input type="date" value={goal.goalDate}
              onChange={e => setGoal(p => ({ ...p, goalDate: e.target.value }))}
              onBlur={saveGoal}
              className="border border-indigo-300 rounded px-3 py-2 text-sm w-full" />
          </div>
        </div>
        {diff !== null && (
          <div className={`text-sm font-semibold ${diff >= 0 ? 'text-green-700' : 'text-red-600'}`}>
            {diff >= 0
              ? `On track — +$${diff.toFixed(2)} ahead`
              : `Behind by $${Math.abs(diff).toFixed(2)}`}
            {projected !== null && <span className="text-gray-500 font-normal ml-2">(projected: ${projected.toFixed(2)})</span>}
          </div>
        )}
        {goal.goalDate && forecast && new Date(goal.goalDate) > new Date(forecast.months[forecast.months.length - 1]?.date) && (
          <p className="text-xs text-gray-400 mt-1">Goal date is beyond the 12-month forecast window — projection may be understated.</p>
        )}
      </div>

      <h2 className="font-semibold text-gray-800 mb-3">Plans & Ideas</h2>
      <div className="flex gap-2 mb-4">
        <input
          value={newItem}
          onChange={e => setNewItem(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addItem()}
          placeholder="Add a plan or idea..."
          className="border border-indigo-300 rounded px-3 py-2 flex-1 text-sm"
        />
        <button onClick={addItem} className="bg-indigo-600 text-white px-4 py-2 rounded text-sm hover:bg-indigo-700">
          Add
        </button>
      </div>
      {list?.items?.map(item => (
        <div
          key={item._id}
          draggable={editingId !== item._id}
          onDragStart={() => setDraggedId(item._id)}
          onDragOver={e => e.preventDefault()}
          onDrop={() => handleDrop(item._id)}
          className={`py-3 border-b border-indigo-100 last:border-0 ${editingId !== item._id ? 'cursor-grab active:cursor-grabbing' : ''}`}
        >
          {editingId === item._id ? (
            <div className="flex flex-col gap-2">
              <textarea
                value={editingText}
                onChange={e => setEditingText(e.target.value)}
                rows={3}
                className="border border-indigo-300 rounded px-3 py-2 text-sm w-full"
                autoFocus
              />
              <div className="flex gap-2">
                <button onClick={() => saveEdit(item._id)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded text-xs">
                  Save
                </button>
                <button onClick={cancelEdit}
                  className="border border-indigo-300 px-3 py-1 rounded text-xs hover:bg-indigo-50">
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-start justify-between gap-3">
              <div className="prose prose-sm text-gray-800 flex-1 min-w-0">
                <ReactMarkdown>{item.name}</ReactMarkdown>
              </div>
              <div className="flex gap-2 shrink-0">
                <button onClick={() => startEdit(item)}
                  className="text-xs text-indigo-500 hover:text-indigo-700">Edit</button>
                <button onClick={() => remove(item._id)}
                  className="text-xs text-red-400 hover:text-red-600">Delete</button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
