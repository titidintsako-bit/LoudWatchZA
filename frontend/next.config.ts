import type { NextConfig } from 'next'
import { withSentryConfig } from '@sentry/nextjs'
import withPWAInit from '@ducanh2912/next-pwa'

const withPWA = withPWAInit({
  dest: 'public',
  register: true,
  disable: true, // SW disabled: @ducanh2912/next-pwa generates broken cacheWillUpdate handler (_ref not defined) that serves stale CSS forever
  workboxOptions: {
    skipWaiting: true,
    clientsClaim: true,
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/api\.eskomsepush\.com\/.*/i,
        handler: 'NetworkFirst',
        options: { cacheName: 'eskom-api', expiration: { maxAgeSeconds: 300 } },
      },
      {
        urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
        handler: 'NetworkFirst',
        options: { cacheName: 'supabase-api', expiration: { maxAgeSeconds: 60 } },
      },
      {
        urlPattern: /\/api\/(loadshedding|dams|news|trending).*/i,
        handler: 'NetworkFirst',
        options: { cacheName: 'loudwatch-api', expiration: { maxAgeSeconds: 120 } },
      },
      {
        urlPattern: /\.(png|jpg|jpeg|svg|gif|webp|ico)$/i,
        handler: 'CacheFirst',
        options: { cacheName: 'images', expiration: { maxEntries: 100, maxAgeSeconds: 86400 } },
      },
    ],
  },
})

// Security headers applied to every response
const securityHeaders = [
  // Prevent clickjacking
  { key: 'X-Frame-Options', value: 'DENY' },
  // Prevent MIME type sniffing
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Referrer policy
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Permissions policy — only geolocation needed (for user location features)
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(self), payment=()' },
  // XSS protection (legacy browsers)
  { key: 'X-XSS-Protection', value: '1; mode=block' },
  // HSTS — 1 year, include subdomains
  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
  // DNS prefetch control
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
]

const nextConfig: NextConfig = {
  images: { remotePatterns: [{ protocol: 'https', hostname: '**' }] },
  env: { BACKEND_URL: process.env.BACKEND_URL || 'http://localhost:8000' },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ]
  },

  // Suppress punycode deprecation warning from Node internals
  webpack(config) {
    config.ignoreWarnings = [{ module: /node_modules\/punycode/ }]
    return config
  },
}

const sentryConfig = withSentryConfig(nextConfig, {
  silent: !process.env.SENTRY_AUTH_TOKEN,
  sourcemaps: { disable: !process.env.SENTRY_AUTH_TOKEN },
  telemetry: false,
})

export default withPWA(sentryConfig)
