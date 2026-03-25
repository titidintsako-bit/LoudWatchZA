'use client'

import { BarChart2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { useMarketData } from '@/hooks/useMarketData'
import { CollapsiblePanel } from '@/components/ui/Panel'

function delta(price: number | null, prev: number | null, invert?: boolean): number | null {
  if (price == null || prev == null || prev === 0) return null
  const raw = ((price - prev) / Math.abs(prev)) * 100
  return invert ? -raw : raw
}

function fmt(price: number | null, unit: string): string {
  if (price == null) return '—'
  if (unit === 'pts') return price.toLocaleString('en-ZA', { maximumFractionDigits: 0 })
  if (unit === '%') return `${price.toFixed(2)}%`
  if (unit === 'R') return `R${price.toFixed(2)}`
  return `$${price.toFixed(2)}`
}

export default function MarketDataPanel() {
  const { metrics, loading, asOf } = useMarketData()

  return (
    <CollapsiblePanel
      icon={<BarChart2 size={11} />}
      title="SA MARKETS"
      source="stooq · delayed"
    >
      {loading && metrics.length === 0
        ? Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="data-row">
              <div style={{ height: 10, width: '45%', background: 'var(--div)', borderRadius: 1 }} />
              <div style={{ height: 10, width: 60, background: 'var(--div)', borderRadius: 1 }} />
            </div>
          ))
        : metrics.map((m) => {
            const pct = delta(m.price, m.prev, m.invertSign)
            const up = pct != null && pct > 0
            const down = pct != null && pct < 0
            const changeColor = up ? 'var(--normal)' : down ? 'var(--critical)' : 'var(--t-meta)'
            const changeArrow = up ? '▲' : down ? '▼' : '—'

            return (
              <div key={m.id} className="data-row">
                <span className="data-label">{m.label}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                  <span className="data-value">{fmt(m.price, m.unit)}</span>
                  <span style={{ fontFamily: 'var(--font-data)', fontSize: 10, color: changeColor, minWidth: 50, textAlign: 'right' }}>
                    {changeArrow}{pct != null ? `${Math.abs(pct).toFixed(1)}%` : ''}
                  </span>
                </div>
              </div>
            )
          })
      }

      {asOf && (
        <div className="data-row" style={{ height: 24, borderTop: '1px solid var(--div)' }}>
          <span style={{ fontFamily: 'var(--font-data)', fontSize: 9, color: 'var(--t-meta)' }}>
            Updated {formatDistanceToNow(new Date(asOf), { addSuffix: true })}
          </span>
        </div>
      )}
    </CollapsiblePanel>
  )
}
