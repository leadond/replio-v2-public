import { useEffect, useState } from 'react'
import { apiFetch } from '../api/client'

interface Conversation {
  id: string
  caller_id: string
  status: string
  duration_seconds: number
  outcome?: string
  created_at: string
}

export default function ConversationsTable() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiFetch('/conversations').then(data => {
      setConversations(data)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  if (loading) return <div>Loading conversations...</div>

  return (
    <div className="card" style={{ overflow: 'auto' }}>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Status</th>
            <th>Duration</th>
            <th>Outcome</th>
            <th>Created</th>
          </tr>
        </thead>
        <tbody>
          {conversations.map(c => (
            <tr key={c.id}>
              <td>{c.id.slice(0, 8)}...</td>
              <td>
                <span className={
                  c.status === 'completed' ? 'badge badge-success' :
                  c.status === 'in_progress' ? 'badge badge-warning' : 'badge badge-default'
                }>
                  {c.status}
                </span>
              </td>
              <td>{Math.round(c.duration_seconds / 60)}m</td>
              <td>{c.outcome || '-'}</td>
              <td>{new Date(c.created_at).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
