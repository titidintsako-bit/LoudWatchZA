'use client'

import { useEffect, useState } from 'react'
import { Sparkles, RefreshCw, ExternalLink } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import type { GoodNewsItem } from '@/types'

export default function GoodNewsPanel() {
  const [items, setItems] = useState<GoodNewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(true)

  async function fetchNews() {
    setLoading(true)
    try {
      const res = await fetch('/api/good-news')
      const data = await res.json()
      setItems(data.items ?? [])
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchNews() }, [])

  return (
    <div>
      {/* Header — flex row; toggle and refresh are siblings, never nested */}
      <div className="w-full flex items-center justify-between px-3 py-2.5">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-2 flex-1 min-w-0 text-left"
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        >
          <Sparkles size={12} style={{ color: 'var(--normal)' }} />
          <span
            style={{
              fontFamily: 'var(--font-data)',
              fontSize: '0.6rem',
              color: 'var(--normal)',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
            }}
          >
            Good News From SA
          </span>
          <span style={{ fontFamily: 'var(--font-data)', fontSize: '0.5rem', color: 'rgba(22,163,74,0.4)', marginLeft: 'auto' }}>
            {open ? '▲' : '▼'}
          </span>
        </button>
        {!loading && (
          <button
            type="button"
            title="Refresh"
            onClick={fetchNews}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(22,163,74,0.4)', padding: '0 0 0 6px', flexShrink: 0 }}
          >
            <RefreshCw size={10} />
          </button>
        )}
      </div>

      {open && (
        <div className="pb-2">
          {loading ? (
            <div className="px-3 py-4 flex flex-col gap-1.5">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-8 rounded animate-pulse" style={{ background: 'rgba(22,163,74,0.06)' }} />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="px-3 py-4 text-center">
              <span style={{ fontFamily: 'var(--font-data)', fontSize: '0.55rem', color: 'rgba(255,255,255,0.3)' }}>
                No stories right now
              </span>
            </div>
          ) : (
            <div className="flex flex-col gap-0">
              {items.map((item, i) => (
                <a
                  key={item.id ?? i}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block px-3 py-2 transition-colors"
                  style={{ textDecoration: 'none' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(22,163,74,0.04)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <div className="flex items-start gap-2">
                    <span style={{ color: 'var(--normal)', fontSize: '10px', flexShrink: 0, marginTop: 1 }}>✦</span>
                    <div className="flex-1 min-w-0">
                      <p
                        style={{
                          fontFamily: 'var(--font-data)',
                          fontSize: '0.6rem',
                          color: 'rgba(255,255,255,0.85)',
                          lineHeight: '1.4',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {item.title}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {item.category && (
                          <span
                            style={{
                              fontFamily: 'var(--font-data)',
                              fontSize: '0.38rem',
                              color: 'rgba(22,163,74,0.5)',
                              letterSpacing: '0.1em',
                              textTransform: 'uppercase',
                              background: 'rgba(22,163,74,0.08)',
                              padding: '1px 4px',
                              borderRadius: 2,
                            }}
                          >
                            {item.category}
                          </span>
                        )}
                        <span style={{ fontFamily: 'var(--font-data)', fontSize: '0.45rem', color: 'rgba(255,255,255,0.25)' }}>
                          {formatDistanceToNow(new Date(item.published_at), { addSuffix: true })}
                        </span>
                        <ExternalLink size={8} style={{ color: 'rgba(22,163,74,0.3)', marginLeft: 'auto', flexShrink: 0 }} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  </div>
                  {i < items.length - 1 && (
                    <div style={{ height: 1, background: 'rgba(22,163,74,0.04)', marginTop: 6 }} />
                  )}
                </a>
              ))}
            </div>
          )}
          <div className="px-3 pt-1">
            <a
              href="https://www.goodthingsguy.com"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontFamily: 'var(--font-data)',
                fontSize: '0.45rem',
                color: 'rgba(22,163,74,0.3)',
                textDecoration: 'none',
              }}
            >
              Source: GoodThingsGuy.com
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
