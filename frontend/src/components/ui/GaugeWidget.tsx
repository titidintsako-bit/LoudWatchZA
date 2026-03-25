'use client'

type GaugeSize = 'sm' | 'md' | 'lg'

const SIZE_DIMS: Record<GaugeSize, { r: number; stroke: number; viewBox: number }> = {
  sm: { r: 28, stroke: 5, viewBox: 70 },
  md: { r: 40, stroke: 7, viewBox: 100 },
  lg: { r: 55, stroke: 9, viewBox: 130 },
}

interface GaugeWidgetProps {
  value: number // 0-100
  label?: string
  size?: GaugeSize
  showValue?: boolean
  unit?: string
  thresholds?: { warn: number; danger: number }
}

export function GaugeWidget({
  value,
  label,
  size = 'md',
  showValue = true,
  unit = '%',
  thresholds = { warn: 50, danger: 30 },
}: GaugeWidgetProps) {
  const { r, stroke, viewBox } = SIZE_DIMS[size]
  const cx = viewBox / 2
  const cy = viewBox / 2
  const circumference = Math.PI * r // half arc (180°)
  const clampedValue = Math.min(100, Math.max(0, value))
  const dashOffset = circumference - (clampedValue / 100) * circumference

  // Color by threshold (for dams: danger=30 means red when LOW)
  const color =
    clampedValue <= thresholds.danger
      ? 'var(--critical)'
      : clampedValue <= thresholds.warn
        ? 'var(--warning)'
        : 'var(--normal)'

  const fontSize = size === 'sm' ? 10 : size === 'md' ? 14 : 18
  const labelSize = size === 'sm' ? 7 : size === 'md' ? 9 : 11

  return (
    <svg
      width={viewBox}
      height={viewBox / 2 + 16}
      viewBox={`0 0 ${viewBox} ${viewBox / 2 + 16}`}
      className="overflow-visible"
    >
      {/* Track */}
      <path
        d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
        fill="none"
        stroke="rgba(255,255,255,0.06)"
        strokeWidth={stroke}
        strokeLinecap="round"
      />
      {/* Value arc */}
      <path
        d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={dashOffset}
        style={{ transition: 'stroke-dashoffset 0.6s ease, stroke 0.4s ease' }}
      />
      {/* Glow effect */}
      <path
        d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
        fill="none"
        stroke={color}
        strokeWidth={stroke + 2}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={dashOffset}
        opacity={0.2}
        style={{ filter: 'blur(3px)', transition: 'stroke-dashoffset 0.6s ease' }}
      />
      {showValue && (
        <text
          x={cx}
          y={cy - 2}
          textAnchor="middle"
          dominantBaseline="auto"
          fill={color}
          fontSize={fontSize}
          fontFamily="var(--font-orbitron), Orbitron, sans-serif"
          fontWeight="700"
        >
          {Math.round(clampedValue)}{unit}
        </text>
      )}
      {label && (
        <text
          x={cx}
          y={cy + labelSize + 2}
          textAnchor="middle"
          dominantBaseline="hanging"
          fill="var(--t-label)"
          fontSize={labelSize}
          fontFamily="var(--font-fira-code), monospace"
        >
          {label}
        </text>
      )}
    </svg>
  )
}

export default GaugeWidget
