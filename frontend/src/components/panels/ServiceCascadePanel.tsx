'use client'

import { AlertTriangle } from 'lucide-react'
import { format } from 'date-fns'
import { GlassCard } from '@/components/ui/GlassCard'
import { useStore } from '@/store/useStore'
import { STAGE_COLORS } from '@/lib/constants'

function stageLabel(stage: number): string {
  if (stage === 0) return 'NO LOADSHEDDING'
  return `STAGE ${stage}`
}

function stageColor(stage: number): string {
  return STAGE_COLORS[Math.min(stage, STAGE_COLORS.length - 1)] ?? '#1a2a1a'
}

export default function ServiceCascadePanel() {
  const loadshedding = useStore((s) => s.loadshedding)
  const municipalities = useStore((s) => s.municipalities)

  const stage = loadshedding?.stage ?? 0
  const color = stageColor(stage)

  const topWaterShortage = [...municipalities]
    .filter((m) => (m.no_piped_water_pct ?? 0) > 0)
    .sort((a, b) => (b.no_piped_water_pct ?? 0) - (a.no_piped_water_pct ?? 0))
    .slice(0, 3)

  const timestamp = format(new Date(), 'HH:mm')

  return (
    <GlassCard
      title="SERVICE CASCADE"
      titleIcon={<AlertTriangle className="w-3.5 h-3.5" />}
      collapsible
    >
      <div className="space-y-3">
        {/* Electricity */}
        <div
          className="pl-2 border-l-2"
          style={{ borderLeftColor: color }}
        >
          <p className="text-[9px] font-orbitron tracking-widest uppercase text-[var(--t-label)] mb-1">
            ELECTRICITY
          </p>
          <div className="flex items-center gap-2">
            <span
              className={`text-[10px] font-fira font-bold ${stage > 0 ? 'animate-pulse' : ''}`}
              style={{ color }}
            >
              {stageLabel(stage)}
            </span>
            {loadshedding?.areas_affected !== undefined && loadshedding.areas_affected > 0 && (
              <span className="text-[8px] text-[var(--t-meta)] font-fira">
                {loadshedding.areas_affected} areas affected
              </span>
            )}
          </div>
        </div>

        {/* Water */}
        <div
          className="pl-2 border-l-2"
          style={{ borderLeftColor: 'var(--accent)' }}
        >
          <p className="text-[9px] font-orbitron tracking-widest uppercase text-[var(--t-label)] mb-1">
            WATER
          </p>
          {topWaterShortage.length === 0 ? (
            <p className="text-[10px] text-[var(--normal)] font-fira">No critical shortages reported</p>
          ) : (
            <div className="space-y-0.5">
              {topWaterShortage.map((m) => (
                <p key={m.id} className="text-[10px] font-fira text-[var(--t-value)]">
                  <span className="text-[var(--t-label)]">{m.name}:</span>{' '}
                  <span className="text-[var(--critical)]">{(m.no_piped_water_pct ?? 0).toFixed(1)}%</span>{' '}
                  <span className="text-[var(--t-meta)]">without water</span>
                </p>
              ))}
            </div>
          )}
        </div>

        {/* Roads */}
        <div
          className="pl-2 border-l-2"
          style={{ borderLeftColor: 'var(--warning)' }}
        >
          <p className="text-[9px] font-orbitron tracking-widest uppercase text-[var(--t-label)] mb-1">
            ROADS
          </p>
          <div className="space-y-0.5">
            <p className="text-[10px] font-fira text-[var(--t-value)]">
              <span className="text-[var(--t-label)]">N1 Cape Town–Paarl:</span>{' '}
              <span className="text-[var(--warning)]">Roadworks delays</span>
            </p>
            <p className="text-[10px] font-fira text-[var(--t-value)]">
              <span className="text-[var(--t-label)]">N3 Durban–Joburg:</span>{' '}
              <span className="text-[var(--normal)]">Clear</span>
            </p>
          </div>
        </div>

        {/* Comms */}
        <div
          className="pl-2 border-l-2"
          style={{ borderLeftColor: 'var(--normal)' }}
        >
          <p className="text-[9px] font-orbitron tracking-widest uppercase text-[var(--t-label)] mb-1">
            COMMS
          </p>
          <p className="text-[10px] font-fira text-[var(--normal)]">
            All major networks operational
          </p>
        </div>
      </div>

      <p className="text-[9px] text-[var(--t-meta)] font-fira mt-3">
        Updated {timestamp} SAST
      </p>
    </GlassCard>
  )
}
