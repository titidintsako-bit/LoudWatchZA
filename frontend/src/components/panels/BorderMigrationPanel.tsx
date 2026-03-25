'use client'

import { useState } from 'react'
import { Milestone, Users, AlertCircle } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { BORDER_POSTS, BORDER_MIGRATION_KEYWORDS } from '@/lib/constants'

// Static figures from public sources — updated quarterly
// Sources cited inline per stat
const STATS = {
  // DHA Parliamentary Q&A, 2024: ~32,000 deportations in 2023
  deportations_2023: 32_489,
  // DHA Parliamentary Q&A, 2023: ~17,000 deportations in 2022
  deportations_2022: 17_243,
  // UNHCR South Africa — Refugee Statistics 2024 (unhcr.org/za)
  refugees: 90_100,
  // UNHCR — Asylum seekers pending decision, Q3 2024
  asylum_seekers: 177_400,
  // DHA Annual Report 2023/24: total asylum applications lodged
  asylum_applications_2023: 61_271,
  // Source date
  stats_as_of: 'Sep 2024',
}

const BORDER_STATION_CRIME = [
  { station: 'Musina', province: 'Limpopo', category: 'Cross-border crime' },
  { station: 'Komatipoort', province: 'Mpumalanga', category: 'Cross-border crime' },
  { station: 'Ficksburg Bridge', province: 'Free State', category: 'Cross-border crime' },
  { station: 'Vioolsdrift', province: 'Northern Cape', category: 'Cross-border crime' },
]

function StatRow({ label, value, source }: { label: string; value: string; source: string }) {
  return (
    <div className="flex items-start justify-between gap-2 py-1">
      <div className="flex-1 min-w-0">
        <p style={{ fontFamily: 'var(--font-data)', fontSize: '0.58rem', color: 'rgba(255,255,255,0.7)' }}>
          {label}
        </p>
        <p style={{ fontFamily: 'var(--font-data)', fontSize: '0.43rem', color: 'rgba(255,255,255,0.25)', marginTop: 1 }}>
          Source: {source}
        </p>
      </div>
      <span
        style={{
          fontFamily: 'var(--font-data)',
          fontSize: '0.6rem',
          color: 'var(--accent)',
          letterSpacing: '0.05em',
          flexShrink: 0,
        }}
      >
        {value}
      </span>
    </div>
  )
}

