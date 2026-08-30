/**
 * Guidance Page - AI-powered suggestions for agents
 * Real-time guidance during calls/chats with knowledge recommendations
 */

import React, { useState, useEffect } from 'react'
import {
  Lightbulb,
  MessageSquare,
  BookOpen,
  TrendingUp,
  Heart,
  ThumbsUp,
  ThumbsDown,
  Search,
  Zap,
  Target,
  Award,
  RefreshCw,
} from 'lucide-react'
import { apiClient } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { Alert } from '../components/Alert'
import { LoadingSpinner } from '../components/LoadingSpinner'

interface AIGuidance {
  id: string
  type: 'response' | 'knowledge' | 'practice' | 'escalation'
  title: string
  description: string
  suggestion: string
  confidence: number
  source?: string
  tags?: string[]
}

interface GuidanceMetrics {
  suggestions_shown: number
  suggestions_accepted: number
  avg_confidence: number
  helpful_rate: number
  training_progress: number
}

const GUIDANCE_TYPES = {
  response: {
    color: '#00d4ff',
    label: 'Suggested Response',
    icon: MessageSquare,
  },
  knowledge: {
    color: '#00ffaa',
    label: 'Knowledge Article',
    icon: BookOpen,
  },
  practice: {
    color: '#ffa500',
    label: 'Best Practice',
    icon: Award,
  },
  escalation: {
    color: '#ff6b6b',
    label: 'Escalation Guide',
    icon: TrendingUp,
  },
}

const CONFIDENCE_COLOR = (score: number) => {
  if (score >= 0.9) return '#00ffaa'
  if (score >= 0.75) return '#ffa500'
  return '#ff6b6b'
}

