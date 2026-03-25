'use client'

import { useState } from 'react'
import { BookOpen, ChevronDown, ChevronUp } from 'lucide-react'
import { CollapsiblePanel } from '@/components/ui/Panel'

interface Recommendation {
  id: number
  category: string
  description: string
  status: 'implemented' | 'partial' | 'pending' | 'rejected'
}

const TOTAL_RECS = 52
const IMPLEMENTED = 14
const PARTIAL = 21
const PENDING = 15
const REJECTED = 2

const SAMPLE_RECS: Recommendation[] = [
  { id: 1,  category: 'NPA',        description: 'Establish dedicated state capture prosecution unit',      status: 'implemented' },
  { id: 2,  category: 'SARS',       description: 'Restore SARS capacity and independence',                  status: 'implemented' },
  { id: 3,  category: 'Hawks',      description: 'Overhaul DPCI (Hawks) appointment process',               status: 'partial' },
  { id: 4,  category: 'SOE',        description: 'Reform Eskom, Transnet, PRASA governance boards',         status: 'partial' },
  { id: 5,  category: 'Presidency', description: 'Strengthen disclosure requirements for public officials', status: 'pending' },
  { id: 6,  category: 'Parliament', description: 'Establish permanent state capture oversight committee',   status: 'pending' },
  { id: 7,  category: 'Judiciary',  description: 'Create specialist corruption court',                      status: 'partial' },
  { id: 8,  category: 'Gupta',      description: 'Mutual legal assistance — asset recovery from UAE',       status: 'pending' },
]

const STATUS_COLOR: Record<string, string> = {
  implemented: 'var(--normal)',
  partial:     'var(--warning)',
  pending:     'var(--t-meta)',
  rejected:    'var(--critical)',
}
const STATUS_LABEL: Record<string, string> = {
  implemented: 'DONE',
  partial:     'PARTIAL',
  pending:     'PENDING',
  rejected:    'REJECTED',
}

export default function StateCapturePanel() {
  const [showAll, setShowAll] = useState(false)
  const recs = showAll ? SAMPLE_RECS : SAMPLE_RECS.slice(0, 4)
  const pctDone = Math.round(((IMPLEMENTED + PARTIAL * 0.5) / TOTAL_RECS) * 100)

  return (
    <CollapsiblePanel
      icon={<BookOpen size={11} />}
      title="STATE CAPTURE · ZONDO"
      source="Zondo Commission"
    >
      {/* Hero */}
      <div className="hero-stat">
        <div style={{ flex: 1 }}>
          <div className="hero-label">IMPLEMENTATION</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span className="hero-value" style={{ color: 'var(--warning)' }}>{pctDone}%</span>
            <span style={{ fontFamily: 'var(--font-data)', fontSize: 11, color: 'var(--t-meta)' }}>
              {IMPLEMENTED + Math.round(PARTIAL * 0.5)}/{TOTAL_RECS} recs
            </span>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="progress-track">
        <div className="progress-fill-warning" style={{ width: `${pctDone}%` }} />
      </div>

      {/* Status summary row */}
      <div className="data-row" style={{ gap: 16 }}>
        {[
          { label: 'Done',     count: IMPLEMENTED, color: 'var(--normal)' },
          { label: 'Partial',  count: PARTIAL,     color: 'var(--warning)' },
          { label: 'Pending',  count: PENDING,     color: 'var(--t-meta)' },
          { label: 'Rejected', count: REJECTED,    color: 'var(--critical)' },
        ].map((s) => (
          <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ fontFamily: 'var(--font-data)', fontSize: 9, color: 'var(--t-meta)' }}>{s.label}</span>
            <span style={{ fontFamily: 'var(--font-data)', fontSize: 11, color: s.color }}>{s.count}</span>
          </div>
        ))}
      </div>

      {/* Recommendations */}
      {recs.map((r) => (
        <div
          key={r.id}
          className="data-row"
          style={{
            height: 'auto',
            minHeight: 36,
            padding: '6px 12px',
            flexDirection: 'column',
            alignItems: 'flex-start',
            gap: 3,
            borderLeft: `2px solid ${STATUS_COLOR[r.status]}`,
            paddingLeft: 10,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%' }}>
            <span style={{ fontFamily: 'var(--font-data)', fontSize: 9, color: 'var(--t-meta)', minWidth: 18 }}>
              #{r.id}
            </span>
            <span style={{ fontFamily: 'var(--font-data)', fontSize: 9, color: 'var(--t-meta)', background: 'var(--bg-2)', border: '1px solid var(--div)', borderRadius: 2, padding: '1px 4px' }}>
              {r.category}
            </span>
            <span style={{ fontFamily: 'var(--font-data)', fontSize: 9, color: STATUS_COLOR[r.status], marginLeft: 'auto' }}>
              {STATUS_LABEL[r.status]}
            </span>
          </div>
          <p style={{ fontFamily: 'var(--font-ui)', fontSize: 11, color: 'var(--t-label)', lineHeight: 1.4 }}>
            {r.description}
          </p>
        </div>
      ))}

      <button
        type="button"
        onClick={() => setShowAll((v) => !v)}
        style={{
          width: '100%', padding: '6px 12px', background: 'none', border: 'none',
          borderTop: '1px solid var(--div)', color: 'var(--t-meta)',
          fontFamily: 'var(--font-data)', fontSize: 9, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
          transition: 'color 0.1s',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--t-label)')}
        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--t-meta)')}
      >
        {showAll
          ? <><ChevronUp size={10} /> SHOW LESS</>
          : <><ChevronDown size={10} /> SHOW ALL {TOTAL_RECS}</>}
      </button>
    </CollapsiblePanel>
  )
}
