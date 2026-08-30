/**
 * Loading Spinner - Reusable loading indicator component
 */

import React from 'react'

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large'
  message?: string
  fullScreen?: boolean
}

export function LoadingSpinner({
  size = 'medium',
  message = 'Loading...',
  fullScreen = false,
}: LoadingSpinnerProps) {
  const sizeMap = {
    small: { width: 24, height: 24 },
    medium: { width: 40, height: 40 },
    large: { width: 64, height: 64 },
  }

  const dimensions = sizeMap[size]

  const container = fullScreen ? {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 1000,
  } : {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 20px',
    gap: '16px',
  }

  return (
    <div style={container}>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '16px',
      }}>
        <div style={{
          display: 'inline-block',
          width: dimensions.width,
          height: dimensions.height,
          border: '3px solid rgba(45,212,191,0.2)',
          borderTopColor: '#2dd4bf',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }} />
        {message && (
          <p style={{
            color: '#9ca3af',
            fontSize: '14px',
            margin: 0,
          }}>
            {message}
          </p>
        )}
      </div>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

/**
 * Skeleton Loading - Placeholder for content while loading
 */
interface SkeletonProps {
  width?: string | number
  height?: string | number
  circle?: boolean
  count?: number
  style?: React.CSSProperties
}

export function Skeleton({
  width = '100%',
  height = '20px',
  circle = false,
  count = 1,
  style = {},
}: SkeletonProps) {
  const skeletonStyle: React.CSSProperties = {
    display: 'inline-block',
    backgroundColor: 'rgba(45,212,191,0.1)',
    borderRadius: circle ? '50%' : '8px',
    width,
    height,
    ...style,
  }

  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          style={{
            ...skeletonStyle,
            marginBottom: i < count - 1 ? '12px' : 0,
            animation: 'pulse 2s infinite',
          }} />
      ))}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </>
  )
}
