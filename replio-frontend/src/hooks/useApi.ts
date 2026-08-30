/**
 * useApi Hook - Custom hook for data fetching with loading, error, and retry states
 */

import { useState, useCallback, useEffect, useRef } from 'react'
import { ApiErrorClass } from '../api/client'

export interface UseApiState<T> {
  data: T | null
  loading: boolean
  error: ApiErrorClass | null
  retry: () => void
  refetch: () => Promise<void>
}

export interface UseApiOptions {
  immediate?: boolean
  onSuccess?: (data: any) => void
  onError?: (error: ApiErrorClass) => void
  cache?: boolean
  retryCount?: number
  deps?: any[]
}

/**
 * Custom hook for making API calls with loading and error states
 * @param fn - Async function that makes the API call
 * @param options - Hook options
 * @returns Object with data, loading, error, and retry function
 */
export function useApi<T>(
  fn: () => Promise<T>,
  options: UseApiOptions = {},
): UseApiState<T> {
  const { immediate = true, onSuccess, onError, retryCount = 3 } = options

  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(immediate)
  const [error, setError] = useState<ApiErrorClass | null>(null)
  const retryCountRef = useRef(0)
  const isMountedRef = useRef(true)

  const execute = useCallback(async () => {
    if (!isMountedRef.current) return

    setLoading(true)
    setError(null)

    try {
      const result = await fn()
      if (isMountedRef.current) {
        setData(result)
        setError(null)
        retryCountRef.current = 0
        onSuccess?.(result)
      }
    } catch (err) {
      if (!isMountedRef.current) return

      const apiError = err instanceof ApiErrorClass
        ? err
        : new ApiErrorClass(
          'UNKNOWN_ERROR',
          err instanceof Error ? err.message : 'An unexpected error occurred',
          0,
        )

      setError(apiError)
      onError?.(apiError)

      // Auto-retry on network errors
      if (apiError.status === 0 && retryCountRef.current < retryCount) {
        retryCountRef.current++
        const backoffDelay = Math.pow(2, retryCountRef.current) * 1000
        setTimeout(() => {
          if (isMountedRef.current) execute()
        }, backoffDelay)
      }
    } finally {
      if (isMountedRef.current) setLoading(false)
    }
  }, [fn, onSuccess, onError, retryCount])

  useEffect(() => {
    if (immediate) {
      execute()
    }

    return () => {
      isMountedRef.current = false
    }
  }, [execute, immediate])

  const retry = useCallback(() => {
    retryCountRef.current = 0
    execute()
  }, [execute])

  const refetch = useCallback(async () => {
    return execute()
  }, [execute])

  return { data, loading, error, retry, refetch }
}

/**
 * Hook for handling form submission with API calls
 */
export interface UseApiMutationState<T> {
  data: T | null
  loading: boolean
  error: ApiErrorClass | null
  execute: (args?: any) => Promise<T>
  isSuccess: boolean
}

export function useApiMutation<T>(
  fn: (args?: any) => Promise<T>,
  options: UseApiOptions = {},
): UseApiMutationState<T> {
  const { onSuccess, onError } = options

  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<ApiErrorClass | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)
  const isMountedRef = useRef(true)

  useEffect(() => {
    return () => {
      isMountedRef.current = false
    }
  }, [])

  const execute = useCallback(
    async (args?: any) => {
      if (!isMountedRef.current) return null as any

      setLoading(true)
      setError(null)
      setIsSuccess(false)

      try {
        const result = await fn(args)
        if (isMountedRef.current) {
          setData(result)
          setIsSuccess(true)
          onSuccess?.(result)
        }
        return result
      } catch (err) {
        if (!isMountedRef.current) throw err

        const apiError = err instanceof ApiErrorClass
          ? err
          : new ApiErrorClass(
            'UNKNOWN_ERROR',
            err instanceof Error ? err.message : 'An unexpected error occurred',
            0,
          )

        setError(apiError)
        onError?.(apiError)
        throw apiError
      } finally {
        if (isMountedRef.current) setLoading(false)
      }
    },
    [fn, onSuccess, onError],
  )

  return { data, loading, error, execute, isSuccess }
}
