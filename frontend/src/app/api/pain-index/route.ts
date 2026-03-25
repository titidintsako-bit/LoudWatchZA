import { NextResponse } from 'next/server'
import { BACKEND_URL } from '@/lib/constants'

export async function GET() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/pain-index`, {
      next: { revalidate: 3600 },
      headers: { 'Content-Type': 'application/json' },
    })
    if (!res.ok) throw new Error(`Backend error: ${res.status}`)
    const data = await res.json()
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'max-age=3600, stale-while-revalidate=300',
      },
    })
  } catch {
    return NextResponse.json(
      { municipalities: [] },
      {
        headers: {
          'Cache-Control': 'max-age=60, stale-while-revalidate=30',
        },
      },
    )
  }
}
