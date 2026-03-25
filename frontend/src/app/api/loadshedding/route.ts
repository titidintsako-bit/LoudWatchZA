import { NextResponse } from 'next/server'
import { BACKEND_URL } from '@/lib/constants'

export async function GET() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/loadshedding/current`, {
      next: { revalidate: 55 },
      headers: { 'Content-Type': 'application/json' },
    })
    if (!res.ok) throw new Error(`Backend error: ${res.status}`)
    const data = await res.json()
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'max-age=55, stale-while-revalidate=5',
      },
    })
  } catch {
    return NextResponse.json(
      {
        stage: 0,
        updated_at: new Date().toISOString(),
        areas_affected: 0,
      },
      {
        headers: {
          'Cache-Control': 'max-age=30, stale-while-revalidate=10',
        },
      },
    )
  }
}
