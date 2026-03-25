import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

export function formatNumber(n: number): string {
  return n.toLocaleString('en-ZA')
}

export function formatPercent(n: number, decimals = 1): string {
  return `${n.toFixed(decimals)}%`
}

export function painScoreColor(score: number): string {
  // 0 = green, 1 = yellow-green, 2 = amber, 3 = orange-red, 4 = red, 5 = deep red
  if (score <= 0.5) return 'var(--normal)'
  if (score <= 1.5) return '#aaff00'
  if (score <= 2.5) return '#ffeb3b'
  if (score <= 3.5) return 'var(--warning)'
  if (score <= 4.5) return 'var(--critical)'
  return '#9c27b0'
}

export function stageColor(stage: number): string {
  const colors: Record<number, string> = {
    0: 'var(--normal)',
    1: '#ffeb3b',
    2: 'var(--warning)',
    3: 'var(--critical)',
    4: '#9c27b0',
    5: '#9c27b0',
    6: '#9c27b0',
    7: '#9c27b0',
    8: '#9c27b0',
  }
  return colors[Math.min(stage, 8)] ?? 'var(--normal)'
}

export function distanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

export function timeAgo(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHr = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHr / 24)

  if (diffSec < 60) return `${diffSec}s ago`
  if (diffMin < 60) return `${diffMin}m ago`
  if (diffHr < 24) return `${diffHr}h ago`
  if (diffDay < 30) return `${diffDay}d ago`
  return date.toLocaleDateString('en-ZA')
}

export function truncate(str: string, len: number): string {
  if (str.length <= len) return str
  return str.slice(0, len - 3) + '...'
}
