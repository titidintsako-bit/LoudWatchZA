'use client'

import { Building2 } from 'lucide-react'
import { CollapsiblePanel } from '@/components/ui/Panel'
import { useStore } from '@/store/useStore'

const AUDIT_CATEGORIES = [
  { score: 5, label: 'Clean Audit',              borderColor: 'var(--normal)',   bg: 'var(--normal-bg)' },
  { score: 4, label: 'Unqualified with Findings', borderColor: 'var(--normal)',   bg: 'transparent' },
  { score: 3, label: 'Qualified',                borderColor: 'var(--warning)',  bg: 'var(--warning-bg)' },
  { score: 2, label: 'Adverse',                  borderColor: 'var(--critical)', bg: 'var(--critical-bg)' },
  { score: 1, label: 'Disclaimer',               borderColor: 'var(--critical)', bg: 'var(--critical-bg)' },
  { score: 0, label: 'Outstanding',              borderColor: 'var(--t-dim)',    bg: 'transparent' },
]

function getParliamentStatus(): { label: string; color: string } {
  const month = new Date().getMonth() + 1
  const inSession = (month >= 2 && month <= 6) || (month >= 8 && month <= 11)
  return inSession
    ? { label: 'PARLIAMENT · IN SESSION', color: 'var(--normal)' }
    : { label: 'PARLIAMENT · IN RECESS',  color: 'var(--t-meta)' }
}

export default function GovernancePosturePanel() {
  const municipalities = useStore((s) => s.municipalities)
  const parliament = getParliamentStatus()
  const total = municipalities.length

  const distribution = AUDIT_CATEGORIES.map((cat) => {
    const count = municipalities.filter((m) => Math.round(m.audit_score) === cat.score).length
    const pct = total > 0 ? (count / total) * 100 : 0
    return { ...cat, count, pct }
  })

  return (
    <CollapsiblePanel
      icon={<Building2 size={11} />}
      title="AUDIT OUTCOMES"
      source={total > 0 ? `${total} municipalities` : undefined}
    >
      {/* Parliament status */}
      <div className="data-row">
        <span className="data-label">Parliament</span>
        <span style={{ fontFamily: 'var(--font-data)', fontSize: 11, color: parliament.color }}>
          {parliament.label}
        </span>
      </div>

      {/* Audit distribution rows */}
      {total === 0
        ? Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="data-row">
              <div style={{ height: 10, width: '55%', background: 'var(--div)', borderRadius: 1 }} />
              <div style={{ height: 10, width: 30, background: 'var(--div)', borderRadius: 1 }} />
            </div>
          ))
        : distribution.map((cat) => (
            <div key={cat.score}>
              <div
                className="data-row"
                style={{
                  borderLeft: `2px solid ${cat.borderColor}`,
                  paddingLeft: 10,
                  background: cat.bg,
                }}
              >
                <span className="data-label">{cat.label}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                  <span className="data-value">{cat.count}</span>
                  <span style={{ fontFamily: 'var(--font-data)', fontSize: 11, color: 'var(--t-meta)', width: 38, textAlign: 'right' }}>
                    {cat.pct.toFixed(1)}%
                  </span>
                </div>
              </div>
              {/* 2px bar */}
              <div style={{ height: 2, background: 'var(--div)' }}>
                <div style={{ height: '100%', width: `${cat.pct}%`, background: cat.borderColor, transition: 'width 0.3s' }} />
              </div>
            </div>
          ))
      }
    </CollapsiblePanel>
  )
}
