import type { Metadata, Viewport } from 'next'
import { IBM_Plex_Sans, IBM_Plex_Mono } from 'next/font/google'
import './globals.css'

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-sans',
  display: 'swap',
})

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'LoudWatch ZA | South Africa Real-Time Intelligence Dashboard',
  description:
    'Real-time intelligence dashboard for South Africa — loadshedding, pain index, protests, dam levels, air traffic, maritime tracking, crime, audits and more. Free civic intelligence for all South Africans.',
  keywords: [
    'South Africa', 'loadshedding', 'eskom', 'intelligence', 'dashboard',
    'real-time', 'SASSA', 'dam levels', 'protests', 'crime', 'municipalities',
  ],
  authors: [{ name: 'LoudWatch ZA' }],
  manifest: '/manifest.json',
  openGraph: {
    title: 'LoudWatch ZA',
    description: 'Real-time South African intelligence dashboard',
    type: 'website',
    locale: 'en_ZA',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#080c14',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`dark ${ibmPlexSans.variable} ${ibmPlexMono.variable}`}
      suppressHydrationWarning
    >
      <body style={{ fontFamily: 'var(--font-sans)' }}>
        {children}
      </body>
    </html>
  )
}
