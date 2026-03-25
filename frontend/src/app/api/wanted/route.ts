import { NextRequest, NextResponse } from 'next/server'
import { BACKEND_URL } from '@/lib/constants'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const params = new URLSearchParams()
  for (const [k, v] of searchParams.entries()) params.set(k, v)

  try {
    const res = await fetch(`${BACKEND_URL}/api/wanted?${params}`, {
      next: { revalidate: 300 },
      headers: { 'Content-Type': 'application/json' },
    })
    if (!res.ok) throw new Error(`Backend ${res.status}`)
    const data = await res.json()
    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'max-age=300, stale-while-revalidate=60' },
    })
  } catch {
    return NextResponse.json(
      { persons: [], total: 0, last_updated: null, error: 'Unavailable' },
      { headers: { 'Cache-Control': 'max-age=60' } },
    )
  }
}
