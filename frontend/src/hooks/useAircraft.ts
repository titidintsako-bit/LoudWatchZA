'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import type { Aircraft } from '@/types'
import { REFRESH_INTERVALS, BACKEND_URL } from '@/lib/constants'

async function fetchWithRetry(
  url: string,
  retries = 3,
  delay = 1000,
): Promise<Response> {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const res = await fetch(url, { cache: 'no-store' })
      if (res.ok) return res
    } catch {
      if (attempt === retries - 1) throw new Error(`Failed to fetch ${url}`)
    }
    await new Promise((r) => setTimeout(r, delay * Math.pow(2, attempt)))
  }
  throw new Error(`Failed after ${retries} retries`)
}

export function useAircraft() {
  const [aircraft, setAircraft] = useState<Aircraft[]>([])
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const mountedRef = useRef(true)
  const wsRef = useRef<WebSocket | null>(null)
  const usingWsRef = useRef(false)

  const loadFromHttp = useCallback(async () => {
    try {
      const res = await fetchWithRetry('/api/aircraft')
      const json = await res.json()
      if (mountedRef.current) {
        const list: Aircraft[] = json.aircraft ?? []
        setAircraft(list)
        setCount(json.count ?? list.length)
        setError(null)
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      }
    } finally {
      if (mountedRef.current) setLoading(false)
    }
  }, [])

  useEffect(() => {
    mountedRef.current = true

    // Try WebSocket first
    const wsUrl = BACKEND_URL.replace(/^http/, 'ws') + '/ws/aircraft'
    let ws: WebSocket

    try {
      ws = new WebSocket(wsUrl)
      wsRef.current = ws

      ws.onopen = () => {
        usingWsRef.current = true
        if (mountedRef.current) setLoading(false)
      }

      ws.onmessage = (event) => {
        if (!mountedRef.current) return
        try {
          const data = JSON.parse(event.data)
          const list: Aircraft[] = data.aircraft ?? []
          setAircraft(list)
          setCount(data.count ?? list.length)
          setError(null)
        } catch {
          // ignore parse errors
        }
      }

      ws.onerror = () => {
        usingWsRef.current = false
        wsRef.current = null
        // Fall back to polling
        loadFromHttp()
      }

      ws.onclose = () => {
        usingWsRef.current = false
        wsRef.current = null
      }
    } catch {
      usingWsRef.current = false
      loadFromHttp()
    }

    // Polling fallback or supplement
    const interval = setInterval(() => {
      if (!usingWsRef.current) {
        loadFromHttp()
      }
    }, REFRESH_INTERVALS.aircraft)

    // Initial load
    loadFromHttp()

    return () => {
      mountedRef.current = false
      clearInterval(interval)
      if (wsRef.current) {
        wsRef.current.close()
        wsRef.current = null
      }
    }
  }, [loadFromHttp])

  return { aircraft, count, loading, error }
}
