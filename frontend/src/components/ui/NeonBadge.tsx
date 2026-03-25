'use client'

import type { ReactNode } from 'react'

type Variant = 'cyan' | 'green' | 'red' | 'amber' | 'purple' | 'grey'
type Size = 'sm' | 'md'

const VARIANT_STYLES: Record<Variant, { color: string; bg: string; border: string }> = {
  cyan:   { color: 'var(--accent)', bg: 'rgba(14,165,233,0.08)',   border: 'rgba(14,165,233,0.35)' },
  green:  { color: 'var(--normal)', bg: 'rgba(22,163,74,0.08)',   border: 'rgba(22,163,74,0.35)' },
  red:    { color: 'var(--critical)', bg: 'rgba(220,38,38,0.08)',   border: 'rgba(220,38,38,0.35)' },
  amber:  { color: 'var(--warning)', bg: 'rgba(217,119,6,0.08)',   border: 'rgba(217,119,6,0.35)' },
  purple: { color: '#7b2fff', bg: 'rgba(123,47,255,0.08)',  border: 'rgba(123,47,255,0.35)' },
  grey:   { color: 'var(--t-label)', bg: 'rgba(122,156,192,0.08)', border: 'rgba(122,156,192,0.25)' },
}

interface NeonBadgeProps {
  children: ReactNode
  variant?: Variant
  size?: Size
  pulse?: boolean
  className?: string
}

export function NeonBadge({
  children,
  variant = 'cyan',
  size = 'sm',
  pulse = false,
  className = '',
}: NeonBadgeProps) {
  const { color, bg, border } = VARIANT_STYLES[variant]
  const sizeClass = size === 'sm' ? 'text-[9px] px-1.5 py-0.5' : 'text-xs px-2 py-1'

  return (
    <span
      className={`inline-flex items-center font-orbitron tracking-wider uppercase rounded ${sizeClass} ${pulse ? 'animate-pulse' : ''} ${className}`}
      style={{ color, background: bg, border: `1px solid ${border}` }}
    >
      {children}
    </span>
  )
}

export default NeonBadge
