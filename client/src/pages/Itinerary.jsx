import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { get, post, put, del } from '../api/client'
import ReactMarkdown from 'react-markdown'

// --- Helpers ---

// Returns YYYY-MM-DD string for a date, always in UTC
const toDateStr = (d) => new Date(d).toISOString().split('T')[0]

// Returns all Date objects from startDate to endDate inclusive (UTC)
function getDaysInRange(startDate, endDate) {
  const days = []
  const current = new Date(toDateStr(startDate) + 'T00:00:00.000Z')
  const end = new Date(toDateStr(endDate) + 'T00:00:00.000Z')
  while (current <= end) {
    days.push(new Date(current))
    current.setUTCDate(current.getUTCDate() + 1)
  }
  return days
}

// Groups dates into 7-day weeks starting Sunday, padded to fill the week
function getWeeks(startDate, endDate) {
  const start = new Date(toDateStr(startDate) + 'T00:00:00.000Z')
  const end = new Date(toDateStr(endDate) + 'T00:00:00.000Z')

  // Rewind to the Sunday on or before start
  const firstSunday = new Date(start)
  firstSunday.setUTCDate(firstSunday.getUTCDate() - firstSunday.getUTCDay())

  // Advance to the Saturday on or after end
  const lastSaturday = new Date(end)
  lastSaturday.setUTCDate(lastSaturday.getUTCDate() + (6 - lastSaturday.getUTCDay()))

  const weeks = []
  const current = new Date(firstSunday)
  while (current <= lastSaturday) {
    const week = []
    for (let i = 0; i < 7; i++) {
      week.push(new Date(current))
      current.setUTCDate(current.getUTCDate() + 1)
    }
    weeks.push(week)
  }
  return weeks
}

const formatLong = (dateStr) =>
  new Date(dateStr + 'T00:00:00.000Z').toLocaleDateString('en-NZ', {
    weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC',
  })

const formatShort = (dateStr) =>
  new Date(dateStr + 'T00:00:00.000Z').toLocaleDateString('en-NZ', {
    weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC',
  })

// --- DayPanel (module-level to avoid remount issues) ---
// Use key={expandedDay} when rendering so it re-initialises when day changes.

