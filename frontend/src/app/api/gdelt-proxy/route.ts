import { NextResponse } from 'next/server'
import { redis } from '@/lib/redis'

export const runtime = 'edge'

const CACHE_KEY = 'gdelt:articles:v1'
const CACHE_TTL = 900 // 15 minutes

// GDELT v2 free API — no key required
const GDELT_API = 'https://api.gdeltproject.org/api/v2/doc/doc'

const SA_THEMES = [
  '"South Africa"',
  '"South African"',
  'Eskom',
  'loadshedding',
  'SASSA',
  'ANC party',
  'Ramaphosa',
]

interface GdeltArticle {
  id: string
  title: string
  url: string
  source: string
  published_at: string
  summary: string
  lat: number
  lng: number
  sentiment: number
  image_url?: string
  province?: string
}

async function fetchGdeltQuery(query: string): Promise<GdeltArticle[]> {
  const params = new URLSearchParams({
    query: `${query} sourcelang:english`,
    mode: 'ArtList',
    maxrecords: '50',
    format: 'json',
    timespan: '1d',
    sort: 'DateDesc',
  })

  try {
    const res = await fetch(`${GDELT_API}?${params}`, {
      headers: { 'User-Agent': 'LoudWatch-SA/2.0' },
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) return []

    const data = await res.json()
    const articles = data.articles ?? []

    return articles.map((a: Record<string, unknown>) => {
      const rawDate = (a.seendate as string) ?? ''
      let published_at: string
      try {
        // GDELT date format: YYYYMMDDTHHMMSSZ
        const d = rawDate.length === 16
          ? new Date(
              `${rawDate.slice(0, 4)}-${rawDate.slice(4, 6)}-${rawDate.slice(6, 8)}T${rawDate.slice(9, 11)}:${rawDate.slice(11, 13)}:${rawDate.slice(13, 15)}Z`,
            )
          : new Date(rawDate)
        published_at = d.toISOString()
      } catch {
        published_at = new Date().toISOString()
      }

      const url = (a.url as string) ?? ''
      const id = `gdelt-${url.slice(-20).replace(/[^a-z0-9]/gi, '')}`

      return {
        id,
        title: (a.title as string) ?? '',
        url,
        source: (a.domain as string) ?? 'GDELT',
        published_at,
        summary: '',
        lat: -28.5,
        lng: 24.0,
        sentiment: 0,
      } as GdeltArticle
    }).filter((a: GdeltArticle) => a.title && a.url)
  } catch {
    return []
  }
}

function isSouthAfricanContent(title: string): boolean {
  const saKeywords = [
    'south africa', 'johannesburg', 'cape town', 'durban', 'pretoria',
    'soweto', 'eskom', 'anc', 'ramaphosa', 'zuma', 'sassa', 'saps', 'sabc',
    'loadshed', 'rand ', 'zar', 'gauteng', 'kwazulu', 'transnet',
  ]
  const lower = title.toLowerCase()
  return saKeywords.some((kw) => lower.includes(kw))
}

export async function GET() {
  // Check cache
  if (redis) {
    try {
      const cached = await redis.get(CACHE_KEY)
      if (cached) {
        return NextResponse.json({ articles: cached, source: 'cache' }, {
          headers: { 'Cache-Control': 'max-age=900, stale-while-revalidate=120' },
        })
      }
    } catch { /* ignore */ }
  }

  // Fetch multiple GDELT queries in parallel
  const queries = SA_THEMES.slice(0, 3) // Limit to 3 queries to avoid rate limiting
  const results = await Promise.allSettled(queries.map((q) => fetchGdeltQuery(q)))

  const allArticles: GdeltArticle[] = results.flatMap((r) =>
    r.status === 'fulfilled' ? r.value : [],
  )

  // Deduplicate by URL + SA filter
  const seen = new Set<string>()
  const unique = allArticles.filter((a) => {
    if (seen.has(a.url)) return false
    if (!isSouthAfricanContent(a.title)) return false
    seen.add(a.url)
    return true
  })

  unique.sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime())
  const articles = unique.slice(0, 50)

  // Cache result
  if (redis) {
    try {
      await redis.set(CACHE_KEY, articles, { ex: CACHE_TTL })
    } catch { /* ignore */ }
  }

  return NextResponse.json({ articles, source: 'live' }, {
    headers: { 'Cache-Control': 'max-age=900, stale-while-revalidate=120' },
  })
}
