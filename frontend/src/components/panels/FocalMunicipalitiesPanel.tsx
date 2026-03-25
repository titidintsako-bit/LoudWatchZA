'use client'

import { Target } from 'lucide-react'
import { GlassCard } from '@/components/ui/GlassCard'
import { useStore } from '@/store/useStore'

function painColor(score: number): string {
  if (score > 7) return 'var(--critical)'
  if (score > 5) return 'var(--warning)'
  return 'var(--normal)'
}

export default function FocalMunicipalitiesPanel() {
  const municipalities = useStore((s) => s.municipalities)
  const setMapView = useStore((s) => s.setMapView)

  const top10 = [...municipalities]
    .sort((a, b) => b.pain_score - a.pain_score)
    .slice(0, 10)

  return (
    <GlassCard
      title="FOCAL MUNICIPALITIES"
      titleIcon={<Target className="w-3.5 h-3.5" />}
      collapsible
    >
      {top10.length === 0 ? (
        <div className="space-y-1.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="py-1.5 px-1">
              <div className="h-2.5 bg-white/5 rounded animate-pulse w-3/4 mb-1" />
              <div className="h-1 bg-white/5 rounded animate-pulse w-full" />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-0.5">
          {top10.map((muni) => {
            const color = painColor(muni.pain_score)
            const barWidth = Math.min((muni.pain_score / 10) * 100, 100)
            return (
              <div
                key={muni.id}
                className="hover:bg-white/5 cursor-pointer py-1.5 px-1 rounded transition-colors"
                onClick={() => setMapView(10, [muni.lat, muni.lng])}
              >
                <div className="flex items-center justify-between mb-0.5">
                  <span className="font-orbitron text-[10px] uppercase text-[var(--t-value)] truncate max-w-[70%]">
                    {muni.name}
                  </span>
                  <span className="text-[10px] font-fira" style={{ color }}>
                    {muni.pain_score.toFixed(1)}
                  </span>
                </div>
                <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden mb-0.5">
                  <div
                    className="h-1 rounded-full transition-all"
                    style={{ width: `${barWidth}%`, background: color }}
                  />
                </div>
                <p className="text-[8px] text-[var(--t-meta)]">{muni.province}</p>
              </div>
            )
          })}
        </div>
      )}
    </GlassCard>
  )
}
