'use client'

import { useEffect, useState } from 'react'

export interface MarketMetric {
  id: string
  label: string
  unit: string
  price: number | null
  prev: number | null
  invertSign?: boolean
}

export function useMarketData() {
  const [metrics, setMetrics] = useState<MarketMetric[]>([])
  const [loading, setLoading] = useState(true)
  const [asOf, setAsOf] = useState<string | null>(null)

  async function fetch_() {
    try {
      const res = await fetch('/api/market-data')
      if (!res.ok) return
      const data = await res.json()
      setMetrics(data.metrics ?? [])
      setAsOf(data.as_of ?? null)
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetch_()
    const id = setInterval(fetch_, 5 * 60 * 1000) // 5 min
    return () => clearInterval(id)
  }, [])

  return { metrics, loading, asOf, refresh: fetch_ }
}
