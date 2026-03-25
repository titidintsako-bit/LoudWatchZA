import { NextResponse } from 'next/server'

const GTG_RSS = 'https://www.goodthingsguy.com/feed/'
const CACHE_TTL = 15 * 60 * 1000 // 15 min

let cache: { data: unknown; ts: number } | null = null

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ').trim()
}

function extractImage(block: string): string | undefined {
  return block.match(/<enclosure[^>]+url="([^"]+)"/)?.[1]
    ?? block.match(/<media:content[^>]+url="([^"]+)"/)?.[1]
    ?? undefined
}

function parseRSSItems(xml: string) {
  const items = []
  const itemMatches = xml.matchAll(/<item>([\s\S]*?)<\/item>/g)
  for (const match of itemMatches) {
    const block = match[1]
    const title = stripHtml(block.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? '')
    const link = block.match(/<link>(.*?)<\/link>/)?.[1]?.trim() ?? ''
    const pubDate = block.match(/<pubDate>(.*?)<\/pubDate>/)?.[1]?.trim() ?? ''
    const rawDesc = block.match(/<description>([\s\S]*?)<\/description>/)?.[1] ?? ''
    const summary = stripHtml(rawDesc).slice(0, 200)
    const category = block.match(/<category>([\s\S]*?)<\/category>/)?.[1]?.trim() ?? ''
    const image_url = extractImage(block)
    if (title) {
      items.push({
        id: link || `item-${items.length}`,
        title,
        url: link,
        summary,
        published_at: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
        image_url,
        category: stripHtml(category),
      })
    }
    if (items.length >= 12) break
  }
  return items
}

export async function GET() {
  if (cache && Date.now() - cache.ts < CACHE_TTL) {
    return NextResponse.json(cache.data)
  }

  try {
    const res = await fetch(GTG_RSS, {
      headers: { 'User-Agent': 'LoudWatchZA/2.0' },
      next: { revalidate: 900 },
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const xml = await res.text()
    const items = parseRSSItems(xml)
    const data = { items, source: 'GoodThingsGuy', fetched_at: new Date().toISOString() }
    cache = { data, ts: Date.now() }
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ items: [], source: 'GoodThingsGuy', fetched_at: new Date().toISOString() })
  }
}
