import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import CallersPage from './pages/CallersPage'
import ConversationsPage from './pages/ConversationsPage'
import SettingsPage from './pages/SettingsPage'
import LoginPage from './pages/LoginPage'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <div style={{ padding: 40 }}>Loading...</div>
  return user ? <>{children}</> : <Navigate to="/login" />
}

export default function App() {
  const { user } = useAuth()
  if (!user) return <LoginPage />

  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="callers" element={<CallersPage />} />
        <Route path="conversations" element={<ConversationsPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
      <Route path="/login" element={<LoginPage />} />
    </Routes>
  )
}
