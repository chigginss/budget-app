import { useEffect, useState } from 'react'
import { login, isAuthenticated } from '../api/client'

export default function AuthGate({ children }) {
  const [authed, setAuthed] = useState(isAuthenticated())
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const handleLogout = () => setAuthed(false)
    window.addEventListener('auth:logout', handleLogout)
    return () => window.removeEventListener('auth:logout', handleLogout)
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await login(password)
      setAuthed(true)
    } catch {
      setError('Wrong password')
    } finally {
      setLoading(false)
    }
  }

  if (authed) return children

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-xl p-8 w-full max-w-sm shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Welcome back</h1>
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          autoFocus
          className="border rounded px-3 py-2 text-sm w-full mb-3"
        />
        {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="bg-gray-800 text-white px-4 py-2 rounded text-sm w-full hover:bg-gray-700 disabled:opacity-50"
        >
          {loading ? 'Checking...' : 'Enter'}
        </button>
      </form>
    </div>
  )
}
