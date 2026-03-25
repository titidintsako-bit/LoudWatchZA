import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Session replay: only capture on errors in production
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: process.env.NODE_ENV === 'production' ? 1.0 : 0,

  integrations: [],

  // Filter out browser noise that isn't actionable
  ignoreErrors: [
    'ResizeObserver loop limit exceeded',
    'Non-Error promise rejection captured',
    'AbortError',
    // MapLibre WebGL context loss — handled in-app
    'WebGL context lost',
  ],
})

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart
