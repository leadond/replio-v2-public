/**
 * API Types - Central TypeScript definitions for all data models and API responses
 */

// ============================================================================
// AUTH TYPES
// ============================================================================

export interface User {
  id: string
  email: string
  full_name?: string
  is_active?: boolean
  created_at?: string
  updated_at?: string
}

export interface Token {
  access_token: string
  token_type: string
}

export interface AuthResponse {
  access_token: string
  token_type: string
}

export interface UserLogin {
  email: string
  password: string
}

// ============================================================================
// CALLER/CONTACT TYPES
// ============================================================================

export interface Caller {
  id: string
  company_id: string
  name: string
  phone_number: string
  email?: string
  status?: 'active' | 'inactive' | 'blocked'
  notes?: string
  created_at?: string
  updated_at?: string
  call_count?: number
  last_call_date?: string
  is_blocked?: boolean
}

export interface CallerCreate {
  company_id: string
  name: string
  phone_number: string
  email?: string
  notes?: string
}

export interface CallerUpdate {
  name?: string
  email?: string
  notes?: string
  status?: string
}

export interface CallerStatistics {
  total_calls: number
  total_duration_seconds: number
  avg_duration_seconds: number
  last_call_date?: string
  sentiment_average?: number
}

// ============================================================================
// CONVERSATION / INBOX TYPES
// ============================================================================

export interface Conversation {
  id: string
  company_id: string
  caller_id: string
  channel: 'phone' | 'email' | 'sms' | 'chat' | 'web'
  status: 'active' | 'completed' | 'escalated' | 'archived'
  duration_seconds?: number
  transcript?: string
  summary?: string
  sentiment_score?: number
  outcome?: string
  created_at: string
  updated_at?: string
  caller_name?: string
  phone_number?: string
}

export interface ConversationCreate {
  company_id: string
  caller_id: string
  channel: string
  status?: string
}

export interface ConversationRead {
  id: string
  company_id: string
  caller_id: string
  channel: string
  status: string
  duration_seconds?: number
  transcript?: string
  summary?: string
  sentiment_score?: number
  outcome?: string
  created_at: string
  updated_at?: string
}

export interface Message {
  id: string
  conversation_id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: string
  created_at?: string
}

export interface MessageCreate {
  role: 'user' | 'assistant' | 'system'
  content: string
}

// ============================================================================
// DASHBOARD TYPES
// ============================================================================

export interface DashboardStats {
  total_calls: number
  total_conversations: number
  total_callers: number
  avg_conversation_duration_seconds: number
  total_messages: number
  avg_response_time_ms?: number
  system_health?: SystemHealthStatus
  channel_distribution?: ChannelDistribution[]
  sentiment_average?: number
}

export interface SystemHealthStatus {
  uptime_percentage: number
  api_response_time_ms: number
  database_status: 'healthy' | 'degraded' | 'down'
  ai_services_status: 'online' | 'offline'
  last_checked_at?: string
}

export interface ChannelDistribution {
  channel: string
  count: number
  percentage: number
}

export interface ConversationTrend {
  date: string
  count: number
  avg_duration: number
}

export interface ConversationTrendResponse {
  trends: ConversationTrend[]
  total_conversations: number
  avg_duration_seconds: number
}

export interface TopCaller {
  caller_id: string
  name: string
  phone_number: string
  call_count: number
  total_duration_seconds: number
}

export interface SentimentTrend {
  date: string
  average_sentiment: number
  positive_count: number
  neutral_count: number
  negative_count: number
}

export interface SentimentTrendResponse {
  trends: SentimentTrend[]
  overall_average: number
}

// ============================================================================
// RECORDING TYPES
// ============================================================================

export interface Recording {
  id: string
  conversation_id: string
  duration_seconds: number
  file_size_mb: number
  format: string
  transcription_status: 'pending' | 'processing' | 'completed' | 'failed'
  transcription?: string
  created_at: string
}

// ============================================================================
// ESCALATION TYPES
// ============================================================================

export interface Escalation {
  id: string
  conversation_id: string
  reason: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  status: 'pending' | 'assigned' | 'in_progress' | 'resolved'
  assigned_to?: string
  created_at: string
  updated_at?: string
}

// ============================================================================
// SETTINGS TYPES
// ============================================================================

export interface CompanySettings {
  id?: string
  company_id: string
  company_name: string
  phone_number?: string
  email?: string
  website?: string
  industry?: string
  timezone?: string
  language?: string
  max_callers_queue?: number
  enable_ai_responses?: boolean
  enable_escalation?: boolean
  enable_sms?: boolean
  enable_email?: boolean
}

// ============================================================================
// AUDIT LOG TYPES
// ============================================================================

export interface AuditLog {
  id: string
  company_id: string
  action: string
  entity_type: string
  entity_id: string
  changes?: Record<string, any>
  user_id?: string
  timestamp: string
}

// ============================================================================
// ERROR TYPES
// ============================================================================

export interface ApiError {
  code: string
  message: string
  details?: Record<string, any>
  status?: number
}

export class ApiErrorClass extends Error {
  code: string
  status: number
  details?: Record<string, any>

  constructor(code: string, message: string, status: number = 500, details?: Record<string, any>) {
    super(message)
    this.code = code
    this.status = status
    this.details = details
    this.name = 'ApiError'
  }
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface ApiResponse<T> {
  data?: T
  error?: ApiError
  success: boolean
  message?: string
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  limit: number
  offset: number
  has_more: boolean
}

// ============================================================================
// ACTIVITY LOG TYPES
// ============================================================================

export interface Activity {
  id?: string
  type: 'call' | 'email' | 'escalation' | 'chat' | 'other'
  description: string
  time: string
  status: 'completed' | 'pending' | 'failed'
  icon?: any
}
