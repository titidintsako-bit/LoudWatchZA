'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import type { LoadsheddingStatus } from '@/types'
import { REFRESH_INTERVALS } from '@/lib/constants'

const FALLBACK: LoadsheddingStatus = {
  stage: 0,
  updated_at: new Date().toISOString(),
  areas_affected: 0,
}

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
  throw new Error(`Failed to fetch ${url} after ${retries} retries`)
}

export function useLoadshedding() {
  const [data, setData] = useState<LoadsheddingStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const mountedRef = useRef(true)

  const load = useCallback(async () => {
    try {
      const res = await fetchWithRetry('/api/loadshedding')
      const json = await res.json()
      if (mountedRef.current) {
        setData(json)
        setError(null)
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : 'Unknown error')
        setData(FALLBACK)
      }
    } finally {
      if (mountedRef.current) setLoading(false)
    }
  }, [])

  useEffect(() => {
    mountedRef.current = true
    load()
    const interval = setInterval(load, REFRESH_INTERVALS.loadshedding)
    return () => {
      mountedRef.current = false
      clearInterval(interval)
    }
  }, [load])

  return { data, loading, error }
}
