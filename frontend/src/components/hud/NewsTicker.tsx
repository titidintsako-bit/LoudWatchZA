'use client'

import { useRef, useEffect, useState } from 'react'
import { motion, useAnimation } from 'framer-motion'
import type { NewsArticle } from '@/types'

interface Props {
  articles: NewsArticle[]
}

const FALLBACK_TEXT = 'LOUDWATCH ZA | Real-time South Africa Intelligence Dashboard'
const PIXELS_PER_SECOND = 80

export default function NewsTicker({ articles }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLSpanElement>(null)
  const controls = useAnimation()
  const [isPaused, setIsPaused] = useState(false)
  const [contentWidth, setContentWidth] = useState(0)

  const tickerText =
    articles.length > 0
      ? articles.map(a => `${a.source.toUpperCase()} | ${a.title}`).join('  •  ')
      : FALLBACK_TEXT

  // Duplicate so scroll looks seamless
  const fullText = tickerText + '     •     ' + tickerText

  useEffect(() => {
    if (!contentRef.current) return
    const width = contentRef.current.scrollWidth / 2
    setContentWidth(width)
  }, [fullText])

  useEffect(() => {
    if (contentWidth === 0 || isPaused) return

    const duration = contentWidth / PIXELS_PER_SECOND

    controls.start({
      x: [-0, -contentWidth],
      transition: {
        duration,
        ease: 'linear',
        repeat: Infinity,
        repeatType: 'loop',
      },
    })
  }, [contentWidth, controls, isPaused])

  useEffect(() => {
    if (isPaused) {
      controls.stop()
    }
  }, [isPaused, controls])

  function handleArticleClick(article: NewsArticle) {
    window.open(article.url, '_blank', 'noopener,noreferrer')
  }

  return (
    <div
      className="fixed bottom-10 left-0 right-0 z-40 overflow-hidden"
      style={{
        height: '48px',
        background: 'rgba(10,14,23,0.88)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        borderTop: '1px solid rgba(255,255,255,0.07)',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
      }}
    >
      {/* Left: BREAKING label */}
      <div
        className="absolute left-0 top-0 bottom-0 z-10 flex items-center px-3 gap-2"
        style={{
          background: 'linear-gradient(90deg, rgba(10,14,23,1) 80%, transparent)',
          minWidth: '100px',
        }}
      >
        {/* Pulse dot */}
        <div className="relative flex-shrink-0">
          <div
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: 'var(--critical)' }}
          />
          <div
            className="absolute inset-0 rounded-full animate-ping"
            style={{ background: 'var(--critical)', opacity: 0.5 }}
          />
        </div>
        <span
          style={{
            fontFamily: 'var(--font-data)',
            fontSize: '0.6rem',
            fontWeight: 700,
            color: 'var(--critical)',
            letterSpacing: '0.15em',
            textShadow: '0 0 8px rgba(220,38,38,0.5)',
            whiteSpace: 'nowrap',
          }}
        >
          BREAKING:
        </span>
      </div>

      {/* Right fade */}
      <div
        className="absolute right-0 top-0 bottom-0 z-10 w-16 pointer-events-none"
        style={{
          background: 'linear-gradient(270deg, rgba(10,14,23,1) 30%, transparent)',
        }}
      />

      {/* Scrolling content */}
      <div
        ref={containerRef}
        className="h-full flex items-center"
        style={{ paddingLeft: '108px' }}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <motion.span
          ref={contentRef}
          animate={controls}
          style={{
            display: 'inline-block',
            whiteSpace: 'nowrap',
            willChange: 'transform',
          }}
        >
          {articles.length > 0
            ? (tickerText + '     •     ' + tickerText).split('  •  ').map((segment, i) => {
                // Find which article this segment belongs to
                const articleIndex = i % articles.length
                const article = articles[articleIndex]
                return (
                  <span key={i}>
                    {i > 0 && (
                      <span
                        style={{
                          color: 'rgba(255,255,255,0.2)',
                          fontFamily: 'var(--font-data)',
                          fontSize: '0.65rem',
                          margin: '0 6px',
                        }}
                      >
                        •
                      </span>
                    )}
                    <span
                      className="cursor-pointer"
                      onClick={() => article && handleArticleClick(article)}
                      style={{
                        fontFamily: 'var(--font-data)',
                        fontSize: '0.65rem',
                        color: 'rgba(255,255,255,0.75)',
                        letterSpacing: '0.02em',
                        transition: 'color 0.15s',
                      }}
                      onMouseEnter={e => {
                        ;(e.target as HTMLSpanElement).style.color = 'var(--accent)'
                      }}
                      onMouseLeave={e => {
                        ;(e.target as HTMLSpanElement).style.color = 'rgba(255,255,255,0.75)'
                      }}
                    >
                      {segment.trim()}
                    </span>
                  </span>
                )
              })
            : (
              <span
                style={{
                  fontFamily: 'var(--font-data)',
                  fontSize: '0.65rem',
                  color: 'rgba(255,255,255,0.4)',
                  letterSpacing: '0.03em',
                }}
              >
                {fullText}
              </span>
            )}
        </motion.span>
      </div>
    </div>
  )
}
