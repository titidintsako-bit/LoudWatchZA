'use client'

import { TrendingUp } from 'lucide-react'
import { CollapsiblePanel } from '@/components/ui/Panel'
import { useStore } from '@/store/useStore'

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

// Fallback when trending data isn't loaded yet
const FALLBACK = [
  { topic: 'Loadshedding',     mentions: 8200, growth_pct: 12,  category: 'energy'  },
  { topic: 'Eskom',            mentions: 6100, growth_pct: 0,   category: 'energy'  },
  { topic: 'Service Delivery', mentions: 3800, growth_pct: 24,  category: 'protest' },
  { topic: 'Water Crisis',     mentions: 2100, growth_pct: -8,  category: 'water'   },
  { topic: 'Corruption',       mentions: 1900, growth_pct: 31,  category: 'corruption' },
]

export default function SocialPulsePanel() {
  const trending  = useStore((s) => s.trending)
  const setReport = useStore((s) => s.setReportOpen)

  const topics = trending?.topics?.slice(0, 5).map((t) => ({
    topic:      t.topic,
    mentions:   t.mentions,
    growth_pct: t.growth_pct,
    category:   t.category,
  })) ?? FALLBACK

  const maxMentions = Math.max(...topics.map((t) => t.mentions), 1)

  return (
    <CollapsiblePanel
      icon={<TrendingUp size={11} />}
      title="Social Pulse"
      live={!!trending}
      source={trending ? 'LoudWatch Trending' : 'Estimated'}
    >
      <div style={{ padding: '4px 0' }}>
        {topics.map((item) => {
          const barPct   = (item.mentions / maxMentions) * 100
          const catColor = CATEGORY_COLORS[item.category] ?? 'var(--text-muted)'
          const growthColor = item.growth_pct > 0 ? 'var(--live)' : item.growth_pct < 0 ? 'var(--critical)' : 'var(--text-muted)'
          const growthSign  = item.growth_pct > 0 ? '+' : ''

          return (
            <div key={item.topic} style={{ padding: '5px 12px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: catColor, flexShrink: 0, display: 'inline-block' }} />
                  <span style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: 'var(--text-primary)' }}>{item.topic}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)' }}>
                    {item.mentions.toLocaleString('en-ZA')}
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: growthColor }}>
                    {growthSign}{item.growth_pct}%
                  </span>
                </div>
              </div>
              <div style={{ height: 2, background: 'var(--bg-elevated)', borderRadius: 1 }}>
                <div style={{ height: '100%', width: `${barPct}%`, background: catColor, borderRadius: 1, opacity: 0.7, transition: 'width 0.5s ease' }} />
              </div>
            </div>
          )
        })}
      </div>

      <div style={{ padding: '8px 12px', borderTop: '1px solid var(--border)' }}>
        <button
          type="button"
          onClick={() => setReport(true)}
          style={{
            width: '100%', background: 'rgba(0,212,255,0.08)', border: '1px solid var(--border-active)',
            borderRadius: 'var(--radius-md)', color: 'var(--accent)', fontFamily: 'var(--font-mono)',
            fontSize: 10, padding: '6px', cursor: 'pointer', letterSpacing: '0.06em',
            transition: 'background 0.2s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(0,212,255,0.15)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(0,212,255,0.08)')}
        >
          + SUBMIT FIELD REPORT
        </button>
      </div>
    </CollapsiblePanel>
  )
}
