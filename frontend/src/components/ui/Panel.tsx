'use client'

import { useState, ReactNode } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

interface PanelHeaderProps {
  icon?: ReactNode
  title: string
  live?: boolean
  count?: number
  updatedAt?: string
  source?: string
  collapsible?: boolean
  open?: boolean
  onToggle?: () => void
}

interface PanelProps {
  children: ReactNode
  className?: string
}

interface PanelContentProps {
  children: ReactNode
  className?: string
}

export function PanelHeader({
  icon,
  title,
  live,
  count,
  updatedAt,
  source,
  collapsible,
  open = true,
  onToggle,
}: PanelHeaderProps) {
  const sourceLabel = source ?? updatedAt
  return (
    <div className="panel-header">
      {icon && (
        <span style={{ color: 'var(--t-meta)', flexShrink: 0, display: 'flex' }}>
          {icon}
        </span>
      )}

      <span className="panel-title">{title}</span>

      {sourceLabel && (
        <span className="panel-source-label">{sourceLabel}</span>
      )}

      {count !== undefined && count > 0 && (
        <span className="panel-count" style={{ marginLeft: 4 }}>{count}</span>
      )}

      {live && (
        <span className="live-badge">
          <span className="live-dot" />
          LIVE
        </span>
      )}

      {collapsible && (
        <button
          type="button"
          onClick={onToggle}
          aria-label={open ? 'Collapse panel' : 'Expand panel'}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--t-dim)', padding: 0, display: 'flex', flexShrink: 0, marginLeft: 2 }}
        >
          {open ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
        </button>
      )}
    </div>
  )
}

export function PanelContent({ children, className = '' }: PanelContentProps) {
  return <div className={className}>{children}</div>
}

export function Panel({ children, className = '' }: PanelProps) {
  return (
    <div
      className={className}
      style={{ borderBottom: '1px solid var(--div)', background: 'transparent' }}
    >
      {children}
    </div>
  )
}

/** Convenience: collapsible panel with built-in toggle state */
export function CollapsiblePanel({
  icon,
  title,
  live,
  count,
  source,
  defaultOpen = true,
  children,
}: Omit<PanelHeaderProps, 'collapsible' | 'open' | 'onToggle'> & {
  defaultOpen?: boolean
  children: ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <Panel>
      <PanelHeader
        icon={icon}
        title={title}
        live={live}
        count={count}
        source={source}
        collapsible
        open={open}
        onToggle={() => setOpen((o) => !o)}
      />
      {open && <PanelContent>{children}</PanelContent>}
    </Panel>
  )
}

export default Panel
