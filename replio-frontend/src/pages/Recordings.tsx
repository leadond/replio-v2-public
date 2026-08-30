/**
 * Recordings Page - Call recording management with playback and transcription
 * Production-ready implementation with crypto trading dashboard aesthetic
 */

import { useState, useEffect, useRef } from 'react'
import { Download, Play, Pause, Search, Filter, Volume2, Zap, TrendingUp, CheckCircle2, AlertCircle, Clock, Phone, Headphones } from 'lucide-react'
import { apiClient } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { Alert } from '../components/Alert'
import { LoadingSpinner } from '../components/LoadingSpinner'

interface Recording {
  id: string
  conversation_id: string
  caller_name?: string
  phone_number?: string
  duration_seconds: number
  created_at: string
  transcription?: string
  sentiment_score?: number
  quality_score?: number
  tags?: string[]
  channel?: string
  status?: string
}

interface FilterState {
  searchTerm: string
  dateFrom?: string
  dateTo?: string
  durationMin?: number
  durationMax?: number
  sentiment?: string
  quality?: string
}

const QUALITY_LEVELS = {
  excellent: { label: 'Excellent', color: '#00ffaa', threshold: 0.9 },
  good: { label: 'Good', color: '#00d4ff', threshold: 0.7 },
  fair: { label: 'Fair', color: '#ffa500', threshold: 0.5 },
  poor: { label: 'Poor', color: '#ff6b6b', threshold: 0 },
}

const SENTIMENT_COLORS: Record<string, string> = {
  positive: '#00ffaa',
  neutral: '#00d4ff',
  negative: '#ff6b6b',
}

