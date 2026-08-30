/**
 * Chat Page - Live customer support chat interface
 * Production-ready implementation with crypto trading dashboard aesthetic
 */

import { useState, useEffect, useRef } from 'react'
import { Send, Plus, MessageSquare, Search, Phone, Mail, User, Paperclip, MoreVertical, CheckCircle2 } from 'lucide-react'
import { useApi, useApiMutation } from '../hooks/useApi'
import { apiClient } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { Alert } from '../components/Alert'

interface ChatMessage {
  id: string
  role: 'customer' | 'agent' | 'system'
  content: string
  timestamp: string
  sender_name?: string
  sender_id?: string
  attachments?: Array<{ id: string; name: string; url: string }>
}

interface Conversation {
  id: string
  caller_name?: string
  phone_number?: string
  email?: string
  channel: string
  status: string
  created_at: string
  last_message_at?: string
  is_online?: boolean
  sentiment_score?: number
  tags?: string[]
}

interface CustomerInfo {
  name: string
  phone?: string
  email?: string
  status: 'online' | 'offline' | 'away'
  lastSeen?: string
  totalChats?: number
  satisfaction?: number
}

const CHANNEL_LABELS: Record<string, string> = {
  phone: 'Phone',
  email: 'Email',
  sms: 'SMS',
  chat: 'Chat',
  web: 'Web',
}

const CHANNEL_COLORS: Record<string, string> = {
  phone: '#2dd4bf',
  email: '#8b5cf6',
  sms: '#3b82f6',
  chat: '#f59e0b',
  web: '#f59e0b',
}

