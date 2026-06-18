const BASE = '/api'

function authHeader() {
  const password = sessionStorage.getItem('auth_password')
  if (!password) return {}
  return { 'X-App-Password': password }
}

async function req(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: { ...authHeader(), ...options.headers },
  })
  if (res.status === 401) {
    sessionStorage.removeItem('auth_password')
    window.dispatchEvent(new Event('auth:logout'))
    throw new Error('Unauthorized')
  }
  if (res.status === 204) return null
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Request failed')
  return data
}

export const get = (path) => req(path)

export const post = (path, body) => req(path, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
})

export const put = (path, body) => req(path, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
})

export const del = (path) => req(path, { method: 'DELETE' })

export const upload = (path, formData) => req(path, { method: 'POST', body: formData })

export async function login(password) {
  const res = await fetch(`${BASE}/forecast`, {
    headers: { 'X-App-Password': password },
  })
  if (!res.ok) throw new Error('Wrong password')
  sessionStorage.setItem('auth_password', password)
}

export function logout() {
  sessionStorage.removeItem('auth_password')
}

export function isAuthenticated() {
  return !!sessionStorage.getItem('auth_password')
}