export default function Recordings() {
  const { user } = useAuth()
  const companyId = user?.company_id || ''

  // State for recordings list
  const [recordings, setRecordings] = useState<Recording[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // State for filtering and search
  const [filters, setFilters] = useState<FilterState>({ searchTerm: '' })
  const [showFilters, setShowFilters] = useState(false)

  // State for selected recording and playback
  const [selectedRecording, setSelectedRecording] = useState<Recording | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [playbackSpeed, setPlaybackSpeed] = useState(1)

  // State for pagination
  const [currentPage, setCurrentPage] = useState(0)
  const pageSize = 20

  // Fetch recordings
  useEffect(() => {
    if (!companyId) return

    const fetchRecordings = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await apiClient.listRecordings(
          companyId,
          filters.searchTerm || undefined,
          pageSize,
          currentPage * pageSize
        )
        setRecordings((Array.isArray(data) ? data : []) as Recording[])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load recordings')
        console.error('Failed to load recordings:', err)
      } finally {
        setLoading(false)
      }
    }

    const debounce = setTimeout(fetchRecordings, 300)
    return () => clearTimeout(debounce)
  }, [companyId, filters.searchTerm, currentPage])

  // Filter recordings based on filter state
  const filteredRecordings = recordings.filter(recording => {
    if (filters.durationMin !== undefined && recording.duration_seconds < filters.durationMin * 60) {
      return false
    }
    if (filters.durationMax !== undefined && recording.duration_seconds > filters.durationMax * 60) {
      return false
    }
    if (filters.sentiment && !getSentimentCategory(recording.sentiment_score || 0).includes(filters.sentiment)) {
      return false
    }
    if (filters.quality) {
      const quality = getQualityLevel(recording.quality_score || 0)
      if (quality !== filters.quality) return false
    }
    return true
  })

  // Handle playback
  const handlePlayPause = (recording: Recording) => {
    setSelectedRecording(recording)
    if (isPlaying) {
      audioRef.current?.pause()
      setIsPlaying(false)
    } else {
      audioRef.current?.play()
      setIsPlaying(true)
    }
  }

  const handleDownload = async (recording: Recording) => {
    try {
      const data = await apiClient.downloadRecording(recording.id)
      const blobData = data instanceof Blob ? data : new Blob([data as BlobPart])
      const url = window.URL.createObjectURL(blobData)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `recording-${recording.id}.wav`)
      document.body.appendChild(link)
      link.click()
      link.parentNode?.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Failed to download recording:', err)
      setError('Failed to download recording')
    }
  }

  // Utility functions
  function formatDuration(seconds: number): string {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = Math.round(seconds % 60)
    if (hrs > 0) return `${hrs}h ${mins}m`
    if (mins > 0) return `${mins}m ${secs}s`
    return `${secs}s`
  }

  function getQualityLevel(score: number): string {
    if (score >= QUALITY_LEVELS.excellent.threshold) return 'excellent'
    if (score >= QUALITY_LEVELS.good.threshold) return 'good'
    if (score >= QUALITY_LEVELS.fair.threshold) return 'fair'
    return 'poor'
  }

  function getSentimentCategory(score: number): string {
    if (score >= 0.6) return 'positive'
    if (score <= -0.6) return 'negative'
    return 'neutral'
  }

  function getQualityBadge(score?: number) {
    if (score === undefined) return null
    const level = getQualityLevel(score)
    const config = QUALITY_LEVELS[level as keyof typeof QUALITY_LEVELS]
    return { label: config.label, color: config.color }
  }

  return (
    <div style={{ background: '#0f1728', minHeight: '100vh', padding: '20px' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginTop: 0, marginBottom: '8px', color: '#fff' }}>
          Call Recordings
        </h1>
        <p style={{ fontSize: '14px', color: '#9ca3af', margin: 0 }}>
          {filteredRecordings.length} recordings
        </p>
      </div>

      {/* Stats Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '32px',
      }}>
        <div style={{
          background: 'linear-gradient(135deg, rgba(139,92,246,0.1) 0%, rgba(45,212,191,0.05) 100%)',
          border: '1px solid rgba(139,92,246,0.3)',
          borderRadius: '12px',
          padding: '20px',
        }}>
          <div style={{ fontSize: '12px', color: '#8b5cf6', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Headphones size={14} />
            Total Recordings
          </div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#fff' }}>
            {recordings.length}
          </div>
        </div>

        <div style={{
          background: 'linear-gradient(135deg, rgba(0,212,255,0.1) 0%, rgba(0,255,170,0.05) 100%)',
          border: '1px solid rgba(0,212,255,0.3)',
          borderRadius: '12px',
          padding: '20px',
        }}>
          <div style={{ fontSize: '12px', color: '#00d4ff', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Clock size={14} />
            Total Duration
          </div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#fff' }}>
            {formatDuration(recordings.reduce((sum, r) => sum + (r.duration_seconds || 0), 0))}
          </div>
        </div>

        <div style={{
          background: 'linear-gradient(135deg, rgba(0,255,170,0.1) 0%, rgba(255,107,107,0.05) 100%)',
          border: '1px solid rgba(0,255,170,0.3)',
          borderRadius: '12px',
          padding: '20px',
        }}>
          <div style={{ fontSize: '12px', color: '#00ffaa', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <TrendingUp size={14} />
            Avg Quality
          </div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#fff' }}>
            {recordings.length > 0
              ? ((recordings.reduce((sum, r) => sum + (r.quality_score || 0), 0) / recordings.length) * 100).toFixed(0)
              : '0'}%
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '20px', minHeight: '600px' }}>
        {/* Recordings List */}
        <div style={{
          background: 'rgba(15,23,42,0.6)',
          border: '1px solid rgba(45,212,191,0.2)',
          borderRadius: '12px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{
            padding: '16px 20px',
            borderBottom: '1px solid rgba(45,212,191,0.15)',
            display: 'flex',
            gap: '8px',
          }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={14} style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#9ca3af',
              }} />
              <input
                type="text"
                placeholder="Search recordings..."
                value={filters.searchTerm}
                onChange={(e) => {
                  setFilters({ ...filters, searchTerm: e.target.value })
                  setCurrentPage(0)
                }}
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
                  fontSize: '13px',
                  outline: 'none',
                }}
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              style={{
                padding: '8px 12px',
                background: showFilters ? 'rgba(45,212,191,0.2)' : 'rgba(45,212,191,0.05)',
                border: '1px solid rgba(45,212,191,0.2)',
                borderRadius: '6px',
                color: '#2dd4bf',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}>
              <Filter size={14} />
            </button>
          </div>

          {/* Filters */}
          {showFilters && (
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid rgba(45,212,191,0.15)',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px',
              fontSize: '12px',
            }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', color: '#9ca3af' }}>Min Duration (min)</label>
                <input
                  type="number"
                  value={filters.durationMin || ''}
                  onChange={(e) => setFilters({ ...filters, durationMin: e.target.value ? Number(e.target.value) : undefined })}
                  style={{
                    width: '100%',
                    padding: '6px 8px',
                    background: 'rgba(45,212,191,0.05)',
                    border: '1px solid rgba(45,212,191,0.2)',
                    borderRadius: '4px',
                    color: 'inherit',
                    fontSize: '12px',
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', color: '#9ca3af' }}>Max Duration (min)</label>
                <input
                  type="number"
                  value={filters.durationMax || ''}
                  onChange={(e) => setFilters({ ...filters, durationMax: e.target.value ? Number(e.target.value) : undefined })}
                  style={{
                    width: '100%',
                    padding: '6px 8px',
                    background: 'rgba(45,212,191,0.05)',
                    border: '1px solid rgba(45,212,191,0.2)',
                    borderRadius: '4px',
                    color: 'inherit',
                    fontSize: '12px',
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', color: '#9ca3af' }}>Sentiment</label>
                <select
                  value={filters.sentiment || ''}
                  onChange={(e) => setFilters({ ...filters, sentiment: e.target.value || undefined })}
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
                  <option value="">All</option>
                  <option value="positive">Positive</option>
                  <option value="neutral">Neutral</option>
                  <option value="negative">Negative</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', color: '#9ca3af' }}>Quality</label>
                <select
                  value={filters.quality || ''}
                  onChange={(e) => setFilters({ ...filters, quality: e.target.value || undefined })}
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
                  <option value="">All</option>
                  <option value="excellent">Excellent</option>
                  <option value="good">Good</option>
                  <option value="fair">Fair</option>
                  <option value="poor">Poor</option>
                </select>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={{ padding: '16px 20px' }}>
              <Alert type="error" message={error} dismissible />
            </div>
          )}

          {/* Recordings List */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {loading ? (
              <LoadingSpinner message="Loading recordings..." />
            ) : filteredRecordings.length === 0 ? (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                color: '#9ca3af',
                textAlign: 'center',
                padding: '20px',
              }}>
                <div>
                  <Headphones size={40} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                  <p>No recordings found</p>
                </div>
              </div>
            ) : (
              filteredRecordings.map((recording) => (
                <div
                  key={recording.id}
                  onClick={() => setSelectedRecording(recording)}
                  style={{
                    padding: '16px 20px',
                    borderBottom: '1px solid rgba(45,212,191,0.1)',
                    cursor: 'pointer',
                    background: selectedRecording?.id === recording.id ? 'rgba(45,212,191,0.15)' : 'transparent',
                    transition: 'background 0.2s',
                  }}>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '8px',
                        background: 'rgba(45,212,191,0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#2dd4bf',
                        flexShrink: 0,
                      }}>
                      <Volume2 size={16} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>
                        {recording.caller_name || 'Unknown Caller'}
                      </div>
                      <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '6px' }}>
                        {formatDuration(recording.duration_seconds)}
                      </div>
                      <div style={{ fontSize: '10px', color: '#9ca3af' }}>
                        {new Date(recording.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pagination */}
          {filteredRecordings.length > 0 && (
            <div style={{
              padding: '12px 20px',
              borderTop: '1px solid rgba(45,212,191,0.15)',
              display: 'flex',
              gap: '8px',
              justifyContent: 'center',
            }}>
              <button
                onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                disabled={currentPage === 0}
                style={{
                  padding: '6px 12px',
                  background: currentPage === 0 ? 'rgba(45,212,191,0.05)' : 'rgba(45,212,191,0.2)',
                  border: '1px solid rgba(45,212,191,0.2)',
                  borderRadius: '4px',
                  color: '#2dd4bf',
                  cursor: currentPage === 0 ? 'not-allowed' : 'pointer',
                  fontSize: '12px',
                  opacity: currentPage === 0 ? 0.5 : 1,
                }}>
                Prev
              </button>
              <span style={{ padding: '6px 12px', color: '#9ca3af', fontSize: '12px' }}>
                Page {currentPage + 1}
              </span>
              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                style={{
                  padding: '6px 12px',
                  background: 'rgba(45,212,191,0.2)',
                  border: '1px solid rgba(45,212,191,0.2)',
                  borderRadius: '4px',
                  color: '#2dd4bf',
                  cursor: 'pointer',
                  fontSize: '12px',
                }}>
                Next
              </button>
            </div>
          )}
        </div>

        {/* Recording Details */}
        <div style={{
          background: 'rgba(15,23,42,0.6)',
          border: '1px solid rgba(45,212,191,0.2)',
          borderRadius: '12px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}>
          {selectedRecording ? (
            <>
              {/* Header */}
              <div style={{
                padding: '20px',
                borderBottom: '1px solid rgba(45,212,191,0.15)',
              }}>
                <h3 style={{ fontSize: '16px', fontWeight: 600, marginTop: 0, marginBottom: '8px' }}>
                  {selectedRecording.caller_name || 'Unknown Caller'}
                </h3>
                <p style={{ fontSize: '12px', color: '#9ca3af', margin: 0 }}>
                  {new Date(selectedRecording.created_at).toLocaleString()}
                </p>
              </div>

              {/* Metadata */}
              <div style={{
                padding: '20px',
                borderBottom: '1px solid rgba(45,212,191,0.15)',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '16px',
              }}>
                <div>
                  <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '6px' }}>Duration</div>
                  <div style={{ fontSize: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Clock size={14} style={{ color: '#2dd4bf' }} />
                    {formatDuration(selectedRecording.duration_seconds)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '6px' }}>Quality</div>
                  <div style={{ fontSize: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CheckCircle2 size={14} style={{ color: getQualityBadge(selectedRecording.quality_score)?.color }} />
                    {getQualityBadge(selectedRecording.quality_score)?.label || 'Unknown'} {(selectedRecording.quality_score ? (selectedRecording.quality_score * 100).toFixed(0) : '0')}%
                  </div>
                </div>
                {selectedRecording.phone_number && (
                  <div>
                    <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '6px' }}>Phone</div>
                    <div style={{ fontSize: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Phone size={14} style={{ color: '#2dd4bf' }} />
                      {selectedRecording.phone_number}
                    </div>
                  </div>
                )}
                {selectedRecording.sentiment_score !== undefined && (
                  <div>
                    <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '6px' }}>Sentiment</div>
                    <div style={{ fontSize: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Zap size={14} style={{ color: SENTIMENT_COLORS[getSentimentCategory(selectedRecording.sentiment_score)] }} />
                      {getSentimentCategory(selectedRecording.sentiment_score)}
                    </div>
                  </div>
                )}
              </div>

              {/* Audio Player */}
              <div style={{
                padding: '20px',
                borderBottom: '1px solid rgba(45,212,191,0.15)',
              }}>
                <audio
                  ref={audioRef}
                  src={`data:audio/wav;base64,${selectedRecording.id}`}
                  onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
                  onEnded={() => setIsPlaying(false)}
                />

                <div style={{
                  display: 'flex',
                  gap: '12px',
                  marginBottom: '16px',
                  alignItems: 'center',
                }}>
                  <button
                    onClick={() => handlePlayPause(selectedRecording)}
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '8px',
                      background: 'rgba(45,212,191,0.2)',
                      border: '1px solid rgba(45,212,191,0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#2dd4bf',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}>
                    {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                  </button>

                  <div style={{ flex: 1 }}>
                    <input
                      type="range"
                      min="0"
                      max={selectedRecording.duration_seconds}
                      value={currentTime}
                      onChange={(e) => {
                        if (audioRef.current) {
                          audioRef.current.currentTime = Number(e.target.value)
                        }
                      }}
                      style={{
                        width: '100%',
                        cursor: 'pointer',
                      }}
                    />
                  </div>

                  <span style={{ fontSize: '12px', color: '#9ca3af', minWidth: '40px', textAlign: 'right' }}>
                    {formatDuration(currentTime)}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <label style={{ fontSize: '12px', color: '#9ca3af' }}>Speed:</label>
                  <select
                    value={playbackSpeed}
                    onChange={(e) => {
                      const speed = Number(e.target.value)
                      setPlaybackSpeed(speed)
                      if (audioRef.current) {
                        audioRef.current.playbackRate = speed
                      }
                    }}
                    style={{
                      padding: '6px 8px',
                      background: 'rgba(45,212,191,0.05)',
                      border: '1px solid rgba(45,212,191,0.2)',
                      borderRadius: '4px',
                      color: 'inherit',
                      fontSize: '12px',
                      cursor: 'pointer',
                    }}>
                    <option value="0.75">0.75x</option>
                    <option value="1">1x</option>
                    <option value="1.25">1.25x</option>
                    <option value="1.5">1.5x</option>
                    <option value="2">2x</option>
                  </select>

                  <button
                    onClick={() => handleDownload(selectedRecording)}
                    style={{
                      marginLeft: 'auto',
                      padding: '8px 12px',
                      background: 'rgba(45,212,191,0.2)',
                      border: '1px solid rgba(45,212,191,0.3)',
                      borderRadius: '6px',
                      color: '#2dd4bf',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '12px',
                      fontWeight: 600,
                      transition: 'all 0.2s',
                    }}>
                    <Download size={14} />
                    Download
                  </button>
                </div>
              </div>

              {/* Transcript */}
              {selectedRecording.transcription ? (
                <div style={{
                  padding: '20px',
                  flex: 1,
                  overflowY: 'auto',
                }}>
                  <h4 style={{ fontSize: '13px', fontWeight: 600, marginTop: 0, marginBottom: '12px', color: '#2dd4bf' }}>
                    Transcript
                  </h4>
                  <p style={{
                    fontSize: '13px',
                    lineHeight: '1.6',
                    color: '#d1d5db',
                    marginTop: 0,
                  }}>
                    {selectedRecording.transcription}
                  </p>
                </div>
              ) : (
                <div style={{
                  padding: '20px',
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#9ca3af',
                  textAlign: 'center',
                }}>
                  <div>
                    <AlertCircle size={32} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                    <p>No transcript available</p>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              color: '#9ca3af',
              textAlign: 'center',
            }}>
              <div>
                <Headphones size={48} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                <p>Select a recording to view details</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