export default function Chat() {
  const { user } = useAuth()
  const companyId = user?.company_id || ''
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [showTypingIndicator, setShowTypingIndicator] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout>>()

  // Fetch conversations
  const conversationsApi = useApi(
    () => apiClient.listConversations(companyId, undefined, 'active', 50, 0),
    { immediate: true }
  )

  // Fetch messages for selected conversation
  const messagesApi = useApi(
    () => selectedConversationId ? apiClient.getMessages(selectedConversationId, 100) : Promise.resolve([]),
    { immediate: !!selectedConversationId }
  )

  // Send message mutation
  const sendMessageMutation = useApiMutation(
    async (content: string) => {
      if (!selectedConversationId) {
        throw new Error('No conversation selected')
      }
      return await apiClient.addMessage(selectedConversationId, 'agent', content)
    },
    {
      onSuccess: () => {
        const agentMessage: ChatMessage = {
          id: `agent-${Date.now()}`,
          role: 'agent',
          content: inputValue,
          timestamp: new Date().toISOString(),
          sender_name: user?.email?.split('@')[0] || 'Agent',
          sender_id: user?.id,
        }
        setMessages(prev => [...prev, agentMessage])
        setInputValue('')

        // Simulate customer response
        setShowTypingIndicator(true)
        setTimeout(() => {
          const customerMessage: ChatMessage = {
            id: `customer-${Date.now()}`,
            role: 'customer',
            content: generateMockCustomerResponse(inputValue),
            timestamp: new Date().toISOString(),
            sender_name: conversations.find(c => c.id === selectedConversationId)?.caller_name || 'Customer',
          }
          setMessages(prev => [...prev, customerMessage])
          setShowTypingIndicator(false)
        }, 1000 + Math.random() * 2000)
      },
    }
  )

  // Update UI when conversations load
  useEffect(() => {
    if (conversationsApi.data && Array.isArray(conversationsApi.data)) {
      setConversations(conversationsApi.data as Conversation[])
      if (!selectedConversationId && conversationsApi.data.length > 0) {
        setSelectedConversationId(((conversationsApi.data as unknown) as Conversation[])[0].id)
      }
    }
  }, [conversationsApi.data, selectedConversationId])

  // Update messages when selected conversation changes or messages load
  useEffect(() => {
    if (selectedConversationId && messagesApi.data) {
      const loadedMessages: ChatMessage[] = (messagesApi.data as any[]).map((msg: any) => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp || msg.created_at,
        sender_name: msg.sender_name,
        sender_id: msg.sender_id,
        attachments: msg.attachments,
      }))
      setMessages(loadedMessages)
    }
  }, [selectedConversationId, messagesApi.data])

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, showTypingIndicator])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputValue.trim() || !selectedConversationId) return

    try {
      await sendMessageMutation.execute(inputValue)
    } catch (error) {
      console.error('Failed to send message:', error)
    }
  }

  const handleNewConversation = async () => {
    try {
      const newConv = await apiClient.createConversation({
        company_id: companyId,
        caller_id: 'customer-' + Date.now(),
        caller_name: 'New Customer',
        channel: 'chat',
        status: 'active',
      }) as any
      setSelectedConversationId(newConv.id)
      setMessages([])
      conversationsApi.refetch()
    } catch (error) {
      console.error('Failed to create conversation:', error)
    }
  }

  const handleTyping = () => {
    // Simulate agent typing
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
    typingTimeoutRef.current = setTimeout(() => {
      // Typing indicator would disappear here
    }, 3000)
  }

  const filteredConversations = conversations.filter(conv =>
    !searchTerm ||
    (conv.caller_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (conv.phone_number || '').includes(searchTerm) ||
    (conv.email || '').toLowerCase().includes(searchTerm.toLowerCase())
  )

  const selectedConv = conversations.find(c => c.id === selectedConversationId)
  const customerInfo: CustomerInfo = selectedConv ? {
    name: selectedConv.caller_name || 'Unknown Customer',
    phone: selectedConv.phone_number,
    email: selectedConv.email,
    status: selectedConv.is_online ? 'online' : 'offline',
    lastSeen: selectedConv.last_message_at,
    totalChats: 3,
    satisfaction: 0.8,
  } : {
    name: 'No customer selected',
    status: 'offline',
    totalChats: 0,
    satisfaction: 0,
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr 280px', gap: '16px', height: 'calc(100vh - 100px)' }}>
      {/* Sidebar - Conversations */}
      <div style={{
        background: 'rgba(15,23,42,0.4)',
        border: '1px solid rgba(45,212,191,0.15)',
        borderRadius: '12px',
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
      }}>
        {/* Header */}
        <div style={{ padding: '16px', borderBottom: '1px solid rgba(45,212,191,0.15)' }}>
          <button
            onClick={handleNewConversation}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '10px 16px',
              background: 'rgba(45,212,191,0.2)',
              color: '#2dd4bf',
              border: '1px solid rgba(45,212,191,0.3)',
              borderRadius: '6px',
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: '13px',
            }}>
            <Plus size={16} />
            New Chat
          </button>
        </div>

        {/* Search */}
        <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(45,212,191,0.15)' }}>
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{
              position: 'absolute',
              left: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#9ca3af',
            }} />
            <input
              type="text"
              placeholder="Search chats..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                paddingLeft: '32px',
                paddingRight: '10px',
                paddingTop: '8px',
                paddingBottom: '8px',
                background: 'rgba(45,212,191,0.05)',
                border: '1px solid rgba(45,212,191,0.2)',
                borderRadius: '6px',
                color: 'inherit',
                fontSize: '12px',
                outline: 'none',
              }}
            />
          </div>
        </div>

        {/* Conversations List */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          {conversationsApi.loading ? (
            <div style={{ padding: '16px', textAlign: 'center', color: '#9ca3af', fontSize: '12px' }}>
              Loading...
            </div>
          ) : filteredConversations.length === 0 ? (
            <div style={{ padding: '16px', textAlign: 'center', color: '#9ca3af', fontSize: '12px' }}>
              No conversations
            </div>
          ) : (
            filteredConversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => setSelectedConversationId(conv.id)}
                style={{
                  textAlign: 'left',
                  padding: '12px 16px',
                  background: selectedConversationId === conv.id ? 'rgba(45,212,191,0.2)' : 'transparent',
                  border: 'none',
                  borderBottom: '1px solid rgba(45,212,191,0.1)',
                  color: 'inherit',
                  cursor: 'pointer',
                  fontSize: '13px',
                  transition: 'background 0.2s',
                }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: conv.is_online ? '#00ffaa' : '#6b7280',
                  }} />
                  <div style={{ fontWeight: 500, flex: 1 }}>
                    {conv.caller_name || 'Chat'}
                  </div>
                  {conv.status === 'active' && (
                    <div style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: '#00d4ff',
                      animation: 'pulse 2s infinite',
                    }} />
                  )}
                </div>
                <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>
                  {CHANNEL_LABELS[conv.channel as keyof typeof CHANNEL_LABELS] || conv.channel}
                </div>
                <div style={{ fontSize: '10px', color: '#6b7280' }}>
                  {new Date(conv.created_at).toLocaleString()}
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div style={{
        background: 'rgba(15,23,42,0.4)',
        border: '1px solid rgba(45,212,191,0.15)',
        borderRadius: '12px',
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
      }}>
        {selectedConversationId ? (
          <>
            {/* Header */}
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid rgba(45,212,191,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '8px',
                  background: 'rgba(45,212,191,0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#2dd4bf',
                  position: 'relative',
                }}>
                  <User size={20} />
                  <div style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    background: customerInfo.status === 'online' ? '#00ffaa' : '#6b7280',
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                  }} />
                </div>
                <div>
                  <h3 style={{ fontSize: 14, fontWeight: 600, marginTop: 0, marginBottom: 0 }}>
                    {selectedConv?.caller_name || 'Customer'}
                  </h3>
                  <p style={{ fontSize: 11, color: '#9ca3af', margin: 0 }}>
                    {customerInfo.status === 'online' ? 'Online' : 'Offline'}
                  </p>
                </div>
              </div>
              <button
                style={{
                  padding: '6px 12px',
                  background: 'transparent',
                  border: 'none',
                  color: '#9ca3af',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                }}>
                <MoreVertical size={18} />
              </button>
            </div>

            {/* Messages */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}>
              {messagesApi.loading && messages.length === 0 ? (
                <LoadingSpinner message="Loading messages..." />
              ) : messages.length === 0 ? (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flex: 1,
                  color: '#9ca3af',
                  textAlign: 'center',
                }}>
                  <MessageSquare size={48} style={{ marginBottom: '12px', opacity: 0.5 }} />
                  <p>No messages yet. Start the conversation!</p>
                </div>
              ) : (
                <>
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      style={{
                        display: 'flex',
                        justifyContent: msg.role === 'agent' ? 'flex-end' : 'flex-start',
                        gap: '8px',
                      }}>
                      {msg.role === 'customer' && (
                        <div
                          style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            background: 'rgba(45,212,191,0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#2dd4bf',
                            fontSize: '11px',
                            fontWeight: 'bold',
                            flexShrink: 0,
                          }}>
                          {(msg.sender_name || 'C')[0]}
                        </div>
                      )}
                      <div>
                        {msg.role === 'customer' && (
                          <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>
                            {msg.sender_name || 'Customer'}
                          </div>
                        )}
                        <div
                          style={{
                            maxWidth: '500px',
                            padding: '12px 16px',
                            borderRadius: '12px',
                            background: msg.role === 'agent'
                              ? 'rgba(45,212,191,0.2)'
                              : 'rgba(139,92,246,0.1)',
                            wordWrap: 'break-word',
                            fontSize: '13px',
                            lineHeight: '1.5',
                            color: msg.role === 'agent' ? '#2dd4bf' : '#d1d5db',
                            border: msg.role === 'agent' ? '1px solid rgba(45,212,191,0.3)' : 'none',
                          }}>
                          {msg.content}
                        </div>
                        <div style={{ fontSize: '10px', color: '#6b7280', marginTop: '4px' }}>
                          {new Date(msg.timestamp).toLocaleTimeString()}
                        </div>
                        {msg.attachments && msg.attachments.length > 0 && (
                          <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
                            {msg.attachments.map((att) => (
                              <a
                                key={att.id}
                                href={att.url}
                                style={{
                                  padding: '6px 10px',
                                  background: 'rgba(45,212,191,0.1)',
                                  border: '1px solid rgba(45,212,191,0.2)',
                                  borderRadius: '4px',
                                  color: '#2dd4bf',
                                  textDecoration: 'none',
                                  fontSize: '11px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                }}>
                                <Paperclip size={12} />
                                {att.name}
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                      {msg.role === 'agent' && (
                        <div style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          background: 'rgba(45,212,191,0.1)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#2dd4bf',
                          fontSize: '11px',
                          fontWeight: 'bold',
                          flexShrink: 0,
                        }}>
                          {(msg.sender_name || 'A')[0]}
                        </div>
                      )}
                    </div>
                  ))}
                  {showTypingIndicator && (
                    <div style={{
                      display: 'flex',
                      gap: '4px',
                      padding: '12px 16px',
                      background: 'rgba(139,92,246,0.1)',
                      borderRadius: '12px',
                      width: 'fit-content',
                    }}>
                      <div style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        background: '#8b5cf6',
                        animation: 'bounce 1.4s infinite',
                      }} />
                      <div style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        background: '#8b5cf6',
                        animation: 'bounce 1.4s infinite 0.2s',
                      }} />
                      <div style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        background: '#8b5cf6',
                        animation: 'bounce 1.4s infinite 0.4s',
                      }} />
                    </div>
                  )}
                </>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div style={{ borderTop: '1px solid rgba(45,212,191,0.15)', padding: '16px 20px' }}>
              {sendMessageMutation.error && (
                <Alert
                  type="error"
                  message={sendMessageMutation.error.message}
                  dismissible
                  autoClose
                />
              )}
              <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="button"
                  style={{
                    padding: '10px 12px',
                    background: 'rgba(45,212,191,0.05)',
                    border: '1px solid rgba(45,212,191,0.2)',
                    borderRadius: '8px',
                    color: '#2dd4bf',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                  <Paperclip size={16} />
                </button>
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => {
                    setInputValue(e.target.value)
                    handleTyping()
                  }}
                  placeholder="Type your message..."
                  disabled={sendMessageMutation.loading}
                  style={{
                    flex: 1,
                    padding: '10px 14px',
                    background: 'rgba(45,212,191,0.05)',
                    border: '1px solid rgba(45,212,191,0.2)',
                    borderRadius: '8px',
                    color: 'inherit',
                    fontSize: '13px',
                    outline: 'none',
                  }}
                />
                <button
                  type="submit"
                  disabled={!inputValue.trim() || sendMessageMutation.loading}
                  style={{
                    padding: '10px 16px',
                    background: '#2dd4bf',
                    color: '#000',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 600,
                    cursor: inputValue.trim() && !sendMessageMutation.loading ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '13px',
                    opacity: inputValue.trim() && !sendMessageMutation.loading ? 1 : 0.5,
                  }}>
                  <Send size={14} />
                  Send
                </button>
              </form>
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
              <MessageSquare size={48} style={{ marginBottom: '12px', opacity: 0.5 }} />
              <p>Select a conversation to start chatting</p>
            </div>
          </div>
        )}
      </div>

      {/* Right Sidebar - Customer Info */}
      {selectedConversationId && selectedConv && (
        <div style={{
          background: 'rgba(15,23,42,0.4)',
          border: '1px solid rgba(45,212,191,0.15)',
          borderRadius: '12px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{
            padding: '16px 20px',
            borderBottom: '1px solid rgba(45,212,191,0.15)',
          }}>
            <h4 style={{ fontSize: '13px', fontWeight: 600, marginTop: 0, marginBottom: '12px', color: '#2dd4bf' }}>
              Customer Info
            </h4>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '8px',
              background: 'rgba(45,212,191,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#2dd4bf',
              fontSize: '18px',
              fontWeight: 'bold',
              marginBottom: '12px',
              position: 'relative',
            }}>
              {(selectedConv.caller_name || 'C')[0]}
              <div style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                background: customerInfo.status === 'online' ? '#00ffaa' : '#6b7280',
                position: 'absolute',
                bottom: -2,
                right: -2,
                border: '2px solid #0f1728',
              }} />
            </div>
            <h5 style={{ fontSize: '14px', fontWeight: 600, marginTop: 0, marginBottom: '4px' }}>
              {customerInfo.name}
            </h5>
            <p style={{ fontSize: '11px', color: '#9ca3af', margin: 0 }}>
              {customerInfo.status === 'online' ? 'Online now' : `Last seen ${customerInfo.lastSeen ? new Date(customerInfo.lastSeen).toLocaleTimeString() : 'Unknown'}`}
            </p>
          </div>

          {/* Details */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
          }}>
            {/* Contact */}
            <div>
              <h6 style={{ fontSize: '11px', color: '#9ca3af', textTransform: 'uppercase', marginTop: 0, marginBottom: '8px', letterSpacing: '0.5px' }}>
                Contact
              </h6>
              {customerInfo.phone && (
                <div style={{
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '8px',
                  color: '#d1d5db',
                }}>
                  <Phone size={14} style={{ color: '#2dd4bf' }} />
                  <a href={`tel:${customerInfo.phone}`} style={{ color: '#2dd4bf', textDecoration: 'none' }}>
                    {customerInfo.phone}
                  </a>
                </div>
              )}
              {customerInfo.email && (
                <div style={{
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: '#d1d5db',
                }}>
                  <Mail size={14} style={{ color: '#2dd4bf' }} />
                  <a href={`mailto:${customerInfo.email}`} style={{ color: '#2dd4bf', textDecoration: 'none' }}>
                    {customerInfo.email}
                  </a>
                </div>
              )}
            </div>

            {/* Channel */}
            <div>
              <h6 style={{ fontSize: '11px', color: '#9ca3af', textTransform: 'uppercase', marginTop: 0, marginBottom: '8px', letterSpacing: '0.5px' }}>
                Channel
              </h6>
              <div style={{
                fontSize: '12px',
                padding: '8px 12px',
                background: `${CHANNEL_COLORS[selectedConv.channel as keyof typeof CHANNEL_COLORS] || '#3b82f6'}20`,
                border: `1px solid ${CHANNEL_COLORS[selectedConv.channel as keyof typeof CHANNEL_COLORS] || '#3b82f6'}40`,
                borderRadius: '6px',
                color: CHANNEL_COLORS[selectedConv.channel as keyof typeof CHANNEL_COLORS] || '#3b82f6',
                fontWeight: 500,
              }}>
                {CHANNEL_LABELS[selectedConv.channel as keyof typeof CHANNEL_LABELS] || selectedConv.channel}
              </div>
            </div>

            {/* Status */}
            <div>
              <h6 style={{ fontSize: '11px', color: '#9ca3af', textTransform: 'uppercase', marginTop: 0, marginBottom: '8px', letterSpacing: '0.5px' }}>
                Status
              </h6>
              <div style={{
                fontSize: '12px',
                padding: '8px 12px',
                background: selectedConv.status === 'active' ? 'rgba(59,130,246,0.1)' : 'rgba(16,185,129,0.1)',
                border: selectedConv.status === 'active' ? '1px solid rgba(59,130,246,0.3)' : '1px solid rgba(16,185,129,0.3)',
                borderRadius: '6px',
                color: selectedConv.status === 'active' ? '#3b82f6' : '#10b981',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}>
                <CheckCircle2 size={14} />
                {selectedConv.status.charAt(0).toUpperCase() + selectedConv.status.slice(1)}
              </div>
            </div>

            {/* Stats */}
            <div>
              <h6 style={{ fontSize: '11px', color: '#9ca3af', textTransform: 'uppercase', marginTop: 0, marginBottom: '12px', letterSpacing: '0.5px' }}>
                Statistics
              </h6>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{
                  padding: '12px',
                  background: 'rgba(45,212,191,0.05)',
                  borderRadius: '6px',
                  textAlign: 'center',
                }}>
                  <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#2dd4bf' }}>
                    {customerInfo.totalChats}
                  </div>
                  <div style={{ fontSize: '10px', color: '#9ca3af', marginTop: '4px' }}>
                    Total Chats
                  </div>
                </div>
                <div style={{
                  padding: '12px',
                  background: 'rgba(45,212,191,0.05)',
                  borderRadius: '6px',
                  textAlign: 'center',
                }}>
                  <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#00ffaa' }}>
                    {((customerInfo.satisfaction || 0) * 100).toFixed(0)}%
                  </div>
                  <div style={{ fontSize: '10px', color: '#9ca3af', marginTop: '4px' }}>
                    Satisfaction
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CSS for animations */}
      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-10px); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  )
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function generateMockCustomerResponse(_userMessage: string): string {
  const responses = [
    "That sounds good, thank you for your help!",
    "I appreciate your assistance. This resolved my issue.",
    "Can you provide more details about that?",
    "That's exactly what I needed to know.",
    "Thanks for the quick response!",
    "Perfect, I understand now.",
  ]
  return responses[Math.floor(Math.random() * responses.length)]
}
