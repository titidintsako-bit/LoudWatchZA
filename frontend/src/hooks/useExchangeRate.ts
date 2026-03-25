import { useEffect } from 'react'
import { useStore } from '@/store/useStore'
import { REFRESH_INTERVALS } from '@/lib/constants'
import type { ExchangeRate } from '@/types'

export function useExchangeRate() {
  const setExchangeRate = useStore((s) => s.setExchangeRate)

  async function fetchRate() {
    try {
      const res = await fetch('/api/exchange-rate')
      if (!res.ok) return
      const data: ExchangeRate = await res.json()
      setExchangeRate(data)
    } catch {
      // Silently fail — UI shows last known value or loading state
    }
  }

  useEffect(() => {
    fetchRate()
    const id = setInterval(fetchRate, REFRESH_INTERVALS.exchangeRate)
    return () => clearInterval(id)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
}
