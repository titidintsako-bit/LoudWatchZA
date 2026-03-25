'use client'

import { TrendingUp } from 'lucide-react'
import { useStore } from '@/store/useStore'

export default function TrendingSheet() {
  const trending = useStore((s) => s.trending)
  const topics = trending?.topics ?? []
  const rising = trending?.rising ?? []

  function growthColor(pct: number) {
    if (pct >= 100) return 'var(--critical)'
    if (pct >= 50) return 'var(--warning)'
    return 'var(--live)'
  }

  function categoryColor(cat: string) {
    const MAP: Record<string, string> = {
      politics: 'var(--critical)', economy: 'var(--warning)',
      crime: 'var(--critical)', sports: 'var(--live)',
      entertainment: 'var(--accent)', technology: 'var(--accent)',
    }
    return MAP[cat.toLowerCase()] ?? 'var(--text-muted)'
  }

  return (
    <div>
      {/* Rising fast */}
      {rising.length > 0 && (
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.05em', marginBottom: 10 }}>
            RISING FAST
          </p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {rising.slice(0, 4).map((t) => (
              <div key={t.topic} style={{
                background: 'var(--critical)12', border: '1px solid var(--critical)33',
                borderRadius: 8, padding: '6px 10px',
              }}>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--critical)', fontWeight: 600 }}>
                  🔥 {t.topic}
                </p>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--text-muted)', marginTop: 2 }}>
                  +{t.growth_pct.toFixed(0)}%
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top topics */}
      <div>
        <div style={{ padding: '10px 16px 6px', display: 'flex', alignItems: 'center', gap: 6 }}>
          <TrendingUp size={12} style={{ color: 'var(--accent)' }} />
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>TOP 10 TRENDING</p>
        </div>

        {topics.slice(0, 10).map((t, i) => {
          const color = categoryColor(t.category)
          const growth = t.growth_pct
          return (
            <div key={t.topic} style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', minWidth: 18, textAlign: 'right' }}>
                {i + 1}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <p style={{ fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>
                    {t.topic}
                  </p>
                  {t.is_new && (
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 7, color: 'var(--live)', background: 'var(--live)18', border: '1px solid var(--live)44', borderRadius: 4, padding: '0 4px' }}>
                      NEW
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color }}>
                    {t.category}
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)' }}>
                    {t.mentions.toLocaleString()} mentions
                  </span>
                </div>
              </div>
              {growth !== 0 && (
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, color: growthColor(growth), flexShrink: 0 }}>
                  +{growth.toFixed(0)}%
                </span>
              )}
            </div>
          )
        })}

        {topics.length === 0 && (
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', padding: '20px', textAlign: 'center' }}>
            Loading trending data…
          </p>
        )}
      </div>
    </div>
  )
}
