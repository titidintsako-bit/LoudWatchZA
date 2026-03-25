'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import type { Incident } from '@/types'
import { REFRESH_INTERVALS } from '@/lib/constants'

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

export function useProtests() {
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const mountedRef = useRef(true)

  const load = useCallback(async () => {
    try {
      const res = await fetchWithRetry('/api/protests')
      const json = await res.json()
      if (mountedRef.current) {
        setIncidents(json.incidents ?? [])
        setError(null)
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : 'Unknown error')
        setIncidents([])
      }
    } finally {
      if (mountedRef.current) setLoading(false)
    }
  }, [])

  useEffect(() => {
    mountedRef.current = true
    load()
    const interval = setInterval(load, REFRESH_INTERVALS.protests)
    return () => {
      mountedRef.current = false
      clearInterval(interval)
    }
  }, [load])

  return { incidents, loading, error }
}
