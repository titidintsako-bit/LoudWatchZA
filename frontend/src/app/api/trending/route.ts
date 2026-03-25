import { NextRequest, NextResponse } from 'next/server'
import { BACKEND_URL } from '@/lib/constants'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const force = searchParams.get('force') === 'true'
    const url = `${BACKEND_URL}/api/trending${force ? '?force=true' : ''}`
    const res = await fetch(url, { next: { revalidate: 3600 }, signal: AbortSignal.timeout(8000) })
    if (!res.ok) throw new Error(`Backend ${res.status}`)
    const data = await res.json()
    return NextResponse.json({ ...data, is_live: true })
  } catch {
    // Backend unavailable — return clearly-labelled demo data so the panel
    // can show an OFFLINE indicator rather than presenting stale info as real.
    return NextResponse.json({
      is_live: false,
      offline_reason: 'Backend unavailable',
      topics: [
        { rank: 1, topic: 'GNU Coalition Tensions',  mentions: 38, growth_pct: 22,  category: 'politics',    province: 'National',      articles: [], is_new: false },
        { rank: 2, topic: 'Eskom Stage 0 Streak',    mentions: 31, growth_pct: 12,  category: 'energy',      province: 'National',      articles: [], is_new: false },
        { rank: 3, topic: 'NHI Implementation',      mentions: 24, growth_pct: 40,  category: 'health',      province: 'National',      articles: [], is_new: true  },
        { rank: 4, topic: 'Joburg Water Crisis',     mentions: 19, growth_pct: 55,  category: 'water',       province: 'Gauteng',       articles: [], is_new: true  },
        { rank: 5, topic: 'Rand Under Pressure',     mentions: 17, growth_pct: 8,   category: 'economy',     province: 'National',      articles: [], is_new: false },
        { rank: 6, topic: 'Hawks Corruption Cases',  mentions: 15, growth_pct: 180, category: 'corruption',  province: 'Gauteng',       articles: [], is_new: true  },
        { rank: 7, topic: 'Cape Town Water Level',   mentions: 13, growth_pct: 5,   category: 'water',       province: 'Western Cape',  articles: [], is_new: false },
        { rank: 8, topic: 'SASSA Grant Delays',      mentions: 11, growth_pct: -3,  category: 'social',      province: 'National',      articles: [], is_new: false },
        { rank: 9, topic: 'Border Queue Backlog',    mentions: 10, growth_pct: 30,  category: 'migration',   province: 'Limpopo',       articles: [], is_new: false },
        { rank:10, topic: 'State Capture Hearings',  mentions:  9, growth_pct: 7,   category: 'corruption',  province: 'Gauteng',       articles: [], is_new: false },
      ],
      rising: [
        { rank: 3, topic: 'NHI Implementation',  mentions: 24, growth_pct: 40,  category: 'health',     province: 'National', articles: [], is_new: true },
        { rank: 6, topic: 'Hawks Corruption Cases', mentions: 15, growth_pct: 180, category: 'corruption', province: 'Gauteng', articles: [], is_new: true },
      ],
      province_topics: {
        'Gauteng':       { topic: 'Water Outages',     mentions: 19, category: 'water'      },
        'Western Cape':  { topic: 'Dam Levels',        mentions: 13, category: 'water'      },
        'KwaZulu-Natal': { topic: 'Unemployment',      mentions: 10, category: 'economy'    },
        'Eastern Cape':  { topic: 'Service Delivery',  mentions:  8, category: 'protest'    },
        'Limpopo':       { topic: 'Border Queues',     mentions:  7, category: 'migration'  },
        'Mpumalanga':    { topic: 'Mining Disputes',   mentions:  5, category: 'economy'    },
        'North West':    { topic: 'Corruption',        mentions:  4, category: 'corruption' },
        'Free State':    { topic: 'Water Cuts',        mentions:  4, category: 'water'      },
        'Northern Cape': { topic: 'Drought',           mentions:  3, category: 'environment'},
      },
      sentiment_national: -0.18,
      province_sentiment: {
        'Western Cape':  0.08,
        'Gauteng':      -0.21,
        'KwaZulu-Natal': -0.29,
        'Eastern Cape': -0.41,
        'Limpopo':      -0.25,
        'Mpumalanga':   -0.19,
        'North West':   -0.32,
        'Free State':   -0.27,
        'Northern Cape': -0.12,
      },
      computed_at: new Date().toISOString(),
    })
  }
}
