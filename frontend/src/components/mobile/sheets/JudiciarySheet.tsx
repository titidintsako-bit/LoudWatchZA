'use client'

import { useState, useEffect } from 'react'
import { Gavel, ExternalLink } from 'lucide-react'

interface Judgment {
  id: string
  title: string
  court: string
  date: string
  summary: string
  url: string
  category: string
}

const CATEGORY_COLOR: Record<string, string> = {
  corruption: 'var(--critical)',
  constitutional: 'var(--accent)',
  criminal: 'var(--warning)',
  civil: 'var(--text-secondary)',
}

export default function JudiciarySheet() {
  const [judgments, setJudgments] = useState<Judgment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/judiciary')
      .then((r) => r.json())
      .then((d) => setJudgments(d.judgments ?? []))
      .catch(() => setJudgments([]))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div style={{ padding: '40px 16px', textAlign: 'center' }}>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}>Loading judgments…</p>
      </div>
    )
  }

  return (
    <div>
      <div style={{ padding: '10px 16px 6px', display: 'flex', alignItems: 'center', gap: 6 }}>
        <Gavel size={12} style={{ color: 'var(--accent)' }} />
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
          RECENT JUDGMENTS
        </p>
      </div>

      {judgments.map((j) => {
        const color = CATEGORY_COLOR[j.category] ?? 'var(--text-muted)'
        return (
          <div key={j.id} style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <span style={{
                fontFamily: 'var(--font-mono)', fontSize: 8, color,
                background: `${color}18`, border: `1px solid ${color}44`,
                borderRadius: 4, padding: '1px 5px', textTransform: 'uppercase',
              }}>
                {j.category}
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--text-muted)' }}>{j.court}</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--text-muted)', marginLeft: 'auto' }}>{j.date}</span>
            </div>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 4, lineHeight: 1.3 }}>
              {j.title}
            </p>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.4 }}>
              {j.summary}
            </p>
            {j.url && j.url !== '#' && (
              <a
                href={j.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 6, fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--accent)', textDecoration: 'none' }}
              >
                Read judgment <ExternalLink size={10} />
              </a>
            )}
          </div>
        )
      })}
    </div>
  )
}
