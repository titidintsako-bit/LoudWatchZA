'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import type { GHSRecord, CensusRecord, ProvincePopulation, HungerRecord } from '@/types'

const REFRESH_INTERVAL_STATS_SA = 6 * 60 * 60 * 1000 // 6 hours

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

export function useGHSData(): {
  data: GHSRecord[]
  loading: boolean
  error: string | null
} {
  const [data, setData] = useState<GHSRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const mountedRef = useRef(true)

  const load = useCallback(async () => {
    try {
      const res = await fetchWithRetry('/api/stats-sa?layer=ghs')
      const json = await res.json()
      if (mountedRef.current) {
        setData(Array.isArray(json) ? json : json.data ?? [])
        setError(null)
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : 'Unknown error')
        setData([])
      }
    } finally {
      if (mountedRef.current) setLoading(false)
    }
  }, [])

  useEffect(() => {
    mountedRef.current = true
    load()
    const interval = setInterval(load, REFRESH_INTERVAL_STATS_SA)
    return () => {
      mountedRef.current = false
      clearInterval(interval)
    }
  }, [load])

  return { data, loading, error }
}

export function useCensusData(): {
  data: CensusRecord[]
  loading: boolean
  error: string | null
} {
  const [data, setData] = useState<CensusRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const mountedRef = useRef(true)

  const load = useCallback(async () => {
    try {
      const res = await fetchWithRetry('/api/stats-sa?layer=census')
      const json = await res.json()
      if (mountedRef.current) {
        setData(Array.isArray(json) ? json : json.data ?? [])
        setError(null)
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : 'Unknown error')
        setData([])
      }
    } finally {
      if (mountedRef.current) setLoading(false)
    }
  }, [])

  useEffect(() => {
    mountedRef.current = true
    load()
    const interval = setInterval(load, REFRESH_INTERVAL_STATS_SA)
    return () => {
      mountedRef.current = false
      clearInterval(interval)
    }
  }, [load])

  return { data, loading, error }
}

export function usePopulationEstimates(): {
  provinces: ProvincePopulation[]
  total: number
  loading: boolean
} {
  const [provinces, setProvinces] = useState<ProvincePopulation[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const mountedRef = useRef(true)

  const load = useCallback(async () => {
    try {
      const res = await fetchWithRetry('/api/stats-sa?layer=population')
      const json = await res.json()
      if (mountedRef.current) {
        const rows: ProvincePopulation[] = Array.isArray(json)
          ? json
          : json.data ?? json.provinces ?? []
        setProvinces(rows)
        const sum = rows.reduce((acc, p) => acc + (p.population ?? 0), 0)
        setTotal(sum)
      }
    } catch {
      if (mountedRef.current) {
        setProvinces([])
        setTotal(0)
      }
    } finally {
      if (mountedRef.current) setLoading(false)
    }
  }, [])

  useEffect(() => {
    mountedRef.current = true
    load()
    const interval = setInterval(load, REFRESH_INTERVAL_STATS_SA)
    return () => {
      mountedRef.current = false
      clearInterval(interval)
    }
  }, [load])

  return { provinces, total, loading }
}

export function useHungerIndex(): {
  data: HungerRecord[]
  loading: boolean
} {
  const [data, setData] = useState<HungerRecord[]>([])
  const [loading, setLoading] = useState(true)
  const mountedRef = useRef(true)

  const load = useCallback(async () => {
    try {
      const res = await fetchWithRetry('/api/stats-sa?layer=hunger')
      const json = await res.json()
      if (mountedRef.current) {
        setData(Array.isArray(json) ? json : json.data ?? [])
      }
    } catch {
      if (mountedRef.current) {
        setData([])
      }
    } finally {
      if (mountedRef.current) setLoading(false)
    }
  }, [])

  useEffect(() => {
    mountedRef.current = true
    load()
    const interval = setInterval(load, REFRESH_INTERVAL_STATS_SA)
    return () => {
      mountedRef.current = false
      clearInterval(interval)
    }
  }, [load])

  return { data, loading }
}
