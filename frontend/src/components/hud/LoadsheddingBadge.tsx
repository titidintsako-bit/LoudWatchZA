'use client'

import { useStore } from '@/store/useStore'

function getStageStyle(stage: number) {
  if (stage === 0) return {
    color: 'var(--live)',
    border: '1px solid rgba(0,200,117,0.3)',
    bg: 'rgba(0,200,117,0.12)',
    label: 'NO LOADSHEDDING',
    pulse: false,
    suffix: '',
  }
  if (stage <= 2) return {
    color: 'var(--warning)',
    border: '1px solid rgba(245,166,35,0.3)',
    bg: 'rgba(245,166,35,0.12)',
    label: `STAGE ${stage}`,
    pulse: false,
    suffix: '',
  }
  if (stage <= 4) return {
    color: 'var(--warning)',
    border: '1px solid rgba(245,166,35,0.3)',
    bg: 'rgba(245,166,35,0.12)',
    label: `STAGE ${stage}`,
    pulse: true,
    suffix: '',
  }
  if (stage <= 6) return {
    color: 'var(--critical)',
    border: '1px solid rgba(232,54,74,0.4)',
    bg: 'rgba(232,54,74,0.15)',
    label: `STAGE ${stage}`,
    pulse: true,
    suffix: ' — CRITICAL',
  }
  return {
    color: 'var(--critical)',
    border: '1px solid rgba(232,54,74,0.5)',
    bg: 'rgba(232,54,74,0.18)',
    label: `STAGE ${stage}`,
    pulse: true,
    suffix: ' — SEVERE',
  }
}

export default function LoadsheddingBadge() {
  const loadshedding = useStore((s) => s.loadshedding)
  const stage = loadshedding?.stage ?? 0
  const s = getStageStyle(stage)

  return (
    <div
      className="shrink-0"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '3px 8px',
        borderRadius: 'var(--radius-md)',
        background: s.bg,
        border: s.border,
        animation: s.pulse ? 'blink 2s ease-in-out infinite' : 'none',
      }}
    >
      <span
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          fontWeight: 500,
          color: s.color,
          letterSpacing: '0.04em',
          whiteSpace: 'nowrap',
        }}
      >
        {s.label}{s.suffix}
      </span>
    </div>
  )
}
