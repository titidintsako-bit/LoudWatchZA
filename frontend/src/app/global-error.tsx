'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <html lang="en">
      <body style={{ margin: 0, background: '#000', color: '#e8eaf0', fontFamily: 'IBM Plex Mono, monospace' }}>
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', height: '100vh', gap: 16,
        }}>
          <span style={{ fontSize: 11, color: '#dc2626', letterSpacing: '0.15em' }}>
            LOUDWATCH SYSTEM FAULT
          </span>
          <span style={{ fontSize: 9, color: '#4a5568', letterSpacing: '0.1em' }}>
            A critical rendering error occurred. Our team has been notified.
          </span>
          {error.digest && (
            <span style={{ fontSize: 8, color: '#2d3748' }}>
              ref: {error.digest}
            </span>
          )}
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: 8,
              fontFamily: 'IBM Plex Mono, monospace',
              fontSize: 9,
              color: '#00e87a',
              background: 'transparent',
              border: '1px solid rgba(0,232,122,0.3)',
              padding: '6px 16px',
              cursor: 'pointer',
              letterSpacing: '0.1em',
            }}
          >
            ↺ RESTART
          </button>
        </div>
      </body>
    </html>
  )
}
