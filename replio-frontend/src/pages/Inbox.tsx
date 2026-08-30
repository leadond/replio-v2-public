/**
 * Inbox Page - Multi-channel conversation management
 */

import React, { useState, useEffect } from 'react'
import { Mail, MessageSquare, Phone, MessageCircle, Search, Archive, Eye } from 'lucide-react'
import { apiClient } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { Alert } from '../components/Alert'

interface Conversation {
  id: string
  caller_name?: string
  phone_number?: string
  channel: string
  status: string
  created_at: string
  duration_seconds?: number
  sentiment_score?: number
}

interface ConversationWithCaller extends Conversation {
  caller_name?: string
}

const CHANNEL_ICONS: Record<string, React.ReactNode> = {
  phone: <Phone size={16} />,
  email: <Mail size={16} />,
  sms: <MessageSquare size={16} />,
  chat: <MessageCircle size={16} />,
  web: <MessageCircle size={16} />,
}

const CHANNEL_COLORS: Record<string, string> = {
  phone: '#2dd4bf',
  email: '#8b5cf6',
  sms: '#3b82f6',
  chat: '#f59e0b',
  web: '#f59e0b',
}

export default function Inbox() {
  const { user } = useAuth()
  const companyId = user?.company_id || ''

  const [conversations, setConversations] = useState<ConversationWithCaller[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [selectedConversation, setSelectedConversation] = useState<ConversationWithCaller | null>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [messagesLoading, setMessagesLoading] = useState(false)

  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterChannel, setFilterChannel] = useState<string>('all')

  // Fetch conversations when companyId is available
  useEffect(() => {
    if (!companyId) return

    const fetchConversations = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await apiClient.listConversations(
          companyId,
          undefined,
          filterStatus === 'all' ? undefined : filterStatus,
          50,
          0
        )
        setConversations(data || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load conversations')
      } finally {
        setLoading(false)
      }
    }

    fetchConversations()
  }, [companyId, filterStatus])

  // Fetch messages for selected conversation
  useEffect(() => {
    if (!selectedConversation) return

    const fetchMessages = async () => {
      try {
        setMessagesLoading(true)
        const data = await apiClient.getMessages(selectedConversation.id, 100)
        setMessages(data || [])
      } catch (err) {
        console.error('Failed to load messages:', err)
      } finally {
        setMessagesLoading(false)
      }
    }

    fetchMessages()
  }, [selectedConversation])

  // Filter conversations
  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = !searchTerm ||
      (conv.caller_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (conv.phone_number || '').includes(searchTerm)
    const matchesChannel = filterChannel === 'all' || conv.channel === filterChannel
    return matchesSearch && matchesChannel
  })

  const handleArchive = async (conversationId: string) => {
    try {
      await apiClient.updateConversation(conversationId, { status: 'archived' })
      // Refresh conversations list
      const data = await apiClient.listConversations(
        companyId,
        undefined,
        filterStatus === 'all' ? undefined : filterStatus,
        50,
        0
      )
      setConversations(data || [])
    } catch (err) {
      console.error('Failed to archive conversation:', err)
    }
  }

  function formatDuration(seconds: number): string {
    if (!seconds) return '0s'
    const mins = Math.floor(seconds / 60)
    const secs = Math.round(seconds % 60)
    if (mins === 0) return `${secs}s`
    return `${mins}m ${secs}s`
  }

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 100px)', gap: '16px' }}>
      {/* Conversations List */}
      <div style={{
        flex: 1,
        minWidth: 0,
        background: 'rgba(15,23,42,0.4)',
        border: '1px solid rgba(45,212,191,0.15)',
        borderRadius: '12px',
        display: 'flex',
        flexDirection: 'column',
      }}>
        <div style={{ padding: '20px', borderBottom: '1px solid rgba(45,212,191,0.15)' }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginTop: 0, marginBottom: 16 }}>
            Conversations
          </h2>

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
              placeholder="Search by name or phone..."
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
                padding: '8px 12px',
                background: 'rgba(45,212,191,0.05)',
                border: '1px solid rgba(45,212,191,0.2)',
                borderRadius: '6px',
                color: 'inherit',
                fontSize: '12px',
                cursor: 'pointer',
              }}>
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="escalated">Escalated</option>
            </select>

            <select
              value={filterChannel}
              onChange={(e) => setFilterChannel(e.target.value)}
              style={{
                padding: '8px 12px',
                background: 'rgba(45,212,191,0.05)',
                border: '1px solid rgba(45,212,191,0.2)',
                borderRadius: '6px',
                color: 'inherit',
                fontSize: '12px',
                cursor: 'pointer',
              }}>
              <option value="all">All Channels</option>
              <option value="phone">Phone</option>
              <option value="email">Email</option>
              <option value="sms">SMS</option>
              <option value="chat">Chat</option>
            </select>
          </div>
        </div>

        {/* Error display */}
        {error && (
          <div style={{ padding: '20px' }}>
            <Alert type="error" message={error} dismissible />
          </div>
        )}

        {/* Conversations list */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
        }}>
          {loading ? (
            <div style={{ padding: '20px', color: '#9ca3af' }}>Loading conversations...</div>
          ) : filteredConversations.length === 0 ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flex: 1,
              color: '#9ca3af',
              textAlign: 'center',
              padding: '20px',
            }}>
              <div>
                <MessageCircle size={40} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                <p>No conversations found</p>
              </div>
            </div>
          ) : (
            filteredConversations.map((conv) => (
              <div
                key={conv.id}
                onClick={() => setSelectedConversation(conv)}
                style={{
                  padding: '12px 16px',
                  borderBottom: '1px solid rgba(45,212,191,0.1)',
                  cursor: 'pointer',
                  background: selectedConversation?.id === conv.id ? 'rgba(45,212,191,0.15)' : 'transparent',
                  transition: 'background 0.2s',
                }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '8px',
                      background: `${CHANNEL_COLORS[conv.channel as keyof typeof CHANNEL_COLORS] || '#3b82f6'}33`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: CHANNEL_COLORS[conv.channel as keyof typeof CHANNEL_COLORS] || '#3b82f6',
                      flexShrink: 0,
                    }}>
                    {CHANNEL_ICONS[conv.channel as keyof typeof CHANNEL_ICONS] || <MessageCircle size={16} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <div style={{ fontSize: '13px', fontWeight: 600 }}>{conv.caller_name || 'Unknown'}</div>
                      <div style={{
                        fontSize: '11px',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        background: conv.status === 'active' ? 'rgba(59,130,246,0.1)' : 'rgba(16,185,129,0.1)',
                        color: conv.status === 'active' ? '#3b82f6' : '#10b981',
                      }}>
                        {conv.status}
                      </div>
                    </div>
                    <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>
                      {conv.phone_number || conv.channel}
                    </div>
                    <div style={{ fontSize: '12px', color: '#9ca3af', opacity: 0.8 }}>
                      {new Date(conv.created_at).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Conversation Details */}
      <div style={{
        flex: 1.5,
        minWidth: 0,
        background: 'rgba(15,23,42,0.4)',
        border: '1px solid rgba(45,212,191,0.15)',
        borderRadius: '12px',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {selectedConversation ? (
          <>
            {/* Header */}
            <div style={{
              padding: '20px',
              borderBottom: '1px solid rgba(45,212,191,0.15)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 600, marginTop: 0, marginBottom: '4px' }}>
                  {selectedConversation.caller_name || 'Unknown Caller'}
                </h3>
                <p style={{ fontSize: 12, color: '#9ca3af', margin: 0 }}>
                  {selectedConversation.phone_number || selectedConversation.channel}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  style={{
                    padding: '6px 12px',
                    background: 'rgba(45,212,191,0.1)',
                    border: 'none',
                    borderRadius: '6px',
                    color: '#2dd4bf',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: 500,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}>
                  <Eye size={14} />
                  View
                </button>
                <button
                  onClick={() => handleArchive(selectedConversation.id)}
                  style={{
                    padding: '6px 12px',
                    background: 'rgba(45,212,191,0.1)',
                    border: 'none',
                    borderRadius: '6px',
                    color: '#2dd4bf',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: 500,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}>
                  <Archive size={14} />
                  Archive
                </button>
              </div>
            </div>

            {/* Messages */}
            {messagesLoading ? (
              <div style={{ flex: 1, padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ color: '#9ca3af' }}>Loading messages...</div>
              </div>
            ) : (
              <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}>
                {messages.length === 0 ? (
                  <p style={{ color: '#9ca3af', textAlign: 'center', marginTop: 'auto', marginBottom: 'auto' }}>
                    No messages in this conversation
                  </p>
                ) : (
                  messages.map((msg, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                      }}>
                      <div
                        style={{
                          maxWidth: '70%',
                          padding: '12px 16px',
                          borderRadius: '8px',
                          background: msg.role === 'user' ? 'rgba(59,130,246,0.2)' : 'rgba(45,212,191,0.1)',
                          color: msg.role === 'user' ? '#3b82f6' : 'inherit',
                          fontSize: '13px',
                        }}>
                        {msg.content}
                        <div style={{
                          fontSize: '11px',
                          marginTop: '4px',
                          opacity: 0.7,
                        }}>
                          {new Date(msg.timestamp || msg.created_at).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Info section */}
            <div style={{
              borderTop: '1px solid rgba(45,212,191,0.15)',
              padding: '16px 20px',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px',
              fontSize: '12px',
            }}>
              <div>
                <div style={{ color: '#9ca3af', marginBottom: '4px' }}>Duration</div>
                <div style={{ fontWeight: 600 }}>{selectedConversation.duration_seconds ? formatDuration(selectedConversation.duration_seconds) : '-'}</div>
              </div>
              <div>
                <div style={{ color: '#9ca3af', marginBottom: '4px' }}>Sentiment</div>
                <div style={{ fontWeight: 600 }}>{selectedConversation.sentiment_score ? selectedConversation.sentiment_score.toFixed(2) : '-'}</div>
              </div>
            </div>
          </>
        ) : (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flex: 1,
            color: '#9ca3af',
            textAlign: 'center',
          }}>
            <div>
              <MessageCircle size={48} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
              <p>Select a conversation to view details</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
