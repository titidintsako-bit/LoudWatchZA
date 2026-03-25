'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, X, MapPin, Building2, Map } from 'lucide-react'

interface SearchResult {
  id: string
  name: string
  type: 'municipality' | 'province' | 'suburb' | 'dam' | 'location'
  province?: string
  lat: number
  lng: number
}

const TYPE_ICONS: Record<string, React.ElementType> = {
  municipality: Building2,
  province: Map,
  suburb: MapPin,
  dam: MapPin,
  location: MapPin,
}

const TYPE_COLORS: Record<string, string> = {
  municipality: 'var(--accent)',
  province: 'var(--normal)',
  suburb: 'var(--warning)',
  dam: 'var(--accent)',
  location: 'rgba(255,255,255,0.5)',
}

const TYPE_LABELS: Record<string, string> = {
  municipality: 'MUNI',
  province: 'PROV',
  suburb: 'SUBURB',
  dam: 'DAM',
  location: 'LOC',
}

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debounced
}

export default function SearchBar() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const debouncedQuery = useDebounce(query, 300)
  const abortRef = useRef<AbortController | null>(null)

  // Fetch results
  useEffect(() => {
    if (debouncedQuery.trim().length < 2) {
      setResults([])
      setOpen(false)
      return
    }

    if (abortRef.current) abortRef.current.abort()
    abortRef.current = new AbortController()

    setLoading(true)
    fetch(`/api/search?q=${encodeURIComponent(debouncedQuery.trim())}`, {
      signal: abortRef.current.signal,
    })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then((data: SearchResult[]) => {
        setResults(data.slice(0, 8))
        setOpen(data.length > 0)
        setActiveIndex(-1)
      })
      .catch(err => {
        if (err.name !== 'AbortError') {
          setResults([])
          setOpen(false)
        }
      })
      .finally(() => setLoading(false))
  }, [debouncedQuery])

  // Close on outside click
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  // Close on Escape
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpen(false)
        setQuery('')
        inputRef.current?.blur()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  const handleSelect = useCallback((result: SearchResult) => {
    window.dispatchEvent(
      new CustomEvent('loudwatch:zoomTo', {
        detail: { lat: result.lat, lng: result.lng },
      })
    )
    setQuery(result.name)
    setOpen(false)
    setResults([])
  }, [])

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || results.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex(i => Math.min(i + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex(i => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const target = activeIndex >= 0 ? results[activeIndex] : results[0]
      if (target) handleSelect(target)
    }
  }

  function handleClear() {
    setQuery('')
    setResults([])
    setOpen(false)
    inputRef.current?.focus()
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full max-w-lg mx-auto"
    >
      {/* Input wrapper */}
      <div
        className="relative flex items-center rounded-xl border transition-all duration-200"
        style={{
          background: 'rgba(10,14,23,0.85)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderColor: open || query
            ? 'rgba(14,165,233,0.5)'
            : 'rgba(255,255,255,0.1)',
          boxShadow: open || query
            ? '0 0 0 1px rgba(14,165,233,0.2), 0 0 20px rgba(14,165,233,0.1)'
            : 'none',
        }}
      >
        <div className="flex items-center pl-3.5 flex-shrink-0">
          {loading ? (
            <div
              className="w-4 h-4 rounded-full border-2 animate-spin"
              style={{ borderColor: 'rgba(14,165,233,0.2)', borderTopColor: 'var(--accent)' }}
            />
          ) : (
            <Search size={15} style={{ color: open ? 'var(--accent)' : 'rgba(255,255,255,0.35)' }} />
          )}
        </div>

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="Search suburb, municipality, province..."
          className="flex-1 bg-transparent outline-none px-3 py-2.5"
          style={{
            fontFamily: 'var(--font-data)',
            fontSize: '0.72rem',
            color: 'rgba(255,255,255,0.9)',
            letterSpacing: '0.02em',
          }}
          spellCheck={false}
          autoComplete="off"
        />

        {/* Kbd hint */}
        {!query && (
          <span
            className="hidden sm:flex items-center mr-3 gap-1"
            style={{
              fontFamily: 'var(--font-data)',
              fontSize: '0.5rem',
              color: 'rgba(255,255,255,0.2)',
            }}
          >
            <kbd
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '3px',
                padding: '1px 4px',
              }}
            >
              ESC
            </kbd>
          </span>
        )}

        {/* Clear button */}
        {query && (
          <button
            onClick={handleClear}
            className="mr-2 p-1 rounded-md transition-colors"
            style={{ color: 'rgba(255,255,255,0.4)' }}
            onMouseEnter={e => {
              ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--accent)'
            }}
            onMouseLeave={e => {
              ;(e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.4)'
            }}
          >
            <X size={13} />
          </button>
        )}
      </div>

      {/* Dropdown results */}
      <AnimatePresence>
        {open && results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute top-full mt-1.5 w-full rounded-xl border overflow-hidden z-50"
            style={{
              background: 'rgba(10,14,23,0.95)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              borderColor: 'rgba(14,165,233,0.2)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(14,165,233,0.1)',
            }}
          >
            {results.map((result, i) => {
              const Icon = TYPE_ICONS[result.type] ?? MapPin
              const typeColor = TYPE_COLORS[result.type] ?? 'rgba(255,255,255,0.5)'
              const typeLabel = TYPE_LABELS[result.type] ?? result.type.toUpperCase()
              const isActive = i === activeIndex

              return (
                <motion.button
                  key={result.id}
                  onClick={() => handleSelect(result)}
                  className="w-full text-left px-3.5 py-2.5 flex items-center gap-3 transition-colors"
                  style={{
                    background: isActive ? 'rgba(14,165,233,0.07)' : 'transparent',
                    borderBottom:
                      i < results.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                  }}
                  onMouseEnter={() => setActiveIndex(i)}
                  onMouseLeave={() => setActiveIndex(-1)}
                >
                  <div
                    className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-md"
                    style={{
                      background: `${typeColor}15`,
                      border: `1px solid ${typeColor}30`,
                    }}
                  >
                    <Icon size={11} style={{ color: typeColor }} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <span
                      className="block truncate"
                      style={{
                        fontFamily: 'var(--font-data)',
                        fontSize: '0.68rem',
                        color: isActive ? '#fff' : 'rgba(255,255,255,0.8)',
                        fontWeight: 600,
                      }}
                    >
                      {result.name}
                    </span>
                    {result.province && (
                      <span
                        style={{
                          fontFamily: 'var(--font-data)',
                          fontSize: '0.55rem',
                          color: 'rgba(255,255,255,0.35)',
                        }}
                      >
                        {result.province}
                      </span>
                    )}
                  </div>

                  <span
                    style={{
                      fontFamily: 'var(--font-data)',
                      fontSize: '0.45rem',
                      color: typeColor,
                      background: `${typeColor}12`,
                      border: `1px solid ${typeColor}28`,
                      borderRadius: '4px',
                      padding: '2px 5px',
                      letterSpacing: '0.06em',
                      flexShrink: 0,
                    }}
                  >
                    {typeLabel}
                  </span>
                </motion.button>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
