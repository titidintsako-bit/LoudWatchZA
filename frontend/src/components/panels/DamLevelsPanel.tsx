'use client'

import { Droplets } from 'lucide-react'
import { CollapsiblePanel } from '@/components/ui/Panel'
import { useStore } from '@/store/useStore'
import type { Dam } from '@/types'

function levelColor(pct: number): string {
  if (pct < 30) return 'var(--critical)'
  if (pct < 60) return 'var(--warning)'
  return 'var(--normal)'
}

const DAY_ZERO_CITIES = [
  { city: 'Cape Town',    fragments: ['theewaterskloof', 'cape'], dailyUsageMl: 750 },
  { city: 'Johannesburg', fragments: ['vaal'],                    dailyUsageMl: 1200 },
  { city: 'Tshwane',      fragments: ['roodeplaat', 'erasmus'],   dailyUsageMl: 800 },
]

function findDam(dams: Dam[], fragments: string[]): Dam | undefined {
  return dams.find((d) => fragments.some((f) => d.name.toLowerCase().includes(f)))
}

export default function DamLevelsPanel() {
  const dams = useStore((s) => s.dams)
  const sorted = [...dams].sort((a, b) => a.level_percent - b.level_percent)
  const avg = dams.length > 0 ? dams.reduce((s, d) => s + d.level_percent, 0) / dams.length : 0

  return (
    <CollapsiblePanel
      icon={<Droplets size={11} />}
      title="DAM LEVELS · NATIONAL"
      source="DWS · weekly"
    >
      {/* Hero */}
      <div className="hero-stat">
        <div style={{ flex: 1 }}>
          <div className="hero-label">NATIONAL AVG</div>
          <span className="hero-value" style={{ color: levelColor(avg) }}>
            {dams.length > 0 ? `${avg.toFixed(1)}%` : '—'}
          </span>
        </div>
      </div>

      {/* Dam rows */}
      {sorted.length === 0
        ? Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="data-row">
              <div style={{ height: 10, width: '50%', background: 'var(--div)', borderRadius: 1 }} />
              <div style={{ height: 10, width: 40, background: 'var(--div)', borderRadius: 1 }} />
            </div>
          ))
        : sorted.map((dam) => {
            const color = levelColor(dam.level_percent)
            const changeUp = (dam.week_change_pct ?? 0) >= 0
            return (
              <div key={dam.id}>
                <div className="data-row">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 0 }}>
                    <span className="data-label">{dam.name}</span>
                    <span style={{ fontFamily: 'var(--font-data)', fontSize: 9, color: 'var(--t-meta)', flexShrink: 0 }}>
                      {dam.province?.slice(0, 3).toUpperCase()}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    {dam.week_change_pct !== undefined && (
                      <span style={{ fontFamily: 'var(--font-data)', fontSize: 10, color: changeUp ? 'var(--normal)' : 'var(--critical)' }}>
                        {changeUp ? '+' : ''}{dam.week_change_pct.toFixed(1)}%
                      </span>
                    )}
                    <span style={{ fontFamily: 'var(--font-data)', fontSize: 12, color, minWidth: 42, textAlign: 'right' }}>
                      {dam.level_percent.toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div style={{ height: 2, background: 'var(--div)' }}>
                  <div style={{ height: '100%', width: `${Math.min(dam.level_percent, 100)}%`, background: color }} />
                </div>
              </div>
            )
          })
      }

      {/* Day Zero */}
      <div style={{ borderTop: '1px solid var(--div)' }}>
        <div className="section-header">Day Zero Estimates</div>
        {DAY_ZERO_CITIES.map(({ city, fragments, dailyUsageMl }) => {
          const dam = findDam(dams, fragments)
          if (!dam) {
            return (
              <div key={city} className="data-row">
                <span className="data-label">{city}</span>
                <span className="data-value" style={{ color: 'var(--t-meta)' }}>—</span>
              </div>
            )
          }
          const currentMcm = (dam.level_percent / 100) * dam.capacity_mcm
          const days = Math.round((currentMcm * 1000) / dailyUsageMl)
          const color = days > 365 ? 'var(--normal)' : days >= 180 ? 'var(--warning)' : 'var(--critical)'
          return (
            <div key={city} className="data-row">
              <span className="data-label">{city}</span>
              <span style={{ fontFamily: 'var(--font-data)', fontSize: 12, color }}>
                {days > 365 ? `${(days / 365).toFixed(1)}y` : `${days}d`}
              </span>
            </div>
          )
        })}
      </div>
    </CollapsiblePanel>
  )
}
