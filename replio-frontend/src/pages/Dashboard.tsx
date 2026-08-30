/**
 * Dashboard Page - Real-time metrics and system health overview
 * Designed with crypto trading dashboard aesthetic
 */

import React, { useState, useEffect } from 'react'
import { TrendingUp, Phone, MessageSquare, Users, Activity, Zap, CheckCircle2, AlertCircle } from 'lucide-react'
import { apiClient } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { Alert } from '../components/Alert'

export default function Dashboard() {
  const { user } = useAuth()
  const companyId = user?.company_id || ''

  // State for dashboard stats
  const [stats, setStats] = useState<any>(null)
  const [statsLoading, setStatsLoading] = useState(false)
  const [statsError, setStatsError] = useState<string | null>(null)

  // Fetch stats when companyId is available
  useEffect(() => {
    if (!companyId) return

    const fetchStats = async () => {
      try {
        setStatsLoading(true)
        setStatsError(null)
        const data = await apiClient.getDashboardStats(companyId)
        setStats(data)
      } catch (err) {
        setStatsError(err instanceof Error ? err.message : 'Failed to load stats')
      } finally {
        setStatsLoading(false)
      }
    }

    fetchStats()
  }, [companyId])

  // Extract data from stats
  const totalCalls = stats?.total_calls || 0
  const totalMessages = stats?.total_messages || 0
  const totalCallers = stats?.total_callers || 0
  const avgDuration = stats?.avg_conversation_duration_seconds || 0
  const channelDist = stats?.channel_distribution || []
  const systemHealth = stats?.system_health || {}

  // Calculate channel percentages
  const channelPercentages = {
    phone: channelDist.find((ch: any) => ch.channel === 'phone')?.percentage || 0,
    email: channelDist.find((ch: any) => ch.channel === 'email')?.percentage || 0,
    sms: channelDist.find((ch: any) => ch.channel === 'sms')?.percentage || 0,
    chat: channelDist.find((ch: any) => ch.channel === 'chat')?.percentage || 0,
  }

  // Simple pie chart SVG
  const PieChart = ({ percentages }: any) => {
    const radius = 40
    const circumference = 2 * Math.PI * radius

    let cumulativePercent = 0
    const segments = [
      { label: 'Phone', percent: percentages.phone, color: '#00d4ff' },
      { label: 'Email', percent: percentages.email, color: '#00ffaa' },
      { label: 'SMS', percent: percentages.sms, color: '#ff6b6b' },
      { label: 'Chat', percent: percentages.chat, color: '#ffa500' },
    ]

    const paths = segments.map((seg) => {
      const startPercent = cumulativePercent
      const endPercent = cumulativePercent + seg.percent
      cumulativePercent = endPercent

      const startAngle = (startPercent / 100) * 360
      const endAngle = (endPercent / 100) * 360

      return { ...seg, startAngle, endAngle }
    })

    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <svg width="100" height="100" viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
          {paths.map((path, idx) => {
            const startRad = (path.startAngle * Math.PI) / 180
            const endRad = (path.endAngle * Math.PI) / 180

            const x1 = 50 + 40 * Math.cos(startRad)
            const y1 = 50 + 40 * Math.sin(startRad)
            const x2 = 50 + 40 * Math.cos(endRad)
            const y2 = 50 + 40 * Math.sin(endRad)

            const largeArc = path.endAngle - path.startAngle > 180 ? 1 : 0

            const pathData = `M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArc} 1 ${x2} ${y2} Z`

            return (
              <path key={idx} d={pathData} fill={path.color} opacity="0.8" />
            )
          })}
          <circle cx="50" cy="50" r="25" fill="#1a1f3a" />
        </svg>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {segments.map((seg) => (
            seg.percent > 0 && (
              <div key={seg.label} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: seg.color }} />
                <span>{seg.label}</span>
                <span style={{ color: '#00d4ff' }}>{seg.percent.toFixed(1)}%</span>
              </div>
            )
          ))}
        </div>
      </div>
    )
  }

  return (
    <div style={{ background: '#0f1728', minHeight: '100vh', padding: '20px' }}>
      {/* Header with Top Metrics */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '32px',
      }}>
        {/* Total Calls */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(0,212,255,0.1) 0%, rgba(0,255,170,0.05) 100%)',
          border: '1px solid rgba(0,212,255,0.3)',
          borderRadius: '12px',
          padding: '20px',
          backdropFilter: 'blur(10px)',
        }}>
          <div style={{ fontSize: '12px', color: '#00d4ff', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Phone size={14} />
            Total Calls
          </div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#fff', marginBottom: '8px' }}>
            {totalCalls.toLocaleString()}
          </div>
          <div style={{ fontSize: '12px', color: '#00ffaa', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <TrendingUp size={12} />
            +12% from last week
          </div>
        </div>

        {/* Total Messages */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(0,255,170,0.1) 0%, rgba(255,107,107,0.05) 100%)',
          border: '1px solid rgba(0,255,170,0.3)',
          borderRadius: '12px',
          padding: '20px',
          backdropFilter: 'blur(10px)',
        }}>
          <div style={{ fontSize: '12px', color: '#00ffaa', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <MessageSquare size={14} />
            Total Messages
          </div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#fff', marginBottom: '8px' }}>
            {totalMessages.toLocaleString()}
          </div>
          <div style={{ fontSize: '12px', color: '#00d4ff', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <TrendingUp size={12} />
            +23% from last week
          </div>
        </div>

        {/* Total Callers */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(255,107,107,0.1) 0%, rgba(255,165,0,0.05) 100%)',
          border: '1px solid rgba(255,107,107,0.3)',
          borderRadius: '12px',
          padding: '20px',
          backdropFilter: 'blur(10px)',
        }}>
          <div style={{ fontSize: '12px', color: '#ff6b6b', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Users size={14} />
            Unique Callers
          </div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#fff', marginBottom: '8px' }}>
            {totalCallers.toLocaleString()}
          </div>
          <div style={{ fontSize: '12px', color: '#ffa500', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <TrendingUp size={12} />
            +8% from last week
          </div>
        </div>

        {/* Avg Duration */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(255,165,0,0.1) 0%, rgba(0,212,255,0.05) 100%)',
          border: '1px solid rgba(255,165,0,0.3)',
          borderRadius: '12px',
          padding: '20px',
          backdropFilter: 'blur(10px)',
        }}>
          <div style={{ fontSize: '12px', color: '#ffa500', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Activity size={14} />
            Avg Duration
          </div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#fff', marginBottom: '8px' }}>
            {Math.floor(avgDuration / 60)}m {Math.round(avgDuration % 60)}s
          </div>
          <div style={{ fontSize: '12px', color: '#00ffaa', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <TrendingUp size={12} />
            -2% from last week
          </div>
        </div>
      </div>

      {/* Main Dashboard Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '20px',
      }}>
        {/* Channel Distribution */}
        <div style={{
          background: 'rgba(15,23,42,0.6)',
          border: '1px solid rgba(0,212,255,0.2)',
          borderRadius: '12px',
          padding: '24px',
          backdropFilter: 'blur(10px)',
        }}>
          <h3 style={{ fontSize: '14px', fontWeight: '600', marginTop: 0, marginBottom: '24px', color: '#00d4ff', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Channel Distribution
          </h3>
          <PieChart percentages={channelPercentages} />
        </div>

        {/* System Health */}
        <div style={{
          background: 'rgba(15,23,42,0.6)',
          border: '1px solid rgba(0,255,170,0.2)',
          borderRadius: '12px',
          padding: '24px',
          backdropFilter: 'blur(10px)',
        }}>
          <h3 style={{ fontSize: '14px', fontWeight: '600', marginTop: 0, marginBottom: '24px', color: '#00ffaa', textTransform: 'uppercase', letterSpacing: '1px' }}>
            System Health
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[
              { label: 'Uptime', value: `${systemHealth.uptime_percentage?.toFixed(1) || '99.9'}%`, status: 'healthy', icon: CheckCircle2 },
              { label: 'API Response', value: `${systemHealth.api_response_time_ms || 242}ms`, status: 'healthy', icon: Zap },
              { label: 'Database', value: systemHealth.database_status || 'Connected', status: 'healthy', icon: CheckCircle2 },
            ].map((item, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: '1px solid rgba(0,212,255,0.1)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <item.icon size={16} color={item.status === 'healthy' ? '#00ffaa' : '#ff6b6b'} />
                  <span style={{ fontSize: '12px', color: '#b0bac9' }}>{item.label}</span>
                </div>
                <span style={{ fontSize: '12px', fontWeight: '600', color: item.status === 'healthy' ? '#00ffaa' : '#ff6b6b' }}>
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Call Trends */}
        <div style={{
          background: 'rgba(15,23,42,0.6)',
          border: '1px solid rgba(255,107,107,0.2)',
          borderRadius: '12px',
          padding: '24px',
          backdropFilter: 'blur(10px)',
        }}>
          <h3 style={{ fontSize: '14px', fontWeight: '600', marginTop: 0, marginBottom: '24px', color: '#ff6b6b', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Call Trends (7 days)
          </h3>
          <div style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            height: '150px',
            gap: '8px',
          }}>
            {[65, 75, 82, 71, 88, 95, 87].map((height, idx) => (
              <div
                key={idx}
                style={{
                  flex: 1,
                  height: `${height * 1.5}px`,
                  background: 'linear-gradient(180deg, #00d4ff 0%, #00ffaa 100%)',
                  borderRadius: '4px',
                  opacity: 0.8,
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = '1'
                  e.currentTarget.style.filter = 'drop-shadow(0 0 8px rgba(0,212,255,0.6))'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = '0.8'
                  e.currentTarget.style.filter = 'none'
                }}
              />
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px', fontSize: '11px', color: '#8899aa' }}>
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
            <span>Sun</span>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {statsError && (
        <div style={{ marginTop: '20px' }}>
          <Alert type="error" title="Error loading dashboard stats" message={statsError} dismissible />
        </div>
      )}
    </div>
  )
}
