'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, MapPin, Droplets, Globe, ZoomIn } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { SA_PROVINCES, ZOOM_PRESETS } from '@/lib/constants'
import type { Municipality, Dam } from '@/types'

interface SearchResultItem {
  id: string
  name: string
  type: 'municipality' | 'province' | 'dam' | 'preset'
  province?: string
  lat?: number
  lng?: number
  zoom?: number
  center?: [number, number]
}

function buildResults(
  query: string,
  municipalities: Municipality[],
  dams: Dam[],
): SearchResultItem[] {
  if (!query || query.length < 1) return []
  const q = query.toLowerCase()
  const results: SearchResultItem[] = []

  SA_PROVINCES.forEach((province) => {
    if (province.toLowerCase().includes(q)) {
      results.push({ id: `province-${province}`, name: province, type: 'province', province })
    }
  })

  municipalities.forEach((m) => {
    if (m.name.toLowerCase().includes(q) || m.province.toLowerCase().includes(q)) {
      results.push({
        id: `muni-${m.id}`,
        name: m.name,
        type: 'municipality',
        province: m.province,
        lat: m.lat,
        lng: m.lng,
      })
    }
  })

  dams.forEach((d) => {
    if (d.name.toLowerCase().includes(q) || d.province.toLowerCase().includes(q)) {
      results.push({
        id: `dam-${d.id}`,
        name: d.name,
        type: 'dam',
        province: d.province,
        lat: d.lat,
        lng: d.lng,
      })
    }
  })

  Object.entries(ZOOM_PRESETS).forEach(([key, preset]) => {
    if (key.toLowerCase().includes(q)) {
      results.push({
        id: `preset-${key}`,
        name: key,
        type: 'preset',
        zoom: preset.zoom,
        center: preset.center,
      })
    }
  })

  return results.slice(0, 12)
}

function ResultIcon({ type }: { type: SearchResultItem['type'] }) {
  const cls = 'w-3.5 h-3.5 flex-shrink-0'
  if (type === 'municipality') return <MapPin className={cls} style={{ color: 'var(--accent)' }} />
  if (type === 'dam') return <Droplets className={cls} style={{ color: 'var(--accent)' }} />
  if (type === 'province') return <Globe className={cls} style={{ color: 'var(--normal)' }} />
  return <ZoomIn className={cls} style={{ color: 'var(--warning)' }} />
}

export default function SearchModal() {
  const searchOpen = useStore((s) => s.searchOpen)
  const setSearchOpen = useStore((s) => s.setSearchOpen)
  const setMapView = useStore((s) => s.setMapView)
  const setSelectedProvince = useStore((s) => s.setSelectedProvince)
  const municipalities = useStore((s) => s.municipalities)
  const dams = useStore((s) => s.dams)

  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const results = buildResults(query, municipalities, dams)

  function close() {
    setSearchOpen(false)
    setQuery('')
    setSelectedIndex(0)
  }

  function activateResult(result: SearchResultItem) {
    if (result.type === 'province') {
      setSelectedProvince(result.name)
      const preset = Object.values(ZOOM_PRESETS).find(() => false)
      void preset
    } else if (result.type === 'municipality' && result.lat !== undefined && result.lng !== undefined) {
      setMapView(10, [result.lat, result.lng])
    } else if (result.type === 'dam' && result.lat !== undefined && result.lng !== undefined) {
      setMapView(11, [result.lat, result.lng])
    } else if (result.type === 'preset' && result.zoom !== undefined && result.center) {
      setMapView(result.zoom, result.center)
    }
    close()
  }

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex((i) => Math.min(i + 1, results.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex((i) => Math.max(i - 1, 0))
      } else if (e.key === 'Enter') {
        if (results[selectedIndex]) {
          activateResult(results[selectedIndex])
        }
      } else if (e.key === 'Escape') {
        close()
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [results, selectedIndex],
  )

  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [searchOpen])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && searchOpen) {
        close()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchOpen])

  return (
    <AnimatePresence>
      {searchOpen && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-start justify-center"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={close}
        >
          <motion.div
            className="max-w-lg w-full mx-4 mt-24 rounded-xl overflow-hidden"
            style={{
              background: 'rgba(13,18,32,0.95)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(14,165,233,0.2)',
            }}
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-4 py-2 border-b"
              style={{ borderColor: 'rgba(14,165,233,0.1)' }}
            >
              <span className="font-orbitron text-[10px] tracking-widest uppercase text-[var(--accent)]">
                COMMAND SEARCH
              </span>
              <button
                onClick={close}
                className="text-[var(--t-meta)] hover:text-[var(--accent)] transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Input */}
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search municipalities, dams, provinces..."
              className="w-full bg-transparent p-4 text-[var(--t-value)] font-fira placeholder-[var(--t-meta)] outline-none border-b"
              style={{ borderColor: 'rgba(14,165,233,0.15)', fontSize: '14px' }}
            />

            {/* Results */}
            <div className="max-h-72 overflow-y-auto">
              {query.length === 0 && (
                <p className="text-[var(--t-meta)] text-xs font-fira text-center py-6 px-4">
                  Type to search municipalities, dams, provinces...
                </p>
              )}

              {query.length >= 2 && results.length === 0 && (
                <p className="text-[var(--t-meta)] text-xs font-fira text-center py-6 px-4">
                  No results for &apos;{query}&apos;
                </p>
              )}

              {results.map((result, idx) => (
                <button
                  key={result.id}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-left transition-colors"
                  style={{
                    background: idx === selectedIndex ? 'rgba(14,165,233,0.08)' : 'transparent',
                  }}
                  onClick={() => activateResult(result)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                >
                  <ResultIcon type={result.type} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[var(--t-value)] truncate">{result.name}</p>
                    {result.province && (
                      <p className="text-[9px] text-[var(--t-meta)] font-fira">{result.province}</p>
                    )}
                  </div>
                  <span
                    className="text-[9px] text-[var(--t-meta)] font-fira flex-shrink-0 uppercase"
                  >
                    {result.type}
                  </span>
                </button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
