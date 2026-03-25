'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, ChevronRight } from 'lucide-react'
import type { Municipality } from '@/types'

interface Props {
  municipalities: Municipality[]
}

function getPainColor(score: number): string {
  if (score < 1.5) return 'var(--normal)'
  if (score < 2.5) return '#ffeb3b'
  if (score < 3.5) return 'var(--warning)'
  return 'var(--critical)'
}

function getPainGlow(score: number): string {
  if (score < 1.5) return 'rgba(22,163,74,0.3)'
  if (score < 2.5) return 'rgba(255,235,59,0.3)'
  if (score < 3.5) return 'rgba(255,145,0,0.3)'
  return 'rgba(220,38,38,0.3)'
}

function getRankColor(rank: number): string {
  const colors: Record<number, string> = {
    1: 'var(--critical)',
    2: '#ff4d6d',
    3: 'var(--warning)',
    4: '#ffeb3b',
    5: 'var(--normal)',
  }
  return colors[rank] ?? 'var(--normal)'
}

const PROVINCE_ABBR: Record<string, string> = {
  'Gauteng': 'GP',
  'Western Cape': 'WC',
  'KwaZulu-Natal': 'KZN',
  'Eastern Cape': 'EC',
  'Limpopo': 'LP',
  'Mpumalanga': 'MP',
  'North West': 'NW',
  'Free State': 'FS',
  'Northern Cape': 'NC',
}

function getProvinceAbbr(province: string): string {
  return PROVINCE_ABBR[province] ?? province.slice(0, 3).toUpperCase()
}

interface DimensionConfig {
  key: keyof Municipality
  label: string
  max: number
  color: string
  weight: string
}

const DIMENSIONS: DimensionConfig[] = [
  { key: 'audit_score',          label: 'Audit Score',    max: 5,   color: 'var(--normal)', weight: '20%' },
  { key: 'unemployment_rate',    label: 'Unemployment',   max: 100, color: '#ffeb3b', weight: '20%' },
  { key: 'loadshedding_days',    label: 'Loadshedding',   max: 365, color: 'var(--critical)', weight: '15%' },
  { key: 'water_shortage',       label: 'Water Shortage', max: 5,   color: 'var(--accent)', weight: '10%' },
  { key: 'no_piped_water_pct',   label: 'No Piped Water', max: 100, color: '#29b6f6', weight: '10%' },
  { key: 'no_electricity_pct',   label: 'No Electricity', max: 100, color: 'var(--warning)', weight: '10%' },
  { key: 'no_sanitation_pct',    label: 'No Sanitation',  max: 100, color: '#ef5350', weight: '8%'  },
  { key: 'ghs_service_fail_score', label: 'Service Fail', max: 1,   color: '#7b2fff', weight: '7%'  },
]

function DimensionBar({
  label,
  value,
  max,
  color,
  weight,
}: {
  label: string
  value: number
  max: number
  color: string
  weight: string
}) {
  const pct = Math.min(100, (value / max) * 100)
  const blocks = 5
  const filledBlocks = Math.round((pct / 100) * blocks)

  return (
    <div className="flex items-center gap-1.5 py-0.5">
      <span
        style={{
          fontFamily: 'var(--font-data)',
          fontSize: '0.5rem',
          color: 'rgba(255,255,255,0.55)',
          minWidth: '5.5rem',
          whiteSpace: 'nowrap',
        }}
      >
        {label}:
      </span>
      <div className="flex gap-0.5">
        {Array.from({ length: blocks }).map((_, i) => (
          <div
            key={i}
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '2px',
              background: i < filledBlocks ? color : 'rgba(255,255,255,0.1)',
              boxShadow: i < filledBlocks ? `0 0 4px ${color}80` : 'none',
              transition: 'background 0.2s',
            }}
          />
        ))}
      </div>
      <span
        style={{
          fontFamily: 'var(--font-data)',
          fontSize: '0.42rem',
          color: 'rgba(255,255,255,0.25)',
          marginLeft: 'auto',
          whiteSpace: 'nowrap',
        }}
      >
        {weight}
      </span>
    </div>
  )
}

