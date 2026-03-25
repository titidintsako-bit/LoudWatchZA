'use client'

interface SparklineChartProps {
  data: number[]
  color?: string
  height?: number
  width?: number
  showDots?: boolean
  fillOpacity?: number
  className?: string
}

export function SparklineChart({
  data,
  color = 'var(--accent)',
  height = 40,
  width = 120,
  showDots = false,
  fillOpacity = 0.1,
  className = '',
}: SparklineChartProps) {
  if (!data || data.length < 2) {
    return <div style={{ width, height }} className={className} />
  }

  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1

  const padding = 2
  const usableWidth = width - padding * 2
  const usableHeight = height - padding * 2

  const points = data.map((val, i) => {
    const x = padding + (i / (data.length - 1)) * usableWidth
    const y = padding + usableHeight - ((val - min) / range) * usableHeight
    return { x, y }
  })

  const polylinePoints = points.map((p) => `${p.x},${p.y}`).join(' ')

  // Area fill path
  const areaPath = [
    `M ${points[0].x},${height - padding}`,
    ...points.map((p) => `L ${p.x},${p.y}`),
    `L ${points[points.length - 1].x},${height - padding}`,
    'Z',
  ].join(' ')

  const gradientId = `spark-${color.replace('#', '')}-${Math.random().toString(36).slice(2, 6)}`

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      style={{ overflow: 'visible' }}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={fillOpacity * 3} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      {/* Fill area */}
      <path d={areaPath} fill={`url(#${gradientId})`} />
      {/* Line */}
      <polyline
        points={polylinePoints}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Optional dots */}
      {showDots &&
        points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={2} fill={color} />
        ))}
    </svg>
  )
}

export default SparklineChart
