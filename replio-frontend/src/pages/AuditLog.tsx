/**
 * Audit Log Page - System activity and compliance logging
 * Real-time activity feed with filtering, searching, and export functionality
 */

import React, { useState, useEffect } from 'react'
import {
  Search,
  Filter,
  Download,
  Calendar,
  User,
  Clock,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  FileText,
} from 'lucide-react'
import { apiClient } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { Alert } from '../components/Alert'

interface AuditLogEntry {
  id: string
  user_id: string
  user_name?: string
  action: string
  action_type: string
  resource_type: string
  resource_id?: string
  status: 'success' | 'failed'
  details?: Record<string, any>
  ip_address?: string
  timestamp: string
  created_at: string
}

interface FilterOptions {
  startDate: string
  endDate: string
  actionType: string
  userId: string
  status: string
}

const ACTION_TYPE_OPTIONS = [
  'login',
  'logout',
  'conversation_created',
  'conversation_updated',
  'call_handled',
  'settings_changed',
  'integration_enabled',
  'integration_disabled',
  'api_key_created',
  'api_key_revoked',
  'user_added',
  'user_removed',
  'permission_changed',
  'escalation_created',
  'knowledge_base_updated',
]

export default function AuditLog() {
  const { user } = useAuth()
  const companyId = user?.company_id || ''

  // State for audit logs
  const [logs, setLogs] = useState<AuditLogEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // State for filtering
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState<FilterOptions>({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    actionType: '',
    userId: '',
    status: '',
  })

  const [expandedLog, setExpandedLog] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)

  // Fetch audit logs
  useEffect(() => {
    if (!companyId) return

    const fetchLogs = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await apiClient.getAuditLogs(companyId, 100, page * 100)
        setLogs(data || [])
        setHasMore((data || []).length >= 100)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load audit logs')
      } finally {
        setLoading(false)
      }
    }

    fetchLogs()
  }, [companyId, page])

  // Filter logs
  const filteredLogs = logs.filter(log => {
    const matchesSearch =
      !searchTerm ||
      (log.user_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.resource_id || '').includes(searchTerm)

    const matchesActionType = !filters.actionType || log.action_type === filters.actionType
    const matchesUserId = !filters.userId || log.user_id === filters.userId
    const matchesStatus = !filters.status || log.status === filters.status

    const logDate = new Date(log.created_at).toISOString().split('T')[0]
    const matchesDateRange =
      !filters.startDate ||
      !filters.endDate ||
      (logDate >= filters.startDate && logDate <= filters.endDate)

    return matchesSearch && matchesActionType && matchesUserId && matchesStatus && matchesDateRange
  })

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ['Timestamp', 'User', 'Action', 'Resource Type', 'Status', 'IP Address', 'Details']
    const rows = filteredLogs.map(log => [
      new Date(log.created_at).toLocaleString(),
      log.user_name || log.user_id,
      log.action,
      log.resource_type,
      log.status,
      log.ip_address || 'N/A',
      JSON.stringify(log.details || {}),
    ])

    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `audit-log-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }

  // Generate compliance report
  const handleGenerateReport = () => {
    const totalActions = filteredLogs.length
    const successfulActions = filteredLogs.filter(l => l.status === 'success').length
    const failedActions = filteredLogs.filter(l => l.status === 'failed').length

    const report = `
COMPLIANCE AUDIT REPORT
Generated: ${new Date().toLocaleString()}
Period: ${filters.startDate} to ${filters.endDate}

=== SUMMARY ===
Total Actions: ${totalActions}
Successful: ${successfulActions}
Failed: ${failedActions}
Success Rate: ${totalActions > 0 ? ((successfulActions / totalActions) * 100).toFixed(2) : 0}%

