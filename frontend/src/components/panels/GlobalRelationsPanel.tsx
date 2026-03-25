'use client'

import { Globe } from 'lucide-react'
import { CollapsiblePanel } from '@/components/ui/Panel'

interface Relation {
  country: string
  flag: string
  status: 'strategic' | 'neutral' | 'strained' | 'observer'
  trade_bn: number
  notes: string
}

const STATUS_COLOR: Record<string, string> = {
  strategic: 'var(--live)',
  neutral:   'var(--text-secondary)',
  strained:  'var(--warning)',
  observer:  'var(--accent)',
}

const RELATIONS: Relation[] = [
  { country: 'China',         flag: '🇨🇳', status: 'strategic', trade_bn: 59.3, notes: 'BRICS chair partner. Belt & Road.' },
  { country: 'United States', flag: '🇺🇸', status: 'strained',  trade_bn: 17.2, notes: 'AGOA renewal uncertain. ICJ tensions.' },
  { country: 'European Union',flag: '🇪🇺', status: 'neutral',   trade_bn: 44.1, notes: 'TDCA trade agreement ongoing.' },
  { country: 'Russia',        flag: '🇷🇺', status: 'observer',  trade_bn: 3.1,  notes: 'ICC warrant issue — Zuma declined visit.' },
  { country: 'India',         flag: '🇮🇳', status: 'strategic', trade_bn: 12.8, notes: 'BRICS. Growing tech investment.' },
  { country: 'Zimbabwe',      flag: '🇿🇼', status: 'neutral',   trade_bn: 2.3,  notes: 'Migration pressure. Beitbridge capacity.' },
  { country: 'Mozambique',    flag: '🇲🇿', status: 'strategic', trade_bn: 4.7,  notes: 'SADC security cooperation. Cabo Delgado.' },
  { country: 'UAE',           flag: '🇦🇪', status: 'strained',  trade_bn: 5.4,  notes: 'Gupta asset recovery unresolved.' },
]

export default function GlobalRelationsPanel() {
  return (
    <CollapsiblePanel
      icon={<Globe size={11} />}
      title="Global Relations"
      source="DIRCO · Trade data"
    >
      {RELATIONS.map((r) => (
        <div key={r.country} className="data-row" style={{ height: 'auto', padding: '6px 12px', flexDirection: 'column', alignItems: 'flex-start', gap: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%' }}>
            <span style={{ fontSize: 14 }}>{r.flag}</span>
            <span style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--text-primary)', fontWeight: 500, flex: 1 }}>
              {r.country}
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: STATUS_COLOR[r.status], textTransform: 'uppercase' }}>
              {r.status}
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)' }}>
              R{r.trade_bn}bn
            </span>
          </div>
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
            {r.notes}
          </p>
        </div>
      ))}
      <div style={{ padding: '6px 12px', borderTop: '1px solid var(--border)' }}>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)' }}>
          Trade figures: 2024 bilateral · DIRCO
        </p>
      </div>
    </CollapsiblePanel>
  )
}
