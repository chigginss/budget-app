import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { get, post, put, del } from '../api/client'

export default function Dreaming() {
  const [list, setList] = useState(null)
  const [forecast, setForecast] = useState(null)
  const [newItem, setNewItem] = useState('')
  const [goal, setGoal] = useState({ savingGoal: '', goalDate: '' })

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

  // Calculate projected savings by goal date using forecast months
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

      <div className="border border-gray-200 rounded-lg p-5 mb-8">
        <h2 className="font-semibold text-gray-800 mb-3">Saving Goal</h2>
        <div className="grid grid-cols-2 gap-4 mb-3">
          <div>
            <label className="text-sm text-gray-600 block mb-1">Goal Amount (NZD)</label>
            <input type="number" step="0.01" value={goal.savingGoal}
              onChange={e => setGoal(p => ({ ...p, savingGoal: e.target.value }))}
              onBlur={saveGoal}
              className="border rounded px-3 py-2 text-sm w-full" />
          </div>
          <div>
            <label className="text-sm text-gray-600 block mb-1">Target Date</label>
            <input type="date" value={goal.goalDate}
              onChange={e => setGoal(p => ({ ...p, goalDate: e.target.value }))}
              onBlur={saveGoal}
              className="border rounded px-3 py-2 text-sm w-full" />
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
          className="border border-gray-300 rounded px-3 py-2 flex-1 text-sm"
        />
        <button onClick={addItem} className="bg-gray-800 text-white px-4 py-2 rounded text-sm hover:bg-gray-700">
          Add
        </button>
      </div>
      {list?.items?.map(item => (
        <div key={item._id} className="flex items-center justify-between py-2 border-b last:border-0">
          <span className="text-gray-800">{item.name}</span>
          <button onClick={() => remove(item._id)} className="text-xs text-red-400 hover:text-red-600">Delete</button>
        </div>
      ))}
    </div>
  )
}
