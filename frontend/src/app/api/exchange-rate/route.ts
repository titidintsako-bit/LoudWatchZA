import { NextResponse } from 'next/server'

export const revalidate = 300 // 5 minutes

export async function GET() {
  try {
    // Fetch today's rate from ZAR → USD, EUR, GBP
    const [todayRes, yesterdayRes] = await Promise.all([
      fetch('https://api.frankfurter.app/latest?from=ZAR&to=USD,EUR,GBP', {
        next: { revalidate: 300 },
      }),
      fetch('https://api.frankfurter.app/latest?from=ZAR&to=USD', {
        next: { revalidate: 300 },
      }),
    ])

    if (!todayRes.ok) {
      throw new Error(`Frankfurter API error: ${todayRes.status}`)
    }

    const today = await todayRes.json()
    // rates are X ZAR per 1 USD (inverse)
    // Frankfurter: from=ZAR to=USD gives 1 ZAR = rates.USD USD
    // We want ZAR per USD = 1 / rates.USD
    const zarPerUsd = today.rates?.USD ? 1 / today.rates.USD : 18.5
    const zarPerEur = today.rates?.EUR ? 1 / today.rates.EUR : 20.1
    const zarPerGbp = today.rates?.GBP ? 1 / today.rates.GBP : 23.4

    // Calculate change vs yesterday
    let usdChange = 0
    if (yesterdayRes.ok) {
      const yesterday = await yesterdayRes.json()
      const yesterdayZarPerUsd = yesterday.rates?.USD ? 1 / yesterday.rates.USD : zarPerUsd
      usdChange = zarPerUsd - yesterdayZarPerUsd
    }

    return NextResponse.json(
      {
        usd: Math.round(zarPerUsd * 100) / 100,
        eur: Math.round(zarPerEur * 100) / 100,
        gbp: Math.round(zarPerGbp * 100) / 100,
        updatedAt: new Date().toISOString(),
        usdChange: Math.round(usdChange * 100) / 100,
      },
      {
        headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60' },
      },
    )
  } catch (err) {
    console.error('Exchange rate fetch failed:', err)
    // Return realistic fallback so UI doesn't break
    return NextResponse.json(
      {
        usd: 18.20,
        eur: 19.85,
        gbp: 23.10,
        updatedAt: new Date().toISOString(),
        usdChange: 0,
        isFallback: true,
      },
      { status: 200 },
    )
  }
}
