'use client'

import { useEffect } from 'react'
import { useStore } from '@/store/useStore'
import type { ProductMode, TimeFilter } from '@/store/useStore'

const KEY = 'lw_prefs_v1'

interface Prefs {
  activeMode: ProductMode
  timeFilter: TimeFilter
  leftSidebarOpen: boolean
  rightSidebarOpen: boolean
  selectedProvince: string | null
  mapProjection: string
}

function load(): Partial<Prefs> {
  if (typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as Partial<Prefs>) : {}
  } catch {
    return {}
  }
}

function save(prefs: Prefs) {
  try {
    localStorage.setItem(KEY, JSON.stringify(prefs))
  } catch {
    // ignore quota errors
  }
}

/** Restores user preferences from localStorage on mount and persists changes. */
export function usePersistedPreferences() {
  const setActiveMode       = useStore((s) => s.setActiveMode)
  const setTimeFilter       = useStore((s) => s.setTimeFilter)
  const setSelectedProvince = useStore((s) => s.setSelectedProvince)
  const setMapProjection    = useStore((s) => s.setMapProjection)

  // Restore on mount (runs once)
  useEffect(() => {
    const prefs = load()
    if (prefs.activeMode)       setActiveMode(prefs.activeMode)
    if (prefs.timeFilter)       setTimeFilter(prefs.timeFilter)
    if (prefs.selectedProvince !== undefined) setSelectedProvince(prefs.selectedProvince ?? null)
    if (prefs.mapProjection)    setMapProjection(prefs.mapProjection as 'globe' | '2d' | '3d')
    // Don't restore sidebar open state — let responsive hook handle it
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Persist whenever relevant state changes
  useEffect(() => {
    const unsub = useStore.subscribe((state) => {
      save({
        activeMode:       state.activeMode,
        timeFilter:       state.timeFilter,
        leftSidebarOpen:  state.leftSidebarOpen,
        rightSidebarOpen: state.rightSidebarOpen,
        selectedProvince: state.selectedProvince,
        mapProjection:    state.mapProjection,
      })
    })
    return unsub
  }, [])
}
