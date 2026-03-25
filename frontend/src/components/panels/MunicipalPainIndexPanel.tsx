'use client'

import { useState } from 'react'
import { BarChart2 } from 'lucide-react'
import { CollapsiblePanel } from '@/components/ui/Panel'
import { useStore } from '@/store/useStore'
import type { Municipality } from '@/types'

const PAGE_SIZE = 10

type SortField = 'pain_score' | 'unemployment_rate' | 'no_piped_water_pct' | 'audit_score'
const SORT_LABELS: Record<SortField, string> = {
  pain_score: 'PAIN',
  unemployment_rate: 'UNEMP',
  no_piped_water_pct: 'WATER',
  audit_score: 'AUDIT',
}

function scoreColor(score: number): string {
  if (score > 7) return 'var(--critical)'
  if (score > 5) return 'var(--warning)'
  return 'var(--normal)'
}

function provinceAbbr(p: string): string {
  const map: Record<string, string> = {
    'Gauteng': 'GP', 'Western Cape': 'WC', 'KwaZulu-Natal': 'KZN',
    'Eastern Cape': 'EC', 'Free State': 'FS', 'Limpopo': 'LP',
    'Mpumalanga': 'MP', 'North West': 'NW', 'Northern Cape': 'NC',
  }
  return map[p] ?? p.slice(0, 3).toUpperCase()
}

export default function MunicipalPainIndexPanel() {
  const municipalities = useStore((s) => s.municipalities)
  const [sortBy, setSortBy] = useState<SortField>('pain_score')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)

  const filtered = municipalities.filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.province.toLowerCase().includes(search.toLowerCase())
  )

  const sorted = [...filtered].sort((a, b) => {
    const av = (a[sortBy] as number) ?? 0
    const bv = (b[sortBy] as number) ?? 0
    return sortDir === 'desc' ? bv - av : av - bv
  })

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE)
  const paginated = sorted.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE)

  const worst = sorted[0]

  function toggleSort(field: SortField) {
    if (sortBy === field) setSortDir((d) => d === 'desc' ? 'asc' : 'desc')
    else { setSortBy(field); setSortDir('desc'); setPage(0) }
  }

  return (
    <CollapsiblePanel
      icon={<BarChart2 size={11} />}
      title="MUNICIPAL PAIN INDEX"
      source="StatsSA"
      defaultOpen={false}
    >
      {/* Hero — worst municipality */}
      {worst && (
        <div className="hero-stat">
          <div style={{ flex: 1 }}>
            <div className="hero-label">WORST</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span className="hero-value" style={{ fontSize: 18, color: scoreColor(worst.pain_score) }}>
                {worst.name.toUpperCase()}
              </span>
              <span style={{ fontFamily: 'var(--font-data)', fontSize: 13, color: scoreColor(worst.pain_score) }}>
                {worst.pain_score.toFixed(1)}/10
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Sort tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--div)', height: 28 }}>
        {(Object.keys(SORT_LABELS) as SortField[]).map((field) => (
          <button
            key={field}
            type="button"
            onClick={() => toggleSort(field)}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              borderBottom: sortBy === field ? '1px solid var(--accent)' : '1px solid transparent',
              borderRight: '1px solid var(--div)',
              cursor: 'pointer',
              fontFamily: 'var(--font-data)',
              fontSize: 9,
              color: sortBy === field ? 'var(--t-value)' : 'var(--t-meta)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              paddingBottom: 0,
              marginBottom: -1,
              transition: 'color 0.1s',
            }}
          >
            {SORT_LABELS[field]}{sortBy === field ? (sortDir === 'desc' ? ' ↓' : ' ↑') : ''}
          </button>
        ))}
      </div>

      {/* Search */}
      <div style={{ padding: '0', borderBottom: '1px solid var(--div)' }}>
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0) }}
          placeholder="Filter municipalities…"
          style={{
            width: '100%',
            background: 'transparent',
            border: 'none',
            outline: 'none',
            fontFamily: 'var(--font-data)',
            fontSize: 11,
            color: 'var(--t-label)',
            padding: '6px 12px',
          }}
        />
      </div>

      {/* List */}
      {paginated.length === 0 ? (
        <div className="data-row" style={{ justifyContent: 'center' }}>
          <span style={{ fontFamily: 'var(--font-data)', fontSize: 10, color: 'var(--t-meta)' }}>No results</span>
        </div>
      ) : (
        paginated.map((muni: Municipality, idx: number) => {
          const rank = page * PAGE_SIZE + idx + 1
          const score = muni.pain_score
          const color = scoreColor(score)
          const barW = Math.min((score / 10) * 100, 100)
          return (
            <div key={muni.id}>
              <div
                className="data-row"
                style={{
                  height: 32,
                  borderLeft: score > 7 ? '2px solid var(--critical)' : score > 5 ? '2px solid var(--warning)' : 'none',
                  paddingLeft: score > 5 ? 10 : 12,
                  background: score > 7 ? 'var(--critical-bg)' : score > 5 ? 'var(--warning-bg)' : 'transparent',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 0 }}>
                  <span style={{ fontFamily: 'var(--font-data)', fontSize: 9, color: 'var(--t-meta)', width: 18, textAlign: 'right', flexShrink: 0 }}>{rank}</span>
                  <span className="data-label" style={{ flex: 1 }}>{muni.name}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                  <span style={{ fontFamily: 'var(--font-data)', fontSize: 12, color, minWidth: 28, textAlign: 'right' }}>
                    {score.toFixed(1)}
                  </span>
                  <span style={{ fontFamily: 'var(--font-data)', fontSize: 9, color: 'var(--t-meta)', width: 24, textAlign: 'right' }}>
                    {provinceAbbr(muni.province)}
                  </span>
                </div>
              </div>
              {/* Score bar — 2px height */}
              <div style={{ height: 2, background: 'var(--div)' }}>
                <div style={{ height: '100%', width: `${barW}%`, background: color, transition: 'width 0.3s' }} />
              </div>
            </div>
          )
        })
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 12px', borderTop: '1px solid var(--div)' }}>
          <button
            type="button"
            disabled={page === 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            style={{ background: 'none', border: 'none', cursor: page === 0 ? 'default' : 'pointer', fontFamily: 'var(--font-data)', fontSize: 10, color: page === 0 ? 'var(--t-dim)' : 'var(--t-meta)' }}
          >
            ← prev
          </button>
          <span style={{ fontFamily: 'var(--font-data)', fontSize: 9, color: 'var(--t-meta)' }}>
            {page + 1} / {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages - 1}
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            style={{ background: 'none', border: 'none', cursor: page >= totalPages - 1 ? 'default' : 'pointer', fontFamily: 'var(--font-data)', fontSize: 10, color: page >= totalPages - 1 ? 'var(--t-dim)' : 'var(--t-meta)' }}
          >
            next →
          </button>
        </div>
      )}
    </CollapsiblePanel>
  )
}
