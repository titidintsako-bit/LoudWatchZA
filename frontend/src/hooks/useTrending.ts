'use client'

import { useEffect } from 'react'
import { useStore } from '@/store/useStore'

export interface TrendingTopic {
  rank: number
  topic: string
  mentions: number
  growth_pct: number
  category: string
  province: string
  articles: { title: string; url: string; source: string }[]
  is_new: boolean
}

export interface TrendingData {
  topics: TrendingTopic[]
  rising: TrendingTopic[]
  province_topics: Record<string, { topic: string; mentions: number; category: string }>
  sentiment_national: number
  province_sentiment: Record<string, number>
  computed_at: string
  is_live?: boolean
  offline_reason?: string
}

export function useTrending() {
  const setTrending = useStore((s) => s.setTrending)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const res = await fetch('/api/trending')
        if (!res.ok) return
        const data: TrendingData = await res.json()
        if (!cancelled) setTrending(data)
      } catch {
        // silently ignore — store keeps its default empty state
      }
    }

    load()
    const interval = setInterval(load, 3600_000) // refresh hourly
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [setTrending])
}
