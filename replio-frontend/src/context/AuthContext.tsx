import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { API_BASE_URL } from '../api/client'

interface User {
  id: string
  email: string
  full_name?: string
  company_id?: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

/**
 * Distinguishes "the server said no" from "the server isn't reachable".
 * Reporting an unreachable backend as bad credentials sends people chasing
 * the wrong problem, so network failures get their own message.
 */
class AuthNetworkError extends Error {
  readonly originalError?: unknown

  constructor(originalError?: unknown) {
    super(
      `Cannot reach the server at ${API_BASE_URL}. ` +
      'Check that the backend is running and that VITE_API_URL is set correctly.',
    )
    this.name = 'AuthNetworkError'
    this.originalError = originalError
  }
}

async function authFetch(path: string, init?: RequestInit): Promise<Response> {
  try {
    return await fetch(`${API_BASE_URL}${path}`, init)
  } catch (e) {
    throw new AuthNetworkError(e)
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) {
      setLoading(false)
      return
    }

    let cancelled = false
    authFetch('/auth/me', { headers: { Authorization: `Bearer ${token}` } })
      .then(async r => {
        if (r.ok) return r.json()
        // Only clear the token when the server actively rejects it.
        if (r.status === 401 || r.status === 403) {
          localStorage.removeItem('token')
          if (!cancelled) setToken(null)
        }
        return null
      })
      .catch(() => null)  // Network blip: keep the token, let the user retry.
      .then(data => { if (data && !cancelled) setUser(data) })
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [token])

  const login = async (email: string, password: string) => {
    const form = new URLSearchParams()
    form.append('username', email)
    form.append('password', password)

    const r = await authFetch('/auth/login', { method: 'POST', body: form })

    if (!r.ok) {
      if (r.status === 401 || r.status === 400) {
        throw new Error('Invalid email or password')
      }
      throw new Error(`Login failed (server returned ${r.status})`)
    }

    const data = await r.json()
    localStorage.setItem('token', data.access_token)
    setToken(data.access_token)

    const meResponse = await authFetch('/auth/me', {
      headers: { Authorization: `Bearer ${data.access_token}` },
    })
    if (meResponse.ok) {
      setUser(await meResponse.json())
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}