function DayPanel({ dateStr, dayActivities, notes, onSaveNotes, onAddActivity, onSaveActivity, onDeleteActivity }) {
  const [localNotes, setLocalNotes] = useState(notes)
  const [showForm, setShowForm] = useState(false)
  const [newActivity, setNewActivity] = useState({ title: '', description: '', locationUrl: '' })
  const [editingId, setEditingId] = useState(null)
  const [editingActivity, setEditingActivity] = useState({ title: '', description: '', locationUrl: '' })

  return (
    <div className="border-t border-indigo-200 p-4 bg-indigo-50">
      <h3 className="font-semibold text-gray-800 mb-3">{formatLong(dateStr)}</h3>

      {/* Activities list */}
      <div className="space-y-2 mb-3">
        {dayActivities.map(a => (
          <div key={a._id} className="bg-white border border-indigo-100 rounded p-3">
            {editingId === a._id ? (
              <div className="space-y-2">
                <input
                  autoFocus
                  value={editingActivity.title}
                  onChange={e => setEditingActivity(p => ({ ...p, title: e.target.value }))}
                  className="border border-indigo-300 rounded px-3 py-1.5 text-sm w-full"
                  placeholder="Title"
                />
                <textarea
                  value={editingActivity.description}
                  onChange={e => setEditingActivity(p => ({ ...p, description: e.target.value }))}
                  rows={3}
                  className="border border-indigo-300 rounded px-3 py-1.5 text-sm w-full resize-y"
                  placeholder="Description (optional)"
                />
                <input
                  value={editingActivity.locationUrl}
                  onChange={e => setEditingActivity(p => ({ ...p, locationUrl: e.target.value }))}
                  className="border border-indigo-300 rounded px-3 py-1.5 text-sm w-full"
                  placeholder="Google Maps link (optional)"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => onSaveActivity(a._id, editingActivity).then(() => setEditingId(null))}
                    className="bg-indigo-600 text-white px-3 py-1 rounded text-xs hover:bg-indigo-700"
                  >Save</button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="border border-indigo-300 px-3 py-1 rounded text-xs hover:bg-white"
                  >Cancel</button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex justify-between items-start gap-2">
                  <span className="font-medium text-sm text-gray-800">{a.title}</span>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => {
                        setEditingId(a._id)
                        setEditingActivity({ title: a.title, description: a.description, locationUrl: a.locationUrl })
                      }}
                      className="text-xs text-indigo-500 hover:text-indigo-700"
                    >Edit</button>
                    <button
                      onClick={() => onDeleteActivity(a._id)}
                      className="text-xs text-red-400 hover:text-red-600"
                    >Delete</button>
                  </div>
                </div>
                {a.description && <p className="text-xs text-gray-600 mt-1">{a.description}</p>}
                {a.locationUrl && (
                  <a
                    href={a.locationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-indigo-500 hover:underline mt-1 inline-block"
                  >📍 View location</a>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add activity form */}
      {showForm ? (
        <div className="bg-white border border-indigo-200 rounded p-3 mb-3 space-y-2">
          <input
            autoFocus
            value={newActivity.title}
            onChange={e => setNewActivity(p => ({ ...p, title: e.target.value }))}
            className="border border-indigo-300 rounded px-3 py-1.5 text-sm w-full"
            placeholder="Activity title"
          />
          <textarea
            value={newActivity.description}
            onChange={e => setNewActivity(p => ({ ...p, description: e.target.value }))}
            rows={3}
            className="border border-indigo-300 rounded px-3 py-1.5 text-sm w-full resize-y"
            placeholder="Description (optional)"
          />
          <input
            value={newActivity.locationUrl}
            onChange={e => setNewActivity(p => ({ ...p, locationUrl: e.target.value }))}
            className="border border-indigo-300 rounded px-3 py-1.5 text-sm w-full"
            placeholder="Google Maps link (optional)"
          />
          <div className="flex gap-2">
            <button
              onClick={() => {
                if (!newActivity.title.trim()) return
                onAddActivity({ ...newActivity, title: newActivity.title.trim() })
                setNewActivity({ title: '', description: '', locationUrl: '' })
                setShowForm(false)
              }}
              className="bg-indigo-600 text-white px-3 py-1 rounded text-xs hover:bg-indigo-700"
            >Save</button>
            <button
              onClick={() => {
                setShowForm(false)
                setNewActivity({ title: '', description: '', locationUrl: '' })
              }}
              className="border border-indigo-300 px-3 py-1 rounded text-xs hover:bg-white"
            >Cancel</button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="text-sm text-indigo-600 hover:text-indigo-800 mb-3 inline-block"
        >+ Add activity</button>
      )}

      {/* Day notes */}
      <div>
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Notes</label>
        <textarea
          value={localNotes}
          onChange={e => setLocalNotes(e.target.value)}
          onBlur={() => onSaveNotes(dateStr, localNotes)}
          rows={3}
          className="border border-indigo-300 rounded px-3 py-2 text-sm w-full resize-y"
          placeholder="Notes for this day..."
        />
      </div>
    </div>
  )
}

// --- Itinerary page ---

export default function Itinerary() {
  const { id } = useParams()
  const [itinerary, setItinerary] = useState(null)
  const [activities, setActivities] = useState([])
  const [availableLists, setAvailableLists] = useState([])
  const [linkedListsData, setLinkedListsData] = useState({})
  const [months, setMonths] = useState([])
  const [ledgerMonth, setLedgerMonth] = useState(null)
  const [expandedDay, setExpandedDay] = useState(null)
  const [editingField, setEditingField] = useState(null)  // 'name' | 'description' | null
  const [editValues, setEditValues] = useState({ name: '', description: '' })
  const [selectedListId, setSelectedListId] = useState('')
  const [collapsedLists, setCollapsedLists] = useState({})

  const loadItinerary = () =>
    get(`/itineraries/${id}`).then(data => {
      setItinerary(data)
      setActivities(data.activities || [])
      setEditValues({ name: data.name, description: data.description || '' })
    }).catch(console.error)

  useEffect(() => {
    loadItinerary()
    get('/lists?type=custom').then(setAvailableLists).catch(console.error)
    get('/months').then(setMonths).catch(console.error)
  }, [id])

  // Fetch linked list items whenever linkedListIds changes
  useEffect(() => {
    if (!itinerary?.linkedListIds?.length) return
    itinerary.linkedListIds.forEach(listId => {
      if (!linkedListsData[listId]) {
        get(`/lists/${listId}`)
          .then(data => setLinkedListsData(prev => ({ ...prev, [listId]: data })))
          .catch(console.error)
      }
    })
  }, [itinerary?.linkedListIds?.join(',')])

  // Fetch ledger month with transactions when ledgerMonthId changes
  useEffect(() => {
    if (!itinerary?.ledgerMonthId) { setLedgerMonth(null); return }
    get(`/months/${itinerary.ledgerMonthId}`).then(setLedgerMonth).catch(console.error)
  }, [itinerary?.ledgerMonthId])

  const saveField = async (field, value) => {
    const updated = await put(`/itineraries/${id}`, { [field]: value })
    setItinerary(prev => ({ ...prev, ...updated }))
    setEditingField(null)
  }

  const saveDayNotes = async (dateStr, notes) => {
    await put(`/itineraries/${id}/days/${dateStr}/notes`, { notes })
    // Reload to sync embedded days array
    loadItinerary()
  }

  const addActivity = async (dateStr, form) => {
    const activity = await post(`/itineraries/${id}/activities`, { ...form, date: dateStr })
    setActivities(prev => [...prev, activity])
  }

  const saveActivity = async (actId, form) => {
    const updated = await put(`/activities/${actId}`, form)
    setActivities(prev => prev.map(a => a._id === actId ? updated : a))
  }

  const deleteActivity = async (actId) => {
    await del(`/activities/${actId}`)
    setActivities(prev => prev.filter(a => a._id !== actId))
  }

  const addLinkedList = async (listId) => {
    if (!listId || (itinerary.linkedListIds || []).includes(listId)) return
    const updated = await put(`/itineraries/${id}`, {
      linkedListIds: [...(itinerary.linkedListIds || []), listId],
    })
    setItinerary(prev => ({ ...prev, linkedListIds: updated.linkedListIds }))
    setSelectedListId('')
    // Fetch the new list's data
    get(`/lists/${listId}`)
      .then(data => setLinkedListsData(prev => ({ ...prev, [listId]: data })))
      .catch(console.error)
  }

  const removeLinkedList = async (listId) => {
    const updated = await put(`/itineraries/${id}`, {
      linkedListIds: (itinerary.linkedListIds || []).filter(l => l.toString() !== listId.toString()),
    })
    setItinerary(prev => ({ ...prev, linkedListIds: updated.linkedListIds }))
    setLinkedListsData(prev => { const n = { ...prev }; delete n[listId]; return n })
  }

  const activitiesForDay = (dateStr) =>
    activities.filter(a => toDateStr(a.date) === dateStr)

  const notesForDay = (dateStr) =>
    itinerary?.days?.find(d => toDateStr(d.date) === dateStr)?.notes || ''

  if (!itinerary) return <div className="p-6 text-gray-500">Loading...</div>

  const tripStart = toDateStr(itinerary.startDate)
  const tripEnd = toDateStr(itinerary.endDate)
  const tripDays = getDaysInRange(itinerary.startDate, itinerary.endDate)
  const weeks = getWeeks(itinerary.startDate, itinerary.endDate)

  const actualSpend = (ledgerMonth?.transactions || []).reduce((sum, t) => {
    const rate = ledgerMonth?.exchangeRate || 1.65
    return sum + (t.currency === 'USD' ? t.value * rate : t.value)
  }, 0)

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Link to="/itineraries" className="text-sm text-gray-500 hover:text-gray-800 mb-6 inline-block">← Itineraries</Link>

      {/* ── Section 1: Header ── */}
      <div className="mb-8">
        {editingField === 'name' ? (
          <input
            value={editValues.name}
            onChange={e => setEditValues(p => ({ ...p, name: e.target.value }))}
            onBlur={() => saveField('name', editValues.name)}
            onKeyDown={e => e.key === 'Enter' && saveField('name', editValues.name)}
            className="text-3xl font-bold w-full border-b-2 border-indigo-400 outline-none mb-4 bg-transparent"
            autoFocus
          />
        ) : (
          <h1
            className="text-3xl font-bold text-gray-900 mb-4 cursor-pointer hover:text-indigo-700"
            onClick={() => setEditingField('name')}
          >{itinerary.name}</h1>
        )}

        {editingField === 'description' ? (
          <div>
            <textarea
              value={editValues.description}
              onChange={e => setEditValues(p => ({ ...p, description: e.target.value }))}
              rows={8}
              className="border border-indigo-300 rounded px-3 py-2 text-sm w-full resize-y"
              placeholder="Trip description..."
              autoFocus
            />
            <button
              onClick={() => saveField('description', editValues.description)}
              className="mt-2 bg-indigo-600 text-white px-3 py-1 rounded text-xs hover:bg-indigo-700"
            >Save</button>
          </div>
        ) : (
          <div
            className="cursor-pointer hover:bg-indigo-50 rounded p-2 -mx-2 min-h-[2rem]"
            onClick={() => setEditingField('description')}
          >
            {itinerary.description ? (
              <div className="prose prose-sm max-w-none text-gray-700">
                <ReactMarkdown>{itinerary.description}</ReactMarkdown>
              </div>
            ) : (
              <p className="text-sm text-gray-400 italic">Click to add a description...</p>
            )}
          </div>
        )}
      </div>

      {/* ── Section 2: Trip Details + Budget ── */}
      <div className="border border-indigo-200 rounded-lg p-5 mb-8">
        <h2 className="font-semibold text-gray-800 mb-4">Trip Details</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Start Date</label>
            <input
              type="date"
              defaultValue={tripStart}
              onBlur={e => saveField('startDate', e.target.value)}
              className="border border-indigo-300 rounded px-3 py-2 text-sm w-full"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">End Date</label>
            <input
              type="date"
              defaultValue={tripEnd}
              onBlur={e => saveField('endDate', e.target.value)}
              className="border border-indigo-300 rounded px-3 py-2 text-sm w-full"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Trip Budget (NZD)</label>
            <input
              type="number"
              step="0.01"
              defaultValue={itinerary.budget || ''}
              onBlur={e => saveField('budget', parseFloat(e.target.value) || null)}
              className="border border-indigo-300 rounded px-3 py-2 text-sm w-full"
              placeholder="e.g. 5000"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Linked Ledger Duration</label>
            <select
              value={itinerary.ledgerMonthId || ''}
              onChange={e => saveField('ledgerMonthId', e.target.value || null)}
              className="border border-indigo-300 rounded px-3 py-2 text-sm w-full text-gray-700"
            >
              <option value="">No duration linked</option>
              {months.map(m => <option key={m._id} value={m._id}>{m.name}</option>)}
            </select>
          </div>
        </div>

        {itinerary.ledgerMonthId && itinerary.budget && ledgerMonth && (
          <div className="border-t border-indigo-100 pt-3 flex flex-wrap gap-6 text-sm">
            <div>
              <span className="text-gray-500">Budget: </span>
              <span className="font-semibold text-gray-800">${Number(itinerary.budget).toFixed(2)}</span>
            </div>
            <div>
              <span className="text-gray-500">Actual: </span>
              <span className="font-semibold text-gray-800">${actualSpend.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-gray-500">Remaining: </span>
              <span className={`font-semibold ${itinerary.budget - actualSpend >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                ${(itinerary.budget - actualSpend).toFixed(2)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ── Section 3: Linked Lists ── */}
      <div className="border border-indigo-200 rounded-lg p-5 mb-8">
        <h2 className="font-semibold text-gray-800 mb-4">Linked Lists</h2>

        <div className="flex gap-2 mb-4">
          <select
            value={selectedListId}
            onChange={e => setSelectedListId(e.target.value)}
            className="border border-indigo-300 rounded px-3 py-2 text-sm flex-1 text-gray-700"
          >
            <option value="">Add a list...</option>
            {availableLists
              .filter(l => !(itinerary.linkedListIds || []).map(String).includes(String(l._id)))
              .map(l => <option key={l._id} value={l._id}>{l.name}</option>)}
          </select>
          <button
            onClick={() => addLinkedList(selectedListId)}
            className="bg-indigo-600 text-white px-4 py-2 rounded text-sm hover:bg-indigo-700"
          >Add</button>
        </div>

        <div className="space-y-3">
          {(itinerary.linkedListIds || []).map(listId => {
            const listData = linkedListsData[listId]
            const isCollapsed = collapsedLists[listId]
            return (
              <div key={listId} className="border border-indigo-100 rounded-lg overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 bg-indigo-50">
                  <button
                    onClick={() => setCollapsedLists(p => ({ ...p, [listId]: !p[listId] }))}
                    className="font-medium text-gray-800 flex items-center gap-2 text-left"
                  >
                    <span>{listData?.name || 'Loading...'}</span>
                    <span className="text-gray-400 text-xs">{isCollapsed ? '▼' : '▲'}</span>
                  </button>
                  <div className="flex items-center gap-3">
                    <Link to={`/lists/${listId}`} className="text-xs text-indigo-500 hover:underline">Open →</Link>
                    <button onClick={() => removeLinkedList(listId)} className="text-xs text-red-400 hover:text-red-600">Remove</button>
                  </div>
                </div>
                {!isCollapsed && listData && (
                  <div className="px-4 py-3">
                    {(listData.items || []).map(item => (
                      <div key={item._id} className="flex items-start gap-2 py-1.5 border-b border-indigo-50 last:border-0">
                        <input type="checkbox" readOnly checked={item.status === 'completed'} className="mt-0.5 shrink-0" />
                        <div className={`text-sm prose prose-sm max-w-none ${item.status === 'completed' ? 'opacity-50' : 'text-gray-700'}`}>
                          <ReactMarkdown>{item.name}</ReactMarkdown>
                        </div>
                      </div>
                    ))}
                    {(!listData.items || listData.items.length === 0) && (
                      <p className="text-sm text-gray-400">No items in this list.</p>
                    )}
                  </div>
                )}
              </div>
            )
          })}
          {(!itinerary.linkedListIds || itinerary.linkedListIds.length === 0) && (
            <p className="text-sm text-gray-400">No lists linked yet.</p>
          )}
        </div>
      </div>

      {/* ── Section 4: Calendar ── */}
      <div className="border border-indigo-200 rounded-lg overflow-hidden">
        <div className="px-5 py-4 bg-indigo-50 border-b border-indigo-200">
          <h2 className="font-semibold text-gray-800">Calendar</h2>
          <p className="text-xs text-gray-500 mt-0.5">{tripDays.length} {tripDays.length === 1 ? 'day' : 'days'}</p>
        </div>

        {/* Desktop: 7-column week grid — hidden below sm */}
        <div className="hidden sm:block">
          <div className="grid grid-cols-7 border-b border-indigo-100">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <div key={d} className="px-2 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider text-center border-r border-indigo-50 last:border-0">
                {d}
              </div>
            ))}
          </div>

          {weeks.map(week => {
            const weekKey = toDateStr(week[0])
            const expandedInThisWeek = week.some(d => toDateStr(d) === expandedDay)
            return (
              <div key={weekKey}>
                <div className="grid grid-cols-7 border-b border-indigo-100 last:border-0">
                  {week.map(day => {
                    const dateStr = toDateStr(day)
                    const isTrip = dateStr >= tripStart && dateStr <= tripEnd
                    const isExpanded = expandedDay === dateStr
                    const dayActs = activitiesForDay(dateStr)
                    return (
                      <div
                        key={dateStr}
                        onClick={() => isTrip && setExpandedDay(isExpanded ? null : dateStr)}
                        className={`min-h-[64px] p-2 border-r border-indigo-50 last:border-0 ${
                          isTrip
                            ? `cursor-pointer ${isExpanded ? 'bg-indigo-100 ring-2 ring-inset ring-indigo-400' : 'hover:bg-indigo-50'}`
                            : 'bg-gray-50'
                        }`}
                      >
                        <div className={`text-sm font-medium mb-1 ${isTrip ? 'text-gray-800' : 'text-gray-300'}`}>
                          {day.getUTCDate()}
                        </div>
                        {isTrip && dayActs.length > 0 && (
                          <div className="text-xs text-indigo-500">
                            {dayActs.length} {dayActs.length === 1 ? 'activity' : 'activities'}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
                {expandedInThisWeek && expandedDay && (
                  <DayPanel
                    key={expandedDay}
                    dateStr={expandedDay}
                    dayActivities={activitiesForDay(expandedDay)}
                    notes={notesForDay(expandedDay)}
                    onSaveNotes={saveDayNotes}
                    onAddActivity={(form) => addActivity(expandedDay, form)}
                    onSaveActivity={saveActivity}
                    onDeleteActivity={deleteActivity}
                  />
                )}
              </div>
            )
          })}
        </div>

        {/* Mobile: vertical list of trip days — hidden at sm and above */}
        <div className="sm:hidden divide-y divide-indigo-100">
          {tripDays.map(day => {
            const dateStr = toDateStr(day)
            const isExpanded = expandedDay === dateStr
            const dayActs = activitiesForDay(dateStr)
            return (
              <div key={dateStr}>
                <div
                  onClick={() => setExpandedDay(isExpanded ? null : dateStr)}
                  className={`flex items-center justify-between px-4 py-3 cursor-pointer ${isExpanded ? 'bg-indigo-100' : 'hover:bg-indigo-50'}`}
                >
                  <span className="font-medium text-sm text-gray-800">{formatShort(dateStr)}</span>
                  <div className="flex items-center gap-2">
                    {dayActs.length > 0 && (
                      <span className="text-xs text-indigo-500">
                        {dayActs.length} {dayActs.length === 1 ? 'activity' : 'activities'}
                      </span>
                    )}
                    <span className="text-gray-400 text-xs">{isExpanded ? '▲' : '▼'}</span>
                  </div>
                </div>
                {isExpanded && (
                  <DayPanel
                    key={dateStr}
                    dateStr={dateStr}
                    dayActivities={activitiesForDay(dateStr)}
                    notes={notesForDay(dateStr)}
                    onSaveNotes={saveDayNotes}
                    onAddActivity={(form) => addActivity(dateStr, form)}
                    onSaveActivity={saveActivity}
                    onDeleteActivity={deleteActivity}
                  />
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
