'use client'

import { Component, ReactNode, ErrorInfo } from 'react'
import * as Sentry from '@sentry/nextjs'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  name?: string
}

interface State {
  hasError: boolean
  error?: Error
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    Sentry.captureException(error, {
      extra: {
        componentStack: info.componentStack,
        boundary: this.props.name ?? 'unknown',
      },
    })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback
      return (
        <div className="px-3 py-3 flex items-start gap-2">
          <span style={{ color: 'var(--red)', fontSize: '0.5rem' }}>✕</span>
          <div>
            <p style={{ color: 'var(--red)', fontSize: '0.55rem', fontFamily: 'var(--font-data)', opacity: 0.8 }}>
              Component error
            </p>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.5rem', fontFamily: 'var(--font-data)', marginTop: 2 }}>
                {this.state.error.message}
              </p>
            )}
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
