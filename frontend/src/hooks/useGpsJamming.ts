'use client'

import { useState, useEffect, useRef } from 'react'
import { REFRESH_INTERVALS } from '@/lib/constants'

export interface JammingPoint {
  lat: number
  lng: number
  level: number
  date: string
}

export function useGpsJamming(enabled: boolean) {
  const [points, setPoints] = useState<JammingPoint[]>([])
  const [date, setDate] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  useEffect(() => {
    if (!enabled) return

    const load = async () => {
      setLoading(true)
      try {
        const res = await fetch('/api/gps-jamming')
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const json = await res.json()
        if (mountedRef.current) {
          setPoints(json.points ?? [])
          setDate(json.date ?? null)
        }
      } catch (err) {
        console.warn('[useGpsJamming] fetch error:', err)
      } finally {
        if (mountedRef.current) setLoading(false)
      }
    }

    load()
    const interval = setInterval(load, REFRESH_INTERVALS.gpsJamming)
    return () => clearInterval(interval)
  }, [enabled])

  return { points, date, loading }
}
