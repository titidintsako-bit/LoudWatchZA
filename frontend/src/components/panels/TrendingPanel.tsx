'use client'

import { useState } from 'react'
import { TrendingUp, ChevronDown, ChevronRight, Flame, Globe } from 'lucide-react'
import { CollapsiblePanel } from '@/components/ui/Panel'
import { useStore } from '@/store/useStore'
import type { TrendingTopic } from '@/hooks/useTrending'

const SA_PROVINCES = [
  'Gauteng', 'Western Cape', 'KwaZulu-Natal', 'Eastern Cape',
  'Limpopo', 'Mpumalanga', 'North West', 'Free State', 'Northern Cape',
]

const CATEGORY_COLORS: Record<string, string> = {
  energy:      'var(--warning)',
  water:       'var(--accent)',
  crime:       'var(--critical)',
  corruption:  '#c9a84c',
  economy:     'var(--live)',
  politics:    '#9b8ec4',
  health:      '#e05c8a',
  education:   '#5ca8e0',
  protest:     'var(--critical)',
  environment: 'var(--live)',
  general:     'var(--text-muted)',
}

function sentimentColor(score: number): string {
  if (score > 0.1)  return 'var(--live)'
  if (score < -0.1) return 'var(--critical)'
  return 'var(--text-muted)'
}

function sentimentLabel(score: number): string {
  if (score > 0.2)  return 'POSITIVE'
  if (score > 0.05) return 'MILD+'
  if (score < -0.2) return 'NEGATIVE'
  if (score < -0.05)return 'MILD−'
  return 'NEUTRAL'
}

function GrowthBadge({ pct }: { pct: number }) {
  const color = pct > 50 ? 'var(--critical)' : pct > 0 ? 'var(--warning)' : 'var(--text-muted)'
  const sign  = pct > 0 ? '+' : ''
  return (
    <span style={{
      fontFamily: 'var(--font-mono)', fontSize: 9, color,
      background: `${color}18`, border: `1px solid ${color}33`,
      borderRadius: 'var(--radius-sm)', padding: '1px 4px', flexShrink: 0,
    }}>
      {sign}{pct}%
    </span>
  )
}

