import { NextResponse } from 'next/server'
import { redis } from '@/lib/redis'

export const runtime = 'edge'

const CACHE_KEY = 'rss:articles:v2'
const CACHE_TTL = 600 // 10 minutes

// ── SA RSS Feeds ─────────────────────────────────────────────────────────────
const RSS_FEEDS = [
  // Tier 1 — High priority
  { url: 'https://feeds.news24.com/articles/news24/TopStories/rss', source: 'News24', tier: 1 },
  { url: 'https://feeds.news24.com/articles/news24/SouthAfrica/rss', source: 'News24', tier: 1 },
  { url: 'https://dailymaverick.co.za/feed/', source: 'Daily Maverick', tier: 1 },
  { url: 'https://www.timeslive.co.za/rss/', source: 'TimesLive', tier: 1 },
  { url: 'https://rss.iol.co.za/rss/news/south-africa.xml', source: 'IOL', tier: 1 },
  { url: 'https://www.sabcnews.com/sabcnews/feed/', source: 'SABC News', tier: 1 },
  // Tier 2 — National
  { url: 'https://ewn.co.za/RSS/ewn-story-feed-complete.xml', source: 'EWN', tier: 2 },
  { url: 'https://businesstech.co.za/news/feed/', source: 'BusinessTech', tier: 2 },
  { url: 'https://www.businesslive.co.za/rss/bd/', source: 'Business Day', tier: 2 },
  { url: 'https://www.sowetanlive.co.za/rss/', source: 'Sowetan', tier: 2 },
  { url: 'https://www.citizen.co.za/feed/', source: 'The Citizen', tier: 2 },
  // Tier 3 — Specialist
  { url: 'https://mybroadband.co.za/news/feed', source: 'MyBroadband', tier: 3 },
  { url: 'https://groundup.org.za/feed/', source: 'GroundUp', tier: 3 },
  { url: 'https://www.dailysun.co.za/feed/', source: 'Daily Sun', tier: 3 },
  { url: 'https://www.dailydispatch.co.za/feed/', source: 'Daily Dispatch', tier: 3 },
  // Tier 4 — Regional / Broadcast
  { url: 'https://jacarandafm.com/feed/', source: 'Jacaranda FM', tier: 4 },
  { url: 'https://702.co.za/feed/', source: 'Radio 702', tier: 4 },
]

const SA_KEYWORDS = [
  'south africa', 'south african', 'johannesburg', 'cape town', 'durban',
  'pretoria', 'soweto', 'gauteng', 'kwazulu', 'western cape', 'eastern cape',
  'limpopo', 'mpumalanga', 'free state', 'northern cape', 'north west',
  'anc', 'da ', ' eff ', 'parliament', 'sassa', 'eskom', 'transnet',
  'load.shed', 'loadshed', 'ramaphosa', 'zuma', 'rand ', 'zar',
  'saps', 'sandf', 'Hawks', 'NPA ', 'constitutional court',
]

function isSouthAfricanContent(title: string, description: string): boolean {
  const text = `${title} ${description}`.toLowerCase()
  return SA_KEYWORDS.some((kw) => text.includes(kw.toLowerCase()))
}

interface RssItem {
  id: string
  title: string
  url: string
  source: string
  published_at: string
  summary: string
  image_url?: string
  lat: number
  lng: number
  sentiment: number
  tier: number
}

function parseXml(xml: string, source: string, tier: number): RssItem[] {
  const items: RssItem[] = []
  // Extract <item> or <entry> blocks
  const itemRx = /<(?:item|entry)[\s>][\s\S]*?<\/(?:item|entry)>/gi
  let match: RegExpExecArray | null

  while ((match = itemRx.exec(xml)) !== null) {
    const block = match[0]
    const get = (tag: string) => {
      const m = block.match(new RegExp(`<${tag}[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/${tag}>`, 'i'))
      return m ? m[1].trim() : ''
    }
    const getAttr = (tag: string, attr: string) => {
      const m = block.match(new RegExp(`<${tag}[^>]+${attr}=["']([^"']+)["']`, 'i'))
      return m ? m[1] : ''
    }

    const title = get('title').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#\d+;/g, '')
    if (!title) continue

    // Link — try <link> tag, then href attr on <link>
    let url = get('link') || getAttr('link', 'href') || ''
    if (!url) continue
    url = url.trim()

    const description = get('description') || get('summary') || get('content')
    if (!isSouthAfricanContent(title, description)) continue

    // Date — pubDate (RSS) or published/updated (Atom)
    const rawDate = get('pubDate') || get('published') || get('updated') || ''
    let published_at: string
    try {
      published_at = rawDate ? new Date(rawDate).toISOString() : new Date().toISOString()
    } catch {
      published_at = new Date().toISOString()
    }

    // Image — media:content, enclosure, or og:image in description
    let image_url = getAttr('media:content', 'url') || getAttr('enclosure', 'url') || ''
    if (!image_url) {
      const imgMatch = description.match(/<img[^>]+src=["']([^"']+)["']/i)
      if (imgMatch) image_url = imgMatch[1]
    }

    // Strip HTML from summary
    const summary = description.replace(/<[^>]+>/g, '').slice(0, 200).trim()

    const id = `rss-${Buffer.from(url).toString('base64').slice(0, 20)}`

    items.push({
      id,
      title,
      url,
      source,
      published_at,
      summary,
      image_url: image_url || undefined,
      lat: -28.5,
      lng: 24.0,
      sentiment: 0,
      tier,
    })
  }

  return items
}

async function fetchFeed(feed: (typeof RSS_FEEDS)[number]): Promise<RssItem[]> {
  try {
    const res = await fetch(feed.url, {
      headers: { 'User-Agent': 'LoudWatch-SA/2.0 News Aggregator' },
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) return []
    const xml = await res.text()
    return parseXml(xml, feed.source, feed.tier)
  } catch {
    return []
  }
}

export async function GET() {
  // Check cache
  if (redis) {
    try {
      const cached = await redis.get(CACHE_KEY)
      if (cached) {
        return NextResponse.json({ articles: cached, cached: true }, {
          headers: { 'Cache-Control': 'max-age=600, stale-while-revalidate=60' },
        })
      }
    } catch { /* ignore redis errors */ }
  }

  // Fetch all feeds in parallel
  const results = await Promise.allSettled(RSS_FEEDS.map(fetchFeed))
  const allItems: RssItem[] = results.flatMap((r) => r.status === 'fulfilled' ? r.value : [])

  // Deduplicate by URL
  const seen = new Set<string>()
  const unique = allItems.filter((a) => {
    if (seen.has(a.url)) return false
    seen.add(a.url)
    return true
  })

  // Sort by tier (priority) then date descending
  unique.sort((a, b) => {
    if (a.tier !== b.tier) return a.tier - b.tier
    return new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
  })

  const articles = unique.slice(0, 200)

  // Cache result
  if (redis) {
    try {
      await redis.set(CACHE_KEY, articles, { ex: CACHE_TTL })
    } catch { /* ignore */ }
  }

  return NextResponse.json({ articles, cached: false }, {
    headers: { 'Cache-Control': 'max-age=600, stale-while-revalidate=60' },
  })
}
