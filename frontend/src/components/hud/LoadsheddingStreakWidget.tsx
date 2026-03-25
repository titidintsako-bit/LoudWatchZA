'use client'

import { useEffect } from 'react'
import { useStore } from '@/store/useStore'
import { SA_PROVINCES } from '@/lib/constants'
import type { LoadsheddingStreak } from '@/types'

// SA has been largely loadshedding-free since ~March 2024.
// When stage > 0, this date resets. We compute against it.
const NATIONAL_CLEAN_SINCE = '2024-03-26'

function daysSince(dateStr: string): number {
  const diff = Date.now() - new Date(dateStr).getTime()
  return Math.max(0, Math.floor(diff / 86_400_000))
}

export default function LoadsheddingStreakWidget() {
  const loadshedding = useStore((s) => s.loadshedding)
  const setLoadsheddingStreaks = useStore((s) => s.setLoadsheddingStreaks)
  const streaks = useStore((s) => s.loadsheddingStreaks)

  useEffect(() => {
    const stage = loadshedding?.stage ?? 0
    if (stage > 0) {
      // Currently shedding — all streaks are 0
      setLoadsheddingStreaks([
        { province: 'NATIONAL', days: 0, since: new Date().toISOString(), isNational: true },
      ])
      return
    }

    const days = daysSince(NATIONAL_CLEAN_SINCE)
    const national: LoadsheddingStreak = {
      province: 'NATIONAL',
      days,
      since: NATIONAL_CLEAN_SINCE,
      isNational: true,
    }
    // Provinces share the national streak until per-province API data is available
    const provincial: LoadsheddingStreak[] = SA_PROVINCES.map((p) => ({
      province: p,
      days,
      since: NATIONAL_CLEAN_SINCE,
      isNational: false,
    }))
    setLoadsheddingStreaks([national, ...provincial])
  }, [loadshedding, setLoadsheddingStreaks])

  const national = streaks.find((s) => s.isNational)
  if (!national) return null

  const isClean = national.days > 0
  const isGolden = national.days >= 7

  return (
    <div
      className="flex items-center gap-1.5 px-2 py-1 rounded"
      style={{
        background: isGolden
          ? 'rgba(22,163,74,0.08)'
          : isClean
            ? 'rgba(22,163,74,0.04)'
            : 'rgba(220,38,38,0.08)',
        border: `1px solid ${isGolden ? 'rgba(22,163,74,0.3)' : isClean ? 'rgba(22,163,74,0.15)' : 'rgba(220,38,38,0.3)'}`,
      }}
      title={isClean ? `Clean since ${NATIONAL_CLEAN_SINCE}` : 'Currently load shedding'}
    >
      <span style={{ fontSize: '10px' }}>{isGolden ? '✓' : isClean ? '○' : '⚡'}</span>
      <span
        style={{
          fontFamily: 'var(--font-data)',
          fontSize: '0.5rem',
          letterSpacing: '0.08em',
          color: isGolden ? 'var(--normal)' : isClean ? 'var(--normal)' : 'var(--critical)',
        }}
      >
        {isClean ? `${national.days}D CLEAN` : 'SHEDDING'}
      </span>
    </div>
  )
}
