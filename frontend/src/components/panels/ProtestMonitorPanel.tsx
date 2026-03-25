'use client'

import { AlertCircle } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { GlassCard } from '@/components/ui/GlassCard'
import { NeonBadge } from '@/components/ui/NeonBadge'
import { useStore } from '@/store/useStore'
import { PROVINCE_COLORS } from '@/lib/constants'

type NeonVariant = 'cyan' | 'green' | 'red' | 'amber' | 'purple' | 'grey'

function provinceVariant(province: string): NeonVariant {
  const color = PROVINCE_COLORS[province]
  if (!color) return 'grey'
  if (color === 'var(--accent)') return 'cyan'
  if (color === 'var(--normal)') return 'green'
  if (color === 'var(--critical)') return 'red'
  if (color === 'var(--warning)') return 'amber'
  if (color === '#7b2fff') return 'purple'
  return 'grey'
}

function severityColor(severity: 'low' | 'medium' | 'high'): string {
  if (severity === 'high') return 'var(--critical)'
  if (severity === 'medium') return 'var(--warning)'
  return 'var(--accent)'
}

function safeFormatDate(dateStr: string): string {
  try {
    return format(parseISO(dateStr), 'dd MMM')
  } catch {
    return dateStr
  }
}

export default function ProtestMonitorPanel() {
  const protests = useStore((s) => s.protests)
  const setMapView = useStore((s) => s.setMapView)

  const sorted = [...protests].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  )
  const display = sorted.slice(0, 6)

  return (
    <GlassCard
      title="PROTEST MONITOR"
      titleIcon={<AlertCircle className="w-3.5 h-3.5" />}
      collapsible
    >
      {/* Count badge */}
      {protests.length > 0 && (
        <div className="flex items-center gap-1.5 mb-2">
          <NeonBadge variant="red">{protests.length} active</NeonBadge>
        </div>
      )}

      {display.length === 0 ? (
        <p className="text-[var(--t-meta)] text-xs text-center py-4 font-fira">
          No active protests in last 7 days
        </p>
      ) : (
        <div className="space-y-0">
          {display.map((protest) => (
            <div
              key={protest.id}
              className="py-2 border-b border-white/5 last:border-0"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                    <span className="text-[9px] text-[var(--t-meta)] font-fira flex-shrink-0">
                      {safeFormatDate(protest.date)}
                    </span>
                    <div
                      className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{ background: severityColor(protest.severity) }}
                      title={protest.severity}
                    />
                    <NeonBadge variant={provinceVariant(protest.province)}>
                      {protest.province.split(' ')[0]}
                    </NeonBadge>
                  </div>
                  <p className="text-[10px] text-[var(--t-value)] truncate leading-snug">
                    {protest.title}
                  </p>
                  <p className="text-[8px] text-[var(--t-meta)] uppercase mt-0.5 font-fira">
                    {protest.category}
                  </p>
                </div>
                <button
                  className="text-[10px] hover:text-[var(--accent)] transition-colors flex-shrink-0 mt-0.5"
                  onClick={() => setMapView(10, [protest.lat, protest.lng])}
                  title="View on map"
                >
                  📍
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-2 pt-2 border-t border-white/5">
        <a
          href="https://acleddata.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[8px] text-[var(--t-meta)] hover:text-[var(--t-label)] transition-colors font-fira"
        >
          Source: ACLED
        </a>
      </div>
    </GlassCard>
  )
}
