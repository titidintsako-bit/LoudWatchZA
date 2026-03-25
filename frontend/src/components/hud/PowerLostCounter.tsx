'use client'

import { AlertTriangle } from 'lucide-react'
import { useStore } from '@/store/useStore'

// Conservative estimate: ~1,200 hours lost Jan-Mar 2025 (avg stage 2)
const BASELINE_HOURS = 1_247

export default function PowerLostCounter() {
  const stored = useStore((s) => s.powerLostHours)
  const hours = stored > 0 ? stored : BASELINE_HOURS

  return (
    <div
      className="flex items-center gap-1"
      title="Estimated hours of loadshedding in South Africa in 2025"
    >
      <AlertTriangle className="w-2.5 h-2.5 text-[var(--critical)] flex-shrink-0" />
      <span className="font-orbitron text-[var(--critical)] text-[9px] tracking-wide">
        SA LOST {hours.toLocaleString()}HRS / 2025
      </span>
    </div>
  )
}
