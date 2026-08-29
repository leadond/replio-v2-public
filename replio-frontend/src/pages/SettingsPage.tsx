import { useAuth } from '../context/AuthContext'

export default function SettingsPage() {
  const { user } = useAuth()
  return (
    <div>
      <h1 style={{ fontSize: 28, marginBottom: 24 }}>Settings</h1>
      <div className="card" style={{ maxWidth: 600 }}>
        <h2 style={{ marginBottom: 16 }}>Account</h2>
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: 13, marginBottom: 4 }}>Email</label>
          <input value={user?.email || ''} readOnly />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: 13, marginBottom: 4 }}>Name</label>
          <input value={user?.full_name || ''} readOnly />
        </div>
        <hr style={{ border: 'none', borderTop: '1px solid var(--surface-light)', margin: '20px 0' }} />
        <h2 style={{ marginBottom: 16 }}>System Status</h2>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <div className="badge badge-success">API Online</div>
          <div className="badge badge-default">Database</div>
          <div className="badge badge-default">SignalWire</div>
          <div className="badge badge-default">ElevenLabs</div>
        </div>
      </div>
    </div>
  )
}
