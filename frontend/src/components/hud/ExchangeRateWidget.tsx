'use client'

import { useStore } from '@/store/useStore'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

export default function ExchangeRateWidget() {
  const rate = useStore((s) => s.exchangeRate)

  if (!rate) {
    return (
      <div className="flex flex-col items-center">
        <span className="font-fira text-[var(--t-meta)] text-[9px]">ZAR/USD</span>
        <span className="font-fira text-[var(--t-value)] text-[10px]">R—/$</span>
      </div>
    )
  }

  const isWeakening = rate.usdChange > 0.01
  const isStrengthening = rate.usdChange < -0.01

  return (
    <div className="flex items-center gap-1">
      <div className="flex flex-col items-end">
        <span className="font-fira text-[var(--t-meta)] text-[8px] leading-none">ZAR/USD</span>
        <div className="flex items-center gap-0.5">
          <span className="font-fira text-[var(--t-value)] text-[11px] font-medium leading-none">
            R{rate.usd.toFixed(2)}/$
          </span>
          {isWeakening && <TrendingUp className="w-2.5 h-2.5 text-[var(--critical)]" />}
          {isStrengthening && <TrendingDown className="w-2.5 h-2.5 text-[var(--normal)]" />}
          {!isWeakening && !isStrengthening && <Minus className="w-2.5 h-2.5 text-[var(--t-label)]" />}
        </div>
      </div>
    </div>
  )
}
