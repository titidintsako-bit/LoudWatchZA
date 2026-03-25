import { NextResponse } from 'next/server'

const CACHE_SECS = 300 // 5 min — delayed data

// stooq.com returns CSV: Date,Open,High,Low,Close,Volume
async function fetchStooq(symbol: string): Promise<{ price: number; prev: number } | null> {
  try {
    const url = `https://stooq.com/q/d/l/?s=${symbol}&i=d&l=2`
    const res = await fetch(url, { next: { revalidate: CACHE_SECS } })
    if (!res.ok) return null
    const text = await res.text()
    const lines = text.trim().split('\n').filter((l) => !l.startsWith('Date'))
    if (lines.length < 2) return null
    const parse = (line: string) => parseFloat(line.split(',')[4] ?? '0') // Close column
    return { price: parse(lines[lines.length - 1]), prev: parse(lines[lines.length - 2]) }
  } catch {
    return null
  }
}

// frankfurter.app — already used for ZAR rates
async function fetchZAR(): Promise<{ price: number; prev: number } | null> {
  try {
    const [cur, prev] = await Promise.all([
      fetch('https://api.frankfurter.app/latest?from=USD&to=ZAR', { next: { revalidate: CACHE_SECS } }),
      fetch('https://api.frankfurter.app/latest?from=USD&to=ZAR&date=yesterday', { next: { revalidate: CACHE_SECS } }),
    ])
    if (!cur.ok) return null
    const cd = await cur.json()
    const pd = prev.ok ? await prev.json() : null
    return {
      price: cd.rates?.ZAR ?? 0,
      prev: pd?.rates?.ZAR ?? cd.rates?.ZAR ?? 0,
    }
  } catch {
    return null
  }
}

export async function GET() {
  const [jse, gold, brent, bond, zar] = await Promise.all([
    fetchStooq('jtopi.jo'),   // JSE Top 40
    fetchStooq('xauusd'),     // Gold USD/oz
    fetchStooq('lcoc.f'),     // Brent crude (ICE)
    fetchStooq('10zar.b'),    // SA 10yr bond yield
    fetchZAR(),
  ])

  const metrics = [
    {
      id: 'jse',
      label: 'JSE Top 40',
      unit: 'pts',
      price: jse?.price ?? null,
      prev: jse?.prev ?? null,
    },
    {
      id: 'zar',
      label: 'ZAR/USD',
      unit: 'R',
      price: zar?.price ?? null,
      prev: zar?.prev ?? null,
      invertSign: true, // higher ZAR/USD = weaker rand = bad
    },
    {
      id: 'gold',
      label: 'Gold',
      unit: '$/oz',
      price: gold?.price ?? null,
      prev: gold?.prev ?? null,
    },
    {
      id: 'brent',
      label: 'Brent Crude',
      unit: '$/bbl',
      price: brent?.price ?? null,
      prev: brent?.prev ?? null,
    },
    {
      id: 'bond',
      label: 'SA 10yr Bond',
      unit: '%',
      price: bond?.price ?? null,
      prev: bond?.prev ?? null,
      invertSign: true, // higher yield = worse for SA
    },
  ]

  return NextResponse.json(
    { metrics, as_of: new Date().toISOString() },
    { headers: { 'Cache-Control': `s-maxage=${CACHE_SECS}, stale-while-revalidate=60` } },
  )
}
