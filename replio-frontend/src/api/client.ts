const API_BASE = ''

export async function apiFetch(path: string, options: RequestInit = {}) {
  const token = localStorage.getItem('token')
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...((options.headers as Record<string, string>) || {}),
  }
  const r = await fetch(`${API_BASE}${path}`, { ...options, headers })
  if (r.status === 401) {
    localStorage.removeItem('token')
    window.location.href = '/login'
    throw new Error('Unauthorized')
  }
  if (!r.ok) {
    const err = await r.text()
    throw new Error(err || `HTTP ${r.status}`)
  }
  return r.json()
}
