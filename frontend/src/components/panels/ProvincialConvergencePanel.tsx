'use client'

import { Activity } from 'lucide-react'
import { GlassCard } from '@/components/ui/GlassCard'
import { useStore } from '@/store/useStore'
import { SA_PROVINCES } from '@/lib/constants'
import type { Municipality, Incident } from '@/types'

interface ProvinceSummaryRow {
  province: string
  avgPain: number
  avgWater: number
  protestCount: number
  unemploymentAvg: number
  signals: string[]
  signalCount: number
}

function computeProvinceSummary(
  province: string,
  municipalities: Municipality[],
  protests: Incident[],
): ProvinceSummaryRow {
  const provinceMusnis = municipalities.filter((m) => m.province === province)

  const avgPain =
    provinceMusnis.length > 0
      ? provinceMusnis.reduce((sum, m) => sum + m.pain_score, 0) / provinceMusnis.length
      : 0

  const avgWater =
    provinceMusnis.length > 0
      ? provinceMusnis.reduce((sum, m) => sum + (m.no_piped_water_pct ?? 0), 0) /
        provinceMusnis.length
      : 0

  const unemploymentAvg =
    provinceMusnis.length > 0
      ? provinceMusnis.reduce((sum, m) => sum + (m.unemployment_rate ?? 0), 0) /
        provinceMusnis.length
      : 0

  const protestCount = protests.filter((p) => p.province === province).length

  const signals: string[] = []
  if (avgPain > 6) signals.push('pain↑')
  if (avgWater > 15) signals.push('water↑')
  if (protestCount > 2) signals.push('protests↑')
  if (unemploymentAvg > 35) signals.push('econ↓')

  const signalCount = (avgWater > 15 ? 1 : 0) + (protestCount > 2 ? 1 : 0) + (avgPain > 6 ? 1 : 0)

  return { province, avgPain, avgWater, protestCount, unemploymentAvg, signals, signalCount }
}

export default function ProvincialConvergencePanel() {
  const municipalities = useStore((s) => s.municipalities)
  const protests = useStore((s) => s.protests)
  const setSelectedProvince = useStore((s) => s.setSelectedProvince)

  const rows: ProvinceSummaryRow[] = SA_PROVINCES.map((p) =>
    computeProvinceSummary(p, municipalities, protests),
  )

  return (
    <GlassCard
      title="CONVERGENCE"
      titleIcon={<Activity className="w-3.5 h-3.5" />}
      collapsible
    >
      <div className="space-y-0.5">
        {rows.map((row) => {
          let borderClass = ''
          let borderStyle: React.CSSProperties = {}
          if (row.signalCount >= 3) {
            borderClass = 'border-l-2'
            borderStyle = { borderLeftColor: 'var(--critical)' }
          } else if (row.signalCount === 2) {
            borderClass = 'border-l-2'
            borderStyle = { borderLeftColor: 'var(--warning)' }
          } else {
            borderClass = 'border-l-2'
            borderStyle = { borderLeftColor: 'var(--t-meta)' }
          }

          return (
            <div
              key={row.province}
              className={`flex items-center justify-between py-1.5 px-2 rounded hover:bg-white/5 cursor-pointer transition-colors ${borderClass}`}
              style={borderStyle}
              onClick={() => setSelectedProvince(row.province)}
            >
              <div className="flex flex-col min-w-0">
                <span
                  className="font-orbitron text-[9px] uppercase truncate"
                  style={{
                    color:
                      row.signalCount >= 3
                        ? 'var(--critical)'
                        : row.signalCount === 2
                          ? 'var(--warning)'
                          : 'var(--t-meta)',
                  }}
                >
                  {row.province}
                </span>
                {row.signals.length > 0 && (
                  <span className="text-[8px] text-[var(--t-label)] font-fira">
                    {row.signals.join(' ')}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                <span className="text-[8px] font-fira text-[var(--t-meta)]">
                  p{row.avgPain.toFixed(1)}
                </span>
                {row.protestCount > 0 && (
                  <span className="text-[8px] font-fira text-[var(--warning)]">
                    {row.protestCount}✗
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </GlassCard>
  )
}
