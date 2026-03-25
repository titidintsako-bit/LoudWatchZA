'use client'

import { motion } from 'framer-motion'
import { Droplets } from 'lucide-react'
import type { Dam } from '@/types'

interface Props {
  dams: Dam[]
  avgLevel: number
}

function getDamColor(pct: number): string {
  if (pct < 30) return 'var(--critical)'
  if (pct < 60) return 'var(--warning)'
  return 'var(--accent)'
}

function getDamGlow(pct: number): string {
  if (pct < 30) return 'rgba(220,38,38,0.35)'
  if (pct < 60) return 'rgba(255,145,0,0.35)'
  return 'rgba(14,165,233,0.35)'
}

function getAvgColor(pct: number): string {
  if (pct < 30) return 'var(--critical)'
  if (pct < 60) return 'var(--warning)'
  return 'var(--normal)'
}

function truncateName(name: string, max = 18): string {
  if (name.length <= max) return name
  return name.slice(0, max - 1) + '…'
}

export default function DamGauges({ dams, avgLevel }: Props) {
  const top5 = dams.slice(0, 5)

  return (
    <div
      className="relative rounded-xl border border-white/10 overflow-hidden"
      style={{
        background: 'rgba(10,14,23,0.80)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        boxShadow: '0 0 24px rgba(14,165,233,0.06), inset 0 1px 0 rgba(255,255,255,0.05)',
      }}
    >
      {/* Top accent bar */}
      <div
        className="h-0.5 w-full"
        style={{ background: 'linear-gradient(90deg, transparent, var(--accent), transparent)' }}
      />

      <div className="px-4 pt-3 pb-3">
        {/* Header */}
        <div className="flex items-center gap-2 mb-3">
          <div
            className="flex items-center justify-center w-7 h-7 rounded-lg"
            style={{
              background: 'rgba(14,165,233,0.1)',
              border: '1px solid rgba(14,165,233,0.3)',
            }}
          >
            <Droplets size={14} style={{ color: 'var(--accent)' }} />
          </div>
          <span
            style={{
              fontFamily: 'var(--font-data)',
              fontSize: '0.65rem',
              color: 'var(--accent)',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
            }}
          >
            Dam Levels
          </span>
          <div className="ml-auto flex items-center gap-1.5">
            <span
              style={{
                fontFamily: 'var(--font-data)',
                fontSize: '0.55rem',
                color: 'rgba(255,255,255,0.35)',
              }}
            >
              NAT AVG
            </span>
            <span
              style={{
                fontFamily: 'var(--font-data)',
                fontSize: '0.75rem',
                fontWeight: 700,
                color: getAvgColor(avgLevel),
                textShadow: `0 0 8px ${getAvgColor(avgLevel)}60`,
              }}
            >
              {avgLevel.toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Dam list */}
        <div className="flex flex-col gap-2.5">
          {top5.length === 0 ? (
            <p
              style={{
                fontFamily: 'var(--font-data)',
                fontSize: '0.65rem',
                color: 'rgba(255,255,255,0.3)',
                textAlign: 'center',
                padding: '0.75rem 0',
              }}
            >
              No dam data available
            </p>
          ) : (
            top5.map((dam, i) => {
              const color = getDamColor(dam.level_percent)
              const glow = getDamGlow(dam.level_percent)
              const clampedPct = Math.min(100, Math.max(0, dam.level_percent))

              return (
                <motion.div
                  key={dam.id}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.07, duration: 0.3, ease: 'easeOut' }}
                >
                  {/* Name + pct row */}
                  <div className="flex items-center justify-between mb-1">
                    <span
                      style={{
                        fontFamily: 'var(--font-data)',
                        fontSize: '0.62rem',
                        color: 'rgba(255,255,255,0.75)',
                        letterSpacing: '0.02em',
                      }}
                    >
                      {truncateName(dam.name)}
                    </span>
                    <span
                      style={{
                        fontFamily: 'var(--font-data)',
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        color,
                        textShadow: `0 0 6px ${glow}`,
                        minWidth: '3rem',
                        textAlign: 'right',
                      }}
                    >
                      {clampedPct.toFixed(1)}%
                    </span>
                  </div>

                  {/* Bar track */}
                  <div
                    className="w-full rounded-full overflow-hidden relative"
                    style={{
                      height: '6px',
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.06)',
                    }}
                  >
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${clampedPct}%` }}
                      transition={{
                        delay: i * 0.07 + 0.15,
                        duration: 0.7,
                        ease: 'easeOut',
                      }}
                      style={{
                        height: '100%',
                        background: `linear-gradient(90deg, ${color}66, ${color})`,
                        boxShadow: `0 0 8px ${glow}, 0 0 2px ${color}`,
                        borderRadius: '9999px',
                        position: 'relative',
                      }}
                    >
                      {/* Shimmer effect on bar */}
                      <div
                        style={{
                          position: 'absolute',
                          top: 0,
                          right: 0,
                          width: '20px',
                          height: '100%',
                          background: `linear-gradient(90deg, transparent, ${color}40, transparent)`,
                          borderRadius: '9999px',
                        }}
                      />
                    </motion.div>
                  </div>

                  {/* Capacity sub-label */}
                  <div className="flex items-center justify-between mt-0.5">
                    <span
                      style={{
                        fontFamily: 'var(--font-data)',
                        fontSize: '0.52rem',
                        color: 'rgba(255,255,255,0.25)',
                      }}
                    >
                      {dam.current_mcm.toFixed(0)} / {dam.capacity_mcm.toFixed(0)} MCm³
                    </span>
                    {dam.level_percent < 30 && (
                      <span
                        style={{
                          fontFamily: 'var(--font-data)',
                          fontSize: '0.45rem',
                          color: 'var(--critical)',
                          background: 'rgba(220,38,38,0.12)',
                          border: '1px solid rgba(220,38,38,0.3)',
                          borderRadius: '3px',
                          padding: '1px 4px',
                          letterSpacing: '0.05em',
                        }}
                      >
                        CRITICAL
                      </span>
                    )}
                  </div>
                </motion.div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
