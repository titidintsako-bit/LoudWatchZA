'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronUp, ChevronDown } from 'lucide-react'
import type { LayerState, LoadsheddingStatus } from '@/types'

interface MapLegendProps {
  layers: LayerState
  loadshedding?: LoadsheddingStatus | null
}

const PAIN_STOPS = [
  { label: '0', color: '#16a34a' },
  { label: '1', color: '#aaff00' },
  { label: '2', color: '#ffeb3b' },
  { label: '3', color: '#d97706' },
  { label: '4', color: '#dc2626' },
  { label: '5', color: '#9c27b0' },
]

const STAGE_STOPS = [
  { label: '0', color: '#16a34a' },
  { label: '2', color: '#ffeb3b' },
  { label: '4', color: '#d97706' },
  { label: '6', color: '#dc2626' },
  { label: '8', color: '#9c27b0' },
]

export default function MapLegend({ layers }: MapLegendProps) {
  const [open, setOpen] = useState(false)

  const anyActive =
    layers.painIndex ||
    layers.loadshedding ||
    layers.news ||
    layers.aircraft ||
    layers.ships ||
    layers.protests

  if (!anyActive) return null

  return (
    <div className="absolute bottom-12 right-4 pointer-events-auto z-10">
      <div className="glass px-3 py-2 min-w-[160px]">
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex items-center justify-between w-full text-xs text-[#e8eaf0] hover:text-[var(--accent)] transition-colors"
        >
          <span className="font-orbitron text-[10px] tracking-widest text-[var(--accent)]">
            LEGEND
          </span>
          {open ? (
            <ChevronDown size={12} className="text-[#6b7280]" />
          ) : (
            <ChevronUp size={12} className="text-[#6b7280]" />
          )}
        </button>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="mt-2 space-y-3">
                {layers.painIndex && (
                  <div>
                    <p className="text-[9px] text-[#6b7280] mb-1 uppercase tracking-wider">
                      Pain Index
                    </p>
                    <div className="flex items-center gap-1">
                      {PAIN_STOPS.map((s) => (
                        <div key={s.label} className="flex flex-col items-center">
                          <div
                            className="w-4 h-3 rounded-sm"
                            style={{ background: s.color }}
                          />
                          <span
                            className="text-[8px] mt-0.5"
                            style={{ color: s.color }}
                          >
                            {s.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {layers.loadshedding && (
                  <div>
                    <p className="text-[9px] text-[#6b7280] mb-1 uppercase tracking-wider">
                      Loadshedding
                    </p>
                    <div className="flex items-center gap-1">
                      {STAGE_STOPS.map((s) => (
                        <div key={s.label} className="flex flex-col items-center">
                          <div
                            className="w-5 h-3 rounded-sm"
                            style={{ background: s.color }}
                          />
                          <span
                            className="text-[8px] mt-0.5"
                            style={{ color: s.color }}
                          >
                            S{s.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {layers.news && (
                  <div>
                    <p className="text-[9px] text-[#6b7280] mb-1 uppercase tracking-wider">
                      News Sentiment
                    </p>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ background: '#dc2626' }}
                        />
                        <span className="text-[9px] text-[#6b7280]">Neg</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ background: '#d97706' }}
                        />
                        <span className="text-[9px] text-[#6b7280]">Neutral</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ background: '#16a34a' }}
                        />
                        <span className="text-[9px] text-[#6b7280]">Pos</span>
                      </div>
                    </div>
                  </div>
                )}

                {layers.protests && (
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full border border-white/40"
                      style={{ background: '#dc2626' }}
                    />
                    <span className="text-[9px] text-[#6b7280]">Protest / Incident</span>
                  </div>
                )}

                {layers.aircraft && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm leading-none" style={{ color: '#0ea5e9' }}>
                      ✈
                    </span>
                    <span className="text-[9px] text-[#6b7280]">Aircraft</span>
                  </div>
                )}

                {layers.ships && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm leading-none" style={{ color: '#7b2fff' }}>
                      ⛵
                    </span>
                    <span className="text-[9px] text-[#6b7280]">Vessel</span>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
