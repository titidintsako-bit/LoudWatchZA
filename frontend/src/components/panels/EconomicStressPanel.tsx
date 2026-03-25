'use client'

import { TrendingDown } from 'lucide-react'
import { differenceInDays, parseISO } from 'date-fns'
import { GlassCard } from '@/components/ui/GlassCard'
import { SparklineChart } from '@/components/ui/SparklineChart'
import { useStore } from '@/store/useStore'
import { PETROL_95_ULP, NEXT_PETROL_CHANGE } from '@/lib/constants'

function generateSparkData(base: number, points = 7, variance = 0.5): number[] {
  const data: number[] = []
  let current = base - variance * 3
  for (let i = 0; i < points; i++) {
    current += (Math.random() - 0.5) * variance
    data.push(Math.round(current * 100) / 100)
  }
  data[data.length - 1] = base
  return data
}

export default function EconomicStressPanel() {
  const exchangeRate = useStore((s) => s.exchangeRate)
  const municipalities = useStore((s) => s.municipalities)

  const usdRate = exchangeRate?.usd ?? 18.42
  const sparkData = generateSparkData(usdRate, 7, 0.5)

  const avgUnemployment =
    municipalities.length > 0
      ? municipalities.reduce((sum, m) => sum + (m.unemployment_rate ?? 0), 0) /
        municipalities.length
      : null

  const petrolPrice = PETROL_95_ULP
  const daysUntilPetrol = (() => {
    try {
      return Math.max(0, differenceInDays(parseISO(NEXT_PETROL_CHANGE), new Date()))
    } catch {
      return 0
    }
  })()

  return (
    <GlassCard
      title="ECONOMIC STRESS"
      titleIcon={<TrendingDown className="w-3.5 h-3.5" />}
      collapsible
    >
      <div className="space-y-3">
        {/* Unemployment */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[var(--t-meta)] text-[9px] font-fira uppercase tracking-wider mb-0.5">
              UNEMPLOYMENT
            </p>
            <p className="font-fira text-sm text-[var(--t-value)]">
              {avgUnemployment !== null ? `${avgUnemployment.toFixed(1)}%` : '32.9%'}
            </p>
            <p className="text-[8px] text-[var(--t-meta)] font-fira">→ Q4 2025</p>
          </div>
          <div
            className="w-2 h-8 rounded-sm"
            style={{ background: 'rgba(220,38,38,0.2)', borderLeft: '2px solid var(--critical)' }}
          />
        </div>

        {/* ZAR/USD */}
        <div
          className="pt-2 border-t"
          style={{ borderColor: 'rgba(14,165,233,0.08)' }}
        >
          <p className="text-[var(--t-meta)] text-[9px] font-fira uppercase tracking-wider mb-1">
            ZAR/USD
          </p>
          <div className="flex items-end justify-between">
            <div>
              <p className="font-fira text-sm text-[var(--t-value)]">R{usdRate.toFixed(2)}</p>
              {exchangeRate?.usdChange !== undefined && (
                <p
                  className="text-[8px] font-fira"
                  style={{ color: exchangeRate.usdChange >= 0 ? 'var(--critical)' : 'var(--normal)' }}
                >
                  {exchangeRate.usdChange >= 0 ? '+' : ''}
                  {exchangeRate.usdChange.toFixed(2)} today
                </p>
              )}
            </div>
            <SparklineChart
              data={sparkData}
              color="var(--accent)"
              height={32}
              width={80}
              fillOpacity={0.15}
            />
          </div>
        </div>

        {/* Petrol 95 */}
        <div
          className="pt-2 border-t"
          style={{ borderColor: 'rgba(14,165,233,0.08)' }}
        >
          <p className="text-[var(--t-meta)] text-[9px] font-fira uppercase tracking-wider mb-0.5">
            PETROL 95
          </p>
          <div className="flex items-center justify-between">
            <p className="font-fira text-sm text-[var(--t-value)]">R{petrolPrice.toFixed(2)}/L</p>
            <span
              className="text-[8px] font-fira px-1.5 py-0.5 rounded"
              style={{
                color: daysUntilPetrol <= 7 ? 'var(--warning)' : 'var(--t-meta)',
                background: daysUntilPetrol <= 7 ? 'rgba(217,119,6,0.1)' : 'transparent',
              }}
            >
              change in {daysUntilPetrol}d
            </span>
          </div>
        </div>

        {/* GDP Growth */}
        <div
          className="pt-2 border-t"
          style={{ borderColor: 'rgba(14,165,233,0.08)' }}
        >
          <p className="text-[var(--t-meta)] text-[9px] font-fira uppercase tracking-wider mb-0.5">
            GDP GROWTH
          </p>
          <div className="flex items-center justify-between">
            <p className="font-fira text-sm text-[var(--t-value)]">0.6%</p>
            <span className="text-[8px] font-fira text-[var(--critical)]">Q4 2025 ↓</span>
          </div>
        </div>
      </div>
    </GlassCard>
  )
}
