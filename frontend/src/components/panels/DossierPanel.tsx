'use client'

import { motion } from 'framer-motion'
import {
  X,
  MapPin,
  AlertTriangle,
  Zap,
  TrendingDown,
  Droplets,
  ClipboardCheck,
  Activity,
  Megaphone,
  Newspaper,
} from 'lucide-react'
import type { DossierData } from '@/types'

interface Props {
  data: DossierData
  onClose: () => void
}

function getPainColor(score: number): string {
  if (score < 1.5) return 'var(--normal)'
  if (score < 2.5) return '#ffeb3b'
  if (score < 3.5) return 'var(--warning)'
  return 'var(--critical)'
}

function getStageColor(stage: number): string {
  if (stage === 0) return 'var(--normal)'
  if (stage <= 2) return '#ffeb3b'
  if (stage === 3) return 'var(--warning)'
  return 'var(--critical)'
}

function getUnemploymentColor(rate: number): string {
  if (rate < 20) return 'var(--normal)'
  if (rate < 35) return '#ffeb3b'
  if (rate < 50) return 'var(--warning)'
  return 'var(--critical)'
}

function getDamColor(pct: number): string {
  if (pct < 30) return 'var(--critical)'
  if (pct < 60) return 'var(--warning)'
  return 'var(--accent)'
}

interface AuditConfig {
  label: string
  color: string
  bg: string
}

function getAuditConfig(outcome: string): AuditConfig {
  const o = outcome.toLowerCase()
  if (o.includes('clean') || o.includes('unqualified with no')) {
    return { label: 'CLEAN AUDIT', color: 'var(--normal)', bg: 'rgba(22,163,74,0.1)' }
  }
  if (o.includes('unqualified') || o.includes('findings')) {
    return { label: 'UNQUALIFIED', color: '#ffeb3b', bg: 'rgba(255,235,59,0.1)' }
  }
  if (o.includes('qualified')) {
    return { label: 'QUALIFIED', color: 'var(--warning)', bg: 'rgba(255,145,0,0.1)' }
  }
  if (o.includes('adverse')) {
    return { label: 'ADVERSE', color: 'var(--critical)', bg: 'rgba(220,38,38,0.12)' }
  }
  if (o.includes('disclaimer')) {
    return { label: 'DISCLAIMER', color: 'var(--critical)', bg: 'rgba(220,38,38,0.12)' }
  }
  return { label: outcome.toUpperCase().slice(0, 14), color: 'rgba(255,255,255,0.5)', bg: 'rgba(255,255,255,0.05)' }
}

function MetricCard({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-lg p-3"
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.07)',
      }}
    >
      {children}
    </div>
  )
}

function SectionLabel({
  icon: Icon,
  label,
  color = 'var(--accent)',
}: {
  icon: React.ElementType
  label: string
  color?: string
}) {
  return (
    <div className="flex items-center gap-1.5 mb-2">
      <Icon size={11} style={{ color }} />
      <span
        style={{
          fontFamily: 'var(--font-data)',
          fontSize: '0.5rem',
          color,
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
        }}
      >
        {label}
      </span>
    </div>
  )
}

