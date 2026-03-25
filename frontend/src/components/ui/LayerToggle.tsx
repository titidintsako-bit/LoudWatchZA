'use client'

import type { ReactNode } from 'react'
import { Switch } from '@/components/ui/switch'

interface LayerToggleProps {
  label: string
  enabled: boolean
  onChange: (v: boolean) => void
  color?: string
  icon?: ReactNode
  description?: string
  badge?: string
  disabled?: boolean
}

export function LayerToggle({
  label,
  enabled,
  onChange,
  color = 'var(--accent)',
  icon,
  description,
  badge,
  disabled = false,
}: LayerToggleProps) {
  return (
    <div
      className={`flex items-center justify-between gap-2 py-1.5 px-1 rounded transition-colors ${disabled ? 'opacity-40 cursor-not-allowed' : 'hover:bg-white/5 cursor-pointer'}`}
      onClick={() => !disabled && onChange(!enabled)}
    >
      <div className="flex items-center gap-2 min-w-0">
        {icon && (
          <span
            className="flex-shrink-0 text-sm"
            style={{ color: enabled ? color : 'var(--t-meta)' }}
          >
            {icon}
          </span>
        )}
        <div className="min-w-0">
          <span
            className="text-xs font-fira block truncate transition-colors"
            style={{ color: enabled ? color : 'var(--t-label)' }}
          >
            {label}
          </span>
          {description && (
            <span className="text-[9px] text-[var(--t-meta)] block truncate">{description}</span>
          )}
        </div>
        {badge && (
          <span
            className="text-[8px] font-orbitron px-1 py-0.5 rounded flex-shrink-0"
            style={{
              color,
              background: `${color}15`,
              border: `1px solid ${color}40`,
            }}
          >
            {badge}
          </span>
        )}
      </div>
      <Switch
        checked={enabled}
        onCheckedChange={(v) => !disabled && onChange(v)}
        disabled={disabled}
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  )
}

export default LayerToggle
