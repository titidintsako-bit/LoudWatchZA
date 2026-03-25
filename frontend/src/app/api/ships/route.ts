import { NextResponse } from 'next/server'
import { BACKEND_URL } from '@/lib/constants'

export async function GET() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/ships`, {
      next: { revalidate: 29 },
      headers: { 'Content-Type': 'application/json' },
    })
    if (!res.ok) throw new Error(`Backend error: ${res.status}`)
    const data = await res.json()
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'max-age=29, stale-while-revalidate=5',
      },
    })
  } catch {
    return NextResponse.json(
      { ships: [], count: 0 },
      {
        headers: {
          'Cache-Control': 'max-age=20, stale-while-revalidate=10',
        },
      },
    )
  }
}
