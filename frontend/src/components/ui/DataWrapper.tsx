'use client'

import { ReactNode } from 'react'

interface Props {
  loading?: boolean
  error?: string | null
  empty?: boolean
  emptyMessage?: string
  skeletonRows?: number
  children: ReactNode
}

function SkeletonRows({ count }: { count: number }) {
  return (
    <div className="flex flex-col gap-1.5 px-3 py-2">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="h-8 rounded animate-pulse"
          style={{ background: 'rgba(14,165,233,0.04)', opacity: 1 - i * 0.15 }}
        />
      ))}
    </div>
  )
}

export default function DataWrapper({
  loading = false,
  error = null,
  empty = false,
  emptyMessage = 'No data available',
  skeletonRows = 3,
  children,
}: Props) {
  if (loading) {
    return <SkeletonRows count={skeletonRows} />
  }

  if (error) {
    return (
      <div className="px-3 py-3 flex items-center gap-2">
        <span style={{ color: 'var(--red)', fontSize: '0.5rem', fontFamily: 'var(--font-data)' }}>
          ✕
        </span>
        <span style={{ color: 'var(--red)', fontSize: '0.55rem', fontFamily: 'var(--font-data)', opacity: 0.7 }}>
          {error}
        </span>
      </div>
    )
  }

  if (empty) {
    return (
      <div className="px-3 py-3">
        <span style={{ color: 'var(--text-muted)', fontSize: '0.55rem', fontFamily: 'var(--font-data)' }}>
          {emptyMessage}
        </span>
      </div>
    )
  }

  return <>{children}</>
}
