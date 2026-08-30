/**
 * Dashboard Page - Real-time metrics and system health overview
 *
 * Every figure on this page comes from the API. Where the backend cannot derive
 * a value from real data (e.g. a week-over-week change with no prior week to
 * compare against) it returns null and we render an explanation rather than a
 * placeholder number.
 */

import { useState, useEffect } from 'react'
import {
  TrendingUp, TrendingDown, Phone, MessageSquare, Users, Activity,
  CheckCircle2, XCircle, HelpCircle,
} from 'lucide-react'
import { apiClient } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { Alert } from '../components/Alert'

interface DeltaSet {
  calls_pct: number | null
  messages_pct: number | null
  callers_pct: number | null
  avg_duration_pct: number | null
  period_days: number
}

interface TrendPoint {
  date: string
  label: string
  count: number
}

interface SystemHealth {
  database_status?: string
  db_latency_ms?: number | null
  uptime_seconds?: number
}

interface ChannelSlice {
  channel: string
  count: number
  percentage: number
}

interface DashboardStats {
  total_calls: number
  total_messages: number
  total_callers: number
  avg_conversation_duration_seconds: number
  channel_distribution: ChannelSlice[]
  deltas?: DeltaSet
  daily_trend?: TrendPoint[]
  system_health?: SystemHealth
}

const CHANNEL_COLORS: Record<string, string> = {
  phone: '#00d4ff',
  email: '#00ffaa',
  sms: '#ff6b6b',
  chat: '#ffa500',
  other: '#8899aa',
}