=== ACTION BREAKDOWN ===
${Object.entries(
  filteredLogs.reduce(
    (acc, log) => {
      acc[log.action_type] = (acc[log.action_type] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  ),
)
  .map(([action, count]) => `${action}: ${count}`)
  .join('\n')}

=== USER ACTIVITY ===
${Object.entries(
  filteredLogs.reduce(
    (acc, log) => {
      acc[log.user_name || log.user_id] = (acc[log.user_name || log.user_id] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  ),
)
  .sort(([, a], [, b]) => b - a)
  .slice(0, 10)
  .map(([user, count]) => `${user}: ${count} actions`)
  .join('\n')}
    `

    const blob = new Blob([report], { type: 'text/plain' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `compliance-report-${new Date().toISOString().split('T')[0]}.txt`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }

  const getStatusColor = (status: string) => {
    return status === 'success'
      ? { bg: 'rgba(0, 255, 170, 0.1)', text: '#00ffaa', icon: CheckCircle2 }
      : { bg: 'rgba(255, 107, 107, 0.1)', text: '#ff6b6b', icon: AlertCircle }
  }

  const getActionColor = (actionType: string) => {
    const colors: Record<string, string> = {
      login: '#00d4ff',
      logout: '#8b5cf6',
      conversation_created: '#00ffaa',
      conversation_updated: '#3b82f6',
      call_handled: '#f59e0b',
      settings_changed: '#ec4899',
      integration_enabled: '#00ffaa',
      integration_disabled: '#ff6b6b',
      api_key_created: '#00d4ff',
      api_key_revoked: '#ff6b6b',
      user_added: '#00ffaa',
      user_removed: '#ff6b6b',
      permission_changed: '#f59e0b',
      escalation_created: '#ff6b6b',
      knowledge_base_updated: '#3b82f6',
    }
    return colors[actionType] || '#00d4ff'
  }

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0, marginBottom: 8, color: '#ffffff' }}>
            Audit Log
          </h1>
          <p style={{ fontSize: 14, color: 'rgba(255, 255, 255, 0.6)', margin: 0 }}>
            System activity and compliance logging
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={handleGenerateReport}
            style={{
              padding: '10px 16px',
              background: 'rgba(0, 212, 255, 0.1)',
              border: '1px solid rgba(0, 212, 255, 0.3)',
              borderRadius: '8px',
              color: '#00d4ff',
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(0, 212, 255, 0.2)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(0, 212, 255, 0.1)'
            }}
          >
            <FileText size={16} />
            Report
          </button>
          <button
            onClick={handleExportCSV}
            style={{
              padding: '10px 16px',
              background: 'rgba(0, 255, 170, 0.1)',
              border: '1px solid rgba(0, 255, 170, 0.3)',
              borderRadius: '8px',
              color: '#00ffaa',
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(0, 255, 170, 0.2)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(0, 255, 170, 0.1)'
            }}
          >
            <Download size={16} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div style={{ display: 'flex', gap: '12px' }}>
        <div
          style={{
            flex: 1,
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            background: 'rgba(15, 23, 42, 0.4)',
            border: '1px solid rgba(45, 212, 191, 0.15)',
            borderRadius: '8px',
            paddingLeft: '12px',
          }}
        >
          <Search size={18} color="rgba(255, 255, 255, 0.4)" />
          <input
            type="text"
            placeholder="Search logs by user, action, or resource ID..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              padding: '12px',
              color: '#ffffff',
              fontSize: 14,
              outline: 'none',
            }}
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          style={{
            padding: '10px 16px',
            background: showFilters ? 'rgba(0, 212, 255, 0.2)' : 'rgba(15, 23, 42, 0.4)',
            border: `1px solid ${showFilters ? 'rgba(0, 212, 255, 0.3)' : 'rgba(45, 212, 191, 0.15)'}`,
            borderRadius: '8px',
            color: '#00d4ff',
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s',
          }}
        >
          <Filter size={16} />
          Filters
        </button>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
            padding: '16px',
            background: 'rgba(0, 212, 255, 0.05)',
            border: '1px solid rgba(0, 212, 255, 0.1)',
            borderRadius: '8px',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255, 255, 255, 0.7)' }}>
              Start Date
            </label>
            <input
              type="date"
              value={filters.startDate}
              onChange={e => setFilters({ ...filters, startDate: e.target.value })}
              style={{
                padding: '8px',
                background: 'rgba(15, 23, 42, 0.4)',
                border: '1px solid rgba(45, 212, 191, 0.15)',
                borderRadius: '6px',
                color: '#ffffff',
                fontSize: 14,
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255, 255, 255, 0.7)' }}>
              End Date
            </label>
            <input
              type="date"
              value={filters.endDate}
              onChange={e => setFilters({ ...filters, endDate: e.target.value })}
              style={{
                padding: '8px',
                background: 'rgba(15, 23, 42, 0.4)',
                border: '1px solid rgba(45, 212, 191, 0.15)',
                borderRadius: '6px',
                color: '#ffffff',
                fontSize: 14,
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255, 255, 255, 0.7)' }}>
              Action Type
            </label>
            <select
              value={filters.actionType}
              onChange={e => setFilters({ ...filters, actionType: e.target.value })}
              style={{
                padding: '8px',
                background: 'rgba(15, 23, 42, 0.4)',
                border: '1px solid rgba(45, 212, 191, 0.15)',
                borderRadius: '6px',
                color: '#ffffff',
                fontSize: 14,
              }}
            >
              <option value="">All Actions</option>
              {ACTION_TYPE_OPTIONS.map(action => (
                <option key={action} value={action}>
                  {action.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255, 255, 255, 0.7)' }}>
              Status
            </label>
            <select
              value={filters.status}
              onChange={e => setFilters({ ...filters, status: e.target.value })}
              style={{
                padding: '8px',
                background: 'rgba(15, 23, 42, 0.4)',
                border: '1px solid rgba(45, 212, 191, 0.15)',
                borderRadius: '6px',
                color: '#ffffff',
                fontSize: 14,
              }}
            >
              <option value="">All Statuses</option>
              <option value="success">Success</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button
              onClick={() =>
                setFilters({
                  startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                    .toISOString()
                    .split('T')[0],
                  endDate: new Date().toISOString().split('T')[0],
                  actionType: '',
                  userId: '',
                  status: '',
                })
              }
              style={{
                padding: '8px 12px',
                background: 'rgba(139, 92, 246, 0.1)',
                border: '1px solid rgba(139, 92, 246, 0.3)',
                borderRadius: '6px',
                color: '#8b5cf6',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 500,
                width: '100%',
              }}
            >
              Reset
            </button>
          </div>
        </div>
      )}

      {/* Error Alert */}
      {error && <Alert type="error" message={error} />}

      {/* Stats Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
        <div
          style={{
            padding: '16px',
            background: 'rgba(15, 23, 42, 0.4)',
            border: '1px solid rgba(45, 212, 191, 0.15)',
            borderRadius: '8px',
          }}
        >
          <p style={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.6)', margin: '0 0 8px 0' }}>Total Entries</p>
          <p style={{ fontSize: 24, fontWeight: 700, color: '#00d4ff', margin: 0 }}>{filteredLogs.length}</p>
        </div>
        <div
          style={{
            padding: '16px',
            background: 'rgba(15, 23, 42, 0.4)',
            border: '1px solid rgba(45, 212, 191, 0.15)',
            borderRadius: '8px',
          }}
        >
          <p style={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.6)', margin: '0 0 8px 0' }}>Successful</p>
          <p style={{ fontSize: 24, fontWeight: 700, color: '#00ffaa', margin: 0 }}>
            {filteredLogs.filter(l => l.status === 'success').length}
          </p>
        </div>
        <div
          style={{
            padding: '16px',
            background: 'rgba(15, 23, 42, 0.4)',
            border: '1px solid rgba(45, 212, 191, 0.15)',
            borderRadius: '8px',
          }}
        >
          <p style={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.6)', margin: '0 0 8px 0' }}>Failed</p>
          <p style={{ fontSize: 24, fontWeight: 700, color: '#ff6b6b', margin: 0 }}>
            {filteredLogs.filter(l => l.status === 'failed').length}
          </p>
        </div>
      </div>

      {/* Logs List */}
      <div
        style={{
          background: 'rgba(15, 23, 42, 0.4)',
          border: '1px solid rgba(45, 212, 191, 0.15)',
          borderRadius: '8px',
          overflow: 'hidden',
        }}
      >
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'rgba(255, 255, 255, 0.5)' }}>
            Loading audit logs...
          </div>
        ) : filteredLogs.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'rgba(255, 255, 255, 0.5)' }}>
            No audit logs found
          </div>
        ) : (
          <div>
            {filteredLogs.map(log => {
              const statusColor = getStatusColor(log.status)
              const StatusIcon = statusColor.icon
              const actionColor = getActionColor(log.action_type)
              const isExpanded = expandedLog === log.id

              return (
                <div
                  key={log.id}
                  style={{
                    borderBottom: '1px solid rgba(45, 212, 191, 0.1)',
                    background: isExpanded ? 'rgba(0, 212, 255, 0.05)' : 'transparent',
                    transition: 'background 0.2s',
                  }}
                >
                  {/* Main Row */}
                  <div
                    onClick={() => setExpandedLog(isExpanded ? null : log.id)}
                    style={{
                      padding: '16px',
                      cursor: 'pointer',
                      display: 'grid',
                      gridTemplateColumns: '1fr auto auto auto auto auto 40px',
                      gap: '12px',
                      alignItems: 'center',
                    }}
                  >
                    {/* Timestamp */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                      <Clock size={16} color="rgba(255, 255, 255, 0.4)" />
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: '#ffffff', margin: 0 }}>
                          {new Date(log.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    {/* User */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <User size={16} color="rgba(255, 255, 255, 0.4)" />
                      <span style={{ fontSize: 13, color: 'rgba(255, 255, 255, 0.8)' }}>
                        {log.user_name || log.user_id.substring(0, 8)}
                      </span>
                    </div>

                    {/* Action */}
                    <div
                      style={{
                        padding: '4px 8px',
                        background: `${actionColor}20`,
                        border: `1px solid ${actionColor}40`,
                        borderRadius: '4px',
                        fontSize: 12,
                        fontWeight: 600,
                        color: actionColor,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {log.action_type.replace(/_/g, ' ')}
                    </div>

                    {/* Resource Type */}
                    <span style={{ fontSize: 13, color: 'rgba(255, 255, 255, 0.6)' }}>
                      {log.resource_type}
                    </span>

                    {/* Status */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <StatusIcon size={16} color={statusColor.text} />
                      <span style={{ fontSize: 13, fontWeight: 600, color: statusColor.text }}>
                        {log.status}
                      </span>
                    </div>

                    {/* IP Address */}
                    <span style={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.5)', textAlign: 'right' }}>
                      {log.ip_address || 'N/A'}
                    </span>

                    {/* Expand Button */}
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                      {isExpanded ? (
                        <ChevronUp size={18} color="#00d4ff" />
                      ) : (
                        <ChevronDown size={18} color="rgba(255, 255, 255, 0.4)" />
                      )}
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && log.details && (
                    <div style={{ padding: '16px', background: 'rgba(0, 212, 255, 0.05)', borderTop: '1px solid rgba(0, 212, 255, 0.1)' }}>
                      <p style={{ fontSize: 12, fontWeight: 600, color: '#00d4ff', marginBottom: '8px' }}>
                        Details
                      </p>
                      <pre
                        style={{
                          background: 'rgba(15, 23, 42, 0.6)',
                          padding: '12px',
                          borderRadius: '4px',
                          fontSize: 12,
                          color: 'rgba(255, 255, 255, 0.8)',
                          overflow: 'auto',
                          margin: 0,
                        }}
                      >
                        {JSON.stringify(log.details, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Pagination */}
      {!loading && hasMore && (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <button
            onClick={() => setPage(page + 1)}
            style={{
              padding: '10px 24px',
              background: 'rgba(0, 212, 255, 0.1)',
              border: '1px solid rgba(0, 212, 255, 0.3)',
              borderRadius: '8px',
              color: '#00d4ff',
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 600,
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(0, 212, 255, 0.2)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(0, 212, 255, 0.1)'
            }}
          >
            Load More
          </button>
        </div>
      )}
    </div>
  )
}
