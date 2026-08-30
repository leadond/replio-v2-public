/**
 * Error Boundary - Component for catching and displaying errors
 */

import React, { Component, ReactNode, ErrorInfo } from 'react'
import { AlertCircle, RefreshCw } from 'lucide-react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo })
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '400px',
          padding: '20px',
        }}>
          <div style={{
            backgroundColor: 'rgba(15,23,42,0.4)',
            border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: '12px',
            padding: '32px',
            maxWidth: '500px',
            textAlign: 'center',
          }}>
            <AlertCircle size={48} color="#ef4444" style={{ margin: '0 auto 16px' }} />
            <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '12px' }}>
              Something went wrong
            </h2>
            <p style={{ color: '#9ca3af', marginBottom: '24px' }}>
              An unexpected error occurred. Please try refreshing the page or contact support if the problem persists.
            </p>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details style={{
                textAlign: 'left',
                backgroundColor: 'rgba(0,0,0,0.2)',
                padding: '12px',
                borderRadius: '8px',
                marginBottom: '20px',
                fontSize: '12px',
                color: '#ef4444',
                maxHeight: '200px',
                overflow: 'auto',
              }}>
                <summary style={{ cursor: 'pointer', fontWeight: 600, marginBottom: '8px' }}>
                  Error Details
                </summary>
                <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                  {this.state.error.toString()}
                </pre>
              </details>
            )}
            <button
              onClick={this.handleReset}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                padding: '10px 20px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#2563eb'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#3b82f6'
              }}>
              <RefreshCw size={16} />
              Try again
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
