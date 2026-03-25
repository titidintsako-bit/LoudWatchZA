'use client'

import { BarChart2 } from 'lucide-react'
import { useStore } from '@/store/useStore'

export default function StatsSheet() {
  const municipalities = useStore((s) => s.municipalities)
  const exchangeRate = useStore((s) => s.exchangeRate)
  const petrolPrice = useStore((s) => s.petrolPrice)

  const top10 = [...(municipalities ?? [])]
    .sort((a, b) => b.pain_score - a.pain_score)
    .slice(0, 10)

  function painColor(score: number) {
    if (score >= 70) return 'var(--critical)'
    if (score >= 45) return 'var(--warning)'
    return 'var(--live)'
  }

  return (
    <div>
      {/* Economic snapshot */}
      {(exchangeRate || petrolPrice) && (
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.05em', marginBottom: 8 }}>ECONOMIC SNAPSHOT</p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {exchangeRate && (
              <>
                {([['USD', exchangeRate.usd], ['EUR', exchangeRate.eur], ['GBP', exchangeRate.gbp]] as [string, number][]).map(([currency, rate]) => (
                  <div key={currency} style={{ flex: 1, minWidth: 70, background: 'var(--bg-elevated)', borderRadius: 8, padding: '8px 10px', border: '1px solid var(--border)' }}>
                    <p style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--text-muted)' }}>ZAR/{currency}</p>
                    <p style={{ fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                      {rate?.toFixed(2) ?? '—'}
                    </p>
                  </div>
                ))}
              </>
            )}
            {petrolPrice && (
              <div style={{ flex: 1, minWidth: 70, background: 'var(--bg-elevated)', borderRadius: 8, padding: '8px 10px', border: '1px solid var(--border)' }}>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--text-muted)' }}>95 ULP</p>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                  R{petrolPrice.unleaded95?.toFixed(2) ?? '—'}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Pain Index */}
      <div>
        <div style={{ padding: '10px 16px 6px', display: 'flex', alignItems: 'center', gap: 6 }}>
          <BarChart2 size={12} style={{ color: 'var(--critical)' }} />
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>PAIN INDEX — TOP 10</p>
        </div>
        {top10.map((m, i) => {
          const color = painColor(m.pain_score)
          return (
            <div key={m.id} style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', minWidth: 18, textAlign: 'right' }}>
                {i + 1}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--text-primary)', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {m.name}
                </p>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', marginTop: 2 }}>
                  {m.province}
                </p>
                <div style={{ height: 3, background: 'var(--bg-elevated)', borderRadius: 2, overflow: 'hidden', marginTop: 4 }}>
                  <div style={{ height: '100%', width: `${m.pain_score}%`, background: color, borderRadius: 2 }} />
                </div>
              </div>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 600, color, minWidth: 36, textAlign: 'right' }}>
                {m.pain_score.toFixed(0)}
              </span>
            </div>
          )
        })}
        {top10.length === 0 && (
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', padding: '20px', textAlign: 'center' }}>
            Loading municipality data…
          </p>
        )}
      </div>
    </div>
  )
}
