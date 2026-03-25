'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, ChevronDown, ChevronUp } from 'lucide-react'
import { usePopulationEstimates } from '@/hooks/useStatsSA'
import type { ProvincePopulation } from '@/types'

const POPULATION_BASE = 63_100_000
const JAN_1_2025_MS = new Date('2025-01-01T00:00:00Z').getTime()
const BIRTHS_PER_DAY = 3940
const BIRTHS_PER_MS = BIRTHS_PER_DAY / (24 * 60 * 60 * 1000)

const PROVINCE_FALLBACKS: ProvincePopulation[] = [
  { province: 'Gauteng', population: 16_100_000, year: 2024 },
  { province: 'KwaZulu-Natal', population: 12_400_000, year: 2024 },
  { province: 'Western Cape', population: 7_400_000, year: 2024 },
  { province: 'Eastern Cape', population: 6_400_000, year: 2024 },
]

function CompactPopulationCounter() {
  const [pop, setPop] = useState(getPopulation())
  useEffect(() => {
    const id = setInterval(() => setPop(getPopulation()), 1000)
    return () => clearInterval(id)
  }, [])
  return (
    <div className="flex flex-col items-end">
      <span className="font-fira text-[var(--t-meta)] text-[8px] leading-none">SA POPULATION</span>
      <span className="font-orbitron text-[var(--accent)] text-[10px] font-bold leading-none">
        {pop.toLocaleString()}
      </span>
    </div>
  )
}

function getPopulation(): number {
  const elapsed = Date.now() - JAN_1_2025_MS
  return POPULATION_BASE + Math.floor(elapsed * BIRTHS_PER_MS)
}

function formatPopulation(n: number): string {
  return n.toLocaleString('en-ZA')
}

function formatMillions(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`
  return n.toLocaleString('en-ZA')
}

function ProvinceBar({
  label,
  population,
  maxPopulation,
  delay,
}: {
  label: string
  population: number
  maxPopulation: number
  delay: number
}) {
  const barPct = maxPopulation > 0 ? (population / maxPopulation) * 100 : 0
  const shortLabel = label.length > 14 ? label.slice(0, 13) + '…' : label

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.22, ease: 'easeOut' }}
      className="flex items-center gap-2 py-0.5"
    >
      <span
        style={{
          fontFamily: 'var(--font-data)',
          fontSize: '0.55rem',
          color: 'rgba(255,255,255,0.55)',
          minWidth: '7rem',
          whiteSpace: 'nowrap',
        }}
      >
        {shortLabel}
      </span>
      <div
        className="flex-1 rounded-full overflow-hidden"
        style={{ height: '3px', background: 'rgba(255,255,255,0.07)' }}
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${barPct}%` }}
          transition={{ delay: delay + 0.1, duration: 0.5, ease: 'easeOut' }}
          style={{
            height: '100%',
            background: 'linear-gradient(90deg, var(--accent)88, var(--accent))',
            borderRadius: '9999px',
          }}
        />
      </div>
      <span
        style={{
          fontFamily: 'var(--font-data)',
          fontSize: '0.5rem',
          color: 'var(--accent)',
          minWidth: '2.8rem',
          textAlign: 'right',
          letterSpacing: '0.03em',
        }}
      >
        {formatMillions(population)}
      </span>
    </motion.div>
  )
}

