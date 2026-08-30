/**
 * API Client - Production-ready HTTP client with authentication, error handling, and retry logic
 */

import { ApiError, ApiErrorClass, Token } from './types'

// Configuration
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
const REQUEST_TIMEOUT = 30000 // 30 seconds
const MAX_RETRIES = 3
const RETRY_DELAY = 1000 // 1 second
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

// Cache for GET requests
interface CacheEntry {
  data: any
  timestamp: number
}

const cache = new Map<string, CacheEntry>()

// Error codes for different scenarios
enum ErrorCode {
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT = 'REQUEST_TIMEOUT',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * Get stored auth token
 */
export function getAuthToken(): string | null {
  return localStorage.getItem('token')
}

/**
 * Set auth token
 */
export function setAuthToken(token: string): void {
  localStorage.setItem('token', token)
}

/**
 * Clear auth token
 */
export function clearAuthToken(): void {
  localStorage.removeItem('token')
  cache.clear()
}

/**
 * Check if token is expired (basic check based on stored expiry)
 */
export function isTokenExpired(): boolean {
  const expiry = localStorage.getItem('token_expiry')
  if (!expiry) return false
  return new Date().getTime() > parseInt(expiry)
}

/**
 * Format error message for user display
 */
function formatErrorMessage(code: string, _status?: number, details?: any): string {
  const messages: Record<string, string> = {
    [ErrorCode.NETWORK_ERROR]: 'Network error. Please check your connection.',
    [ErrorCode.TIMEOUT]: 'Request timeout. Please try again.',
    [ErrorCode.UNAUTHORIZED]: 'Your session has expired. Please log in again.',
    [ErrorCode.FORBIDDEN]: 'You do not have permission to access this resource.',
    [ErrorCode.NOT_FOUND]: 'The requested resource was not found.',
    [ErrorCode.VALIDATION_ERROR]: `Invalid input: ${details?.message || 'Please check your data'}`,
    [ErrorCode.SERVER_ERROR]: 'Server error. Please try again later.',
    [ErrorCode.UNKNOWN_ERROR]: 'An unexpected error occurred. Please try again.',
  }

  return messages[code] || `Error: ${code}`
}

/**
 * Parse API error response
 */
async function parseErrorResponse(response: Response): Promise<ApiError> {
  try {
    const data = await response.json()
    if (data.error) {
      return {
        code: data.error.code || `HTTP_${response.status}`,
        message: data.error.message || response.statusText,
        details: data.error.details,
        status: response.status,
      }
    }
    if (data.detail) {
      // FastAPI error format
      return {
        code: `HTTP_${response.status}`,
        message: typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail),
        status: response.status,
      }
    }
    return {
      code: `HTTP_${response.status}`,
      message: response.statusText,
      status: response.status,
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {
    return {
      code: `HTTP_${response.status}`,
      message: response.statusText,
      status: response.status,
    }
  }
}

/**
 * Determine error code from response
 */
function getErrorCode(status: number): string {
  if (status === 401) return ErrorCode.UNAUTHORIZED
  if (status === 403) return ErrorCode.FORBIDDEN
  if (status === 404) return ErrorCode.NOT_FOUND
  if (status === 422 || status === 400) return ErrorCode.VALIDATION_ERROR
  if (status >= 500) return ErrorCode.SERVER_ERROR
  return ErrorCode.UNKNOWN_ERROR
}

/**
 * Retry logic with exponential backoff
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  retries = MAX_RETRIES,
  delay = RETRY_DELAY,
): Promise<T> {
  try {
    return await fn()
  } catch (error) {
    if (retries > 0 && error instanceof ApiErrorClass && error.status >= 500) {
      await new Promise(resolve => setTimeout(resolve, delay))
      return retryWithBackoff(fn, retries - 1, delay * 2)
    }
    throw error
  }
}

/**
 * Make HTTP request with authentication, error handling, and retry logic
 */
async function request<T = any>(
  method: string,
  path: string,
  options: {
    body?: any
    query?: Record<string, any>
    useCache?: boolean
    headers?: Record<string, string>
    timeout?: number
  } = {},
): Promise<T> {
  const {
    body,
    query = {},
    useCache = method === 'GET',
    headers = {},
    timeout = REQUEST_TIMEOUT,
  } = options

  // Build URL with query parameters
  let url = `${API_BASE_URL}${path}`
  if (Object.keys(query).length > 0) {
    const params = new URLSearchParams()
    Object.entries(query).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        params.append(key, String(value))
      }
    })
    url += `?${params.toString()}`
  }

  // Check cache for GET requests
  if (useCache && method === 'GET') {
    const cached = cache.get(url)
    if (cached && new Date().getTime() - cached.timestamp < CACHE_TTL) {
      return cached.data
    }
  }

  // Prepare request headers
  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...headers,
  }

  // Add authorization token
  const token = getAuthToken()
  if (token) {
    requestHeaders.Authorization = `Bearer ${token}`
  }

  // Create abort controller for timeout
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    // Make the request with retry logic
    const response = await retryWithBackoff(async () => {
      const res = await fetch(url, {
        method,
        headers: requestHeaders,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      })

      // Handle 401 - unauthorized
      if (res.status === 401) {
        clearAuthToken()
        window.location.href = '/login'
        const error = await parseErrorResponse(res)
        throw new ApiErrorClass(
          error.code,
          'Your session has expired. Please log in again.',
          401,
        )
      }

      // Handle non-OK responses
      if (!res.ok) {
        const error = await parseErrorResponse(res)
        const errorCode = getErrorCode(res.status)
        throw new ApiErrorClass(
          error.code || errorCode,
          formatErrorMessage(errorCode, res.status, error.details),
          res.status,
          error.details,
        )
      }

      return res
    })

    // Parse response
    let data: T
    const contentType = response.headers.get('content-type')
    if (contentType?.includes('application/json')) {
      data = await response.json()
    } else {
      data = (await response.text()) as any
    }

    // Cache GET requests
    if (useCache && method === 'GET') {
      cache.set(url, {
        data,
        timestamp: new Date().getTime(),
      })
    }

    return data
  } catch (error) {
    clearTimeout(timeoutId)

    // Handle different error types
    if (error instanceof ApiErrorClass) {
      throw error
    }

    if (error instanceof TypeError) {
      // Network error or CORS issue
      throw new ApiErrorClass(
        ErrorCode.NETWORK_ERROR,
        'Network error. Please check your connection and try again.',
        0,
      )
    }

    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new ApiErrorClass(
        ErrorCode.TIMEOUT,
        'Request timeout. The server took too long to respond. Please try again.',
        0,
      )
    }

    // Unknown error
    throw new ApiErrorClass(
      ErrorCode.UNKNOWN_ERROR,
      error instanceof Error ? error.message : 'An unexpected error occurred',
      0,
    )
  } finally {
    clearTimeout(timeoutId)
  }
}

