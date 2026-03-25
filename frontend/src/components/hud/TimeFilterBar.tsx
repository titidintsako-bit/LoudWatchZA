'use client'

import { useStore } from '@/store/useStore'
import type { TimeFilter } from '@/store/useStore'

const OPTIONS: TimeFilter[] = ['1H', '6H', '24H', '48H', '7D', 'ALL']

export default function TimeFilterBar() {
  const timeFilter = useStore((s) => s.timeFilter)
  const setTimeFilter = useStore((s) => s.setTimeFilter)

  return (
    <div
      className="flex items-center gap-0.5"
      style={{
        background: 'rgba(10,14,23,0.85)',
        border: '1px solid rgba(14,165,233,0.12)',
        borderRadius: 4,
        padding: '2px 3px',
      }}
    >
      {OPTIONS.map((opt) => {
        const active = timeFilter === opt
        return (
          <button
            key={opt}
            type="button"
            onClick={() => setTimeFilter(opt)}
            style={{
              fontFamily: 'var(--font-data)',
              fontSize: '0.5rem',
              letterSpacing: '0.08em',
              padding: '3px 6px',
              borderRadius: 3,
              border: 'none',
              cursor: 'pointer',
              transition: 'background 0.15s, color 0.15s',
              background: active ? 'var(--accent)' : 'transparent',
              color: active ? '#0a0e17' : 'rgba(14,165,233,0.4)',
              fontWeight: active ? 700 : 400,
            }}
          >
            {opt}
          </button>
        )
      })}
    </div>
  )
}
