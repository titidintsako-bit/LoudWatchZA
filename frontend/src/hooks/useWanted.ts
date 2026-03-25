'use client'

import { useEffect } from 'react'
import { useStore } from '@/store/useStore'
import type { WantedPerson } from '@/types'

const REFRESH_MS = 6 * 60 * 60 * 1000 // 6 hours — data updates daily

export function useWanted() {
  const setWantedPersons = useStore((s) => s.setWantedPersons)
  const wantedPersons = useStore((s) => s.wantedPersons)
  const wantedLastUpdated = useStore((s) => s.wantedLastUpdated)

  useEffect(() => {
    async function fetch_() {
      try {
        const res = await fetch('/api/wanted?limit=200')
        if (!res.ok) return
        const data = await res.json()
        const persons: WantedPerson[] = data.persons ?? []
        setWantedPersons(persons, data.last_updated ?? null)
      } catch {
        // silent — panel shows stale data with "last updated" notice
      }
    }

    fetch_()
    const id = setInterval(fetch_, REFRESH_MS)
    return () => clearInterval(id)
  }, [setWantedPersons])

  return { wantedPersons, wantedLastUpdated }
}
