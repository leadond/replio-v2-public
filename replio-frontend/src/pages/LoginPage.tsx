import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { Phone } from 'lucide-react'

export default function LoginPage() {
  const { login } = useAuth()
  const [isRegister, setIsRegister] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [companyId, setCompanyId] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setSubmitting(true)
    try {
      await login(email, password)
    } catch {
      setError('Invalid email or password')
    } finally {
      setSubmitting(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch('/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          full_name: fullName,
          company_name: companyName,
          company_id: companyId || undefined,
        }),
      })

      if (response.ok) {
        await login(email, password)
      } else {
        const data = await response.json()
        setError(data.detail || 'Registration failed')
      }
    } catch {
      setError('Registration error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    }}>
      <div style={{
        background: 'white',
        borderRadius: '12px',
        boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
        width: '100%',
        maxWidth: 420,
        padding: '40px',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Phone size={48} color="#667eea" style={{ marginBottom: 16 }} />
          <h1 style={{ fontSize: 28, fontWeight: 'bold', margin: '0 0 8px 0' }}>Replio v2</h1>
          <p style={{ color: '#666', fontSize: 14, margin: 0 }}>AI Auto-Attendant Platform</p>
        </div>

        {success && (
          <div style={{
            background: '#d4edda',
            color: '#155724',
            padding: '12px',
            borderRadius: '6px',
            marginBottom: 16,
            fontSize: 14,
          }}>
            ✅ {success}
          </div>
        )}

        {error && (
          <div style={{
            background: '#f8d7da',
            color: '#721c24',
            padding: '12px',
            borderRadius: '6px',
            marginBottom: 16,
            fontSize: 14,
          }}>
            ❌ {error}
          </div>
        )}

        <form onSubmit={isRegister ? handleRegister : handleLogin}>
          {isRegister && (
            <>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: '600', marginBottom: 6 }}>Full Name</label>
                <input
                  type="text"
                  placeholder="John Doe"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: 14,
                    boxSizing: 'border-box',
                  }}
                />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: '600', marginBottom: 6 }}>Company Name</label>
                <input
                  type="text"
                  placeholder="Your Company Inc"
                  value={companyName}
                  onChange={e => setCompanyName(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: 14,
                    boxSizing: 'border-box',
                  }}
                />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: '600', marginBottom: 6 }}>Company ID (Optional)</label>
                <input
                  type="text"
                  placeholder="company-123"
                  value={companyId}
                  onChange={e => setCompanyId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: 14,
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </>
          )}

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: '600', marginBottom: 6 }}>Email</label>
            <input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: 14,
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ marginBottom: isRegister ? 16 : 24 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: '600', marginBottom: 6 }}>Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: 14,
                boxSizing: 'border-box',
              }}
            />
          </div>

          {isRegister && (
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: '600', marginBottom: 6 }}>Confirm Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: 14,
                  boxSizing: 'border-box',
                }}
              />
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            style={{
              width: '100%',
              padding: '12px',
              background: submitting ? '#ccc' : '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: 16,
              fontWeight: '600',
              cursor: submitting ? 'not-allowed' : 'pointer',
              transition: 'background 0.2s',
            }}
          >
            {submitting ? (isRegister ? 'Creating Account...' : 'Signing In...') : (isRegister ? 'Create Account' : 'Sign In')}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 20, paddingTop: 20, borderTop: '1px solid #eee' }}>
          <p style={{ margin: '0 0 12px 0', fontSize: 14, color: '#666' }}>
            {isRegister ? 'Already have an account?' : "Don't have an account?"}
          </p>
          <button
            onClick={() => {
              setIsRegister(!isRegister)
              setError('')
              setSuccess('')
            }}
            style={{
              background: 'none',
              border: 'none',
              color: '#667eea',
              fontSize: 14,
              fontWeight: '600',
              cursor: 'pointer',
              textDecoration: 'underline',
            }}
          >
            {isRegister ? 'Sign In Here' : 'Create an Account'}
          </button>
        </div>

        <div style={{
          background: '#f0f4ff',
          padding: '16px',
          borderRadius: '6px',
          marginTop: 24,
          fontSize: 12,
          color: '#666',
        }}>
          <p style={{ margin: '0 0 8px 0', fontWeight: '600' }}>Demo Credentials:</p>
          <p style={{ margin: '4px 0' }}>📧 Email: <code style={{ background: '#fff', padding: '2px 6px', borderRadius: '3px' }}>demo@replio.io</code></p>
          <p style={{ margin: '4px 0' }}>🔐 Password: <code style={{ background: '#fff', padding: '2px 6px', borderRadius: '3px' }}>Demo123!</code></p>
        </div>
      </div>
    </div>
  )
}
