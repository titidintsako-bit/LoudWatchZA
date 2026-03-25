import * as Sentry from '@sentry/nextjs'

export function register() {
  // Server-side only — runs in the Node.js runtime
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      environment: process.env.NODE_ENV,
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
      // Reduce noise from expected upstream timeouts
      ignoreErrors: ['AbortError', 'TimeoutError'],
    })
  }
}

export const onRequestError = Sentry.captureRequestError
