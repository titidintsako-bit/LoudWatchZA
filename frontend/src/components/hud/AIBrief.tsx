'use client'

import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Clock, AlertCircle } from 'lucide-react'

interface AIBriefData {
  brief: string
  topics: string[]
  generated_at: string
}

const TYPING_TEXT = 'Generating intelligence brief...'

function TypingIndicator() {
  const [dots, setDots] = useState('')

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => (prev.length >= 3 ? '' : prev + '.'))
    }, 400)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex items-center gap-2 py-2">
      <div className="flex gap-1">
        {[0, 1, 2].map(i => (
          <motion.div
            key={i}
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: 'var(--accent)' }}
            animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
            transition={{
              duration: 0.8,
              repeat: Infinity,
              delay: i * 0.15,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>
      <span
        style={{
          fontFamily: 'var(--font-data)',
          fontSize: '0.65rem',
          color: 'rgba(14,165,233,0.7)',
        }}
      >
        {TYPING_TEXT.slice(0, TYPING_TEXT.length - (3 - dots.length))}
        {dots}
      </span>
    </div>
  )
}

function formatGenTime(iso: string): string {
  try {
    const d = new Date(iso)
    return d.toLocaleString('en-ZA', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
  } catch {
    return 'Unknown'
  }
}

export default function AIBrief() {
  const [data, setData] = useState<AIBriefData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const hasFetched = useRef(false)

  useEffect(() => {
    if (hasFetched.current) return
    hasFetched.current = true

    const controller = new AbortController()

    async function fetchBrief() {
      try {
        const res = await fetch('/api/ai-brief', {
          signal: controller.signal,
          next: { revalidate: 21600 }, // 6h
        } as RequestInit)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const json = await res.json()
        setData(json)
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') return
        setError(true)
      } finally {
        setLoading(false)
      }
    }

    fetchBrief()
    return () => controller.abort()
  }, [])

  return (
    <div
      className="relative rounded-xl border border-white/10 overflow-hidden"
      style={{
        background: 'rgba(10,14,23,0.80)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        boxShadow: '0 0 24px rgba(14,165,233,0.06), inset 0 1px 0 rgba(255,255,255,0.05)',
      }}
    >
      {/* Top accent bar */}
      <div
        className="h-0.5 w-full"
        style={{ background: 'linear-gradient(90deg, transparent, var(--accent), var(--normal), transparent)' }}
      />

      <div className="px-4 pt-3 pb-3">
        {/* Header */}
        <div className="flex items-center gap-2 mb-3">
          <div
            className="flex items-center justify-center w-7 h-7 rounded-lg"
            style={{
              background: 'rgba(14,165,233,0.1)',
              border: '1px solid rgba(14,165,233,0.3)',
            }}
          >
            <Sparkles size={14} style={{ color: 'var(--accent)' }} />
          </div>
          <span
            style={{
              fontFamily: 'var(--font-data)',
              fontSize: '0.65rem',
              color: 'var(--accent)',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
            }}
          >
            AI Intel Brief
          </span>
          {data && (
            <div className="ml-auto flex items-center gap-1">
              <Clock size={9} style={{ color: 'rgba(255,255,255,0.3)' }} />
              <span
                style={{
                  fontFamily: 'var(--font-data)',
                  fontSize: '0.52rem',
                  color: 'rgba(255,255,255,0.3)',
                }}
              >
                {formatGenTime(data.generated_at)}
              </span>
            </div>
          )}
        </div>

        {/* Content area */}
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <TypingIndicator />
            </motion.div>
          ) : error || !data ? (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2 py-2"
            >
              <AlertCircle size={13} style={{ color: 'rgba(255,255,255,0.3)' }} />
              <span
                style={{
                  fontFamily: 'var(--font-data)',
                  fontSize: '0.65rem',
                  color: 'rgba(255,255,255,0.3)',
                }}
              >
                Brief unavailable
              </span>
            </motion.div>
          ) : (
            <motion.div
              key="content"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
            >
              {/* Brief text — left cyan border, terminal-quote style */}
              <div
                className="mb-3 overflow-y-auto"
                style={{
                  maxHeight: '160px',
                  borderLeft: '2px solid rgba(14,165,233,0.4)',
                  paddingLeft: '10px',
                }}
              >
                <p
                  style={{
                    fontFamily: 'var(--font-data)',
                    fontSize: '0.65rem',
                    color: 'rgba(255,255,255,0.75)',
                    lineHeight: 1.6,
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {data.brief}
                </p>
              </div>

              {/* Topics chips */}
              {data.topics && data.topics.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {data.topics.map((topic, i) => (
                    <motion.span
                      key={topic}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.05, duration: 0.2 }}
                      style={{
                        fontFamily: 'var(--font-data)',
                        fontSize: '0.52rem',
                        color: 'var(--accent)',
                        background: 'rgba(14,165,233,0.08)',
                        border: '1px solid rgba(14,165,233,0.25)',
                        borderRadius: '4px',
                        padding: '2px 7px',
                        letterSpacing: '0.03em',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {topic}
                    </motion.span>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
