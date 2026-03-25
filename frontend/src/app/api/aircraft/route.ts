import { NextResponse } from 'next/server'
import { BACKEND_URL } from '@/lib/constants'

export async function GET() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/aircraft`, {
      next: { revalidate: 14 },
      headers: { 'Content-Type': 'application/json' },
    })
    if (!res.ok) throw new Error(`Backend error: ${res.status}`)
    const data = await res.json()
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'max-age=14, stale-while-revalidate=2',
      },
    })
  } catch {
    return NextResponse.json(
      { aircraft: [], count: 0 },
      {
        headers: {
          'Cache-Control': 'max-age=10, stale-while-revalidate=5',
        },
      },
    )
  }
}
