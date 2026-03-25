'use client'

import { Droplets } from 'lucide-react'
import { CollapsiblePanel } from '@/components/ui/Panel'
import { useStore } from '@/store/useStore'

interface DayZeroCity {
  city: string
  dam: string
  current_pct: number
  day_zero_est: string | null
  status: 'safe' | 'watch' | 'warning' | 'critical'
}

const STATUS_COLOR: Record<string, string> = {
  safe:     'var(--live)',
  watch:    'var(--accent)',
  warning:  'var(--warning)',
  critical: 'var(--critical)',
}

const STATUS_LABEL: Record<string, string> = {
  safe:     'SAFE',
  watch:    'WATCH',
  warning:  'WARNING',
  critical: 'CRITICAL',
}

function getStatus(pct: number): DayZeroCity['status'] {
  if (pct > 60) return 'safe'
  if (pct > 40) return 'watch'
  if (pct > 20) return 'warning'
  return 'critical'
}

export default function DayZeroPanel() {
  const dams = useStore((s) => s.dams)

  // Build city-dam mappings from live dam data or use seed
  const CITIES: DayZeroCity[] = dams.length > 0
    ? [
        { city: 'Cape Town',     dam: 'Theewaterskloof', current_pct: dams.find((d) => d.name?.toLowerCase().includes('theewa'))?.level_percent ?? 65.2, day_zero_est: null, status: 'safe' },
        { city: 'Johannesburg',  dam: 'Vaal Dam',         current_pct: dams.find((d) => d.name?.toLowerCase().includes('vaal'))?.level_percent ?? 72.1,   day_zero_est: null, status: 'safe' },
        { city: 'Tshwane',       dam: 'Roodeplaat',       current_pct: dams.find((d) => d.name?.toLowerCase().includes('roodep'))?.level_percent ?? 58.3,  day_zero_est: null, status: 'watch' },
        { city: 'eThekwini',     dam: 'Midmar',           current_pct: dams.find((d) => d.name?.toLowerCase().includes('midmar'))?.level_percent ?? 44.6,  day_zero_est: 'TBD', status: 'watch' },
      ].map((c) => ({ ...c, status: getStatus(c.current_pct) }))
    : [
        { city: 'Cape Town',     dam: 'Theewaterskloof', current_pct: 65.2, day_zero_est: null,        status: 'safe' },
        { city: 'Johannesburg',  dam: 'Vaal Dam',         current_pct: 72.1, day_zero_est: null,        status: 'safe' },
        { city: 'Tshwane',       dam: 'Roodeplaat',       current_pct: 58.3, day_zero_est: null,        status: 'watch' },
        { city: 'eThekwini',     dam: 'Midmar',           current_pct: 44.6, day_zero_est: 'est 2027+', status: 'watch' },
        { city: 'Mangaung',      dam: 'Kalkfontein',      current_pct: 31.4, day_zero_est: 'est mid-2026', status: 'warning' },
        { city: 'Nelson Mandela',dam: 'Kouga',             current_pct: 19.1, day_zero_est: 'est 2025-07', status: 'critical' },
      ]

  return (
    <CollapsiblePanel
      icon={<Droplets size={11} />}
      title="Day Zero Calculator"
      source="DWS · City estimates"
    >
      <div style={{ padding: '6px 12px', borderBottom: '1px solid var(--border)' }}>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', lineHeight: 1.5 }}>
          Day Zero = when municipal water supply drops below 13.5% storage capacity.
          Cities at &lt;30% are on active restrictions.
        </p>
      </div>

      {CITIES.map((c) => (
        <div key={c.city} style={{ padding: '6px 12px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <div>
              <span style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--text-primary)', fontWeight: 500 }}>{c.city}</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', marginLeft: 6 }}>{c.dam}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: STATUS_COLOR[c.status], fontWeight: 500 }}>
                {c.current_pct.toFixed(1)}%
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: STATUS_COLOR[c.status] }}>
                {STATUS_LABEL[c.status]}
              </span>
            </div>
          </div>
          {/* Progress bar */}
          <div style={{ height: 3, background: 'var(--bg-elevated)', borderRadius: 2 }}>
            <div
              style={{
                height: '100%',
                width: `${c.current_pct}%`,
                background: STATUS_COLOR[c.status],
                borderRadius: 2,
                transition: 'width 0.5s ease',
              }}
            />
          </div>
          {c.day_zero_est && (
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--warning)', marginTop: 3 }}>
              Day Zero: {c.day_zero_est}
            </p>
          )}
        </div>
      ))}
    </CollapsiblePanel>
  )
}
