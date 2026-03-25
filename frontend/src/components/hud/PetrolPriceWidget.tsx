'use client'

import { useStore } from '@/store/useStore'
import { PETROL_95_ULP, NEXT_PETROL_CHANGE } from '@/lib/constants'

function daysUntil(dateStr: string): number {
  const target = new Date(dateStr)
  const now = new Date()
  return Math.max(0, Math.ceil((target.getTime() - now.getTime()) / 86_400_000))
}

export default function PetrolPriceWidget() {
  const price = useStore((s) => s.petrolPrice)
  const p95 = price?.unleaded95 ?? PETROL_95_ULP
  const days = price?.daysUntilChange ?? daysUntil(NEXT_PETROL_CHANGE)

  return (
    <div className="flex flex-col items-end">
      <span className="font-fira text-[var(--t-meta)] text-[8px] leading-none">PETROL 95</span>
      <div className="flex items-center gap-1">
        <span className="font-fira text-[var(--t-value)] text-[11px] font-medium leading-none">
          R{p95.toFixed(2)}/L
        </span>
        <span
          className="font-fira text-[9px] leading-none"
          style={{ color: days < 7 ? 'var(--warning)' : 'var(--t-meta)' }}
        >
          ⛽{days}d
        </span>
      </div>
    </div>
  )
}