function PainTooltip({ muni }: { muni: Municipality }) {
  return (
    <motion.div
      key="pain-tooltip"
      initial={{ opacity: 0, x: 8, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 8, scale: 0.95 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      className="absolute right-full top-0 mr-2 z-50 rounded-lg border overflow-hidden"
      style={{
        background: 'rgba(10,14,23,0.97)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderColor: 'rgba(14,165,233,0.2)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.6), 0 0 16px rgba(14,165,233,0.08)',
        minWidth: '13rem',
        pointerEvents: 'none',
      }}
    >
      {/* Tooltip header */}
      <div
        className="px-3 py-2 border-b"
        style={{ borderColor: 'rgba(255,255,255,0.07)' }}
      >
        <p
          style={{
            fontFamily: 'var(--font-data)',
            fontSize: '0.55rem',
            color: 'var(--accent)',
            letterSpacing: '0.1em',
            marginBottom: '2px',
          }}
        >
          PAIN SCORE
        </p>
        <div className="flex items-baseline gap-1.5">
          <span
            style={{
              fontFamily: 'var(--font-data)',
              fontSize: '1rem',
              fontWeight: 700,
              color: getPainColor(muni.pain_score),
              textShadow: `0 0 10px ${getPainGlow(muni.pain_score)}`,
            }}
          >
            {muni.pain_score.toFixed(2)}
          </span>
          <span
            style={{
              fontFamily: 'var(--font-data)',
              fontSize: '0.5rem',
              color: 'rgba(255,255,255,0.3)',
            }}
          >
            / 5.00
          </span>
        </div>
        <div
          className="mt-1.5"
          style={{
            height: '1px',
            background: `linear-gradient(90deg, ${getPainColor(muni.pain_score)}60, transparent)`,
          }}
        />
      </div>

      {/* Dimension bars */}
      <div className="px-3 py-2">
        {DIMENSIONS.map((dim) => {
          const raw = muni[dim.key]
          const value = typeof raw === 'number' ? raw : 0
          return (
            <DimensionBar
              key={dim.key as string}
              label={dim.label}
              value={value}
              max={dim.max}
              color={dim.color}
              weight={dim.weight}
            />
          )
        })}
      </div>
    </motion.div>
  )
}

export default function PainIndexLeaderboard({ municipalities }: Props) {
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  const worst5 = [...municipalities]
    .sort((a, b) => b.pain_score - a.pain_score)
    .slice(0, 5)

  const handleZoomTo = (lat: number, lng: number) => {
    window.dispatchEvent(
      new CustomEvent('loudwatch:zoomTo', { detail: { lat, lng } })
    )
  }

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
        style={{ background: 'linear-gradient(90deg, transparent, var(--critical), transparent)' }}
      />

      <div className="px-4 pt-3 pb-1">
        {/* Title */}
        <div className="flex items-center gap-2 mb-3">
          <div
            className="flex items-center justify-center w-7 h-7 rounded-lg"
            style={{
              background: 'rgba(220,38,38,0.1)',
              border: '1px solid rgba(220,38,38,0.3)',
            }}
          >
            <AlertTriangle size={14} style={{ color: 'var(--critical)' }} />
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
            Pain Index
          </span>
          <span
            style={{
              fontFamily: 'var(--font-data)',
              fontSize: '0.55rem',
              color: 'rgba(255,255,255,0.3)',
              marginLeft: 'auto',
            }}
          >
            WORST 5
          </span>
        </div>

        {/* List */}
        <div className="flex flex-col gap-1.5 pb-2">
          {worst5.length === 0 ? (
            <p
              style={{
                fontFamily: 'var(--font-data)',
                fontSize: '0.65rem',
                color: 'rgba(255,255,255,0.3)',
                textAlign: 'center',
                padding: '1rem 0',
              }}
            >
              No data available
            </p>
          ) : (
            worst5.map((muni, i) => {
              const rank = i + 1
              const color = getPainColor(muni.pain_score)
              const glow = getPainGlow(muni.pain_score)
              const rankColor = getRankColor(rank)
              const barWidth = Math.min(100, (muni.pain_score / 5) * 100)
              const isHovered = hoveredId === muni.id

              return (
                <div key={muni.id} className="relative">
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.08, duration: 0.35, ease: 'easeOut' }}
                    onClick={() => handleZoomTo(muni.lat, muni.lng)}
                    onMouseEnter={() => setHoveredId(muni.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    className="group cursor-pointer rounded-lg px-2.5 py-2 transition-all"
                    style={{
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(255,255,255,0.05)',
                    }}
                    whileHover={{
                      background: 'rgba(255,255,255,0.05)',
                      borderColor: `${color}40`,
                      scale: 1.01,
                      transition: { duration: 0.15 },
                    }}
                  >
                    <div className="flex items-center gap-2">
                      {/* Rank */}
                      <span
                        style={{
                          fontFamily: 'var(--font-data)',
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          color: rankColor,
                          textShadow: `0 0 8px ${rankColor}60`,
                          minWidth: '1.2rem',
                          textAlign: 'center',
                        }}
                      >
                        #{rank}
                      </span>

                      {/* Name + province */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span
                            className="truncate"
                            style={{
                              fontFamily: 'var(--font-data)',
                              fontSize: '0.65rem',
                              color: 'rgba(255,255,255,0.85)',
                              fontWeight: 600,
                            }}
                          >
                            {muni.name}
                          </span>
                          <span
                            className="flex-shrink-0"
                            style={{
                              fontFamily: 'var(--font-data)',
                              fontSize: '0.45rem',
                              color: 'var(--accent)',
                              background: 'rgba(14,165,233,0.1)',
                              border: '1px solid rgba(14,165,233,0.2)',
                              borderRadius: '3px',
                              padding: '1px 4px',
                              letterSpacing: '0.05em',
                            }}
                          >
                            {getProvinceAbbr(muni.province)}
                          </span>
                        </div>

                        {/* Score bar */}
                        <div
                          className="w-full rounded-full overflow-hidden"
                          style={{
                            height: '4px',
                            background: 'rgba(255,255,255,0.07)',
                          }}
                        >
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${barWidth}%` }}
                            transition={{ delay: i * 0.08 + 0.2, duration: 0.6, ease: 'easeOut' }}
                            style={{
                              height: '100%',
                              background: `linear-gradient(90deg, ${color}88, ${color})`,
                              boxShadow: `0 0 6px ${glow}`,
                              borderRadius: '9999px',
                            }}
                          />
                        </div>
                      </div>

                      {/* Score value */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <span
                          style={{
                            fontFamily: 'var(--font-data)',
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            color,
                            textShadow: `0 0 8px ${glow}`,
                          }}
                        >
                          {muni.pain_score.toFixed(2)}
                        </span>
                        <ChevronRight
                          size={10}
                          style={{ color: 'rgba(255,255,255,0.2)' }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        />
                      </div>
                    </div>
                  </motion.div>

                  {/* Hover tooltip — positioned to the left */}
                  <AnimatePresence>
                    {isHovered && (
                      <PainTooltip muni={muni} />
                    )}
                  </AnimatePresence>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
