import { useState } from 'react'
import { put } from '../api/client'

export default function NotesField({ monthId, initialValue }) {
  const [value, setValue] = useState(initialValue || '')
  const [saved, setSaved] = useState(false)

  const handleBlur = async () => {
    await put(`/months/${monthId}`, { details: value })
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  return (
    <div className="mt-6">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Month Notes {saved && <span className="text-green-600 text-xs">Saved</span>}
      </label>
      <textarea
        value={value}
        onChange={e => setValue(e.target.value)}
        onBlur={handleBlur}
        rows={4}
        placeholder="Goals, notes, reminders for this month..."
        className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
      />
    </div>
  )
}