export default function Guidance() {
  const { user } = useAuth()
  const companyId = user?.company_id || ''

  // State for guidance suggestions
  const [guidances, setGuidances] = useState<AIGuidance[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)


  // State for metrics
  const [metrics, setMetrics] = useState<GuidanceMetrics | null>(null)

  // State for filters and search
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [selectedGuidance, setSelectedGuidance] = useState<AIGuidance | null>(null)

  // State for feedback
  const [feedbackMap, setFeedbackMap] = useState<Record<string, 'helpful' | 'unhelpful'>>({})

  // Fetch guidance suggestions
  useEffect(() => {
    if (!companyId) return

    const fetchGuidance = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await apiClient.listGuidance(companyId)
        const items: AIGuidance[] = Array.isArray(response?.guidance) ? response.guidance : []

        setGuidances(items)
        setSelectedGuidance(items[0] ?? null)

        // Metrics are derived from the guidance actually returned. When there is
        // nothing to measure we show no metrics rather than invented ones.
        setMetrics(
          items.length > 0
            ? {
                suggestions_shown: items.length,
                suggestions_accepted: 0,
                avg_confidence:
                  items.reduce((sum, g) => sum + (g.confidence ?? 0), 0) / items.length,
                helpful_rate: 0,
                training_progress: 0,
              }
            : null,
        )
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load guidance')
      } finally {
        setLoading(false)
      }
    }

    fetchGuidance()
  }, [companyId])

  // Filter guidance
  const filteredGuidances = guidances.filter(guidance => {
    const matchesSearch =
      guidance.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      guidance.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      guidance.suggestion.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesType = filterType === 'all' || guidance.type === filterType

    return matchesSearch && matchesType
  })

  // Handle feedback
  const handleFeedback = (guidanceId: string, helpful: boolean) => {
    setFeedbackMap(prev => ({
      ...prev,
      [guidanceId]: helpful ? 'helpful' : 'unhelpful',
    }))

    // Show brief feedback message
    setTimeout(() => {
      setFeedbackMap(prev => {
        const updated = { ...prev }
        delete updated[guidanceId]
        return updated
      })
    }, 2000)
  }

  // Handle copy suggestion
  const handleCopySuggestion = (suggestion: string) => {
    navigator.clipboard.writeText(suggestion)
    setTimeout(() => {
      alert('Copied to clipboard!')
    }, 100)
  }

  return (
    <div style={{ background: '#0f1728', minHeight: '100vh', padding: '20px' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: 'bold', margin: 0, marginBottom: '4px', color: '#fff' }}>
              Guidance
            </h1>
            <p style={{ margin: 0, color: '#9ca3af', fontSize: '14px' }}>
              AI-powered assistance for agents
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
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: '16px',
          }}>
            {[
              {
                label: 'Suggestions Shown',
                value: metrics.suggestions_shown.toLocaleString(),
                color: '#00d4ff',
                icon: Lightbulb,
              },
              {
                label: 'Acceptance Rate',
                value: `${((metrics.suggestions_accepted / metrics.suggestions_shown) * 100).toFixed(0)}%`,
                color: '#00ffaa',
                icon: ThumbsUp,
              },
              {
                label: 'Avg Confidence',
                value: `${(metrics.avg_confidence * 100).toFixed(0)}%`,
                color: '#ffa500',
                icon: Zap,
              },
              {
                label: 'Helpful Rate',
                value: `${(metrics.helpful_rate * 100).toFixed(0)}%`,
                color: '#2dd4bf',
                icon: Heart,
              },
              {
                label: 'Training Progress',
                value: `${metrics.training_progress}%`,
                color: '#ff6b6b',
                icon: Target,
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
        {/* Guidance Suggestions */}
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
                placeholder="Search suggestions, articles, practices..."
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

            {/* Type Filter */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                onClick={() => setFilterType('all')}
                style={{
                  padding: '6px 12px',
                  background: filterType === 'all' ? 'rgba(0,212,255,0.3)' : 'rgba(45,212,191,0.1)',
                  border: `1px solid ${filterType === 'all' ? 'rgba(0,212,255,0.5)' : 'rgba(45,212,191,0.2)'}`,
                  borderRadius: '4px',
                  color: filterType === 'all' ? '#00d4ff' : '#9ca3af',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}>
                All
              </button>
              {Object.entries(GUIDANCE_TYPES).map(([key, config]) => (
                <button
                  key={key}
                  onClick={() => setFilterType(key)}
                  style={{
                    padding: '6px 12px',
                    background: filterType === key ? `${config.color}30` : 'rgba(45,212,191,0.1)',
                    border: `1px solid ${filterType === key ? config.color + '50' : 'rgba(45,212,191,0.2)'}`,
                    borderRadius: '4px',
                    color: filterType === key ? config.color : '#9ca3af',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}>
                  {config.label}
                </button>
              ))}
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
              <LoadingSpinner message="Loading guidance..." />
            ) : filteredGuidances.length === 0 ? (
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
                  <Lightbulb size={48} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                  <p>No guidance suggestions found</p>
                </div>
              </div>
            ) : (
              filteredGuidances.map((guidance) => {
                const typeConfig = GUIDANCE_TYPES[guidance.type]

                return (
                  <div
                    key={guidance.id}
                    onClick={() => setSelectedGuidance(guidance)}
                    style={{
                      padding: '16px',
                      borderBottom: '1px solid rgba(45,212,191,0.1)',
                      cursor: 'pointer',
                      background: selectedGuidance?.id === guidance.id ? 'rgba(45,212,191,0.15)' : 'transparent',
                      transition: 'background 0.2s',
                      borderLeft: `3px solid ${typeConfig.color}`,
                    }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <typeConfig.icon size={14} color={typeConfig.color} />
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: 600,
                              color: typeConfig.color,
                            }}>
                            {typeConfig.label}
                          </span>
                        </div>
                        <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '4px', color: '#fff' }}>
                          {guidance.title}
                        </div>
                        <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                          {guidance.description}
                        </div>
                      </div>
                      <div
                        style={{
                          padding: '4px 8px',
                          background: `${CONFIDENCE_COLOR(guidance.confidence)}20`,
                          border: `1px solid ${CONFIDENCE_COLOR(guidance.confidence)}`,
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: 600,
                          color: CONFIDENCE_COLOR(guidance.confidence),
                          marginLeft: '12px',
                        }}>
                        {(guidance.confidence * 100).toFixed(0)}%
                      </div>
                    </div>

                    {/* Feedback buttons */}
                    {feedbackMap[guidance.id] && (
                      <div style={{ fontSize: '11px', color: feedbackMap[guidance.id] === 'helpful' ? '#00ffaa' : '#ff6b6b' }}>
                        {feedbackMap[guidance.id] === 'helpful' ? 'Thanks for the feedback!' : 'Noted. We\'ll improve.'}
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Detail Panel */}
        {selectedGuidance && (
          <div style={{
            background: 'rgba(15,23,42,0.4)',
            border: '1px solid rgba(45,212,191,0.15)',
            borderRadius: '12px',
            display: 'flex',
            flexDirection: 'column',
            overflowY: 'auto',
          }}>
            {/* Header */}
            <div style={{ padding: '16px', borderBottom: '1px solid rgba(45,212,191,0.15)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                {selectedGuidance.type && GUIDANCE_TYPES[selectedGuidance.type] && (
                  React.createElement(GUIDANCE_TYPES[selectedGuidance.type].icon, { size: 14, color: GUIDANCE_TYPES[selectedGuidance.type].color })
                )}
                <span style={{ fontSize: '11px', fontWeight: 600, color: GUIDANCE_TYPES[selectedGuidance.type]?.color }}>
                  {GUIDANCE_TYPES[selectedGuidance.type]?.label}
                </span>
              </div>
              <h3 style={{ fontSize: '14px', fontWeight: 600, margin: 0, color: '#fff', marginBottom: '4px' }}>
                {selectedGuidance.title}
              </h3>

              {/* Confidence */}
              <div
                style={{
                  padding: '4px 8px',
                  background: `${CONFIDENCE_COLOR(selectedGuidance.confidence)}20`,
                  border: `1px solid ${CONFIDENCE_COLOR(selectedGuidance.confidence)}`,
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: CONFIDENCE_COLOR(selectedGuidance.confidence),
                  marginTop: '8px',
                  display: 'inline-block',
                }}>
                Confidence: {(selectedGuidance.confidence * 100).toFixed(0)}%
              </div>

              {/* Source */}
              {selectedGuidance.source && (
                <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '8px' }}>
                  {selectedGuidance.source}
                </div>
              )}
            </div>

            {/* Suggestion Content */}
            <div style={{ padding: '16px', flex: 1, overflowY: 'auto', minHeight: 0 }}>
              <div style={{ marginBottom: '16px' }}>
                <h4 style={{ fontSize: '12px', fontWeight: 600, color: '#00ffaa', margin: '0 0 8px 0' }}>
                  Suggestion
                </h4>
                <div style={{
                  background: 'rgba(45,212,191,0.05)',
                  border: '1px solid rgba(45,212,191,0.2)',
                  borderRadius: '6px',
                  padding: '12px',
                  fontSize: '12px',
                  lineHeight: '1.6',
                  color: '#b0bac9',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}>
                  {selectedGuidance.suggestion}
                </div>
              </div>

              {/* Tags */}
              {selectedGuidance.tags && selectedGuidance.tags.length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: '#9ca3af', marginBottom: '6px' }}>Tags</div>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {selectedGuidance.tags.map((tag) => (
                      <span
                        key={tag}
                        style={{
                          padding: '4px 8px',
                          background: 'rgba(0,212,255,0.1)',
                          border: '1px solid rgba(0,212,255,0.2)',
                          borderRadius: '4px',
                          fontSize: '10px',
                          color: '#00d4ff',
                        }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div style={{ padding: '16px', borderTop: '1px solid rgba(45,212,191,0.15)', display: 'flex', gap: '8px', flexDirection: 'column' }}>
              <button
                onClick={() => handleCopySuggestion(selectedGuidance.suggestion)}
                style={{
                  width: '100%',
                  padding: '8px',
                  background: 'rgba(0,212,255,0.3)',
                  border: '1px solid rgba(0,212,255,0.5)',
                  borderRadius: '6px',
                  color: '#00d4ff',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}>
                <MessageSquare size={12} style={{ display: 'inline', marginRight: '6px' }} />
                Copy to Use
              </button>

              {/* Feedback */}
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => handleFeedback(selectedGuidance.id, true)}
                  disabled={feedbackMap[selectedGuidance.id] === 'helpful'}
                  style={{
                    flex: 1,
                    padding: '8px',
                    background: feedbackMap[selectedGuidance.id] === 'helpful' ? 'rgba(0,255,170,0.3)' : 'rgba(45,212,191,0.1)',
                    border: `1px solid ${feedbackMap[selectedGuidance.id] === 'helpful' ? 'rgba(0,255,170,0.5)' : 'rgba(45,212,191,0.2)'}`,
                    borderRadius: '6px',
                    color: feedbackMap[selectedGuidance.id] === 'helpful' ? '#00ffaa' : '#9ca3af',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: feedbackMap[selectedGuidance.id] !== 'helpful' ? 'pointer' : 'not-allowed',
                  }}>
                  <ThumbsUp size={12} style={{ display: 'inline', marginRight: '4px' }} />
                  Helpful
                </button>
                <button
                  onClick={() => handleFeedback(selectedGuidance.id, false)}
                  disabled={feedbackMap[selectedGuidance.id] === 'unhelpful'}
                  style={{
                    flex: 1,
                    padding: '8px',
                    background: feedbackMap[selectedGuidance.id] === 'unhelpful' ? 'rgba(255,107,107,0.3)' : 'rgba(45,212,191,0.1)',
                    border: `1px solid ${feedbackMap[selectedGuidance.id] === 'unhelpful' ? 'rgba(255,107,107,0.5)' : 'rgba(45,212,191,0.2)'}`,
                    borderRadius: '6px',
                    color: feedbackMap[selectedGuidance.id] === 'unhelpful' ? '#ff6b6b' : '#9ca3af',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: feedbackMap[selectedGuidance.id] !== 'unhelpful' ? 'pointer' : 'not-allowed',
                  }}>
                    <ThumbsDown size={12} style={{ display: 'inline', marginRight: '4px' }} />
                  Not helpful
                </button>
              </div>

              {/* Training Note */}
              <div style={{
                padding: '8px',
                background: 'rgba(255,165,0,0.05)',
                border: '1px solid rgba(255,165,0,0.2)',
                borderRadius: '6px',
                fontSize: '11px',
                color: '#ffa500',
              }}>
                <Award size={12} style={{ display: 'inline', marginRight: '4px' }} />
                Your feedback helps improve AI accuracy
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
