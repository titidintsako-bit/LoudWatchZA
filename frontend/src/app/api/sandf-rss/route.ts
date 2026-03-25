import { NextResponse } from 'next/server'

const SANDF_RSS = 'https://www.sandf.mil.za/feed/'
const CACHE_TTL = 30 * 60 * 1000 // 30 min

let cache: { data: unknown; ts: number } | null = null

function parseRSSItems(xml: string): Array<{ title: string; link: string; pubDate: string; description: string }> {
  const items: Array<{ title: string; link: string; pubDate: string; description: string }> = []
  const itemMatches = xml.matchAll(/<item>([\s\S]*?)<\/item>/g)
  for (const match of itemMatches) {
    const block = match[1]
    const title = block.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>|<title>(.*?)<\/title>/)?.[1] ?? block.match(/<title>(.*?)<\/title>/)?.[1] ?? ''
    const link = block.match(/<link>(.*?)<\/link>/)?.[1] ?? ''
    const pubDate = block.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] ?? ''
    const description = block.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>|<description>(.*?)<\/description>/)?.[1] ?? ''
    if (title) items.push({ title: title.trim(), link: link.trim(), pubDate: pubDate.trim(), description: description.replace(/<[^>]*>/g, '').trim().slice(0, 200) })
    if (items.length >= 10) break
  }
  return items
}

export async function GET() {
  if (cache && Date.now() - cache.ts < CACHE_TTL) {
    return NextResponse.json(cache.data)
  }

  try {
    const res = await fetch(SANDF_RSS, {
      headers: { 'User-Agent': 'LoudWatchZA/2.0' },
      next: { revalidate: 1800 },
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const xml = await res.text()
    const items = parseRSSItems(xml)
    const data = { items, source: 'SANDF', fetched_at: new Date().toISOString() }
    cache = { data, ts: Date.now() }
    return NextResponse.json(data)
  } catch {
    // Return empty rather than error — panel degrades gracefully
    return NextResponse.json({ items: [], source: 'SANDF', fetched_at: new Date().toISOString() })
  }
}
