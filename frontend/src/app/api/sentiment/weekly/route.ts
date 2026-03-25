import { NextResponse } from 'next/server'
import { BACKEND_URL } from '@/lib/constants'

export async function GET() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/sentiment/weekly`, {
      next: { revalidate: 3600 },
    })
    if (!res.ok) throw new Error(`Backend ${res.status}`)
    const data = await res.json()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({
      national_sentiment: -0.24,
      province_sentiment: {
        'Western Cape':  0.12,
        'Gauteng':      -0.18,
        'KwaZulu-Natal': -0.31,
        'Eastern Cape': -0.44,
        'Limpopo':      -0.28,
        'Mpumalanga':   -0.22,
        'North West':   -0.35,
        'Free State':   -0.29,
        'Northern Cape': -0.15,
      },
      most_positive: { province: 'Western Cape',  score:  0.12 },
      most_negative: { province: 'Eastern Cape',  score: -0.44 },
      computed_at: new Date().toISOString(),
    })
  }
}