export default function DossierPanel({ data, onClose }: Props) {
  const painColor = getPainColor(data.pain_score)
  const stageColor = getStageColor(data.loadshedding_stage)
  const unemployColor = getUnemploymentColor(data.unemployment_rate)
  const auditConfig = getAuditConfig(data.audit_outcome)
  const painBarPct = Math.min(100, (data.pain_score / 5) * 100)

  return (
    <motion.div
      initial={{ x: 400, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 400, opacity: 0 }}
      transition={{ type: 'spring', damping: 28, stiffness: 280 }}
      className="fixed right-0 top-16 bottom-10 w-80 z-40 flex flex-col overflow-hidden"
      style={{
        background: 'rgba(10,14,23,0.92)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderLeft: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '-8px 0 40px rgba(0,0,0,0.5)',
      }}
    >
      {/* Left accent line */}
      <div
        className="absolute left-0 top-0 bottom-0 w-px"
        style={{
          background:
            'linear-gradient(180deg, transparent, rgba(14,165,233,0.4) 20%, rgba(14,165,233,0.4) 80%, transparent)',
        }}
      />

      {/* Top accent bar */}
      <div
        className="h-0.5 w-full flex-shrink-0"
        style={{
          background: `linear-gradient(90deg, transparent, ${painColor}, transparent)`,
        }}
      />

      {/* Header */}
      <div
        className="flex-shrink-0 px-4 py-3 border-b"
        style={{ borderColor: 'rgba(255,255,255,0.06)' }}
      >
        <div className="flex items-start justify-between gap-2">
          <div>
            <p
              style={{
                fontFamily: 'var(--font-data)',
                fontSize: '0.55rem',
                color: 'var(--accent)',
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                marginBottom: '4px',
              }}
            >
              Location Dossier
            </p>
            <p
              style={{
                fontFamily: 'var(--font-data)',
                fontSize: '0.8rem',
                color: '#fff',
                fontWeight: 700,
                lineHeight: 1.2,
              }}
            >
              {data.municipality}
            </p>
            <p
              style={{
                fontFamily: 'var(--font-data)',
                fontSize: '0.6rem',
                color: 'rgba(255,255,255,0.45)',
                marginTop: '2px',
              }}
            >
              {data.province}
            </p>
          </div>

          <button
            onClick={onClose}
            className="flex items-center justify-center w-7 h-7 rounded-lg flex-shrink-0 transition-all"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'rgba(255,255,255,0.5)',
            }}
            onMouseEnter={e => {
              const el = e.currentTarget as HTMLButtonElement
              el.style.background = 'rgba(220,38,38,0.15)'
              el.style.borderColor = 'rgba(220,38,38,0.4)'
              el.style.color = 'var(--critical)'
            }}
            onMouseLeave={e => {
              const el = e.currentTarget as HTMLButtonElement
              el.style.background = 'rgba(255,255,255,0.05)'
              el.style.borderColor = 'rgba(255,255,255,0.1)'
              el.style.color = 'rgba(255,255,255,0.5)'
            }}
          >
            <X size={13} />
          </button>
        </div>

        {/* Coordinates */}
        <div className="flex items-center gap-1.5 mt-2">
          <MapPin size={10} style={{ color: 'rgba(255,255,255,0.3)' }} />
          <span
            style={{
              fontFamily: 'var(--font-data)',
              fontSize: '0.58rem',
              color: 'rgba(255,255,255,0.35)',
              letterSpacing: '0.03em',
            }}
          >
            {data.lat.toFixed(5)}, {data.lng.toFixed(5)}
          </span>
        </div>
      </div>

      {/* Scrollable body */}
      <div
        className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-2.5"
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(14,165,233,0.15) transparent',
        }}
      >
        {/* 1. PAIN INDEX */}
        <MetricCard>
          <SectionLabel icon={AlertTriangle} label="Pain Index" color="var(--critical)" />
          <div className="flex items-end justify-between mb-2">
            <span
              style={{
                fontFamily: 'var(--font-data)',
                fontSize: '1.8rem',
                fontWeight: 900,
                color: painColor,
                textShadow: `0 0 16px ${painColor}60`,
                lineHeight: 1,
              }}
            >
              {data.pain_score.toFixed(2)}
            </span>
            <span
              style={{
                fontFamily: 'var(--font-data)',
                fontSize: '0.55rem',
                color: 'rgba(255,255,255,0.3)',
                marginBottom: '4px',
              }}
            >
              / 5.00
            </span>
          </div>
          <div
            className="w-full rounded-full overflow-hidden"
            style={{ height: '6px', background: 'rgba(255,255,255,0.08)' }}
          >
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${painBarPct}%` }}
              transition={{ delay: 0.3, duration: 0.8, ease: 'easeOut' }}
              style={{
                height: '100%',
                background: `linear-gradient(90deg, ${painColor}66, ${painColor})`,
                borderRadius: '9999px',
                boxShadow: `0 0 8px ${painColor}50`,
              }}
            />
          </div>
        </MetricCard>

        {/* 2. LOADSHEDDING */}
        <MetricCard>
          <SectionLabel icon={Zap} label="Loadshedding" color={stageColor} />
          <div className="flex items-center justify-between">
            <span
              style={{
                fontFamily: 'var(--font-data)',
                fontSize: '0.95rem',
                fontWeight: 700,
                color: stageColor,
                textShadow: `0 0 10px ${stageColor}50`,
              }}
            >
              {data.loadshedding_stage === 0 ? 'NO SHEDDING' : `STAGE ${data.loadshedding_stage}`}
            </span>
            <span
              style={{
                fontFamily: 'var(--font-data)',
                fontSize: '0.45rem',
                color: stageColor,
                background: `${stageColor}15`,
                border: `1px solid ${stageColor}35`,
                borderRadius: '4px',
                padding: '2px 6px',
                letterSpacing: '0.06em',
              }}
            >
              {data.loadshedding_stage === 0
                ? 'NORMAL'
                : data.loadshedding_stage <= 2
                ? 'MODERATE'
                : data.loadshedding_stage === 3
                ? 'HIGH'
                : 'CRITICAL'}
            </span>
          </div>
        </MetricCard>

        {/* 3. UNEMPLOYMENT */}
        <MetricCard>
          <SectionLabel icon={TrendingDown} label="Unemployment" color={unemployColor} />
          <div className="flex items-baseline gap-1.5">
            <span
              style={{
                fontFamily: 'var(--font-data)',
                fontSize: '1.4rem',
                fontWeight: 700,
                color: unemployColor,
                textShadow: `0 0 10px ${unemployColor}50`,
                lineHeight: 1,
              }}
            >
              {data.unemployment_rate.toFixed(1)}%
            </span>
            <span
              style={{
                fontFamily: 'var(--font-data)',
                fontSize: '0.6rem',
                color: 'rgba(255,255,255,0.3)',
              }}
            >
              unemployment rate
            </span>
          </div>
        </MetricCard>

        {/* 4. INFRASTRUCTURE */}
        <MetricCard>
          <SectionLabel icon={Droplets} label="Infrastructure" color="var(--accent)" />
          {data.dam_level !== undefined && data.dam_level !== null ? (
            <div className="mb-2.5">
              <div className="flex items-center justify-between mb-1">
                <span
                  style={{
                    fontFamily: 'var(--font-data)',
                    fontSize: '0.6rem',
                    color: 'rgba(255,255,255,0.5)',
                  }}
                >
                  Nearest dam level
                </span>
                <span
                  style={{
                    fontFamily: 'var(--font-data)',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    color: getDamColor(data.dam_level),
                  }}
                >
                  {data.dam_level.toFixed(1)}%
                </span>
              </div>
              <div
                className="rounded-full overflow-hidden"
                style={{ height: '4px', background: 'rgba(255,255,255,0.06)' }}
              >
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, data.dam_level)}%` }}
                  transition={{ delay: 0.4, duration: 0.7 }}
                  style={{
                    height: '100%',
                    background: getDamColor(data.dam_level),
                    borderRadius: '9999px',
                  }}
                />
              </div>
            </div>
          ) : (
            <p
              style={{
                fontFamily: 'var(--font-data)',
                fontSize: '0.6rem',
                color: 'rgba(255,255,255,0.25)',
                marginBottom: '4px',
              }}
            >
              No dam data for this area
            </p>
          )}
        </MetricCard>

        {/* 5. RECENT ACTIVITY */}
        <MetricCard>
          <SectionLabel icon={Activity} label="Recent Activity (7d)" color="var(--warning)" />
          <div className="flex gap-3">
            <div className="flex-1 text-center rounded-lg py-2" style={{ background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.15)' }}>
              <div className="flex items-center justify-center gap-1 mb-0.5">
                <Megaphone size={10} style={{ color: 'var(--critical)' }} />
                <span
                  style={{
                    fontFamily: 'var(--font-data)',
                    fontSize: '1.1rem',
                    fontWeight: 700,
                    color: 'var(--critical)',
                    textShadow: '0 0 8px rgba(220,38,38,0.4)',
                  }}
                >
                  {data.protest_count_7d}
                </span>
              </div>
              <span
                style={{
                  fontFamily: 'var(--font-data)',
                  fontSize: '0.52rem',
                  color: 'rgba(255,255,255,0.35)',
                }}
              >
                protests
              </span>
            </div>

            <div className="flex-1 text-center rounded-lg py-2" style={{ background: 'rgba(14,165,233,0.05)', border: '1px solid rgba(14,165,233,0.12)' }}>
              <div className="flex items-center justify-center gap-1 mb-0.5">
                <Newspaper size={10} style={{ color: 'var(--accent)' }} />
                <span
                  style={{
                    fontFamily: 'var(--font-data)',
                    fontSize: '1.1rem',
                    fontWeight: 700,
                    color: 'var(--accent)',
                    textShadow: '0 0 8px rgba(14,165,233,0.4)',
                  }}
                >
                  {data.news_count_7d}
                </span>
              </div>
              <span
                style={{
                  fontFamily: 'var(--font-data)',
                  fontSize: '0.52rem',
                  color: 'rgba(255,255,255,0.35)',
                }}
              >
                articles
              </span>
            </div>
          </div>
        </MetricCard>

        {/* 6. AUDIT STATUS */}
        <MetricCard>
          <SectionLabel icon={ClipboardCheck} label="Audit Status" color="#ffeb3b" />
          <div className="flex items-center justify-between">
            <span
              style={{
                fontFamily: 'var(--font-data)',
                fontSize: '0.65rem',
                color: 'rgba(255,255,255,0.5)',
              }}
            >
              AGSA outcome
            </span>
            <span
              style={{
                fontFamily: 'var(--font-data)',
                fontSize: '0.5rem',
                color: auditConfig.color,
                background: auditConfig.bg,
                border: `1px solid ${auditConfig.color}35`,
                borderRadius: '5px',
                padding: '3px 8px',
                letterSpacing: '0.06em',
                textShadow: `0 0 6px ${auditConfig.color}50`,
              }}
            >
              {auditConfig.label}
            </span>
          </div>
        </MetricCard>
      </div>
    </motion.div>
  )
}
