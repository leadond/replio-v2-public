/**
 * Escalations Page - Workflow management for escalated issues
 * Designed with crypto trading dashboard aesthetic
 */

import { useState, useEffect } from 'react'
import {
  AlertTriangle,
  Clock,
  CheckCircle2,
  AlertCircle,
  Search,
  MessageSquare,
  TrendingUp,
  User,
  Calendar,
  RefreshCw,
  Zap,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { Alert } from '../components/Alert'
import { LoadingSpinner } from '../components/LoadingSpinner'

interface Escalation {
  id: string
  conversation_id: string
  caller_name?: string
  phone_number?: string
  priority: 'critical' | 'high' | 'medium' | 'low'
  status: 'open' | 'in_progress' | 'resolved'
  subject: string
  assigned_to?: string
  created_at: string
  updated_at: string
  sla_minutes?: number
  resolution_time_minutes?: number
  notes?: string
}

interface TeamMember {
  id: string
  name: string
  email: string
}

interface EscalationMetrics {
  total_escalations: number
  open_count: number
  in_progress_count: number
  resolved_count: number
  avg_resolution_time: number
  sla_breach_rate: number
}

const PRIORITY_CONFIG = {
  critical: {
    color: '#ff6b6b',
    bgColor: 'rgba(255,107,107,0.1)',
    borderColor: 'rgba(255,107,107,0.3)',
    label: 'Critical',
    sla: 15,
  },
  high: {
    color: '#ffa500',
    bgColor: 'rgba(255,165,0,0.1)',
    borderColor: 'rgba(255,165,0,0.3)',
    label: 'High',
    sla: 30,
  },
  medium: {
    color: '#ffd700',
    bgColor: 'rgba(255,215,0,0.1)',
    borderColor: 'rgba(255,215,0,0.3)',
    label: 'Medium',
    sla: 120,
  },
  low: {
    color: '#00ffaa',
    bgColor: 'rgba(0,255,170,0.1)',
    borderColor: 'rgba(0,255,170,0.3)',
    label: 'Low',
    sla: 480,
  },
}

const STATUS_CONFIG = {
  open: {
    color: '#00d4ff',
    label: 'Open',
    icon: AlertCircle,
  },
  in_progress: {
    color: '#ffa500',
    label: 'In Progress',
    icon: Clock,
  },
  resolved: {
    color: '#00ffaa',
    label: 'Resolved',
    icon: CheckCircle2,
  },
}

export default function Escalations() {
  const { user } = useAuth()
  const companyId = user?.company_id || ''

  // State for escalations
  const [escalations, setEscalations] = useState<Escalation[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // State for metrics
  const [metrics, setMetrics] = useState<EscalationMetrics | null>(null)

  // State for filters and search
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterPriority, setFilterPriority] = useState<string>('all')

  // State for detail view
  const [selectedEscalation, setSelectedEscalation] = useState<Escalation | null>(null)

  // State for assignment and notes
  const [assignTo, setAssignTo] = useState('')
  const [noteText, setNoteText] = useState('')
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])

  // Fetch escalations and metrics
  useEffect(() => {
    if (!companyId) return

    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Simulate fetching escalations from API
        // In production, this would call apiClient.getEscalations(companyId)
        const mockEscalations: Escalation[] = [
          {
            id: 'esc-001',
            conversation_id: 'conv-001',
            caller_name: 'John Smith',
            phone_number: '+1-555-0101',
            priority: 'critical',
            status: 'open',
            subject: 'Urgent: Account locked - Can\'t access trading platform',
            assigned_to: undefined,
            created_at: new Date(Date.now() - 5 * 60000).toISOString(),
            updated_at: new Date(Date.now() - 5 * 60000).toISOString(),
            sla_minutes: 15,
            resolution_time_minutes: undefined,
            notes: 'Customer reports security block on account',
          },
          {
            id: 'esc-002',
            conversation_id: 'conv-002',
            caller_name: 'Sarah Johnson',
            phone_number: '+1-555-0102',
            priority: 'high',
            status: 'in_progress',
            subject: 'Withdrawal pending for 24+ hours',
            assigned_to: 'Alice Chen',
            created_at: new Date(Date.now() - 45 * 60000).toISOString(),
            updated_at: new Date(Date.now() - 15 * 60000).toISOString(),
            sla_minutes: 30,
            resolution_time_minutes: 30,
            notes: 'Escalated to payments team',
          },
          {
            id: 'esc-003',
            conversation_id: 'conv-003',
            caller_name: 'Michael Chen',
            phone_number: '+1-555-0103',
            priority: 'high',
            status: 'in_progress',
            subject: 'API integration failing with error 502',
            assigned_to: 'Bob Martinez',
            created_at: new Date(Date.now() - 90 * 60000).toISOString(),
            updated_at: new Date(Date.now() - 30 * 60000).toISOString(),
            sla_minutes: 30,
            resolution_time_minutes: 60,
            notes: 'Tech team investigating backend service',
          },
          {
            id: 'esc-004',
            conversation_id: 'conv-004',
            caller_name: 'Emma Wilson',
            phone_number: '+1-555-0104',
            priority: 'medium',
            status: 'resolved',
            subject: 'Questions about tax reporting for 2024',
            assigned_to: 'Carol Davis',
            created_at: new Date(Date.now() - 180 * 60000).toISOString(),
            updated_at: new Date(Date.now() - 120 * 60000).toISOString(),
            sla_minutes: 120,
            resolution_time_minutes: 60,
            notes: 'Resolved - sent tax documentation',
          },
          {
            id: 'esc-005',
            conversation_id: 'conv-005',
            caller_name: 'David Brown',
            phone_number: '+1-555-0105',
            priority: 'medium',
            status: 'open',
            subject: 'Portfolio performance comparison request',
            assigned_to: undefined,
            created_at: new Date(Date.now() - 30 * 60000).toISOString(),
            updated_at: new Date(Date.now() - 30 * 60000).toISOString(),
            sla_minutes: 120,
            resolution_time_minutes: undefined,
            notes: 'Customer wants detailed performance metrics',
          },
          {
            id: 'esc-006',
            conversation_id: 'conv-006',
            caller_name: 'Lisa Anderson',
            phone_number: '+1-555-0106',
            priority: 'low',
            status: 'open',
            subject: 'App notification preferences update',
            assigned_to: undefined,
            created_at: new Date(Date.now() - 15 * 60000).toISOString(),
            updated_at: new Date(Date.now() - 15 * 60000).toISOString(),
            sla_minutes: 480,
            resolution_time_minutes: undefined,
            notes: 'General inquiry',
          },
        ]

        // Mock metrics
        const mockMetrics: EscalationMetrics = {
          total_escalations: mockEscalations.length,
          open_count: mockEscalations.filter(e => e.status === 'open').length,
          in_progress_count: mockEscalations.filter(e => e.status === 'in_progress').length,
          resolved_count: mockEscalations.filter(e => e.status === 'resolved').length,
          avg_resolution_time: 45,
          sla_breach_rate: 8.3,
        }

        // Mock team members
        const mockTeamMembers: TeamMember[] = [
          { id: '1', name: 'Alice Chen', email: 'alice@company.com' },
          { id: '2', name: 'Bob Martinez', email: 'bob@company.com' },
          { id: '3', name: 'Carol Davis', email: 'carol@company.com' },
          { id: '4', name: 'David Wilson', email: 'david@company.com' },
        ]

        setEscalations(mockEscalations)
        setMetrics(mockMetrics)
        setTeamMembers(mockTeamMembers)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load escalations')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [companyId])

  // Filter escalations
  const filteredEscalations = escalations.filter(esc => {
    const matchesSearch =
      esc.caller_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      esc.phone_number?.includes(searchTerm) ||
      esc.subject.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = filterStatus === 'all' || esc.status === filterStatus
    const matchesPriority = filterPriority === 'all' || esc.priority === filterPriority

    return matchesSearch && matchesStatus && matchesPriority
  })

  // Handle assign escalation
  const handleAssign = async (escalationId: string, teamMemberId: string) => {
    const member = teamMembers.find(m => m.id === teamMemberId)
    if (!member) return

    try {
      setEscalations(prevEscalations =>
        prevEscalations.map(esc =>
          esc.id === escalationId
            ? { ...esc, assigned_to: member.name }
            : esc
        )
      )

      if (selectedEscalation?.id === escalationId) {
        setSelectedEscalation(prev => prev ? { ...prev, assigned_to: member.name } : null)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assign escalation')
    }
  }

  // Handle add note
  const handleAddNote = async (escalationId: string) => {
    if (!noteText.trim()) return

    try {
      setEscalations(prevEscalations =>
        prevEscalations.map(esc =>
          esc.id === escalationId
            ? { ...esc, notes: (esc.notes || '') + '\n[' + new Date().toLocaleTimeString() + '] ' + noteText }
            : esc
        )
      )

      if (selectedEscalation?.id === escalationId) {
        setSelectedEscalation(prev =>
          prev
            ? {
              ...prev,
              notes: (prev.notes || '') + '\n[' + new Date().toLocaleTimeString() + '] ' + noteText,
            }
            : null
        )
      }

      setNoteText('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add note')
    }
  }

  // Handle status change
  const handleStatusChange = async (escalationId: string, newStatus: 'open' | 'in_progress' | 'resolved') => {
    try {
      setEscalations(prevEscalations =>
        prevEscalations.map(esc =>
          esc.id === escalationId
            ? {
              ...esc,
              status: newStatus,
              updated_at: new Date().toISOString(),
              resolution_time_minutes: newStatus === 'resolved' ? 45 : esc.resolution_time_minutes,
            }
            : esc
        )
      )

      if (selectedEscalation?.id === escalationId) {
        setSelectedEscalation(prev =>
          prev
            ? {
              ...prev,
              status: newStatus,
              updated_at: new Date().toISOString(),
              resolution_time_minutes: newStatus === 'resolved' ? 45 : prev.resolution_time_minutes,
            }
            : null
        )
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status')
    }
  }

  // Calculate SLA status
  const getSLAStatus = (escalation: Escalation) => {
    if (escalation.status === 'resolved') return 'resolved'
    const minutesElapsed = (Date.now() - new Date(escalation.created_at).getTime()) / 60000
    const slaMinutes = escalation.sla_minutes || 60
    const remaining = slaMinutes - minutesElapsed

    if (remaining < 0) return 'breached'
    if (remaining < slaMinutes * 0.25) return 'critical'
    return 'healthy'
  }

  const priorityConfig = PRIORITY_CONFIG[selectedEscalation?.priority || 'medium']
  const statusConfig = STATUS_CONFIG[selectedEscalation?.status || 'open']

  return (
    <div style={{ background: '#0f1728', minHeight: '100vh', padding: '20px' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: 'bold', margin: 0, marginBottom: '4px', color: '#fff' }}>
              Escalations
            </h1>
            <p style={{ margin: 0, color: '#9ca3af', fontSize: '14px' }}>
              Workflow management for escalated issues
            </p>
          </div>
          <button
            onClick={() => {
              setLoading(true)
              setTimeout(() => setLoading(false), 1000)
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 12px',
              background: 'rgba(0,212,255,0.2)',
              border: 'none',
              borderRadius: '6px',
              color: '#00d4ff',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 600,
            }}>
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>

        {/* Metrics Grid */}
        {metrics && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '16px',
          }}>
            {[
              {
                label: 'Total Escalations',
                value: metrics.total_escalations,
                color: '#00d4ff',
                icon: AlertTriangle,
              },
              {
                label: 'Open',
                value: metrics.open_count,
                color: '#ff6b6b',
                icon: AlertCircle,
              },
              {
                label: 'In Progress',
                value: metrics.in_progress_count,
                color: '#ffa500',
                icon: Clock,
              },
              {
                label: 'Resolved',
                value: metrics.resolved_count,
                color: '#00ffaa',
                icon: CheckCircle2,
              },
              {
                label: 'Avg Resolution',
                value: `${metrics.avg_resolution_time}m`,
                color: '#2dd4bf',
                icon: Zap,
              },
              {
                label: 'SLA Breach Rate',
                value: `${metrics.sla_breach_rate.toFixed(1)}%`,
                color: metrics.sla_breach_rate > 5 ? '#ff6b6b' : '#00ffaa',
                icon: TrendingUp,
              },
            ].map((metric, idx) => (
              <div
                key={idx}
                style={{
                  background: `linear-gradient(135deg, rgba(45,212,191,0.08) 0%, rgba(0,255,170,0.04) 100%)`,
                  border: `1px solid rgba(45,212,191,0.15)`,
                  borderRadius: '12px',
                  padding: '16px',
                  backdropFilter: 'blur(10px)',
                }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <metric.icon size={16} color={metric.color} />
                  <span style={{ fontSize: '12px', color: '#9ca3af' }}>{metric.label}</span>
                </div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: metric.color }}>
                  {metric.value}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Main Content */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '20px', height: 'calc(100vh - 380px)' }}>
        {/* Escalations List */}
        <div style={{
          background: 'rgba(15,23,42,0.4)',
          border: '1px solid rgba(45,212,191,0.15)',
          borderRadius: '12px',
          display: 'flex',
          flexDirection: 'column',
        }}>
          {/* Header */}
          <div style={{ padding: '20px', borderBottom: '1px solid rgba(45,212,191,0.15)' }}>
            {/* Search */}
            <div style={{ position: 'relative', marginBottom: '16px' }}>
              <Search size={16} style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#9ca3af',
              }} />
              <input
                type="text"
                placeholder="Search by name, phone, or subject..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  paddingLeft: '36px',
                  paddingRight: '12px',
                  paddingTop: '8px',
                  paddingBottom: '8px',
                  background: 'rgba(45,212,191,0.05)',
                  border: '1px solid rgba(45,212,191,0.2)',
                  borderRadius: '6px',
                  color: 'inherit',
                  fontSize: '14px',
                  outline: 'none',
                }}
              />
            </div>

            {/* Filters */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                style={{
                  padding: '8px',
                  background: 'rgba(45,212,191,0.05)',
                  border: '1px solid rgba(45,212,191,0.2)',
                  borderRadius: '6px',
                  color: 'inherit',
                  fontSize: '12px',
                  cursor: 'pointer',
                }}>
                <option value="all">All Status</option>
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
              </select>
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                style={{
                  padding: '8px',
                  background: 'rgba(45,212,191,0.05)',
                  border: '1px solid rgba(45,212,191,0.2)',
                  borderRadius: '6px',
                  color: 'inherit',
                  fontSize: '12px',
                  cursor: 'pointer',
                }}>
                <option value="all">All Priority</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>

          {/* Error display */}
          {error && (
            <div style={{ padding: '20px' }}>
              <Alert type="error" message={error} dismissible onClose={() => setError(null)} />
            </div>
          )}

          {/* List */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {loading ? (
              <LoadingSpinner message="Loading escalations..." />
            ) : filteredEscalations.length === 0 ? (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flex: 1,
                color: '#9ca3af',
                textAlign: 'center',
                padding: '40px 20px',
              }}>
                <div>
                  <AlertTriangle size={48} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                  <p>No escalations found</p>
                </div>
              </div>
            ) : (
              filteredEscalations.map((esc) => {
                const priorityConfig = PRIORITY_CONFIG[esc.priority]
                const slaStatus = getSLAStatus(esc)
                const minutesElapsed = Math.round((Date.now() - new Date(esc.created_at).getTime()) / 60000)

                return (
                  <div
                    key={esc.id}
                    onClick={() => setSelectedEscalation(esc)}
                    style={{
                      padding: '16px',
                      borderBottom: '1px solid rgba(45,212,191,0.1)',
                      cursor: 'pointer',
                      background: selectedEscalation?.id === esc.id ? 'rgba(45,212,191,0.15)' : 'transparent',
                      transition: 'background 0.2s',
                      borderLeft: `3px solid ${priorityConfig.color}`,
                    }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '4px', color: '#fff' }}>
                          {esc.subject}
                        </div>
                        <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                          {esc.caller_name} • {esc.phone_number}
                        </div>
                      </div>
                      <div style={{
                        display: 'flex',
                        gap: '6px',
                        alignItems: 'center',
                      }}>
                        <span
                          style={{
                            padding: '4px 8px',
                            background: priorityConfig.bgColor,
                            border: `1px solid ${priorityConfig.color}`,
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: 600,
                            color: priorityConfig.color,
                          }}>
                          {priorityConfig.label}
                        </span>
                        <span
                          style={{
                            padding: '4px 8px',
                            background: STATUS_CONFIG[esc.status].color + '20',
                            border: `1px solid ${STATUS_CONFIG[esc.status].color}`,
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: 600,
                            color: STATUS_CONFIG[esc.status].color,
                          }}>
                          {STATUS_CONFIG[esc.status].label}
                        </span>
                      </div>
                    </div>

                    {/* SLA and Assignment Info */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: '#9ca3af' }}>
                      <div style={{ display: 'flex', gap: '12px' }}>
                        <span>
                          <Clock size={12} style={{ display: 'inline', marginRight: '4px' }} />
                          {minutesElapsed}m ago
                        </span>
                        <span style={{ color: slaStatus === 'breached' ? '#ff6b6b' : slaStatus === 'critical' ? '#ffa500' : '#00ffaa' }}>
                          {slaStatus === 'breached' ? 'SLA Breached' : slaStatus === 'critical' ? 'SLA Critical' : 'SLA OK'}
                        </span>
                      </div>
                      {esc.assigned_to && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <User size={12} />
                          {esc.assigned_to}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Detail Panel */}
        {selectedEscalation && (
          <div style={{
            background: 'rgba(15,23,42,0.4)',
            border: '1px solid rgba(45,212,191,0.15)',
            borderRadius: '12px',
            display: 'flex',
            flexDirection: 'column',
            overflowY: 'auto',
          }}>
            <div style={{ padding: '16px', borderBottom: '1px solid rgba(45,212,191,0.15)' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 600, margin: 0, color: '#00d4ff', marginBottom: '12px' }}>
                Details
              </h3>

              {/* Priority and Status */}
              <div style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>Priority</div>
                <span
                  style={{
                    padding: '4px 8px',
                    background: priorityConfig.bgColor,
                    border: `1px solid ${priorityConfig.color}`,
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: priorityConfig.color,
                  }}>
                  {priorityConfig.label}
                </span>
              </div>

              {/* Status Dropdown */}
              <div style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>Status</div>
                <select
                  value={selectedEscalation.status}
                  onChange={(e) =>
                    handleStatusChange(selectedEscalation.id, e.target.value as any)
                  }
                  style={{
                    width: '100%',
                    padding: '6px 8px',
                    background: `${statusConfig.color}20`,
                    border: `1px solid ${statusConfig.color}`,
                    borderRadius: '4px',
                    color: statusConfig.color,
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}>
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                </select>
              </div>

              {/* Assignment */}
              <div style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>Assign To</div>
                <select
                  value={assignTo}
                  onChange={(e) => {
                    setAssignTo(e.target.value)
                    if (e.target.value) {
                      handleAssign(selectedEscalation.id, e.target.value)
                      setAssignTo('')
                    }
                  }}
                  style={{
                    width: '100%',
                    padding: '6px 8px',
                    background: 'rgba(45,212,191,0.05)',
                    border: '1px solid rgba(45,212,191,0.2)',
                    borderRadius: '4px',
                    color: 'inherit',
                    fontSize: '12px',
                    cursor: 'pointer',
                  }}>
                  <option value="">Select team member...</option>
                  {teamMembers.map(member => (
                    <option key={member.id} value={member.id}>
                      {member.name}
                    </option>
                  ))}
                </select>
                {selectedEscalation.assigned_to && (
                  <div style={{ fontSize: '11px', color: '#00ffaa', marginTop: '4px' }}>
                    Currently: {selectedEscalation.assigned_to}
                  </div>
                )}
              </div>

              {/* SLA Info */}
              <div style={{
                padding: '8px',
                background: 'rgba(0,212,255,0.05)',
                border: '1px solid rgba(0,212,255,0.2)',
                borderRadius: '6px',
                fontSize: '11px',
                marginBottom: '12px',
              }}>
                <div style={{ color: '#00d4ff', marginBottom: '4px' }}>SLA: {selectedEscalation.sla_minutes} minutes</div>
                <div style={{ color: '#9ca3af' }}>
                  Status: {getSLAStatus(selectedEscalation).toUpperCase()}
                </div>
              </div>

              {/* Timeline */}
              <div style={{ fontSize: '11px', color: '#9ca3af', padding: '8px', background: 'rgba(45,212,191,0.05)', borderRadius: '6px' }}>
                <Calendar size={12} style={{ display: 'inline', marginRight: '4px' }} />
                Created: {new Date(selectedEscalation.created_at).toLocaleString()}
              </div>
            </div>

            {/* Notes Section */}
            <div style={{ padding: '16px', borderBottom: '1px solid rgba(45,212,191,0.15)', flex: 1, overflowY: 'auto', minHeight: 0 }}>
              <h4 style={{ fontSize: '12px', fontWeight: 600, color: '#00ffaa', margin: '0 0 12px 0' }}>
                Notes & Timeline
              </h4>

              <div style={{
                background: 'rgba(45,212,191,0.05)',
                border: '1px solid rgba(45,212,191,0.2)',
                borderRadius: '6px',
                padding: '8px',
                fontSize: '11px',
                color: '#b0bac9',
                lineHeight: '1.5',
                marginBottom: '12px',
                maxHeight: '100px',
                overflowY: 'auto',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}>
                {selectedEscalation.notes || 'No notes yet'}
              </div>

              {/* Add Note */}
              <div>
                <textarea
                  placeholder="Add a note..."
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px',
                    background: 'rgba(45,212,191,0.05)',
                    border: '1px solid rgba(45,212,191,0.2)',
                    borderRadius: '6px',
                    color: 'inherit',
                    fontSize: '12px',
                    minHeight: '60px',
                    resize: 'none',
                    outline: 'none',
                  }}
                />
                <button
                  onClick={() => handleAddNote(selectedEscalation.id)}
                  disabled={!noteText.trim()}
                  style={{
                    width: '100%',
                    marginTop: '8px',
                    padding: '6px',
                    background: noteText.trim() ? 'rgba(0,212,255,0.3)' : 'rgba(45,212,191,0.1)',
                    border: `1px solid ${noteText.trim() ? 'rgba(0,212,255,0.5)' : 'rgba(45,212,191,0.2)'}`,
                    borderRadius: '6px',
                    color: noteText.trim() ? '#00d4ff' : '#9ca3af',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: noteText.trim() ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                  }}>
                    <MessageSquare size={12} />
                    Add Note
                  </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