/**
 * Clear specific cache entry
 */
export function invalidateCache(path: string): void {
  const keysToDelete = Array.from(cache.keys()).filter(key => key.includes(path))
  keysToDelete.forEach(key => cache.delete(key))
}

/**
 * Clear all cache
 */
export function clearCache(): void {
  cache.clear()
}

/**
 * API Client - Exposed methods for all endpoints
 */
export const apiClient = {
  // ========================================================================
  // AUTH ENDPOINTS
  // ========================================================================

  async login(email: string, password: string): Promise<Token> {
    const formData = new URLSearchParams()
    formData.append('username', email)
    formData.append('password', password)

    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      const error = await parseErrorResponse(response)
      throw new ApiErrorClass(
        error.code || 'LOGIN_FAILED',
        'Invalid email or password',
        response.status,
      )
    }

    const data = await response.json()
    return data
  },

  async getMe() {
    return request('GET', '/auth/me', { useCache: false })
  },

  // ========================================================================
  // DASHBOARD ENDPOINTS
  // ========================================================================

  async getDashboardStats(companyId: string) {
    return request('GET', '/dashboard/stats', {
      query: { company_id: companyId },
    })
  },

  async getConversationTrends(companyId: string, days: number = 7) {
    return request('GET', '/dashboard/conversations/trends', {
      query: { company_id: companyId, days },
    })
  },

  async getTopCallers(companyId: string, limit: number = 10) {
    return request('GET', '/dashboard/callers/top', {
      query: { company_id: companyId, limit },
    })
  },

  async getSentimentTrends(companyId: string, days: number = 7) {
    return request('GET', '/dashboard/sentiment/trends', {
      query: { company_id: companyId, days },
    })
  },

  // ========================================================================
  // CALLERS ENDPOINTS
  // ========================================================================

  async listCallers(
    companyId?: string,
    search?: string,
    limit: number = 50,
    offset: number = 0,
  ) {
    return request('GET', '/callers', {
      query: { company_id: companyId, search, limit, offset },
    })
  },

  async createCaller(data: any) {
    const result = await request('POST', '/callers', { body: data })
    invalidateCache('/callers')
    return result
  },

  async getCaller(callerId: string) {
    return request('GET', `/callers/${callerId}`)
  },

  async updateCaller(callerId: string, data: any) {
    const result = await request('PATCH', `/callers/${callerId}`, { body: data })
    invalidateCache(`/callers/${callerId}`)
    invalidateCache('/callers')
    return result
  },

  async deleteCaller(callerId: string) {
    const result = await request('DELETE', `/callers/${callerId}`)
    invalidateCache('/callers')
    return result
  },

  async getCallerHistory(callerId: string, limit: number = 20) {
    return request('GET', `/callers/${callerId}/history`, {
      query: { limit },
    })
  },

  async getCallerStatistics(callerId: string) {
    return request('GET', `/callers/${callerId}/statistics`)
  },

  async blockCaller(callerId: string) {
    return request('POST', `/callers/${callerId}/block`)
  },

  // ========================================================================
  // CONVERSATIONS ENDPOINTS
  // ========================================================================

  async listConversations(
    companyId?: string,
    callerId?: string,
    status?: string,
    limit: number = 50,
    offset: number = 0,
  ) {
    return request('GET', '/conversations', {
      query: { company_id: companyId, caller_id: callerId, status, limit, offset },
    })
  },

  async createConversation(data: any) {
    const result = await request('POST', '/conversations', { body: data })
    invalidateCache('/conversations')
    return result
  },

  async getConversation(conversationId: string) {
    return request('GET', `/conversations/${conversationId}`)
  },

  async updateConversation(conversationId: string, data: any) {
    const result = await request('PUT', `/conversations/${conversationId}`, { body: data })
    invalidateCache(`/conversations/${conversationId}`)
    invalidateCache('/conversations')
    return result
  },

  async deleteConversation(conversationId: string) {
    const result = await request('DELETE', `/conversations/${conversationId}`)
    invalidateCache('/conversations')
    return result
  },

  async getMessages(conversationId: string, limit: number = 100) {
    return request('GET', `/conversations/${conversationId}/messages`, {
      query: { limit },
    })
  },

  async addMessage(conversationId: string, role: string, content: string) {
    const result = await request('POST', `/conversations/${conversationId}/messages`, {
      query: { role, content },
    })
    invalidateCache(`/conversations/${conversationId}/messages`)
    return result
  },

  // ========================================================================
  // RECORDINGS ENDPOINTS
  // ========================================================================

  async createRecording(conversationId: string, durationSeconds?: number) {
    return request('POST', '/recordings/create', {
      query: { conversation_id: conversationId, duration_seconds: durationSeconds },
    })
  },

  async getRecording(recordingId: string) {
    return request('GET', `/recordings/${recordingId}`)
  },

  async getConversationRecording(conversationId: string) {
    return request('GET', `/recordings/conversation/${conversationId}`)
  },

  async addTranscription(recordingId: string, transcription: string) {
    return request('POST', `/recordings/${recordingId}/transcribe`, {
      query: { transcription },
    })
  },

  async listRecordings(
    companyId?: string,
    search?: string,
    limit: number = 50,
    offset: number = 0,
  ) {
    return request('GET', '/recordings', {
      query: { company_id: companyId, search, limit, offset },
    })
  },

  async downloadRecording(recordingId: string) {
    return request('GET', `/recordings/${recordingId}/download`, { useCache: false })
  },

  // ========================================================================
  // SETTINGS ENDPOINTS
  // ========================================================================

  async getSettings(companyId: string) {
    return request('GET', `/settings/${companyId}`)
  },

  async updateSettings(companyId: string, data: any) {
    return request('PUT', `/settings/${companyId}`, { body: data })
  },

  // ========================================================================
  // AUDIT LOG ENDPOINTS
  // ========================================================================

  async getAuditLogs(
    companyId?: string,
    limit: number = 50,
    offset: number = 0,
  ) {
    return request('GET', '/audit-logs', {
      query: { company_id: companyId, limit, offset },
    })
  },

  // ========================================================================
  // ESCALATIONS ENDPOINTS
  // ========================================================================

  async listEscalations(companyId: string, status?: string, limit: number = 50, offset: number = 0) {
    return request('GET', '/escalations/pending', {
      query: { company_id: companyId, status, limit, offset },
    })
  },

  async createEscalation(data: any) {
    return request('POST', '/escalations/create', { body: data })
  },

  async updateEscalation(escalationId: string, data: any) {
    return request('PUT', `/escalations/${escalationId}`, { body: data })
  },

  async assignEscalation(escalationId: string, assignedTo: string) {
    return request('PUT', `/escalations/${escalationId}/assign`, { body: { assigned_to: assignedTo } })
  },

  async resolveEscalation(escalationId: string, resolution: string) {
    return request('PUT', `/escalations/${escalationId}/resolve`, { body: { resolution } })
  },

  async getEscalationMetrics(companyId: string) {
    return request('GET', '/escalations/metrics', { query: { company_id: companyId } })
  },

  // ========================================================================
  // KNOWLEDGE BASE ENDPOINTS
  // ========================================================================

  async listKnowledgeBase(companyId: string, limit: number = 50, offset: number = 0) {
    return request('GET', '/knowledge-base/search', {
      query: { company_id: companyId, limit, offset },
    })
  },

  async createKnowledgeBaseArticle(data: any) {
    return request('POST', '/knowledge-base/articles', { body: data })
  },

  async updateKnowledgeBaseArticle(articleId: string, data: any) {
    return request('PUT', `/knowledge-base/${articleId}`, { body: data })
  },

  async approveKnowledgeBaseArticle(articleId: string) {
    return request('PUT', `/knowledge-base/${articleId}/approve`, { body: {} })
  },

  async getKnowledgeBaseStats(companyId: string) {
    return request('GET', '/knowledge-base/statistics', { query: { company_id: companyId } })
  },

  async searchKnowledgeBase(companyId: string, query: string) {
    return request('GET', '/knowledge-base/search', { query: { company_id: companyId, q: query } })
  },

  // ========================================================================
  // GUIDANCE ENDPOINTS
  // ========================================================================

  async listGuidance(companyId: string, limit: number = 50, offset: number = 0) {
    return request('GET', '/guidance', {
      query: { company_id: companyId, limit, offset },
    })
  },

  async createGuidance(data: any) {
    return request('POST', '/guidance', { body: data })
  },

  async getGuidanceSuggestions(companyId: string, conversationId: string) {
    return request('GET', `/guidance/suggestions/${conversationId}`, {
      query: { company_id: companyId },
    })
  },

  async submitGuidanceFeedback(guidanceId: string, feedback: 'helpful' | 'not_helpful') {
    return request('POST', `/guidance/${guidanceId}/feedback`, { body: { feedback } })
  },

  // ========================================================================
  // CHAT ENDPOINTS
  // ========================================================================

  async listChatSessions(companyId: string, limit: number = 50, offset: number = 0) {
    return request('GET', '/chat/sessions', {
      query: { company_id: companyId, limit, offset },
    })
  },

  async createChatSession(data: any) {
    return request('POST', '/chat/sessions', { body: data })
  },

  async listChatMessages(sessionId: string, limit: number = 100) {
    return request('GET', `/chat/sessions/${sessionId}/messages`, { query: { limit } })
  },

  async sendChatMessage(sessionId: string, message: string, role: string = 'user') {
    return request('POST', '/chat/messages', { body: { session_id: sessionId, message, role } })
  },

  // ========================================================================
  // APPOINTMENTS ENDPOINTS
  // ========================================================================

  async listAppointments(companyId: string, limit: number = 50, offset: number = 0) {
    return request('GET', '/appointments', {
      query: { company_id: companyId, limit, offset },
    })
  },

  async createAppointment(data: any) {
    return request('POST', '/appointments', { body: data })
  },

  async updateAppointment(appointmentId: string, data: any) {
    return request('PUT', `/appointments/${appointmentId}`, { body: data })
  },

  async deleteAppointment(appointmentId: string) {
    return request('DELETE', `/appointments/${appointmentId}`)
  },

  async getAppointment(appointmentId: string) {
    return request('GET', `/appointments/${appointmentId}`)
  },

  // ========================================================================
  // REPORTS ENDPOINTS
  // ========================================================================

  async generateReport(companyId: string, reportType: string, dateRange: string) {
    return request('GET', '/reports/generate', {
      query: { company_id: companyId, type: reportType, date_range: dateRange },
    })
  },

  async getReportMetrics(companyId: string) {
    return request('GET', '/reports/metrics', { query: { company_id: companyId } })
  },

  async exportReport(companyId: string, reportType: string, format: string = 'csv') {
    return request('GET', `/reports/export/${reportType}`, { query: { company_id: companyId, format } })
  },

  // ============================================================================
  // OUTBOUND CALLS
  // ============================================================================

  async getCallConfig(): Promise<{
    configured: boolean
    missing_settings: string[]
    from_number: string | null
  }> {
    return request('GET', '/calls/config', { useCache: false })
  },

  async initiateCall(companyId: string, toNumber: string, fromNumber?: string) {
    return request('POST', '/calls/initiate', {
      query: { company_id: companyId, to_number: toNumber, from_number: fromNumber },
    })
  },

  async listCalls(limit: number = 50, offset: number = 0) {
    return request('GET', '/calls/list', { query: { limit, offset } })
  },

  async getCallStatus(callId: string) {
    return request('GET', `/calls/${callId}`)
  },

  async hangupCall(callId: string) {
    return request('POST', `/calls/${callId}/hangup`)
  },
}

// Export types and utilities
export { ApiErrorClass, ErrorCode }
export type { ApiError }

/**
 * Legacy apiFetch - for backwards compatibility with old components
 * Use apiClient methods instead for new code
 */
export async function apiFetch(path: string, _options: RequestInit = {}) {
  return request('GET', path, { useCache: false })
}
