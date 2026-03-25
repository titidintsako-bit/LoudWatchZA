'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import type { NewsArticle } from '@/types'

export interface BreakingAlert {
  id: string
  title: string
  source: string
  url: string
  category?: string
  timestamp: string
}

interface UseRealtimeNewsOptions {
  onBreakingNews?: (alert: BreakingAlert) => void
}

export function useRealtimeNews(options: UseRealtimeNewsOptions = {}) {
  const [realtimeArticles, setRealtimeArticles] = useState<NewsArticle[]>([])
  const [breakingAlert, setBreakingAlert] = useState<BreakingAlert | null>(null)
  const [connected, setConnected] = useState(false)
  const mountedRef = useRef(true)
  const onBreakingRef = useRef(options.onBreakingNews)
  onBreakingRef.current = options.onBreakingNews

  const dismissBreaking = useCallback(() => setBreakingAlert(null), [])

  useEffect(() => {
    mountedRef.current = true

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) return

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let supabase: any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let channel: any

    import('@supabase/supabase-js').then(({ createClient }) => {
      if (!mountedRef.current) return

      supabase = createClient(url, key)

      channel = supabase
        .channel('news_items_realtime')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'news_items' },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (payload: any) => {
            if (!mountedRef.current) return

            const raw = payload.new ?? {}
            const article: NewsArticle = {
              id: String(raw.id ?? `rt-${Date.now()}`),
              title: String(raw.title ?? ''),
              url: String(raw.url ?? ''),
              source: String(raw.source ?? 'Live'),
              published_at: String(raw.published_at ?? new Date().toISOString()),
              sentiment: Number(raw.sentiment ?? 0),
              summary: String(raw.summary ?? ''),
              image_url: raw.image_url ? String(raw.image_url) : undefined,
              province: raw.province ? String(raw.province) : undefined,
              category: raw.category ? String(raw.category) : undefined,
              lat: Number(raw.lat ?? -28.5),
              lng: Number(raw.lng ?? 24.0),
            }

            setRealtimeArticles((prev) => {
              if (prev.some((a) => a.id === article.id)) return prev
              return [article, ...prev].slice(0, 50)
            })

            if (raw.is_breaking === true) {
              const alert: BreakingAlert = {
                id: article.id,
                title: article.title,
                source: article.source,
                url: article.url,
                category: article.category,
                timestamp: article.published_at,
              }
              setBreakingAlert(alert)
              onBreakingRef.current?.(alert)

              setTimeout(() => {
                if (mountedRef.current) setBreakingAlert(null)
              }, 30_000)
            }
          },
        )
        .subscribe((status: string) => {
          if (mountedRef.current) setConnected(status === 'SUBSCRIBED')
        })
    })

    return () => {
      mountedRef.current = false
      if (supabase && channel) {
        supabase.removeChannel(channel)
      }
    }
  }, []) // intentionally empty — stable via refs

  return { realtimeArticles, breakingAlert, connected, dismissBreaking }
}
