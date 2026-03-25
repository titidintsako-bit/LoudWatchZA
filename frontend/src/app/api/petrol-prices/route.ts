import { NextResponse } from 'next/server'

// Last known values — update this object whenever DMRE announces new prices
// Source: DMRE monthly fuel price adjustment media releases
const LAST_KNOWN = {
  unleaded95:       21.63,
  unleaded93:       21.40,
  diesel50ppm:      19.92,
  effectiveDate:    '2025-07-02',
  nextChangeDate:   '2025-08-06',
}

/**
 * Try to parse current petrol prices from the AA South Africa fuel page.
 * Returns null if fetch or parse fails — we fall back to LAST_KNOWN.
 */
async function fetchAAFuelPrices(): Promise<{ unleaded95: number; unleaded93: number; diesel50ppm: number } | null> {
  try {
    const res = await fetch('https://www.aa.co.za/fuel/fuel-prices/', {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; LoudWatchZA/2.0; +https://loudwatch.co.za)' },
      signal: AbortSignal.timeout(6000),
      next: { revalidate: 86400 },
    })
    if (!res.ok) return null
    const html = await res.text()

    // AA page contains table rows with prices like: 95 Unleaded | R21.63
    // Try several patterns to handle layout changes
    const price = (pattern: RegExp): number | null => {
      const m = html.match(pattern)
      if (!m) return null
      const n = parseFloat(m[1])
      return isNaN(n) || n < 10 || n > 50 ? null : n // sanity check: SA petrol is R10–R50
    }

    const p95 =
      price(/95\s+(?:Unleaded|ULP)[^R\d]{0,40}R?\s*([\d]+\.[\d]{2})/i) ??
      price(/(?:unleaded|ULP)\s+95[^R\d]{0,40}R?\s*([\d]+\.[\d]{2})/i)

    const p93 =
      price(/93\s+(?:Unleaded|ULP)[^R\d]{0,40}R?\s*([\d]+\.[\d]{2})/i) ??
      price(/(?:unleaded|ULP)\s+93[^R\d]{0,40}R?\s*([\d]+\.[\d]{2})/i)

    const pDiesel =
      price(/Diesel\s+50\s*ppm[^R\d]{0,40}R?\s*([\d]+\.[\d]{2})/i) ??
      price(/50\s*ppm[^R\d]{0,40}R?\s*([\d]+\.[\d]{2})/i)

    if (!p95) return null
    return {
      unleaded95:  p95,
      unleaded93:  p93  ?? p95 - 0.23,
      diesel50ppm: pDiesel ?? p95 - 1.71,
    }
  } catch {
    return null
  }
}

function daysBetween(dateStr: string): number {
  const diff = new Date(dateStr).getTime() - Date.now()
  return Math.max(0, Math.ceil(diff / 86_400_000))
}

export async function GET() {
  const live = await fetchAAFuelPrices()
  const prices = live ?? LAST_KNOWN
  const source = live
    ? 'AA South Africa (live)'
    : `DMRE — last known (${LAST_KNOWN.effectiveDate})`

  return NextResponse.json(
    {
      unleaded95:     prices.unleaded95,
      unleaded93:     prices.unleaded93,
      diesel50ppm:    prices.diesel50ppm,
      nextChangeDate: LAST_KNOWN.nextChangeDate,
      daysUntilChange: daysBetween(LAST_KNOWN.nextChangeDate),
      effectiveDate:  LAST_KNOWN.effectiveDate,
      source,
      live: !!live,
      currency: 'ZAR',
      unit: 'per litre',
    },
    {
      headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=600' },
    },
  )
}
