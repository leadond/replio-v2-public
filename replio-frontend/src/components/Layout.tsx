import { Outlet, Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  Phone, Users, MessageSquare, Settings, LogOut, BarChart3,
  Inbox, FileText, Clock, AlertCircle, Book, MessageCircle, HelpCircle, Zap
} from 'lucide-react'

const nav = [
  { to: '/', icon: BarChart3, label: 'Dashboard' },
  { to: '/inbox', icon: Inbox, label: 'Inbox' },
  { to: '/callers', icon: Users, label: 'Callers' },
  { to: '/calls', icon: Phone, label: 'Calls' },
  { to: '/recordings', icon: Phone, label: 'Recordings' },
  { to: '/appointments', icon: Clock, label: 'Appointments' },
  { to: '/escalations', icon: AlertCircle, label: 'Escalations' },
  { to: '/knowledge-base', icon: Book, label: 'Knowledge Base' },
  { to: '/reports', icon: BarChart3, label: 'Reports' },
  { to: '/audit-log', icon: FileText, label: 'Audit Log' },
  { to: '/guidance', icon: HelpCircle, label: 'Guidance' },
  { to: '/chat', icon: MessageCircle, label: 'Chat' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

export default function Layout() {
  const { user, logout } = useAuth()
  const location = useLocation()

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <aside style={{
        width: 240,
        background: 'var(--surface)',
        borderRight: '1px solid var(--surface-light)',
        display: 'flex',
        flexDirection: 'column',
        padding: '20px 0',
      }}>
        <div style={{ padding: '0 20px 24px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <Phone size={24} color="var(--accent)" />
          <span style={{ fontSize: 20, fontWeight: 700 }}>Replio</span>
        </div>
        <nav style={{ flex: 1 }}>
          {nav.map(item => {
            const active = location.pathname === item.to
            return (
              <Link key={item.to} to={item.to} style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 20px',
                color: active ? 'var(--accent)' : 'var(--text-muted)',
                background: active ? 'rgba(45,212,191,0.08)' : 'transparent',
                fontWeight: 500,
                transition: 'all 0.15s',
              }}>
                <item.icon size={18} />
                {item.label}
              </Link>
            )
          })}
        </nav>
        <div style={{ padding: '0 20px' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 8 }}>
            {user?.email}
          </div>
          <button onClick={logout} style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: 'transparent',
            color: 'var(--text-muted)',
            border: '1px solid var(--surface-light)',
          }}>
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </aside>
      <main style={{ flex: 1, overflow: 'auto', padding: 28 }}>
        <Outlet />
      </main>
    </div>
  )
}
