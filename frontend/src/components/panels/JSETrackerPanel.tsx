'use client'

import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { useMarketData } from '@/hooks/useMarketData'
import { CollapsiblePanel } from '@/components/ui/Panel'
import DataWrapper from '@/components/ui/DataWrapper'

const TOP_COMPANIES = [
  { name: 'Naspers',    ticker: 'NPN',  sector: 'Tech' },
  { name: 'BHP',        ticker: 'BHG',  sector: 'Mining' },
  { name: 'Anglo',      ticker: 'AGL',  sector: 'Mining' },
  { name: 'Standard Bk',ticker: 'SBK',  sector: 'Finance' },
  { name: 'FirstRand',  ticker: 'FSR',  sector: 'Finance' },
  { name: 'MTN',        ticker: 'MTN',  sector: 'Telco' },
  { name: 'Shoprite',   ticker: 'SHP',  sector: 'Retail' },
  { name: 'Sasol',      ticker: 'SOL',  sector: 'Energy' },
  { name: 'AngloGold',  ticker: 'ANG',  sector: 'Mining' },
  { name: 'Nedbank',    ticker: 'NED',  sector: 'Finance' },
]

const SECTOR_COLORS: Record<string, string> = {
  Tech:    'var(--accent)',
  Mining:  'var(--gold)',
  Finance: 'var(--live)',
  Telco:   'var(--warning)',
  Energy:  'var(--critical)',
  Retail:  'var(--text-secondary)',
}

export default function JSETrackerPanel() {
  const { metrics, loading } = useMarketData()

  // Get JSE index metric for headline
  const jse = metrics.find((m) => m.id === 'jse')

  return (
    <CollapsiblePanel
      icon={<TrendingUp size={11} />}
      title="JSE Top Companies"
      live
      source="Delayed · stooq.com"
    >
      {/* Headline index */}
      {jse && (
        <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: 'var(--text-secondary)' }}>JSE Top 40</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>
              {jse.price?.toLocaleString('en-ZA', { maximumFractionDigits: 0 }) ?? '—'}
            </span>
            {jse.price != null && jse.prev != null && (() => {
              const pct = ((jse.price! - jse.prev!) / Math.abs(jse.prev!)) * 100
              const col = pct >= 0 ? 'var(--live)' : 'var(--critical)'
              const Icon = pct >= 0 ? TrendingUp : TrendingDown
              return (
                <span style={{ display: 'flex', alignItems: 'center', gap: 2, color: col, fontFamily: 'var(--font-mono)', fontSize: 10 }}>
                  <Icon size={10} />
                  {pct >= 0 ? '+' : ''}{pct.toFixed(2)}%
                </span>
              )
            })()}
          </div>
        </div>
      )}

      <DataWrapper loading={loading} empty={TOP_COMPANIES.length === 0} emptyMessage="No data">
        {TOP_COMPANIES.map((co) => (
          <div key={co.ticker} className="data-row">
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 9,
                  color: SECTOR_COLORS[co.sector] ?? 'var(--text-muted)',
                  background: `${SECTOR_COLORS[co.sector] ?? 'var(--text-muted)'}18`,
                  borderRadius: 'var(--radius-sm)',
                  padding: '1px 4px',
                  border: `1px solid ${SECTOR_COLORS[co.sector] ?? 'var(--text-muted)'}30`,
                }}
              >
                {co.ticker}
              </span>
              <span className="data-label">{co.name}</span>
            </div>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)' }}>
              <Minus size={10} />
            </span>
          </div>
        ))}
      </DataWrapper>

      <div style={{ padding: '6px 12px', borderTop: '1px solid var(--border)' }}>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)' }}>
          Individual stock prices require JSE data subscription
        </p>
      </div>
    </CollapsiblePanel>
  )
}
