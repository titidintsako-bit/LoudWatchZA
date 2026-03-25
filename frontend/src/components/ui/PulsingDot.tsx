'use client'

type Color = 'cyan' | 'green' | 'red' | 'amber'
type Size = 'sm' | 'md' | 'lg'
type Speed = 'slow' | 'normal' | 'fast'

const COLOR_MAP: Record<Color, string> = {
  cyan: 'var(--accent)',
  green: 'var(--normal)',
  red: 'var(--critical)',
  amber: 'var(--warning)',
}

const SIZE_MAP: Record<Size, { inner: number; outer: number }> = {
  sm: { inner: 4, outer: 8 },
  md: { inner: 6, outer: 12 },
  lg: { inner: 8, outer: 16 },
}

const SPEED_MAP: Record<Speed, string> = {
  slow: '2s',
  normal: '1.2s',
  fast: '0.7s',
}

interface PulsingDotProps {
  color?: Color
  size?: Size
  speed?: Speed
  className?: string
}

export function PulsingDot({
  color = 'green',
  size = 'md',
  speed = 'normal',
  className = '',
}: PulsingDotProps) {
  const hex = COLOR_MAP[color]
  const { inner, outer } = SIZE_MAP[size]
  const duration = SPEED_MAP[speed]

  return (
    <span
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{ width: outer, height: outer }}
    >
      {/* Outer pulsing ring */}
      <span
        className="absolute inset-0 rounded-full animate-ping"
        style={{
          background: `${hex}33`,
          animationDuration: duration,
        }}
      />
      {/* Inner solid dot */}
      <span
        className="relative rounded-full flex-shrink-0"
        style={{ width: inner, height: inner, background: hex, boxShadow: `0 0 6px ${hex}` }}
      />
    </span>
  )
}

export default PulsingDot
