import { useEffect, useState } from 'react'
import { apiFetch } from '../api/client'

interface Caller {
  id: string
  phone_number: string
  name?: string
  email?: string
  total_calls: number
  total_duration_seconds: number
  last_call_at?: string
  is_blocked: boolean
}

export default function CallersTable() {
  const [callers, setCallers] = useState<Caller[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiFetch('/callers').then(data => {
      setCallers(data)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  if (loading) return <div>Loading callers...</div>

  return (
    <div className="card" style={{ overflow: 'auto' }}>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Phone</th>
            <th>Calls</th>
            <th>Duration</th>
            <th>Last Call</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {callers.map(c => (
            <tr key={c.id}>
              <td>{c.name || '-'}</td>
              <td>{c.phone_number}</td>
              <td>{c.total_calls}</td>
              <td>{Math.round(c.total_duration_seconds / 60)}m</td>
              <td>{c.last_call_at ? new Date(c.last_call_at).toLocaleDateString() : '-'}</td>
              <td>
                <span className={c.is_blocked ? 'badge badge-danger' : 'badge badge-success'}>
                  {c.is_blocked ? 'Blocked' : 'Active'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
