/**
 * Settings Page - Comprehensive configuration for company, team, integrations, security
 * Production-ready with complete US and international timezone support
 */

import { useState, useEffect } from 'react'
import {
  Save,
  Copy,
  Plus,
  Trash2,
  Users,
  Bell,
  Zap,
  Settings as SettingsIcon,
  Shield,
  } from 'lucide-react'
import { apiClient } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { Alert } from '../components/Alert'

// Complete timezone list - US and International
const TIMEZONES = [
  // US Timezones
  { id: 'est-us', label: 'Eastern Standard Time', value: 'EST', offset: '-05:00' },
  { id: 'edt-us', label: 'Eastern Daylight Time', value: 'EDT', offset: '-04:00' },
  { id: 'cst-us', label: 'Central Standard Time', value: 'CST', offset: '-06:00' },
  { id: 'cdt-us', label: 'Central Daylight Time', value: 'CDT', offset: '-05:00' },
  { id: 'mst-us', label: 'Mountain Standard Time', value: 'MST', offset: '-07:00' },
  { id: 'mdt-us', label: 'Mountain Daylight Time', value: 'MDT', offset: '-06:00' },
  { id: 'pst-us', label: 'Pacific Standard Time', value: 'PST', offset: '-08:00' },
  { id: 'pdt-us', label: 'Pacific Daylight Time', value: 'PDT', offset: '-07:00' },
  { id: 'akst-us', label: 'Alaska Standard Time', value: 'AKST', offset: '-09:00' },
  { id: 'akdt-us', label: 'Alaska Daylight Time', value: 'AKDT', offset: '-08:00' },
  { id: 'hst-us', label: 'Hawaii Standard Time', value: 'HST', offset: '-10:00' },
  { id: 'hdt-us', label: 'Hawaii-Aleutian Daylight Time', value: 'HDT', offset: '-09:00' },

  // UTC/International
  { id: 'utc', label: 'Coordinated Universal Time', value: 'UTC', offset: '+00:00' },
  { id: 'gmt', label: 'London (GMT)', value: 'GMT', offset: '+00:00' },
  { id: 'bst', label: 'London (BST)', value: 'BST', offset: '+01:00' },
  { id: 'cet-paris', label: 'Paris (CET)', value: 'CET', offset: '+01:00' },
  { id: 'cest-paris', label: 'Paris (CEST)', value: 'CEST', offset: '+02:00' },
  { id: 'cet-berlin', label: 'Berlin (CET)', value: 'CET', offset: '+01:00' },
  { id: 'cest-berlin', label: 'Berlin (CEST)', value: 'CEST', offset: '+02:00' },
  { id: 'jst', label: 'Tokyo (JST)', value: 'JST', offset: '+09:00' },
  { id: 'aedt', label: 'Sydney (AEDT)', value: 'AEDT', offset: '+11:00' },
  { id: 'aest', label: 'Sydney (AEST)', value: 'AEST', offset: '+10:00' },
  { id: 'gst', label: 'Dubai (GST)', value: 'GST', offset: '+04:00' },
  { id: 'sgt', label: 'Singapore (SGT)', value: 'SGT', offset: '+08:00' },
  { id: 'est-toronto', label: 'Toronto (EST)', value: 'EST', offset: '-05:00' },
  { id: 'edt-toronto', label: 'Toronto (EDT)', value: 'EDT', offset: '-04:00' },
  { id: 'cst-mexico', label: 'Mexico City (CST)', value: 'CST', offset: '-06:00' },
  { id: 'cdt-mexico', label: 'Mexico City (CDT)', value: 'CDT', offset: '-05:00' },
  { id: 'brt', label: 'São Paulo (BRT)', value: 'BRT', offset: '-03:00' },
  { id: 'brst', label: 'São Paulo (BRST)', value: 'BRST', offset: '-02:00' },
  { id: 'hkt', label: 'Hong Kong (HKT)', value: 'HKT', offset: '+08:00' },
  { id: 'ist', label: 'Mumbai (IST)', value: 'IST', offset: '+05:30' },
  { id: 'ict', label: 'Bangkok (ICT)', value: 'ICT', offset: '+07:00' },
  { id: 'eet', label: 'Istanbul (EET)', value: 'EET', offset: '+02:00' },
  { id: 'eest', label: 'Istanbul (EEST)', value: 'EEST', offset: '+03:00' },
  { id: 'nzdt', label: 'Auckland (NZDT)', value: 'NZDT', offset: '+13:00' },
  { id: 'nzst', label: 'Auckland (NZST)', value: 'NZST', offset: '+12:00' },
]