export default function PopulationCounter({ compact = false }: { compact?: boolean }) {
  const [population, setPopulation] = useState<number>(getPopulation())
  const [prevPop, setPrevPop] = useState<number>(getPopulation())
  const [flash, setFlash] = useState(false)
  const [expanded, setExpanded] = useState(false)

  const { provinces: liveProvinces, loading: provincesLoading } = usePopulationEstimates()

  const provinces =
    !provincesLoading && liveProvinces.length >= 4
      ? liveProvinces.slice(0, 4)
      : PROVINCE_FALLBACKS

  const maxPop = Math.max(...provinces.map((p) => p.population), 1)

  useEffect(() => {
    const interval = setInterval(() => {
      const next = getPopulation()
      setPrevPop(population)
      setPopulation(next)
      if (next !== prevPop) {
        setFlash(true)
        setTimeout(() => setFlash(false), 400)
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [population, prevPop])

  if (compact) {
    return <CompactPopulationCounter />
  }

  return (
    <div
      className="relative rounded-xl border border-white/10 overflow-hidden"
      style={{
        background: 'rgba(10,14,23,0.75)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        boxShadow: '0 0 24px rgba(14,165,233,0.08), inset 0 1px 0 rgba(255,255,255,0.05)',
      }}
    >
      {/* Top accent bar */}
      <div
        className="h-0.5 w-full"
        style={{ background: 'linear-gradient(90deg, transparent, var(--normal), transparent)' }}
      />

      <div className="px-4 py-3 flex items-center gap-3">
        <div
          className="flex items-center justify-center w-8 h-8 rounded-lg flex-shrink-0"
          style={{
            background: 'rgba(22,163,74,0.1)',
            border: '1px solid rgba(22,163,74,0.3)',
          }}
        >
          <Users size={16} style={{ color: 'var(--normal)' }} />
        </div>

        <div className="flex-1 min-w-0">
          <p
            className="text-xs tracking-widest uppercase mb-0.5"
            style={{
              fontFamily: 'var(--font-data)',
              color: 'var(--accent)',
              fontSize: '0.6rem',
              letterSpacing: '0.15em',
            }}
          >
            SA Population
          </p>

          <motion.div
            key={population}
            initial={{ opacity: 0.7, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >
            <span
              style={{
                fontFamily: 'var(--font-data)',
                fontSize: '1.35rem',
                fontWeight: 700,
                color: 'var(--normal)',
                letterSpacing: '0.04em',
                textShadow: flash
                  ? '0 0 20px var(--normal), 0 0 40px rgba(22,163,74,0.5)'
                  : '0 0 12px rgba(22,163,74,0.4)',
                transition: 'text-shadow 0.4s ease',
                display: 'block',
                lineHeight: 1.1,
              }}
            >
              {formatPopulation(population)}
            </span>
          </motion.div>

          <p
            className="text-xs mt-0.5"
            style={{
              color: 'rgba(255,255,255,0.3)',
              fontFamily: 'var(--font-data)',
              fontSize: '0.6rem',
            }}
          >
            +{BIRTHS_PER_DAY.toLocaleString()} births/day · live
          </p>
        </div>

        {/* Live pulse indicator */}
        <div className="flex flex-col items-center gap-1 flex-shrink-0">
          <div className="relative">
            <div
              className="w-2 h-2 rounded-full"
              style={{ background: 'var(--normal)' }}
            />
            <div
              className="absolute inset-0 rounded-full animate-ping"
              style={{ background: 'var(--normal)', opacity: 0.4 }}
            />
          </div>
          <span
            style={{
              fontFamily: 'var(--font-data)',
              fontSize: '0.5rem',
              color: 'var(--normal)',
              letterSpacing: '0.05em',
            }}
          >
            LIVE
          </span>
        </div>
      </div>

      {/* Province toggle button */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-center gap-1.5 py-1.5 transition-colors"
        style={{
          borderTop: '1px solid rgba(255,255,255,0.05)',
          background: expanded ? 'rgba(14,165,233,0.04)' : 'transparent',
          cursor: 'pointer',
        }}
        onMouseEnter={e => {
          ;(e.currentTarget as HTMLButtonElement).style.background = 'rgba(14,165,233,0.06)'
        }}
        onMouseLeave={e => {
          ;(e.currentTarget as HTMLButtonElement).style.background = expanded
            ? 'rgba(14,165,233,0.04)'
            : 'transparent'
        }}
      >
        {expanded ? (
          <ChevronUp size={10} style={{ color: 'rgba(14,165,233,0.5)' }} />
        ) : (
          <ChevronDown size={10} style={{ color: 'rgba(14,165,233,0.5)' }} />
        )}
        <span
          style={{
            fontFamily: 'var(--font-data)',
            fontSize: '0.42rem',
            color: 'rgba(14,165,233,0.5)',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
          }}
        >
          Provinces
        </span>
      </button>

      {/* Collapsible province breakdown */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="provinces-panel"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
          >
            <div className="px-4 py-2.5 flex flex-col gap-0.5">
              {provinces.map((p, i) => (
                <ProvinceBar
                  key={p.province}
                  label={p.province}
                  population={p.population}
                  maxPopulation={maxPop}
                  delay={i * 0.05}
                />
              ))}
              <p
                className="mt-1.5"
                style={{
                  fontFamily: 'var(--font-data)',
                  fontSize: '0.48rem',
                  color: 'rgba(255,255,255,0.2)',
                  textAlign: 'right',
                  letterSpacing: '0.03em',
                }}
              >
                {provincesLoading ? 'loading…' : `Stats SA ${provinces[0]?.year ?? 2024}`}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
