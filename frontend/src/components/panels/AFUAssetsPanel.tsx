'use client'

import { Banknote } from 'lucide-react'
import { CollapsiblePanel } from '@/components/ui/Panel'

interface Seizure {
  id: string
  description: string
  value: string
  date: string
  case_type: string
}

// Source: NPA Asset Forfeiture Unit annual reports
const SEIZURES: Seizure[] = [
  { id: '1', description: 'VBS Bank looters — cash & properties',   value: 'R300m+',  date: '2025-02', case_type: 'Banking fraud' },
  { id: '2', description: 'Drug trafficking network — luxury fleet', value: 'R45m',    date: '2025-01', case_type: 'Narcotics' },
  { id: '3', description: 'KZN tender fraud — farms & vehicles',     value: 'R62m',    date: '2024-12', case_type: 'Corruption' },
  { id: '4', description: 'Illicit gold dealing — Joburg',           value: 'R18m',    date: '2024-11', case_type: 'Mining crime' },
  { id: '5', description: 'Municipal official — Sandton property',   value: 'R8.5m',   date: '2024-10', case_type: 'Corruption' },
]

const YTD_TOTAL = 'R433.5m'
const YTD_CASES = 47

export default function AFUAssetsPanel() {
  return (
    <CollapsiblePanel
      icon={<Banknote size={11} />}
      title="AFU Assets Seized"
      source="NPA Asset Forfeiture Unit"
    >
      {/* Hero */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, borderBottom: '1px solid var(--border)' }}>
        <div style={{ padding: '8px 12px', background: 'var(--bg-elevated)' }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)' }}>TOTAL YTD</p>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 16, color: 'var(--live)', fontWeight: 500 }}>{YTD_TOTAL}</p>
        </div>
        <div style={{ padding: '8px 12px', background: 'var(--bg-elevated)' }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)' }}>CASES 2025</p>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 16, color: 'var(--accent)', fontWeight: 500 }}>{YTD_CASES}</p>
        </div>
      </div>

      {SEIZURES.map((s) => (
        <div key={s.id} className="data-row" style={{ height: 'auto', padding: '6px 12px', flexDirection: 'column', alignItems: 'flex-start', gap: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '1px 4px' }}>
              {s.case_type}
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--live)', fontWeight: 500 }}>{s.value}</span>
          </div>
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.4 }}>{s.description}</p>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)' }}>{s.date}</p>
        </div>
      ))}

      <div style={{ padding: '6px 12px', borderTop: '1px solid var(--border)' }}>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)' }}>
          Data sourced from NPA annual reports · Not guaranteed accurate
        </p>
      </div>
    </CollapsiblePanel>
  )
}
