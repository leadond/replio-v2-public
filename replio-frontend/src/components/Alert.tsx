/**
 * Alert - Error, warning, success, and info messages
 */

import { useState, useEffect } from 'react'
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react'

export type AlertType = 'error' | 'warning' | 'success' | 'info'

interface AlertProps {
  type: AlertType
  title?: string
  message: string
  onClose?: () => void
  autoClose?: boolean
  autoCloseDuration?: number
  dismissible?: boolean
}

const alertConfig = {
  error: {
    bgColor: 'rgba(239,68,68,0.1)',
    borderColor: 'rgba(239,68,68,0.3)',
    textColor: '#ef4444',
    icon: AlertCircle,
  },
  warning: {
    bgColor: 'rgba(245,158,11,0.1)',
    borderColor: 'rgba(245,158,11,0.3)',
    textColor: '#f59e0b',
    icon: AlertCircle,
  },
  success: {
    bgColor: 'rgba(16,185,129,0.1)',
    borderColor: 'rgba(16,185,129,0.3)',
    textColor: '#10b981',
    icon: CheckCircle2,
  },
  info: {
    bgColor: 'rgba(59,130,246,0.1)',
    borderColor: 'rgba(59,130,246,0.3)',
    textColor: '#3b82f6',
    icon: Info,
  },
}

export function Alert({
  type,
  title,
  message,
  onClose,
  autoClose = false,
  autoCloseDuration = 5000,
  dismissible = true,
}: AlertProps) {
  const [isVisible, setIsVisible] = useState(true)
  const config = alertConfig[type]
  const Icon = config.icon

  useEffect(() => {
    if (autoClose) {
      const timer = setTimeout(() => {
        setIsVisible(false)
        onClose?.()
      }, autoCloseDuration)
      return () => clearTimeout(timer)
    }
  }, [autoClose, autoCloseDuration, onClose])

  if (!isVisible) return null

  const handleClose = () => {
    setIsVisible(false)
    onClose?.()
  }

  return (
    <div style={{
      backgroundColor: config.bgColor,
      border: `1px solid ${config.borderColor}`,
      borderRadius: '8px',
      padding: '12px 16px',
      marginBottom: '16px',
      display: 'flex',
      alignItems: 'flex-start',
      gap: '12px',
    }}>
      <Icon size={20} color={config.textColor} style={{ flexShrink: 0, marginTop: '2px' }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        {title && (
          <div style={{
            fontWeight: 600,
            color: config.textColor,
            fontSize: '14px',
            marginBottom: '4px',
          }}>
            {title}
          </div>
        )}
        <div style={{
          color: config.textColor,
          fontSize: '14px',
          opacity: 0.9,
        }}>
          {message}
        </div>
      </div>
      {dismissible && (
        <button
          onClick={handleClose}
          style={{
            background: 'none',
            border: 'none',
            color: config.textColor,
            cursor: 'pointer',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            opacity: 0.7,
            transition: 'opacity 0.2s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.opacity = '1' }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.7' }}
          aria-label="Close alert">
          <X size={16} />
        </button>
      )}
    </div>
  )
}

/**
 * Alert Container - For displaying multiple alerts
 */
export function AlertContainer({
  alerts = [],
  onDismiss = () => {},
}: {
  alerts: (AlertProps & { id: string })[]
  onDismiss?: (id: string) => void
}) {
  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      zIndex: 999,
      maxWidth: '400px',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
    }}>
      {alerts.map(alert => (
        <div
          key={alert.id}
          style={{
            animation: 'slideIn 0.3s ease-out',
          }}>
          <Alert
            {...alert}
            onClose={() => onDismiss(alert.id)}
          />
        </div>
      ))}
      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  )
}
