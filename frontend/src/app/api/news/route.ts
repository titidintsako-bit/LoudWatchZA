import { NextResponse } from 'next/server'
import { BACKEND_URL } from '@/lib/constants'

const GDELT_URL =
  'https://api.gdeltproject.org/api/v2/doc/doc?query=southafrica+OR+%22south+africa%22&mode=artlist&maxrecords=25&sort=DateDesc&format=json'

interface GdeltArticle {
  title?: string
  url?: string
  seendate?: string
  sourcecountry?: string
  domain?: string
}

async function fetchGdeltFallback() {
  try {
    const res = await fetch(GDELT_URL, {
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) return []
    const data = await res.json()
    const articles: GdeltArticle[] = data.articles ?? []
    return articles.slice(0, 20).map((a, i) => ({
      id: `gdelt-${i}`,
      title: a.title ?? 'Untitled',
      url: a.url ?? '',
      source: a.domain ?? 'GDELT',
      published_at: a.seendate
        ? `${a.seendate.slice(0, 4)}-${a.seendate.slice(4, 6)}-${a.seendate.slice(6, 8)}T${a.seendate.slice(9, 11)}:${a.seendate.slice(11, 13)}:00Z`
        : new Date().toISOString(),
      province: null,
      category: 'news',
      lat: -28.5,
      lng: 24.0,
    }))
  } catch {
    return []
  }
}

export async function GET() {
  // 1. Try backend
  try {
    const res = await fetch(`${BACKEND_URL}/api/news`, {
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(8000),
      headers: { 'Content-Type': 'application/json' },
    })
    if (!res.ok) throw new Error(`Backend error: ${res.status}`)
    const data = await res.json()
    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'max-age=300, stale-while-revalidate=60' },
    })
  } catch {
    // 2. Backend down — fall back to GDELT
    const articles = await fetchGdeltFallback()
    return NextResponse.json(
      { articles, source: 'gdelt-fallback' },
      { headers: { 'Cache-Control': 'max-age=180, stale-while-revalidate=60' } },
    )
  }
}
