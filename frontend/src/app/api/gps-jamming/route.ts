import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export interface JammingPoint {
  lat: number
  lng: number
  level: number  // 0-3: 0=none, 1=possible, 2=likely, 3=confirmed
  date: string
}

// gpsjam.org CSV export columns: lat,lon,level,date
// URL: https://gpsjam.org/api/export?lat=-29&lng=25&z=5&date=YYYY-MM-DD
async function fetchGpsJam(date: string): Promise<JammingPoint[]> {
  const url = `https://gpsjam.org/api/export?lat=-29&lng=25&z=5&date=${date}`
  const res = await fetch(url, {
    headers: { 'User-Agent': 'LoudWatch-ZA/1.0' },
    signal: AbortSignal.timeout(8000),
  })
  if (!res.ok) throw new Error(`gpsjam HTTP ${res.status}`)

  const text = await res.text()
  const points: JammingPoint[] = []

  for (const line of text.split('\n')) {
    const parts = line.trim().split(',')
    if (parts.length < 3) continue
    const lat = parseFloat(parts[0])
    const lng = parseFloat(parts[1])
    const level = parseInt(parts[2], 10)
    if (isNaN(lat) || isNaN(lng) || isNaN(level)) continue
    if (level === 0) continue  // skip no-jamming entries to keep payload small
    points.push({ lat, lng, level, date })
  }

  return points
}

export async function GET() {
  try {
    // Try today and yesterday (data may lag 24h)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const fmt = (d: Date) => d.toISOString().split('T')[0]

    let points: JammingPoint[] = []
    let usedDate = fmt(today)

    try {
      points = await fetchGpsJam(fmt(today))
      if (points.length === 0) {
        points = await fetchGpsJam(fmt(yesterday))
        usedDate = fmt(yesterday)
      }
    } catch {
      points = await fetchGpsJam(fmt(yesterday))
      usedDate = fmt(yesterday)
    }

    return NextResponse.json(
      { points, date: usedDate, count: points.length },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
        },
      },
    )
  } catch (err) {
    console.error('[gps-jamming] fetch failed:', err)
    // Return empty — map layer simply won't show data
    return NextResponse.json(
      { points: [], date: null, count: 0, error: 'upstream_unavailable' },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  }
}
