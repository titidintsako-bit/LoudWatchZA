'use client'

import { AlertTriangle } from 'lucide-react'
import { CollapsiblePanel } from '@/components/ui/Panel'

interface CrimeCategory {
  name: string
  count_pa: number
  trend: 'up' | 'down' | 'stable'
  source_period: string
}

// Source: SAPS Crime Stats 2023/24 (released Sep 2024)
const CATEGORIES: CrimeCategory[] = [
  { name: 'Murder',                count_pa: 27494, trend: 'up',     source_period: '2023/24' },
  { name: 'Sexual offences',       count_pa: 56289, trend: 'up',     source_period: '2023/24' },
  { name: 'Assault GBH',           count_pa: 184864,trend: 'stable', source_period: '2023/24' },
  { name: 'Robbery (aggravated)',   count_pa: 135200,trend: 'down',   source_period: '2023/24' },
  { name: 'Carjacking',             count_pa: 13762, trend: 'up',     source_period: '2023/24' },
  { name: 'House robbery',          count_pa: 24264, trend: 'down',   source_period: '2023/24' },
  { name: 'Business robbery',       count_pa: 14618, trend: 'up',     source_period: '2023/24' },
  { name: 'Kidnapping',             count_pa: 4191,  trend: 'up',     source_period: '2023/24' },
  { name: 'Commercial crime',       count_pa: 85100, trend: 'stable', source_period: '2023/24' },
  { name: 'Drug-related',           count_pa: 392340,trend: 'up',     source_period: '2023/24' },
]

const TREND_COLOR = { up: 'var(--critical)', down: 'var(--live)', stable: 'var(--text-muted)' }
const TREND_ICON  = { up: '↑', down: '↓', stable: '→' }

const max = Math.max(...CATEGORIES.map((c) => c.count_pa))

export default function CrimeCategoriesPanel() {
  return (
    <CollapsiblePanel
      icon={<AlertTriangle size={11} />}
      title="SAPS Crime Statistics"
      updatedAt="2023/24"
      source="SAPS Annual Report"
    >
      {CATEGORIES.map((c) => {
        const pct = (c.count_pa / max) * 100
        return (
          <div key={c.name} style={{ padding: '5px 12px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
              <span style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--text-secondary)' }}>{c.name}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-primary)' }}>
                  {c.count_pa.toLocaleString('en-ZA')}
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: TREND_COLOR[c.trend] }}>
                  {TREND_ICON[c.trend]}
                </span>
              </div>
            </div>
            <div style={{ height: 2, background: 'var(--bg-elevated)', borderRadius: 1 }}>
              <div
                style={{
                  height: '100%',
                  width: `${pct}%`,
                  background: c.trend === 'up' ? 'var(--critical)' : c.trend === 'down' ? 'var(--live)' : 'var(--text-muted)',
                  borderRadius: 1,
                  opacity: 0.7,
                }}
              />
            </div>
          </div>
        )
      })}
      <div style={{ padding: '6px 12px' }}>
        <a
          href="https://www.saps.gov.za/services/crimestats.php"
          target="_blank"
          rel="noopener noreferrer"
          style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', textDecoration: 'none' }}
        >
          Full stats at SAPS →
        </a>
      </div>
    </CollapsiblePanel>
  )
}
