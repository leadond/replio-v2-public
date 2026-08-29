import { useEffect, useState } from 'react'
import { apiFetch } from '../api/client'
import { Phone, Users, Clock, TrendingUp } from 'lucide-react'

export default function Dashboard() {
  const [stats, setStats] = useState({ calls: 0, callers: 0, minutes: 0, avgDuration: 0 })

  useEffect(() => {
    Promise.all([
      apiFetch('/callers?limit=1'),
      apiFetch('/conversations?limit=100'),
    ]).then(([callersRes, convsRes]) => {
      const callers = callersRes?.length || 0
      const convs = convsRes?.length || 0
      const minutes = convsRes?.reduce((acc: number, c: any) => acc + (c.duration_seconds || 0), 0) / 60 || 0
      setStats({
        calls: convs,
        callers: callers,
        minutes: Math.round(minutes),
        avgDuration: convs > 0 ? Math.round(minutes / convs) : 0,
      })
    }).catch(() => {})
  }, [])

  const cards = [
    { label: 'Total Calls', value: stats.calls, icon: Phone },
    { label: 'Callers', value: stats.callers, icon: Users },
    { label: 'Minutes', value: stats.minutes, icon: Clock },
    { label: 'Avg Duration', value: `${stats.avgDuration}m`, icon: TrendingUp },
  ]

  return (
    <div>
      <h1 style={{ fontSize: 28, marginBottom: 24 }}>Dashboard</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
        {cards.map(c => (
          <div key={c.label} className="card" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ background: 'rgba(45,212,191,0.1)', borderRadius: 10, padding: 12 }}>
              <c.icon size={24} color="var(--accent)" />
            </div>
            <div>
              <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>{c.label}</div>
              <div style={{ fontSize: 24, fontWeight: 700 }}>{c.value}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