function formatUptime(seconds?: number): string {
  if (seconds === undefined || seconds === null) return 'Unknown'
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ${minutes % 60}m`
  return `${Math.floor(hours / 24)}d ${hours % 24}h`
}

/** Renders a real percentage change, or says why there isn't one. */
function Delta({ value, periodDays }: { value: number | null | undefined; periodDays: number }) {
  if (value === null || value === undefined) {
    return (
      <div style={{ fontSize: '12px', color: '#6b7a8f' }}>
        No prior {periodDays}-day data to compare
      </div>
    )
  }
  const positive = value >= 0
  const Icon = positive ? TrendingUp : TrendingDown
  return (
    <div style={{ fontSize: '12px', color: positive ? '#00ffaa' : '#ff6b6b', display: 'flex', alignItems: 'center', gap: '4px' }}>
      <Icon size={12} />
      {positive ? '+' : ''}{value}% vs previous {periodDays} days
    </div>
  )
}

function PieChart({ slices }: { slices: ChannelSlice[] }) {
  if (slices.length === 0) {
    return (
      <div style={{ color: '#6b7a8f', fontSize: '13px', padding: '24px 0' }}>
        No messages recorded yet
      </div>
    )
  }

  let cumulative = 0
  const paths = slices.map((slice) => {
    const start = cumulative
    cumulative += slice.percentage
    return {
      ...slice,
      color: CHANNEL_COLORS[slice.channel] ?? CHANNEL_COLORS.other,
      startAngle: (start / 100) * 360,
      endAngle: (cumulative / 100) * 360,
    }
  })

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
      <svg width="100" height="100" viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
        {paths.map((p) => {
          // A lone channel at 100% can't be expressed as an arc - draw a full circle.
          if (p.percentage >= 99.99) {
            return <circle key={p.channel} cx="50" cy="50" r="40" fill={p.color} opacity="0.8" />
          }
          const startRad = (p.startAngle * Math.PI) / 180
          const endRad = (p.endAngle * Math.PI) / 180
          const x1 = 50 + 40 * Math.cos(startRad)
          const y1 = 50 + 40 * Math.sin(startRad)
          const x2 = 50 + 40 * Math.cos(endRad)
          const y2 = 50 + 40 * Math.sin(endRad)
          const largeArc = p.endAngle - p.startAngle > 180 ? 1 : 0
          return (
            <path
              key={p.channel}
              d={`M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArc} 1 ${x2} ${y2} Z`}
              fill={p.color}
              opacity="0.8"
            />
          )
        })}
        <circle cx="50" cy="50" r="25" fill="#1a1f3a" />
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {paths.map((slice) => (
          <div key={slice.channel} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: slice.color }} />
            <span style={{ textTransform: 'capitalize' }}>{slice.channel}</span>
            <span style={{ color: '#00d4ff' }}>{slice.percentage}%</span>
            <span style={{ color: '#6b7a8f' }}>({slice.count})</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const companyId = user?.company_id || ''

  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [statsLoading, setStatsLoading] = useState(false)
  const [statsError, setStatsError] = useState<string | null>(null)

  useEffect(() => {
    if (!companyId) return

    const fetchStats = async () => {
      try {
        setStatsLoading(true)
        setStatsError(null)
        const data = await apiClient.getDashboardStats(companyId)
        setStats(data as DashboardStats)
      } catch (err) {
        setStatsError(err instanceof Error ? err.message : 'Failed to load stats')
      } finally {
        setStatsLoading(false)
      }
    }

    fetchStats()
  }, [companyId])

  const totalCalls = stats?.total_calls ?? 0
  const totalMessages = stats?.total_messages ?? 0
  const totalCallers = stats?.total_callers ?? 0
  const avgDuration = stats?.avg_conversation_duration_seconds ?? 0
  const channelDist = stats?.channel_distribution ?? []
  const health = stats?.system_health ?? {}
  const trend = stats?.daily_trend ?? []
  const deltas = stats?.deltas
  const periodDays = deltas?.period_days ?? 7

  const healthRows = [
    {
      label: 'Database',
      value: health.database_status ?? 'Unknown',
      known: health.database_status !== undefined,
      ok: health.database_status === 'connected',
    },
    {
      label: 'DB latency',
      value: health.db_latency_ms != null ? `${health.db_latency_ms}ms` : 'Unknown',
      known: health.db_latency_ms != null,
      ok: health.db_latency_ms != null,
    },
    {
      label: 'API uptime',
      value: formatUptime(health.uptime_seconds),
      known: health.uptime_seconds !== undefined,
      ok: health.uptime_seconds !== undefined,
    },
  ]

  const maxTrend = Math.max(0, ...trend.map(t => t.count))
  const hasTrendData = trend.some(t => t.count > 0)

  const cards = [
    {
      key: 'calls',
      label: 'Total Calls',
      icon: Phone,
      accent: '#00d4ff',
      value: totalCalls.toLocaleString(),
      delta: deltas?.calls_pct,
      gradient: 'linear-gradient(135deg, rgba(0,212,255,0.1) 0%, rgba(0,255,170,0.05) 100%)',
      border: 'rgba(0,212,255,0.3)',
    },
    {
      key: 'messages',
      label: 'Total Messages',
      icon: MessageSquare,
      accent: '#00ffaa',
      value: totalMessages.toLocaleString(),
      delta: deltas?.messages_pct,
      gradient: 'linear-gradient(135deg, rgba(0,255,170,0.1) 0%, rgba(255,107,107,0.05) 100%)',
      border: 'rgba(0,255,170,0.3)',
    },
    {
      key: 'callers',
      label: 'Unique Callers',
      icon: Users,
      accent: '#ff6b6b',
      value: totalCallers.toLocaleString(),
      delta: deltas?.callers_pct,
      gradient: 'linear-gradient(135deg, rgba(255,107,107,0.1) 0%, rgba(255,165,0,0.05) 100%)',
      border: 'rgba(255,107,107,0.3)',
    },
    {
      key: 'duration',
      label: 'Avg Duration',
      icon: Activity,
      accent: '#ffa500',
      value: `${Math.floor(avgDuration / 60)}m ${Math.round(avgDuration % 60)}s`,
      delta: deltas?.avg_duration_pct,
      gradient: 'linear-gradient(135deg, rgba(255,165,0,0.1) 0%, rgba(0,212,255,0.05) 100%)',
      border: 'rgba(255,165,0,0.3)',
    },
  ]

  return (
    <div style={{ background: '#0f1728', minHeight: '100vh', padding: '20px' }}>
      {statsLoading && !stats && (
        <div style={{ color: '#6b7a8f', fontSize: '13px', marginBottom: '16px' }}>
          Loading dashboard&hellip;
        </div>
      )}

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '32px',
      }}>
        {cards.map(card => (
          <div key={card.key} style={{
            background: card.gradient,
            border: `1px solid ${card.border}`,
            borderRadius: '12px',
            padding: '20px',
            backdropFilter: 'blur(10px)',
          }}>
            <div style={{ fontSize: '12px', color: card.accent, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <card.icon size={14} />
              {card.label}
            </div>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#fff', marginBottom: '8px' }}>
              {card.value}
            </div>
            <Delta value={card.delta} periodDays={periodDays} />
          </div>
        ))}
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '20px',
      }}>
        <div style={{
          background: 'rgba(15,23,42,0.6)',
          border: '1px solid rgba(0,212,255,0.2)',
          borderRadius: '12px',
          padding: '24px',
          backdropFilter: 'blur(10px)',
        }}>
          <h3 style={{ fontSize: '14px', fontWeight: 600, marginTop: 0, marginBottom: '24px', color: '#00d4ff', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Channel Distribution
          </h3>
          <PieChart slices={channelDist} />
        </div>

        <div style={{
          background: 'rgba(15,23,42,0.6)',
          border: '1px solid rgba(0,255,170,0.2)',
          borderRadius: '12px',
          padding: '24px',
          backdropFilter: 'blur(10px)',
        }}>
          <h3 style={{ fontSize: '14px', fontWeight: 600, marginTop: 0, marginBottom: '24px', color: '#00ffaa', textTransform: 'uppercase', letterSpacing: '1px' }}>
            System Health
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {healthRows.map((row) => {
              const Icon = !row.known ? HelpCircle : row.ok ? CheckCircle2 : XCircle
              const color = !row.known ? '#6b7a8f' : row.ok ? '#00ffaa' : '#ff6b6b'
              return (
                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: '1px solid rgba(0,212,255,0.1)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Icon size={16} color={color} />
                    <span style={{ fontSize: '12px', color: '#b0bac9' }}>{row.label}</span>
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: 600, color, textTransform: 'capitalize' }}>
                    {row.value}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        <div style={{
          background: 'rgba(15,23,42,0.6)',
          border: '1px solid rgba(255,107,107,0.2)',
          borderRadius: '12px',
          padding: '24px',
          backdropFilter: 'blur(10px)',
        }}>
          <h3 style={{ fontSize: '14px', fontWeight: 600, marginTop: 0, marginBottom: '24px', color: '#ff6b6b', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Call Trends ({periodDays} days)
          </h3>

          {!hasTrendData ? (
            <div style={{ color: '#6b7a8f', fontSize: '13px', height: '150px', display: 'flex', alignItems: 'center' }}>
              No calls recorded in the last {periodDays} days
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '150px', gap: '8px' }}>
              {trend.map((point) => (
                <div
                  key={point.date}
                  title={`${point.date}: ${point.count} call${point.count === 1 ? '' : 's'}`}
                  style={{
                    flex: 1,
                    height: `${maxTrend > 0 ? Math.max((point.count / maxTrend) * 150, point.count > 0 ? 4 : 1) : 1}px`,
                    background: point.count > 0
                      ? 'linear-gradient(180deg, #00d4ff 0%, #00ffaa 100%)'
                      : 'rgba(136,153,170,0.2)',
                    borderRadius: '4px',
                    opacity: 0.8,
                    transition: 'all 0.3s ease',
                  }}
                />
              ))}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px', fontSize: '11px', color: '#8899aa' }}>
            {trend.map((point) => (
              <span key={point.date} style={{ flex: 1, textAlign: 'center' }}>{point.label}</span>
            ))}
          </div>
        </div>
      </div>

      {statsError && (
        <div style={{ marginTop: '20px' }}>
          <Alert type="error" title="Error loading dashboard stats" message={statsError} dismissible />
        </div>
      )}
    </div>
  )
}
