import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { ErrorBoundary } from './components/ErrorBoundary'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Inbox from './pages/Inbox'
import Callers from './pages/Callers'
import Calls from './pages/Calls'
import Recordings from './pages/Recordings'
import Appointments from './pages/Appointments'
import Escalations from './pages/Escalations'
import KnowledgeBase from './pages/KnowledgeBase'
import Reports from './pages/Reports'
import AuditLog from './pages/AuditLog'
import Guidance from './pages/Guidance'
import Chat from './pages/Chat'
import Settings from './pages/Settings'
import LoginPage from './pages/LoginPage'

export default function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: 'linear-gradient(135deg, #0f1729 0%, #1a2847 100%)',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            border: '3px solid rgba(45,212,191,0.2)',
            borderTopColor: '#2dd4bf',
            margin: '0 auto 16px',
            animation: 'spin 1s linear infinite',
          }} />
          <p style={{ color: '#9ca3af' }}>Loading...</p>
        </div>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    )
  }

  if (!user) return <LoginPage />

  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="inbox" element={<Inbox />} />
          <Route path="callers" element={<Callers />} />
          <Route path="calls" element={<Calls />} />
          <Route path="recordings" element={<Recordings />} />
          <Route path="appointments" element={<Appointments />} />
          <Route path="escalations" element={<Escalations />} />
          <Route path="knowledge-base" element={<KnowledgeBase />} />
          <Route path="reports" element={<Reports />} />
          <Route path="audit-log" element={<AuditLog />} />
          <Route path="guidance" element={<Guidance />} />
          <Route path="chat" element={<Chat />} />
          <Route path="settings" element={<Settings />} />
        </Route>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </ErrorBoundary>
  )
}
