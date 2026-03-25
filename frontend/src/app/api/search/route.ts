import { NextRequest, NextResponse } from 'next/server'
import { BACKEND_URL } from '@/lib/constants'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q')

  if (!q || q.trim().length === 0) {
    return NextResponse.json({ results: [] })
  }

  try {
    const res = await fetch(
      `${BACKEND_URL}/api/search?q=${encodeURIComponent(q)}`,
      {
        headers: { 'Content-Type': 'application/json' },
        next: { revalidate: 60 },
      },
    )
    if (!res.ok) throw new Error(`Backend error: ${res.status}`)
    const data = await res.json()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ results: [] })
  }
}
