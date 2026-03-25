'use client'

import { Droplets } from 'lucide-react'
import { useStore } from '@/store/useStore'

function levelColor(pct: number): string {
  if (pct < 20) return 'var(--critical)'
  if (pct < 40) return 'var(--warning)'
  return 'var(--live)'
}

export default function WaterSheet() {
  const dams = useStore((s) => s.dams)

  const sorted = [...(dams ?? [])].sort((a, b) => a.level_percent - b.level_percent).slice(0, 10)
  const national = dams && dams.length > 0
    ? dams.reduce((sum, d) => sum + d.level_percent, 0) / dams.length
    : null

  return (
    <div>
      {/* National average */}
      {national !== null && (
        <div style={{ padding: '16px', borderBottom: '1px solid var(--border)', textAlign: 'center' }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.05em', marginBottom: 8 }}>
            NATIONAL AVERAGE
          </p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
            <Droplets size={22} style={{ color: levelColor(national) }} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 32, fontWeight: 700, color: levelColor(national) }}>
              {national.toFixed(1)}%
            </span>
          </div>
          {/* Progress bar */}
          <div style={{ height: 6, background: 'var(--bg-elevated)', borderRadius: 3, overflow: 'hidden', marginTop: 10, maxWidth: 200, margin: '10px auto 0' }}>
            <div style={{ height: '100%', width: `${national}%`, background: levelColor(national), borderRadius: 3, transition: 'width 0.5s' }} />
          </div>
          {national < 30 && (
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--critical)', marginTop: 8 }}>
              ⚠ DAY ZERO RISK
            </p>
          )}
        </div>
      )}

      {/* Dam list */}
      <div style={{ padding: '8px 0' }}>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.05em', padding: '4px 16px 8px' }}>
          LOWEST LEVELS
        </p>
        {sorted.map((dam) => {
          const color = levelColor(dam.level_percent)
          return (
            <div key={dam.id} style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                <div>
                  <p style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--text-primary)', fontWeight: 500 }}>{dam.name}</p>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', marginTop: 1 }}>{dam.province}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 600, color }}>
                    {dam.level_percent.toFixed(1)}%
                  </p>
                  {dam.week_change_pct !== 0 && (
                    <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: dam.week_change_pct > 0 ? 'var(--live)' : 'var(--critical)' }}>
                      {dam.week_change_pct > 0 ? '+' : ''}{dam.week_change_pct.toFixed(1)}% 7d
                    </p>
                  )}
                </div>
              </div>
              <div style={{ height: 4, background: 'var(--bg-elevated)', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${dam.level_percent}%`, background: color, borderRadius: 2 }} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