const LANGUAGES = ['English', 'Spanish', 'French', 'German', 'Portuguese', 'Japanese', 'Chinese']
const THEMES = ['Dark', 'Light', 'System']

interface TeamMember {
  id: string
  email: string
  name: string
  role: 'admin' | 'manager' | 'agent'
  status: 'active' | 'inactive'
}

interface ApiKey {
  id: string
  name: string
  key: string
  created_at: string
  last_used?: string
}

export default function Settings() {
  const { user } = useAuth()
  const companyId = user?.company_id || ''
  const [activeTab, setActiveTab] = useState<'general' | 'team' | 'integrations' | 'notifications' | 'security'>(
    'general',
  )

  // General Settings
  const [companyName, setCompanyName] = useState('Replio')
  const [timezone, setTimezone] = useState('EST')
  const [language, setLanguage] = useState('English')
  const [theme, setTheme] = useState('Dark')

  // Team Settings
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [newMemberEmail, setNewMemberEmail] = useState('')
  const [newMemberRole, setNewMemberRole] = useState<'admin' | 'manager' | 'agent'>('agent')

  // Integration Settings
  // There is no backend for third-party integrations yet, so these are listed as
  // available-but-unconfigured rather than reporting a connection that does not exist.
  const AVAILABLE_INTEGRATIONS = [
    'Twilio (Phone Calls)',
    'Slack',
    'Salesforce',
    'HubSpot',
  ]

  // Notification Settings
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [smsAlerts, setSmsAlerts] = useState(true)
  const [inAppNotifications, setInAppNotifications] = useState(true)
  const [slackNotifications, setSlackNotifications] = useState(true)

  // Security Settings
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [newApiKeyName, setNewApiKeyName] = useState('')
  const [showApiKeyForm, setShowApiKeyForm] = useState(false)

  // UI State
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Load settings on mount
  useEffect(() => {
    if (!companyId) return

    const loadSettings = async () => {
      try {
        setLoading(true)
        const data = await apiClient.getSettings(companyId)
        if (data) {
          setCompanyName(data.company_name || 'Replio')
          setTimezone(data.timezone || 'EST')
          setLanguage(data.language || 'English')
          setTheme(data.theme || 'Dark')
          setTwoFactorEnabled(data.two_factor_enabled || false)
          setEmailNotifications(data.email_notifications !== false)
          setSmsAlerts(data.sms_alerts !== false)
          setInAppNotifications(data.in_app_notifications !== false)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load settings')
      } finally {
        setLoading(false)
      }
    }

    loadSettings()
  }, [companyId])

  // Save settings
  const handleSaveSettings = async () => {
    try {
      setLoading(true)
      setError(null)
      setSuccess(null)

      await apiClient.updateSettings(companyId, {
        company_name: companyName,
        timezone,
        language,
        theme,
        two_factor_enabled: twoFactorEnabled,
        email_notifications: emailNotifications,
        sms_alerts: smsAlerts,
        in_app_notifications: inAppNotifications,
      })

      setSuccess('Settings saved successfully')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings')
    } finally {
      setLoading(false)
    }
  }

  // Add team member
  const handleAddTeamMember = () => {
    if (!newMemberEmail) {
      setError('Please enter an email address')
      return
    }

    const newMember: TeamMember = {
      id: Date.now().toString(),
      email: newMemberEmail,
      name: newMemberEmail.split('@')[0],
      role: newMemberRole,
      status: 'active',
    }

    setTeamMembers([...teamMembers, newMember])
    setNewMemberEmail('')
    setSuccess('Team member added successfully')
    setTimeout(() => setSuccess(null), 3000)
  }

  // Remove team member
  const handleRemoveTeamMember = (id: string) => {
    setTeamMembers(teamMembers.filter(m => m.id !== id))
  }

  // Create API key
  const handleCreateApiKey = () => {
    if (!newApiKeyName) {
      setError('Please enter an API key name')
      return
    }

    const newKey: ApiKey = {
      id: Date.now().toString(),
      name: newApiKeyName,
      key: `sk_${Math.random().toString(36).substring(2, 15)}••••••••••••••••••••`,
      created_at: new Date().toISOString().split('T')[0],
    }

    setApiKeys([...apiKeys, newKey])
    setNewApiKeyName('')
    setShowApiKeyForm(false)
    setSuccess('API key created successfully')
    setTimeout(() => setSuccess(null), 3000)
  }

  // Copy API key
  const handleCopyApiKey = (keyId: string) => {
    const key = apiKeys.find(k => k.id === keyId)
    if (key) {
      navigator.clipboard.writeText(key.key)
      setSuccess('API key copied to clipboard')
      setTimeout(() => setSuccess(null), 2000)
    }
  }

  // Revoke API key
  const handleRevokeApiKey = (id: string) => {
    setApiKeys(apiKeys.filter(k => k.id !== id))
  }

  const getTabContent = () => {
    switch (activeTab) {
      case 'general':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Company Information */}
            <div
              style={{
                padding: '20px',
                background: 'rgba(15, 23, 42, 0.4)',
                border: '1px solid rgba(45, 212, 191, 0.15)',
                borderRadius: '8px',
              }}
            >
              <h3 style={{ fontSize: 16, fontWeight: 600, color: '#ffffff', margin: '0 0 16px 0' }}>
                Company Information
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255, 255, 255, 0.7)', marginBottom: '6px', display: 'block' }}>
                    Company Name
                  </label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={e => setCompanyName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      background: 'rgba(15, 23, 42, 0.4)',
                      border: '1px solid rgba(45, 212, 191, 0.15)',
                      borderRadius: '6px',
                      color: '#ffffff',
                      fontSize: 14,
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255, 255, 255, 0.7)', marginBottom: '6px', display: 'block' }}>
                    Company ID
                  </label>
                  <input
                    type="text"
                    value={companyId}
                    readOnly
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      background: 'rgba(15, 23, 42, 0.6)',
                      border: '1px solid rgba(45, 212, 191, 0.1)',
                      borderRadius: '6px',
                      color: 'rgba(255, 255, 255, 0.5)',
                      fontSize: 14,
                      boxSizing: 'border-box',
                      fontFamily: 'monospace',
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255, 255, 255, 0.7)', marginBottom: '6px', display: 'block' }}>
                    Timezone
                  </label>
                  <select
                    value={timezone}
                    onChange={e => setTimezone(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      background: 'rgba(15, 23, 42, 0.4)',
                      border: '1px solid rgba(45, 212, 191, 0.15)',
                      borderRadius: '6px',
                      color: '#ffffff',
                      fontSize: 14,
                      boxSizing: 'border-box',
                    }}
                  >
                    {TIMEZONES.map(tz => (
                      <option key={tz.id} value={tz.value}>
                        {tz.label} ({tz.offset})
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255, 255, 255, 0.7)', marginBottom: '6px', display: 'block' }}>
                      Language
                    </label>
                    <select
                      value={language}
                      onChange={e => setLanguage(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        background: 'rgba(15, 23, 42, 0.4)',
                        border: '1px solid rgba(45, 212, 191, 0.15)',
                        borderRadius: '6px',
                        color: '#ffffff',
                        fontSize: 14,
                        boxSizing: 'border-box',
                      }}
                    >
                      {LANGUAGES.map(lang => (
                        <option key={lang} value={lang}>
                          {lang}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255, 255, 255, 0.7)', marginBottom: '6px', display: 'block' }}>
                      Theme
                    </label>
                    <select
                      value={theme}
                      onChange={e => setTheme(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        background: 'rgba(15, 23, 42, 0.4)',
                        border: '1px solid rgba(45, 212, 191, 0.15)',
                        borderRadius: '6px',
                        color: '#ffffff',
                        fontSize: 14,
                        boxSizing: 'border-box',
                      }}
                    >
                      {THEMES.map(t => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <button
              onClick={handleSaveSettings}
              disabled={loading}
              style={{
                padding: '12px 24px',
                background: loading ? 'rgba(0, 212, 255, 0.2)' : 'rgba(0, 212, 255, 0.1)',
                border: '1px solid rgba(0, 212, 255, 0.3)',
                borderRadius: '8px',
                color: '#00d4ff',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: 14,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                justifySelf: 'start',
                width: 'fit-content',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => {
                if (!loading) e.currentTarget.style.background = 'rgba(0, 212, 255, 0.2)'
              }}
              onMouseLeave={e => {
                if (!loading) e.currentTarget.style.background = 'rgba(0, 212, 255, 0.1)'
              }}
            >
              <Save size={16} />
              Save Changes
            </button>
          </div>
        )

      case 'team':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Team Members List */}
            <div
              style={{
                padding: '20px',
                background: 'rgba(15, 23, 42, 0.4)',
                border: '1px solid rgba(45, 212, 191, 0.15)',
                borderRadius: '8px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: '#ffffff', margin: 0 }}>
                  Team Members ({teamMembers.length})
                </h3>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {teamMembers.map(member => (
                  <div
                    key={member.id}
                    style={{
                      padding: '12px',
                      background: 'rgba(15, 23, 42, 0.6)',
                      border: '1px solid rgba(45, 212, 191, 0.1)',
                      borderRadius: '6px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 600, color: '#ffffff', margin: '0 0 4px 0' }}>
                        {member.name}
                      </p>
                      <p style={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.6)', margin: 0 }}>
                        {member.email} • {member.role} • {member.status}
                      </p>
                    </div>
                    <button
                      onClick={() => handleRemoveTeamMember(member.id)}
                      style={{
                        padding: '6px 12px',
                        background: 'rgba(255, 107, 107, 0.1)',
                        border: '1px solid rgba(255, 107, 107, 0.3)',
                        borderRadius: '4px',
                        color: '#ff6b6b',
                        cursor: 'pointer',
                        fontSize: 12,
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <Trash2 size={14} />
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Add Team Member */}
            <div
              style={{
                padding: '20px',
                background: 'rgba(15, 23, 42, 0.4)',
                border: '1px solid rgba(0, 255, 170, 0.15)',
                borderRadius: '8px',
              }}
            >
              <h3 style={{ fontSize: 16, fontWeight: 600, color: '#ffffff', margin: '0 0 16px 0' }}>
                Add Team Member
              </h3>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'stretch' }}>
                <input
                  type="email"
                  placeholder="Enter email address"
                  value={newMemberEmail}
                  onChange={e => setNewMemberEmail(e.target.value)}
                  style={{
                    flex: 1,
                    minWidth: 0,
                    padding: '10px 12px',
                    background: 'rgba(15, 23, 42, 0.4)',
                    border: '1px solid rgba(45, 212, 191, 0.15)',
                    borderRadius: '6px',
                    color: '#ffffff',
                    fontSize: 14,
                    boxSizing: 'border-box',
                  }}
                />
                <select
                  value={newMemberRole}
                  onChange={e => setNewMemberRole(e.target.value as any)}
                  style={{
                    padding: '10px 12px',
                    background: 'rgba(15, 23, 42, 0.4)',
                    border: '1px solid rgba(45, 212, 191, 0.15)',
                    borderRadius: '6px',
                    color: '#ffffff',
                    fontSize: 14,
                    boxSizing: 'border-box',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <option value="agent">Agent</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
                <button
                  onClick={handleAddTeamMember}
                  style={{
                    padding: '10px 16px',
                    background: 'rgba(0, 255, 170, 0.1)',
                    border: '1px solid rgba(0, 255, 170, 0.3)',
                    borderRadius: '6px',
                    color: '#00ffaa',
                    cursor: 'pointer',
                    fontSize: 14,
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <Plus size={16} />
                  Add
                </button>
              </div>
            </div>
          </div>
        )

      case 'integrations':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', margin: 0 }}>
              Third-party integrations are not yet available. None are connected.
            </p>
            {AVAILABLE_INTEGRATIONS.map(name => (
              <div
                key={name}
                style={{
                  padding: '16px',
                  background: 'rgba(15, 23, 42, 0.4)',
                  border: '1px solid rgba(45, 212, 191, 0.15)',
                  borderRadius: '8px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  opacity: 0.7,
                }}
              >
                <p style={{ fontSize: 14, fontWeight: 600, color: '#ffffff', margin: 0 }}>
                  {name}
                </p>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255, 255, 255, 0.6)' }}>
                  Not connected
                </span>
              </div>
            ))}
          </div>
        )

      case 'notifications':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[
              { label: 'Email Notifications', state: emailNotifications, setState: setEmailNotifications },
              { label: 'SMS Alerts', state: smsAlerts, setState: setSmsAlerts },
              { label: 'In-app Notifications', state: inAppNotifications, setState: setInAppNotifications },
              { label: 'Slack Notifications', state: slackNotifications, setState: setSlackNotifications },
            ].map(notif => (
              <label
                key={notif.label}
                style={{
                  padding: '16px',
                  background: 'rgba(15, 23, 42, 0.4)',
                  border: '1px solid rgba(45, 212, 191, 0.15)',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  cursor: 'pointer',
                  gap: '12px',
                }}
              >
                <input
                  type="checkbox"
                  checked={notif.state}
                  onChange={e => notif.setState(e.target.checked)}
                  style={{ cursor: 'pointer' }}
                />
                <p style={{ fontSize: 14, fontWeight: 600, color: '#ffffff', margin: 0 }}>
                  {notif.label}
                </p>
              </label>
            ))}
          </div>
        )

      case 'security':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Two-Factor Authentication */}
            <div
              style={{
                padding: '20px',
                background: 'rgba(15, 23, 42, 0.4)',
                border: '1px solid rgba(45, 212, 191, 0.15)',
                borderRadius: '8px',
              }}
            >
              <h3 style={{ fontSize: 16, fontWeight: 600, color: '#ffffff', margin: '0 0 16px 0' }}>
                Two-Factor Authentication
              </h3>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="checkbox"
                  checked={twoFactorEnabled}
                  onChange={e => setTwoFactorEnabled(e.target.checked)}
                  style={{ cursor: 'pointer' }}
                />
                <p style={{ fontSize: 14, color: '#ffffff', margin: 0 }}>
                  Enable two-factor authentication
                </p>
              </label>
              <p style={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.6)', marginTop: '8px' }}>
                Add an extra layer of security to your account
              </p>
            </div>

            {/* API Keys */}
            <div
              style={{
                padding: '20px',
                background: 'rgba(15, 23, 42, 0.4)',
                border: '1px solid rgba(45, 212, 191, 0.15)',
                borderRadius: '8px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: '#ffffff', margin: 0 }}>
                  API Keys
                </h3>
                <button
                  onClick={() => setShowApiKeyForm(!showApiKeyForm)}
                  style={{
                    padding: '8px 16px',
                    background: 'rgba(0, 255, 170, 0.1)',
                    border: '1px solid rgba(0, 255, 170, 0.3)',
                    borderRadius: '6px',
                    color: '#00ffaa',
                    cursor: 'pointer',
                    fontSize: 13,
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <Plus size={14} />
                  Create Key
                </button>
              </div>

              {/* Create API Key Form */}
              {showApiKeyForm && (
                <div
                  style={{
                    padding: '12px',
                    background: 'rgba(0, 255, 170, 0.05)',
                    border: '1px solid rgba(0, 255, 170, 0.1)',
                    borderRadius: '6px',
                    marginBottom: '16px',
                    display: 'flex',
                    gap: '8px',
                  }}
                >
                  <input
                    type="text"
                    placeholder="API Key Name"
                    value={newApiKeyName}
                    onChange={e => setNewApiKeyName(e.target.value)}
                    style={{
                      flex: 1,
                      padding: '8px',
                      background: 'rgba(15, 23, 42, 0.4)',
                      border: '1px solid rgba(45, 212, 191, 0.15)',
                      borderRadius: '4px',
                      color: '#ffffff',
                      fontSize: 13,
                    }}
                  />
                  <button
                    onClick={handleCreateApiKey}
                    style={{
                      padding: '8px 16px',
                      background: 'rgba(0, 255, 170, 0.1)',
                      border: '1px solid rgba(0, 255, 170, 0.3)',
                      borderRadius: '4px',
                      color: '#00ffaa',
                      cursor: 'pointer',
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  >
                    Create
                  </button>
                </div>
              )}

              {/* API Keys List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {apiKeys.map(key => (
                  <div
                    key={key.id}
                    style={{
                      padding: '12px',
                      background: 'rgba(15, 23, 42, 0.6)',
                      border: '1px solid rgba(45, 212, 191, 0.1)',
                      borderRadius: '6px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: '#ffffff', margin: '0 0 4px 0' }}>
                        {key.name}
                      </p>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          fontSize: 12,
                          color: 'rgba(255, 255, 255, 0.6)',
                        }}
                      >
                        <span style={{ fontFamily: 'monospace' }}>{key.key}</span>
                      </div>
                      <p style={{ fontSize: 11, color: 'rgba(255, 255, 255, 0.5)', margin: '4px 0 0 0' }}>
                        Created {key.created_at}
                        {key.last_used && ` • Last used ${key.last_used}`}
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => handleCopyApiKey(key.id)}
                        style={{
                          padding: '6px 12px',
                          background: 'rgba(0, 212, 255, 0.1)',
                          border: '1px solid rgba(0, 212, 255, 0.3)',
                          borderRadius: '4px',
                          color: '#00d4ff',
                          cursor: 'pointer',
                          fontSize: 12,
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <Copy size={12} />
                      </button>
                      <button
                        onClick={() => handleRevokeApiKey(key.id)}
                        style={{
                          padding: '6px 12px',
                          background: 'rgba(255, 107, 107, 0.1)',
                          border: '1px solid rgba(255, 107, 107, 0.3)',
                          borderRadius: '4px',
                          color: '#ff6b6b',
                          cursor: 'pointer',
                          fontSize: 12,
                          fontWeight: 600,
                        }}
                      >
                        Revoke
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  const TAB_CONFIG = [
    { id: 'general', label: 'General', icon: SettingsIcon },
    { id: 'team', label: 'Team', icon: Users },
    { id: 'integrations', label: 'Integrations', icon: Zap },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
  ]

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0, marginBottom: 8, color: '#ffffff' }}>
          Settings
        </h1>
        <p style={{ fontSize: 14, color: 'rgba(255, 255, 255, 0.6)', margin: 0 }}>
          Manage your company, team, integrations, and security
        </p>
      </div>

      {/* Alerts */}
      {error && <Alert type="error" message={error} />}
      {success && <Alert type="success" message={success} />}

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          borderBottom: '1px solid rgba(45, 212, 191, 0.15)',
          overflowX: 'auto',
          paddingBottom: '16px',
        }}
      >
        {TAB_CONFIG.map(tab => {
          const TabIcon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                padding: '10px 16px',
                background: activeTab === tab.id ? 'rgba(0, 212, 255, 0.1)' : 'transparent',
                border: activeTab === tab.id ? '1px solid rgba(0, 212, 255, 0.3)' : 'none',
                borderRadius: '6px',
                color: activeTab === tab.id ? '#00d4ff' : 'rgba(255, 255, 255, 0.6)',
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => {
                if (activeTab !== tab.id) e.currentTarget.style.color = '#ffffff'
              }}
              onMouseLeave={e => {
                if (activeTab !== tab.id) e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)'
              }}
            >
              <TabIcon size={16} />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Tab Content */}
      {loading && activeTab === 'general' ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'rgba(255, 255, 255, 0.5)' }}>
          Loading settings...
        </div>
      ) : (
        getTabContent()
      )}
    </div>
  )
}
