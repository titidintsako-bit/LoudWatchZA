'use client'

import { useEffect, useState } from 'react'
import { Shield } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { CollapsiblePanel } from '@/components/ui/Panel'
import DataWrapper from '@/components/ui/DataWrapper'

interface Arrest {
  id: string
  name: string
  charges: string
  amount_involved: string | null
  date: string
  province: string
  status: 'arrested' | 'charged' | 'convicted' | 'acquitted'
}

const STATUS_COLOR: Record<string, string> = {
  arrested:  'var(--warning)',
  charged:   'var(--accent)',
  convicted: 'var(--live)',
  acquitted: 'var(--text-muted)',
}

const SEED: Arrest[] = [
  { id: '1', name: 'Former VBS Bank director',   charges: 'Fraud & money laundering',      amount_involved: 'R1.9bn', date: '2025-03-05', province: 'Limpopo',       status: 'charged'   },
  { id: '2', name: 'Municipal supply chain head', charges: 'Bribery & tender fraud',        amount_involved: 'R45m',   date: '2025-02-20', province: 'Gauteng',       status: 'arrested'  },
  { id: '3', name: 'Senior SAPS officer',          charges: 'Racketeering & drug trafficking', amount_involved: null,  date: '2025-02-14', province: 'Western Cape',  status: 'arrested'  },
  { id: '4', name: 'Former Transnet CFO',           charges: 'Corruption & fraud',            amount_involved: 'R93m',  date: '2025-01-30', province: 'Gauteng',       status: 'convicted' },
  { id: '5', name: 'Water board official',          charges: 'Embezzlement',                 amount_involved: 'R12m',  date: '2025-01-18', province: 'KwaZulu-Natal', status: 'charged'   },
]

export default function HawksArrestsPanel() {
  const [arrests, setArrests] = useState<Arrest[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/judiciary?type=hawks')
      .then((r) => r.json())
      .then((d) => setArrests(d.hawks ?? SEED))
      .catch(() => setArrests(SEED))
      .finally(() => setLoading(false))
  }, [])

  const ytd = arrests.length
  const totalValue = arrests.reduce((sum, a) => {
    if (!a.amount_involved) return sum
    const num = parseFloat(a.amount_involved.replace(/[^0-9.]/g, ''))
    const mult = a.amount_involved.includes('bn') ? 1e9 : a.amount_involved.includes('m') ? 1e6 : 1
    return sum + num * mult
  }, 0)

  return (
    <CollapsiblePanel
      icon={<Shield size={11} />}
      title="Hawks Arrests"
      source="DPCI · NPA"
    >
      {/* Hero stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, borderBottom: '1px solid var(--border)' }}>
        <div style={{ padding: '8px 12px', background: 'var(--bg-elevated)' }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)' }}>ARRESTS YTD</p>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 18, color: 'var(--critical)', fontWeight: 500 }}>{ytd}</p>
        </div>
        <div style={{ padding: '8px 12px', background: 'var(--bg-elevated)' }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)' }}>VALUE SEIZED</p>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 14, color: 'var(--live)', fontWeight: 500 }}>
            R{totalValue >= 1e9 ? `${(totalValue / 1e9).toFixed(1)}bn` : `${(totalValue / 1e6).toFixed(0)}m`}
          </p>
        </div>
      </div>

      <DataWrapper loading={loading} empty={arrests.length === 0} emptyMessage="No recent arrests" skeletonRows={3}>
        {arrests.map((a) => (
          <div key={a.id} className="data-row" style={{ height: 'auto', padding: '6px 12px', flexDirection: 'column', alignItems: 'flex-start', gap: 2 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: STATUS_COLOR[a.status], textTransform: 'uppercase' }}>
                {a.status}
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', marginLeft: 'auto' }}>
                {formatDistanceToNow(new Date(a.date), { addSuffix: true })}
              </span>
            </div>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--text-primary)', fontWeight: 500 }}>{a.name}</p>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: 'var(--text-secondary)' }}>{a.charges}{a.amount_involved ? ` · ${a.amount_involved}` : ''}</p>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)' }}>{a.province}</p>
          </div>
        ))}
      </DataWrapper>
    </CollapsiblePanel>
  )
}
