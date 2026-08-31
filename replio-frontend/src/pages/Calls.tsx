import { useState, useEffect } from 'react'
import { Phone, PhoneOff, Plus, Search, Loader } from 'lucide-react'
import { apiClient } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { Alert } from '../components/Alert'

interface Call {
  sid: string
  to: string
  from: string
  status: string
  created_at: string
  duration?: number
}

export default function Calls() {
  const { user } = useAuth()
  const companyId = user?.company_id || ''

  const [calls, setCalls] = useState<Call[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [newCallPhone, setNewCallPhone] = useState('')
  const [initiatingCall, setInitiatingCall] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  // Whether SignalWire is actually usable. Until we know, the dial form stays
  // disabled rather than inviting a call that can only fail.
  const [callConfig, setCallConfig] = useState<{
    configured: boolean
    missing_settings: string[]
    from_number: string | null
  } | null>(null)

  useEffect(() => {
    apiClient
      .getCallConfig()
      .then(setCallConfig)
      .catch(() => setCallConfig({ configured: false, missing_settings: [], from_number: null }))
  }, [])

  useEffect(() => {
    fetchCalls()
    const interval = setInterval(fetchCalls, 15000)
    return () => clearInterval(interval)
  }, [companyId])

  const fetchCalls = async () => {
    if (!companyId) return
    try {
      setLoading(true)
      const data = await apiClient.listCalls(50, 0)
      setCalls(Array.isArray(data?.calls) ? data.calls : [])
      setError(null)
    } catch (err) {
      // 503 = SignalWire not configured; show a friendly message instead
      const msg = err instanceof Error ? err.message : 'Failed to load calls'
      if (msg.includes('503') || msg.includes('Service Unavailable')) {
        setError('Outbound calling is not configured. Set up SignalWire credentials to enable calls.')
      } else {
        setError(msg)
      }
      setCalls([])
    } finally {
      setLoading(false)
    }
  }

  const handleInitiateCall = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCallPhone.trim()) {
      setError('Phone number is required')
      return
    }

    try {
      setInitiatingCall(true)
      setError(null)
      const result = await apiClient.initiateCall(companyId, newCallPhone)
      if (result.success) {
        setSuccess(`Call initiated to ${newCallPhone}`)
        setNewCallPhone('')
        fetchCalls()
        setTimeout(() => setSuccess(null), 3000)
      } else {
        setError('Failed to initiate call')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initiate call')
    } finally {
      setInitiatingCall(false)
    }
  }

  const handleHangup = async (callId: string) => {
    try {
      await apiClient.hangupCall(callId)
      setSuccess('Call ended')
      fetchCalls()
      setTimeout(() => setSuccess(null), 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to end call')
    }
  }

  const filteredCalls = calls.filter(call =>
    call.to.includes(searchTerm) || call.from.includes(searchTerm)
  )

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 8 }}>Calls</h1>
        <p style={{ color: 'var(--text-muted)' }}>Make and manage outbound calls</p>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError(null)} />}
      {success && <Alert type="success" message={success} onClose={() => setSuccess(null)} />}

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 24,
        marginBottom: 32,
      }}>
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--surface-light)',
          borderRadius: 12,
          padding: 24,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <Phone size={24} color="var(--accent)" />
            <h2 style={{ fontSize: 18, fontWeight: 600 }}>Active Calls</h2>
          </div>
          <p style={{ fontSize: 32, fontWeight: 700, margin: '16px 0' }}>
            {calls.filter(c => c.status === 'initiated').length}
          </p>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Active now</p>
        </div>

        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--surface-light)',
          borderRadius: 12,
          padding: 24,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <Plus size={24} color="var(--accent)" />
            <h2 style={{ fontSize: 18, fontWeight: 600 }}>Initiate Call</h2>
          </div>
          {callConfig && !callConfig.configured && (
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 0 }}>
              Outbound calling is unavailable
              {callConfig.missing_settings.length > 0
                ? `: ${callConfig.missing_settings.join(', ')} not set`
                : '. Check the SignalWire configuration.'}
            </p>
          )}
          <form onSubmit={handleInitiateCall} style={{ marginTop: 16 }}>
            <input
              type="tel"
              placeholder="Phone number (e.g., +14155552671)"
              value={newCallPhone}
              onChange={(e) => setNewCallPhone(e.target.value)}
              disabled={callConfig ? !callConfig.configured : true}
              style={{
                width: '100%',
                padding: '10px 12px',
                background: 'var(--surface-light)',
                border: '1px solid var(--surface-light)',
                borderRadius: 8,
                color: 'var(--text)',
                marginBottom: 12,
              }}
            />
            <button
              type="submit"
              disabled={initiatingCall || !callConfig?.configured}
              style={{
                width: '100%',
                padding: '10px 12px',
                background: 'var(--accent)',
                color: 'var(--surface)',
                border: 'none',
                borderRadius: 8,
                fontWeight: 600,
                cursor: initiatingCall || !callConfig?.configured ? 'not-allowed' : 'pointer',
                opacity: initiatingCall || !callConfig?.configured ? 0.6 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              {initiatingCall && <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} />}
              {initiatingCall ? 'Calling...' : 'Make Call'}
            </button>
          </form>
        </div>
      </div>

      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--surface-light)',
        borderRadius: 12,
        overflow: 'hidden',
      }}>
        <div style={{ padding: 24, borderBottom: '1px solid var(--surface-light)' }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{
              position: 'absolute',
              left: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)',
            }} />
            <input
              type="text"
              placeholder="Search by phone number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px 10px 36px',
                background: 'var(--surface-light)',
                border: '1px solid var(--surface-light)',
                borderRadius: 8,
                color: 'var(--text)',
              }}
            />
          </div>
        </div>

        {loading && (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
            <LoadingSpinner />
          </div>
        )}

        {!loading && filteredCalls.length === 0 && (
          <div style={{
            padding: 40,
            textAlign: 'center',
            color: 'var(--text-muted)',
          }}>
            <Phone size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
            <p>No calls yet</p>
          </div>
        )}

        {!loading && filteredCalls.length > 0 && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
            }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--surface-light)' }}>
                  <th style={{
                    padding: 16,
                    textAlign: 'left',
                    fontWeight: 600,
                    color: 'var(--text-muted)',
                    fontSize: 14,
                  }}>From</th>
                  <th style={{
                    padding: 16,
                    textAlign: 'left',
                    fontWeight: 600,
                    color: 'var(--text-muted)',
                    fontSize: 14,
                  }}>To</th>
                  <th style={{
                    padding: 16,
                    textAlign: 'left',
                    fontWeight: 600,
                    color: 'var(--text-muted)',
                    fontSize: 14,
                  }}>Status</th>
                  <th style={{
                    padding: 16,
                    textAlign: 'left',
                    fontWeight: 600,
                    color: 'var(--text-muted)',
                    fontSize: 14,
                  }}>Started</th>
                  <th style={{
                    padding: 16,
                    textAlign: 'right',
                    fontWeight: 600,
                    color: 'var(--text-muted)',
                    fontSize: 14,
                  }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredCalls.map(call => (
                  <tr key={call.sid} style={{
                    borderBottom: '1px solid var(--surface-light)',
                  }}>
                    <td style={{ padding: 16 }}>
                      <code style={{ background: 'var(--surface-light)', padding: '4px 8px', borderRadius: 4 }}>
                        {call.from}
                      </code>
                    </td>
                    <td style={{ padding: 16 }}>
                      <code style={{ background: 'var(--surface-light)', padding: '4px 8px', borderRadius: 4 }}>
                        {call.to}
                      </code>
                    </td>
                    <td style={{ padding: 16 }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '4px 12px',
                        background: call.status === 'initiated' ? 'rgba(0,255,170,0.1)' : 'rgba(255,107,107,0.1)',
                        color: call.status === 'initiated' ? '#00ffaa' : '#ff6b6b',
                        borderRadius: 4,
                        fontSize: 12,
                        fontWeight: 600,
                      }}>
                        {call.status}
                      </span>
                    </td>
                    <td style={{ padding: 16, color: 'var(--text-muted)', fontSize: 14 }}>
                      {new Date(call.created_at).toLocaleString()}
                    </td>
                    <td style={{ padding: 16, textAlign: 'right' }}>
                      {call.status === 'initiated' && (
                        <button
                          onClick={() => handleHangup(call.sid)}
                          style={{
                            padding: '8px 16px',
                            background: '#ff6b6b',
                            color: 'white',
                            border: 'none',
                            borderRadius: 6,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            marginLeft: 'auto',
                            fontSize: 12,
                            fontWeight: 600,
                          }}
                        >
                          <PhoneOff size={14} />
                          End
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

function LoadingSpinner() {
  return (
    <div style={{
      width: '48px',
      height: '48px',
      borderRadius: '50%',
      border: '3px solid rgba(45,212,191,0.2)',
      borderTopColor: '#2dd4bf',
      margin: '0 auto',
      animation: 'spin 1s linear infinite',
    }} />
  )
}
