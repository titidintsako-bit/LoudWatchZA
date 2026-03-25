import { NextRequest, NextResponse } from 'next/server'
import { BACKEND_URL } from '@/lib/constants'

type StatsSALayer = 'ghs' | 'census' | 'population' | 'hunger'

const EMPTY_RESPONSES: Record<StatsSALayer, unknown> = {
  ghs: { data: [] },
  census: { data: [] },
  population: { data: [], provinces: [] },
  hunger: { data: [] },
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const layer = (searchParams.get('layer') ?? 'ghs') as StatsSALayer

  if (!['ghs', 'census', 'population', 'hunger'].includes(layer)) {
    return NextResponse.json(
      { error: 'Invalid layer. Must be one of: ghs, census, population, hunger' },
      { status: 400 },
    )
  }

  const cacheHeaders = {
    'Cache-Control': 'max-age=21600, stale-while-revalidate=3600',
  }

  try {
    const res = await fetch(`${BACKEND_URL}/api/stats-sa/${layer}`, {
      next: { revalidate: 21600 },
      headers: { 'Content-Type': 'application/json' },
    })

    if (!res.ok) {
      throw new Error(`Backend error: ${res.status}`)
    }

    const data = await res.json()
    return NextResponse.json(data, { headers: cacheHeaders })
  } catch {
    return NextResponse.json(EMPTY_RESPONSES[layer], {
      headers: cacheHeaders,
    })
  }
}
