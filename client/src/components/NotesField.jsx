import { useState } from 'react'
import { put } from '../api/client'

export default function NotesField({ monthId, initialValue }) {
  const [value, setValue] = useState(initialValue || '')
  const [editing, setEditing] = useState(!initialValue)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    await put(`/months/${monthId}`, { details: value })
    setSaving(false)
    setEditing(false)
  }

  if (!editing) {
    return (
      <div className="mt-6">
        <div className="flex items-center justify-between mb-1">
          <label className="block text-sm font-medium text-gray-700">Month Notes</label>
          <button
            onClick={() => setEditing(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded text-xs"
          >
            Edit
          </button>
        </div>
        <p className="text-sm text-gray-800 whitespace-pre-wrap border border-indigo-200 rounded px-3 py-2 min-h-[4rem] bg-white">
          {value || <span className="text-gray-400 italic">No notes yet.</span>}
        </p>
      </div>
    )
  }

  return (
    <div className="mt-6">
      <label className="block text-sm font-medium text-gray-700 mb-1">Month Notes</label>
      <textarea
        value={value}
        onChange={e => setValue(e.target.value)}
        rows={4}
        placeholder="Goals, notes, reminders for this month..."
        className="w-full border border-indigo-300 rounded px-3 py-2 text-sm mb-2"
      />
      <button
        onClick={handleSave}
        disabled={saving}
        className="bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded text-sm disabled:opacity-50"
      >
        {saving ? 'Saving...' : 'Save'}
      </button>
    </div>
  )
}
