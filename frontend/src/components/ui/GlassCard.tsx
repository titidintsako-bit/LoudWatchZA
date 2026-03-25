'use client'

import { useState, type ReactNode } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

/**
 * GlassCard — backward-compatible wrapper.
 * Renders with the new flat design system (no glass, no blur, no glow).
 * All panels that still import GlassCard get the new look automatically.
 */
interface GlassCardProps {
  children: ReactNode
  className?: string
  title?: string
  titleIcon?: ReactNode
  collapsible?: boolean
  defaultOpen?: boolean
  noPadding?: boolean
  accentColor?: string // ignored — kept for API compat
}

export function GlassCard({
  children,
  className = '',
  title,
  titleIcon,
  collapsible = false,
  defaultOpen = true,
  noPadding = false,
}: GlassCardProps) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div
      className={className}
      style={{ borderBottom: '1px solid var(--div)', background: 'transparent' }}
    >
      {title && (
        <div className="panel-header">
          {titleIcon && (
            <span style={{ color: 'var(--t-meta)', flexShrink: 0, display: 'flex' }}>
              {titleIcon}
            </span>
          )}
          <span className="panel-title">{title}</span>
          {collapsible && (
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-label={open ? 'Collapse' : 'Expand'}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--t-dim)', padding: 0, display: 'flex', marginLeft: 'auto' }}
            >
              {open ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
            </button>
          )}
        </div>
      )}

      {(!collapsible || open) && (
        <div className={noPadding ? '' : ''}>{children}</div>
      )}
    </div>
  )
}

export default GlassCard
