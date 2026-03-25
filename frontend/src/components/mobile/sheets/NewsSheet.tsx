'use client'

import { ExternalLink } from 'lucide-react'
import { useStore } from '@/store/useStore'
import type { NewsArticle } from '@/types'
import { formatDistanceToNow } from 'date-fns'

function sentimentColor(score: number): string {
  if (score > 0.2) return 'var(--live)'
  if (score < -0.2) return 'var(--critical)'
  return 'var(--text-muted)'
}

function sentimentLabel(score: number): string {
  if (score > 0.2) return '+'
  if (score < -0.2) return '−'
  return '·'
}

export default function NewsSheet() {
  const articles = (useStore((s) => s.articles) ?? []).slice(0, 20)

  return (
    <div>
      <div style={{ padding: '10px 16px 6px' }}>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
          INTEL FEED · LATEST {articles.length}
        </p>
      </div>

      {articles.map((a: NewsArticle) => {
        const color = sentimentColor(a.sentiment ?? 0)
        let timeAgo = ''
        try { timeAgo = formatDistanceToNow(new Date(a.published_at), { addSuffix: true }) } catch { timeAgo = '' }

        return (
          <a
            key={a.id}
            href={a.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'block', padding: '12px 16px', borderBottom: '1px solid var(--border)',
              textDecoration: 'none',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 14, color, flexShrink: 0, lineHeight: 1.3 }}>
                {sentimentLabel(a.sentiment ?? 0)}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 500, color: 'var(--text-primary)', lineHeight: 1.35, marginBottom: 4 }}>
                  {a.title}
                </p>
                {a.summary && (
                  <p style={{ fontFamily: 'var(--font-sans)', fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.4, marginBottom: 4,
                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {a.summary}
                  </p>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--text-muted)' }}>{a.source}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--border)' }}>·</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--text-muted)' }}>{timeAgo}</span>
                  <ExternalLink size={8} style={{ color: 'var(--text-muted)', marginLeft: 'auto' }} />
                </div>
              </div>
            </div>
          </a>
        )
      })}

      {articles.length === 0 && (
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', padding: '40px', textAlign: 'center' }}>
          Loading news feed…
        </p>
      )}
    </div>
  )
}
