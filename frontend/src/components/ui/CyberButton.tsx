'use client'

import { type ReactNode } from 'react'
import { Loader2 } from 'lucide-react'

type Variant = 'primary' | 'ghost' | 'danger' | 'success'
type ButtonSize = 'sm' | 'md' | 'lg'

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: 'bg-[var(--accent)]/10 border-[var(--accent)]/60 text-[var(--accent)] hover:bg-[var(--accent)]/20 hover:border-[var(--accent)]',
  ghost:   'border-white/10 text-[var(--t-label)] hover:border-[var(--accent)]/50 hover:text-[var(--accent)]',
  danger:  'border-[var(--critical)]/50 text-[var(--critical)] hover:bg-[var(--critical)]/10 hover:border-[var(--critical)]',
  success: 'border-[var(--normal)]/50 text-[var(--normal)] hover:bg-[var(--normal)]/10 hover:border-[var(--normal)]',
}

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'text-[9px] px-2 py-1 gap-1',
  md: 'text-xs px-3 py-1.5 gap-1.5',
  lg: 'text-sm px-4 py-2 gap-2',
}

interface CyberButtonProps {
  children: ReactNode
  onClick?: () => void
  variant?: Variant
  size?: ButtonSize
  disabled?: boolean
  loading?: boolean
  icon?: ReactNode
  className?: string
  type?: 'button' | 'submit' | 'reset'
  title?: string
}

export function CyberButton({
  children,
  onClick,
  variant = 'ghost',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  className = '',
  type = 'button',
  title,
}: CyberButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      title={title}
      className={[
        'inline-flex items-center justify-center font-orbitron tracking-wider uppercase',
        'rounded border transition-all duration-150',
        'disabled:opacity-40 disabled:cursor-not-allowed',
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        className,
      ].join(' ')}
    >
      {loading ? (
        <Loader2 className="w-3 h-3 animate-spin" />
      ) : icon ? (
        <span className="flex-shrink-0">{icon}</span>
      ) : null}
      {children}
    </button>
  )
}

export default CyberButton
