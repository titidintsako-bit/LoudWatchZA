import { NextResponse } from 'next/server'
import { BACKEND_URL } from '@/lib/constants'

export async function GET() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/ai-brief`, {
      next: { revalidate: 21600 },
      headers: { 'Content-Type': 'application/json' },
    })
    if (!res.ok) throw new Error(`Backend error: ${res.status}`)
    const data = await res.json()
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'max-age=21600, stale-while-revalidate=600',
      },
    })
  } catch {
    return NextResponse.json(
      {
        brief: 'Brief unavailable.',
        generated_at: new Date().toISOString(),
        topics: [],
      },
      {
        headers: {
          'Cache-Control': 'max-age=60, stale-while-revalidate=30',
        },
      },
    )
  }
}