function TopicRow({ topic }: { topic: TrendingTopic }) {
  const [open, setOpen] = useState(false)
  const catColor = CATEGORY_COLORS[topic.category] ?? 'var(--text-muted)'

  return (
    <div style={{ borderBottom: '1px solid var(--border)' }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          width: '100%', background: 'none', border: 'none', cursor: 'pointer',
          padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 8,
          textAlign: 'left',
        }}
      >
        {/* Rank */}
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', width: 14, flexShrink: 0 }}>
          {topic.rank}
        </span>

        {/* Category dot */}
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: catColor, flexShrink: 0 }} />

        {/* Topic name */}
        <span style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--text-primary)', fontWeight: 500, flex: 1 }}>
          {topic.topic}
          {topic.is_new && (
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--live)', marginLeft: 5 }}>NEW</span>
          )}
        </span>

        {/* Growth */}
        <GrowthBadge pct={topic.growth_pct} />

        {/* Mentions */}
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-secondary)', width: 24, textAlign: 'right', flexShrink: 0 }}>
          {topic.mentions}
        </span>

        {/* Expand icon */}
        {topic.articles.length > 0
          ? (open ? <ChevronDown size={10} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                  : <ChevronRight size={10} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />)
          : <span style={{ width: 10 }} />
        }
      </button>

      {/* Expanded articles */}
      {open && topic.articles.length > 0 && (
        <div style={{ background: 'var(--bg-elevated)', padding: '4px 12px 6px 34px' }}>
          {topic.articles.map((a: { title: string; url: string; source: string }, i: number) => (
            <a
              key={i}
              href={a.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'block', fontFamily: 'var(--font-sans)', fontSize: 10,
                color: 'var(--text-secondary)', textDecoration: 'none', padding: '2px 0',
                borderBottom: i < topic.articles.length - 1 ? '1px solid var(--border)' : 'none',
              }}
            >
              {a.title}
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--text-muted)', marginLeft: 4 }}>
                {a.source}
              </span>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}

export default function TrendingPanel() {
  const trending = useStore((s) => s.trending)

  const topics         = trending?.topics ?? []
  const rising         = trending?.rising ?? []
  const provinceTopics = trending?.province_topics ?? {}
  const nationalSent   = trending?.sentiment_national ?? 0
  const provSentiment  = trending?.province_sentiment ?? {}
  const isLive         = trending?.is_live !== false // default true until we get a response

  const sentPct = Math.round(Math.abs(nationalSent) * 100)
  const sentPos = nationalSent >= 0

  return (
    <CollapsiblePanel
      icon={<TrendingUp size={11} />}
      title="Trending in SA"
      live={isLive}
      source={isLive ? 'RSS · Hourly' : 'OFFLINE · DEMO DATA'}
    >
      {/* ── Offline banner ── */}
      {!isLive && (
        <div style={{
          padding: '4px 10px',
          background: 'rgba(220,38,38,0.08)',
          borderBottom: '1px solid rgba(220,38,38,0.2)',
          fontFamily: 'IBM Plex Mono, monospace',
          fontSize: 8,
          color: 'var(--red)',
          letterSpacing: '0.06em',
        }}>
          ⚠ BACKEND OFFLINE — SHOWING DEMO DATA
        </div>
      )}

      {/* ── Top 10 ── */}
      <div style={{ padding: '4px 12px 3px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)' }}>TOPIC</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)' }}>GROWTH · MENTIONS</span>
      </div>

      {topics.length > 0
        ? topics.map((t) => <TopicRow key={t.rank} topic={t} />)
        : (
          <div style={{ padding: '12px', textAlign: 'center' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)' }}>Computing trends…</p>
          </div>
        )
      }

      {/* ── Rising Fast ── */}
      {rising.length > 0 && (
        <>
          <div style={{ padding: '5px 12px 3px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Flame size={10} style={{ color: 'var(--critical)' }} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--critical)', letterSpacing: '0.08em' }}>
              RISING FAST
            </span>
          </div>
          {rising.map((t) => (
            <div key={t.rank} style={{ padding: '4px 12px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: 'var(--text-primary)', flex: 1 }}>{t.topic}</span>
              <GrowthBadge pct={t.growth_pct} />
            </div>
          ))}
        </>
      )}

      {/* ── Province Trending ── */}
      <div style={{ padding: '5px 12px 3px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 6 }}>
        <Globe size={10} style={{ color: 'var(--accent)' }} />
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--accent)', letterSpacing: '0.08em' }}>
          BY PROVINCE
        </span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: 'var(--border)' }}>
        {SA_PROVINCES.map((prov) => {
          const data = provinceTopics[prov]
          const shortName = prov.split(' ')[0]
          const catColor = data ? (CATEGORY_COLORS[data.category] ?? 'var(--text-muted)') : 'var(--text-muted)'
          return (
            <div key={prov} style={{ background: 'var(--bg-surface)', padding: '5px 8px' }}>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--text-muted)', marginBottom: 2 }}>{shortName.toUpperCase()}</p>
              {data ? (
                <p style={{ fontFamily: 'var(--font-sans)', fontSize: 10, color: catColor, lineHeight: 1.2 }}>{data.topic}</p>
              ) : (
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)' }}>—</p>
              )}
            </div>
          )
        })}
      </div>

      {/* ── Weekly Sentiment ── */}
      <div style={{ padding: '5px 12px 3px', borderTop: '1px solid var(--border)' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.08em' }}>
          NATIONAL SENTIMENT
        </span>
      </div>
      <div style={{ padding: '4px 12px 8px' }}>
        {/* Bar */}
        <div style={{ height: 6, background: 'var(--bg-elevated)', borderRadius: 3, overflow: 'hidden', marginBottom: 6 }}>
          <div style={{
            height: '100%',
            width: `${sentPct}%`,
            background: sentPos ? 'var(--live)' : 'var(--critical)',
            borderRadius: 3,
            marginLeft: sentPos ? '50%' : `${50 - sentPct}%`,
            transition: 'width 0.5s ease',
          }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--critical)' }}>NEGATIVE</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: sentimentColor(nationalSent), fontWeight: 500 }}>
            {sentimentLabel(nationalSent)} ({nationalSent > 0 ? '+' : ''}{nationalSent.toFixed(2)})
          </span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--live)' }}>POSITIVE</span>
        </div>

        {/* Province sentiment table */}
        {Object.keys(provSentiment).length > 0 && (
          <div>
            {Object.entries(provSentiment)
              .sort(([, a], [, b]) => b - a)
              .map(([prov, score]) => (
                <div key={prov} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                  <span style={{ fontFamily: 'var(--font-sans)', fontSize: 10, color: 'var(--text-secondary)', flex: 1 }}>
                    {prov}
                  </span>
                  <div style={{ width: 60, height: 3, background: 'var(--bg-elevated)', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: `${Math.abs(score) * 100}%`,
                      background: sentimentColor(score),
                      borderRadius: 2,
                    }} />
                  </div>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: sentimentColor(score), width: 36, textAlign: 'right' }}>
                    {score > 0 ? '+' : ''}{score.toFixed(2)}
                  </span>
                </div>
              ))}
          </div>
        )}
      </div>
    </CollapsiblePanel>
  )
}
