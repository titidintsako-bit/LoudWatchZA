'use client'

import { useRef } from 'react'
import { useStore } from '@/store/useStore'

const _PROVINCE_ABBR: Record<string, string> = {
  'Gauteng': 'GP', 'Western Cape': 'WC', 'KwaZulu-Natal': 'KZN',
  'Eastern Cape': 'EC', 'Free State': 'FS', 'Limpopo': 'LP',
  'Mpumalanga': 'MP', 'North West': 'NW', 'Northern Cape': 'NC',
}

export default function NewsStrip() {
  const loadshedding = useStore((s) => s.loadshedding)
  const articles     = useStore((s) => s.articles)
  const dams         = useStore((s) => s.dams)
  const exchangeRate = useStore((s) => s.exchangeRate)
  const petrolPrice  = useStore((s) => s.petrolPrice)
  const tickerRef    = useRef<HTMLDivElement>(null)

  const stage = loadshedding?.stage ?? 0
  const stageColor = stage === 0 ? 'var(--green)' : stage <= 2 ? 'var(--amber)' : 'var(--red)'
  const stageBg    = stage === 0 ? 'var(--green-bg)' : stage <= 2 ? 'var(--amber-bg)' : 'var(--red-bg)'
  const stageText  = stage === 0 ? 'NO LOADSHEDDING' : `STAGE ${stage}`

  // Build ticker items
  const items: string[] = []

  // National stage label per province (same stage for all, shown as one entry)
  if (stage > 0) {
    items.push(`ESKOM STAGE ${stage} ACTIVE`)
  }

  // Latest headlines
  for (const a of articles.slice(0, 8)) {
    const src = a.source?.toUpperCase().slice(0, 10) ?? 'NEWS'
    const title = a.title.length > 60 ? `${a.title.slice(0, 60)}…` : a.title
    items.push(`${src} — ${title}`)
  }

  // Market data
  if (exchangeRate?.usd) items.push(`ZAR/USD: R${exchangeRate.usd.toFixed(2)}`)
  if (petrolPrice?.unleaded95) items.push(`95 ULP: R${petrolPrice.unleaded95.toFixed(2)}/L`)

  // Dam levels
  for (const d of dams.slice(0, 4)) {
    if (d.level_percent != null) items.push(`${d.name}: ${d.level_percent.toFixed(1)}%`)
  }

  if (items.length === 0) {
    return (
      <div className="news-strip">
        <div className="news-strip-label" style={{ color: stageColor, background: stageBg }}>
          {stageText}
        </div>
      </div>
    )
  }

  const content = items.join('  ·  ')
  const doubled = `${content}  ·  ${content}`
  const duration = Math.max(30, items.length * 4)

  return (
    <div className="news-strip">
      {/* Fixed loadshedding label */}
      <div className="news-strip-label" style={{ color: stageColor, background: stageBg }}>
        {stageText}
      </div>

      {/* Scrolling ticker */}
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        <div
          ref={tickerRef}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            height: '100%',
            whiteSpace: 'nowrap',
            animation: `tickerScroll ${duration}s linear infinite`,
            paddingLeft: 12,
          }}
          onMouseEnter={() => { if (tickerRef.current) tickerRef.current.style.animationPlayState = 'paused' }}
          onMouseLeave={() => { if (tickerRef.current) tickerRef.current.style.animationPlayState = 'running' }}
        >
          <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 8, color: 'var(--t-dim)', letterSpacing: '0.04em' }}>
            {doubled}
          </span>
        </div>
      </div>
    </div>
  )
}
