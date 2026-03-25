import { NextRequest, NextResponse } from 'next/server'
import { BACKEND_URL } from '@/lib/constants'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const lat = searchParams.get('lat')
  const lng = searchParams.get('lng')

  if (!lat || !lng) {
    return NextResponse.json(
      { error: 'lat and lng query params required' },
      { status: 400 },
    )
  }

  try {
    const res = await fetch(
      `${BACKEND_URL}/api/dossier?lat=${lat}&lng=${lng}`,
      {
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
      },
    )
    if (!res.ok) throw new Error(`Backend error: ${res.status}`)
    const data = await res.json()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({
      municipality: 'Unknown',
      province: 'Unknown',
      pain_score: 0,
      loadshedding_stage: 0,
      dam_level: null,
      unemployment_rate: 0,
      protest_count_7d: 0,
      news_count_7d: 0,
      audit_outcome: 'Unknown',
      lat: parseFloat(lat),
      lng: parseFloat(lng),
    })
  }
}