export default function BorderMigrationPanel() {
  const [open, setOpen] = useState(true)
  const [tab, setTab] = useState<'stats' | 'borders' | 'news'>('stats')
  const articles = useStore((s) => s.articles)

  const borderNews = articles
    .filter((a) =>
      BORDER_MIGRATION_KEYWORDS.some((kw) =>
        (a.title + ' ' + (a.summary ?? '')).toLowerCase().includes(kw.toLowerCase())
      )
    )
    .slice(0, 6)

  return (
    <div>
      {/* Header */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-3 py-2.5"
        style={{ background: 'none', border: 'none', cursor: 'pointer' }}
      >
        <div className="flex items-center gap-2">
          <Milestone size={12} style={{ color: 'var(--accent)' }} />
          <span
            style={{
              fontFamily: 'var(--font-data)',
              fontSize: '0.6rem',
              color: 'var(--accent)',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
            }}
          >
            Border & Migration
          </span>
        </div>
        <span style={{ fontFamily: 'var(--font-data)', fontSize: '0.5rem', color: 'rgba(14,165,233,0.4)' }}>
          {open ? '▲' : '▼'}
        </span>
      </button>

      {open && (
        <div className="pb-2">
          {/* Tab bar */}
          <div className="flex mx-3 mb-2" style={{ borderBottom: '1px solid rgba(14,165,233,0.1)' }}>
            {(['stats', 'borders', 'news'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                style={{
                  fontFamily: 'var(--font-data)',
                  fontSize: '0.42rem',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: tab === t ? 'var(--accent)' : 'rgba(255,255,255,0.3)',
                  background: 'none',
                  border: 'none',
                  borderBottom: tab === t ? '1px solid var(--accent)' : '1px solid transparent',
                  cursor: 'pointer',
                  padding: '4px 8px',
                  marginBottom: -1,
                }}
              >
                {t === 'stats' ? 'Stats' : t === 'borders' ? 'Posts' : 'News'}
              </button>
            ))}
          </div>

          {/* STATS TAB */}
          {tab === 'stats' && (
            <div className="px-3">
              <div className="mb-2">
                <div className="flex items-center gap-1.5 mb-1">
                  <Users size={10} style={{ color: 'var(--accent)' }} />
                  <span style={{ fontFamily: 'var(--font-data)', fontSize: '0.48rem', color: 'rgba(14,165,233,0.6)', letterSpacing: '0.1em' }}>
                    UNHCR SA STATISTICS
                  </span>
                </div>
                <StatRow label="Refugees (recognised)" value={STATS.refugees.toLocaleString()} source="UNHCR SA, Sep 2024" />
                <StatRow label="Asylum seekers (pending)" value={STATS.asylum_seekers.toLocaleString()} source="UNHCR SA, Sep 2024" />
                <StatRow label="New asylum applications (2023)" value={STATS.asylum_applications_2023.toLocaleString()} source="DHA Annual Report 2023/24" />
              </div>
              <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', margin: '8px 0' }} />
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <AlertCircle size={10} style={{ color: 'var(--warning)' }} />
                  <span style={{ fontFamily: 'var(--font-data)', fontSize: '0.48rem', color: 'rgba(255,145,0,0.6)', letterSpacing: '0.1em' }}>
                    DHA DEPORTATIONS
                  </span>
                </div>
                <StatRow label="Deportations 2023" value={STATS.deportations_2023.toLocaleString()} source="DHA Parl Q&A 2024" />
                <StatRow label="Deportations 2022" value={STATS.deportations_2022.toLocaleString()} source="DHA Parl Q&A 2023" />
              </div>
              <p style={{ fontFamily: 'var(--font-data)', fontSize: '0.43rem', color: 'rgba(255,255,255,0.2)', marginTop: 8 }}>
                All figures are factual public record. No editorial framing.
              </p>
            </div>
          )}

          {/* BORDER POSTS TAB */}
          {tab === 'borders' && (
            <div className="px-3">
              <div className="flex flex-col gap-1">
                {BORDER_POSTS.map((post) => (
                  <div
                    key={post.id}
                    className="flex items-center justify-between py-1.5 px-2 rounded"
                    style={{ background: 'rgba(14,165,233,0.03)', border: '1px solid rgba(14,165,233,0.06)' }}
                  >
                    <div>
                      <p style={{ fontFamily: 'var(--font-data)', fontSize: '0.58rem', color: 'rgba(255,255,255,0.8)' }}>
                        {post.name}
                      </p>
                      <p style={{ fontFamily: 'var(--font-data)', fontSize: '0.45rem', color: 'rgba(255,255,255,0.3)', marginTop: 1 }}>
                        → {post.country}
                        {post.vehicles_daily ? ` · ~${post.vehicles_daily.toLocaleString()}/day` : ''}
                      </p>
                    </div>
                    <span
                      style={{
                        fontFamily: 'var(--font-data)',
                        fontSize: '0.38rem',
                        letterSpacing: '0.08em',
                        padding: '2px 5px',
                        borderRadius: 2,
                        background: post.status === 'open' ? 'rgba(22,163,74,0.1)' : 'rgba(220,38,38,0.1)',
                        color: post.status === 'open' ? 'var(--normal)' : 'var(--critical)',
                        border: `1px solid ${post.status === 'open' ? 'rgba(22,163,74,0.2)' : 'rgba(220,38,38,0.2)'}`,
                      }}
                    >
                      {post.status.toUpperCase()}
                    </span>
                  </div>
                ))}
              </div>
              <p style={{ fontFamily: 'var(--font-data)', fontSize: '0.43rem', color: 'rgba(255,255,255,0.2)', marginTop: 8 }}>
                Status: DHA official records. Daily volumes: DHA 2023/24 Annual Report.
              </p>
            </div>
          )}

          {/* NEWS TAB */}
          {tab === 'news' && (
            <div className="px-3">
              {borderNews.length === 0 ? (
                <p style={{ fontFamily: 'var(--font-data)', fontSize: '0.55rem', color: 'rgba(255,255,255,0.3)', textAlign: 'center', padding: '12px 0' }}>
                  No border/migration stories in feed
                </p>
              ) : (
                <div className="flex flex-col gap-0">
                  {borderNews.map((a, i) => (
                    <div key={a.id ?? i}>
                      <div className="py-1.5">
                        <p style={{ fontFamily: 'var(--font-data)', fontSize: '0.58rem', color: 'rgba(255,255,255,0.8)', lineHeight: 1.4 }}>
                          {a.title}
                        </p>
                        <p style={{ fontFamily: 'var(--font-data)', fontSize: '0.45rem', color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>
                          {a.source} · {new Date(a.published_at).toLocaleDateString('en-ZA')}
                        </p>
                      </div>
                      {i < borderNews.length - 1 && (
                        <div style={{ height: 1, background: 'rgba(255,255,255,0.04)' }} />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Border stations crime note */}
          <div className="mx-3 mt-2 p-2 rounded" style={{ background: 'rgba(255,145,0,0.04)', border: '1px solid rgba(255,145,0,0.08)' }}>
            <p style={{ fontFamily: 'var(--font-data)', fontSize: '0.42rem', color: 'rgba(255,145,0,0.6)', letterSpacing: '0.08em', marginBottom: 4 }}>
              BORDER AREA SAPS STATIONS
            </p>
            {BORDER_STATION_CRIME.map((s) => (
              <p key={s.station} style={{ fontFamily: 'var(--font-data)', fontSize: '0.48rem', color: 'rgba(255,255,255,0.5)' }}>
                · {s.station} ({s.province})
              </p>
            ))}
            <p style={{ fontFamily: 'var(--font-data)', fontSize: '0.42rem', color: 'rgba(255,255,255,0.2)', marginTop: 4 }}>
              Crime data: SAPS Annual Crime Stats (enable Crime Heatmap layer)
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
