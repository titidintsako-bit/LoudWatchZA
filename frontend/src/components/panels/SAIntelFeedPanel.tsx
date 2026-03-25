'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { Rss, X, Zap } from 'lucide-react'
import { formatDistanceToNow, parseISO } from 'date-fns'
import { CollapsiblePanel } from '@/components/ui/Panel'
import { useStore } from '@/store/useStore'
import { useRealtimeNews } from '@/hooks/useRealtimeNews'
import { classifyArticle, geolocateArticle, getCategoryColor, ALL_CATEGORIES } from '@/lib/news-classifier'
import { getTierConfig, getSourceTier } from '@/lib/sa-source-tiers'
import type { NewsArticle } from '@/types'
import type { NewsCategory } from '@/lib/news-classifier'

type Category = 'ALL' | NewsCategory

function sourceLabel(source: string): string {
  if (source.toLowerCase().includes('news24')) return 'NEWS24'
  if (source.toLowerCase().includes('maverick') || source.toLowerCase().includes('dmg')) return 'DAILY MAVERICK'
  if (source.toLowerCase().includes('sabc')) return 'SABC'
  if (source.toLowerCase().includes('iol')) return 'IOL'
  return source.toUpperCase().slice(0, 14)
}

function sourceColor(source: string): string {
  const s = source.toLowerCase()
  if (s.includes('news24')) return 'var(--accent)'
  if (s.includes('maverick') || s.includes('dmg')) return 'var(--t-label)'
  if (s.includes('sabc')) return 'var(--normal)'
  if (s.includes('iol')) return 'var(--warning)'
  return 'var(--t-meta)'
}

function safeTimeAgo(dateStr: string): string {
  try {
    const d = formatDistanceToNow(parseISO(dateStr))
    return d.replace('about ', '').replace(' minutes', 'm').replace(' minute', 'm')
      .replace(' hours', 'h').replace(' hour', 'h').replace(' days', 'd').replace(' day', 'd') + ' ago'
  } catch { return '—' }
}

// ── Surge detection ───────────────────────────────────────────────────────────
interface CategoryCounts { [cat: string]: number[] }
const SURGE_THRESHOLD = 3
const SURGE_KEY = 'sa_intel_surge_baseline'

function loadBaseline(): CategoryCounts {
  try { return JSON.parse(localStorage.getItem(SURGE_KEY) ?? '{}') } catch { return {} }
}
function saveBaseline(c: CategoryCounts) {
  try { localStorage.setItem(SURGE_KEY, JSON.stringify(c)) } catch {}
}
function detectSurges(articles: NewsArticle[], baseline: CategoryCounts): Set<string> {
  const surging = new Set<string>()
  const cutoff = Date.now() - 3_600_000
  const lastHour: Record<string, number> = {}
  for (const a of articles) {
    const cat = a.category ?? classifyArticle(a.title, a.summary).category ?? 'POLITICAL'
    if (new Date(a.published_at).getTime() >= cutoff) lastHour[cat] = (lastHour[cat] ?? 0) + 1
  }
  for (const [cat, count] of Object.entries(lastHour)) {
    const hist = baseline[cat] ?? []
    if (hist.length < 24) continue
    const avg = hist.reduce((s, n) => s + n, 0) / hist.length
    if (avg > 0 && count / avg >= SURGE_THRESHOLD) surging.add(cat)
  }
  return surging
}

// ── Breaking banner ───────────────────────────────────────────────────────────
function BreakingBanner({ title, source, url, onDismiss }: {
  title: string; source: string; url: string; onDismiss: () => void
}) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: 'block',
        background: 'var(--critical-bg)',
        borderBottom: '1px solid var(--critical-border)',
        borderLeft: '2px solid var(--critical)',
        padding: '7px 12px 7px 10px',
        textDecoration: 'none',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
        <span style={{
          fontFamily: 'var(--font-data)', fontSize: 9, color: 'var(--critical)',
          letterSpacing: '0.08em', flexShrink: 0, marginTop: 1,
        }}>
          BREAKING
        </span>
        <p style={{
          fontFamily: 'var(--font-ui)', fontSize: 12, color: 'var(--t-value)',
          lineHeight: 1.4, flex: 1, margin: 0,
        }}>
          {title}
        </p>
        <button
          type="button"
          aria-label="Dismiss"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDismiss() }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--t-meta)', padding: 0, flexShrink: 0 }}
        >
          <X size={11} />
        </button>
      </div>
      <div style={{ marginTop: 2, fontFamily: 'var(--font-data)', fontSize: 9, color: 'var(--t-meta)' }}>
        {source.toUpperCase()} · just now
      </div>
    </a>
  )
}

// ── Convergence badge config ───────────────────────────────────────────────────
const CONVERGENCE_CONFIG: Record<string, { label: string; color: string }> = {
  BREAKING:      { label: 'BREAKING',    color: 'var(--critical)' },
  CONFIRMED:     { label: 'CONFIRMED',   color: 'var(--normal)' },
  EMERGING:      { label: 'EMERGING',    color: 'var(--warning)' },
  SINGLE_SOURCE: { label: 'UNVERIFIED',  color: 'var(--t-dim)' },
  FILTERED:      { label: 'FILTERED',    color: 'var(--t-dim)' },
}

// ── Article row ───────────────────────────────────────────────────────────────
function ArticleRow({ article, surging }: { article: NewsArticle; surging: boolean }) {
  const classification = classifyArticle(article.title, article.summary)
  const cat = article.category ?? classification.category
  const catColor = getCategoryColor(cat)
  const sentiment = article.sentiment ?? 0
  const isBreaking = article.is_breaking ?? classification.is_breaking
  const geo = !article.province ? geolocateArticle(article.title, article.summary) : null
  const province = article.province ?? geo?.province ?? null

  // Intelligence quality signals
  const tier = article.source_tier ?? getSourceTier(article.url || article.source)
  const tierConfig = getTierConfig(tier)
  const convergence = article.convergence_status ?? (
    tier === 'tier1' || tier === 'tier2' ? 'CONFIRMED' : 'SINGLE_SOURCE'
  )
  const convergenceConfig = CONVERGENCE_CONFIG[convergence] ?? CONVERGENCE_CONFIG.SINGLE_SOURCE
  const isUnverified = convergence === 'SINGLE_SOURCE' || convergence === 'FILTERED'

  // Border: breaking = red, unverified = dim grey, otherwise transparent
  const borderColor = isBreaking
    ? 'var(--critical)'
    : isUnverified
      ? 'var(--div-strong)'
      : 'transparent'

  return (
    <a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: 'block',
        padding: '7px 12px',
        borderBottom: '1px solid var(--div)',
        borderLeft: `2px solid ${borderColor}`,
        paddingLeft: 10,
        textDecoration: 'none',
        background: 'transparent',
        transition: 'background 0.08s',
        opacity: isUnverified ? 0.82 : 1,
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-3)')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
    >
      {/* Meta row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3, flexWrap: 'wrap' }}>
        {/* Tier badge */}
        <span style={{
          fontFamily: 'var(--font-data)', fontSize: 8,
          color: tierConfig.color, letterSpacing: '0.06em',
          border: `1px solid ${tierConfig.color}44`,
          padding: '0 3px', borderRadius: 1, flexShrink: 0,
        }}>
          {tierConfig.label}
        </span>

        {/* Source name */}
        <span style={{
          fontFamily: 'var(--font-data)', fontSize: 9,
          color: isBreaking ? 'var(--critical)' : sourceColor(article.source),
          letterSpacing: '0.05em',
        }}>
          {sourceLabel(article.source)}
        </span>

        {/* Category */}
        {cat && (
          <span style={{ fontFamily: 'var(--font-data)', fontSize: 9, color: catColor, letterSpacing: '0.04em' }}>
            [{cat}{surging ? ' ↑' : ''}]
          </span>
        )}

        {/* Province */}
        {province && (
          <span style={{ fontFamily: 'var(--font-data)', fontSize: 9, color: 'var(--t-meta)' }}>
            {province}
          </span>
        )}

        {/* Time */}
        <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-data)', fontSize: 9, color: 'var(--t-meta)', flexShrink: 0 }}>
          {safeTimeAgo(article.published_at)}
        </span>
      </div>

      {/* Headline */}
      <p style={{
        fontFamily: 'var(--font-ui)', fontSize: 12,
        fontWeight: isUnverified ? 400 : 500,
        color: isUnverified ? 'var(--t-secondary)' : 'var(--t-value)',
        lineHeight: 1.4, margin: 0,
        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
      }}>
        {article.title}
        {isUnverified && <span style={{ color: 'var(--t-dim)', fontWeight: 400 }}> (unverified)</span>}
      </p>

      {/* Bottom row: convergence + sentiment */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 3 }}>
        <span style={{
          fontFamily: 'var(--font-data)', fontSize: 8,
          color: convergenceConfig.color, letterSpacing: '0.06em',
        }}>
          {convergenceConfig.label}
          {typeof article.source_count === 'number' && article.source_count > 1
            ? ` · ${article.source_count} sources`
            : ''}
        </span>
        <span style={{
          width: 4, height: 4, borderRadius: '50%', flexShrink: 0,
          background: sentiment > 0.1 ? 'var(--normal)' : sentiment < -0.1 ? 'var(--critical)' : 'var(--t-dim)',
        }} />
      </div>
    </a>
  )
}

// ── Main panel ────────────────────────────────────────────────────────────────
const TABS: Category[] = ['ALL', ...ALL_CATEGORIES]

export default function SAIntelFeedPanel() {
  const storeArticles = useStore((s) => s.articles)
  const [activeCat, setActiveCat] = useState<Category>('ALL')
  const [surges, setSurges] = useState<Set<string>>(new Set())
  const baselineRef = useRef<CategoryCounts>({})

  const { realtimeArticles, breakingAlert, dismissBreaking } = useRealtimeNews()

  const allArticles = useMemo(() => {
    const seen = new Set<string>()
    const merged: NewsArticle[] = []
    for (const a of [...realtimeArticles, ...storeArticles]) {
      if (!seen.has(a.id)) { seen.add(a.id); merged.push(a) }
    }
    return merged
  }, [realtimeArticles, storeArticles])

  useEffect(() => { baselineRef.current = loadBaseline() }, [])

  const updateSurges = useCallback(() => {
    setSurges(detectSurges(allArticles, baselineRef.current))
    const cutoff = Date.now() - 3_600_000
    const hourCounts: Record<string, number> = {}
    for (const a of allArticles) {
      const cat = a.category ?? classifyArticle(a.title, a.summary).category ?? 'POLITICAL'
      if (new Date(a.published_at).getTime() >= cutoff) hourCounts[cat] = (hourCounts[cat] ?? 0) + 1
    }
    const updated = { ...baselineRef.current }
    for (const [cat, count] of Object.entries(hourCounts)) {
      updated[cat] = [...(updated[cat] ?? []), count].slice(-168)
    }
    baselineRef.current = updated
    saveBaseline(updated)
  }, [allArticles])

  useEffect(() => {
    updateSurges()
    const id = setInterval(updateSurges, 300_000)
    return () => clearInterval(id)
  }, [updateSurges])

  useEffect(() => {
    if (surges.size === 0 || typeof window === 'undefined' || !('Notification' in window)) return
    if (Notification.permission !== 'granted') return
    new Notification('LoudWatch Surge Alert', {
      body: `News surge: ${[...surges].join(', ')}`,
      icon: '/icons/icon-192.png',
    })
  }, [surges])

  const filtered = allArticles
    .filter((a) => {
      if (activeCat === 'ALL') return true
      const cat = a.category ?? classifyArticle(a.title, a.summary).category
      return cat === activeCat
    })
    .slice(0, 20)

  return (
    <CollapsiblePanel
      icon={<Rss size={11} />}
      title="SA INTEL FEED"
      live
      count={allArticles.length}
      source="RSS"
    >
      {/* Breaking banner */}
      {breakingAlert && (
        <BreakingBanner
          title={breakingAlert.title}
          source={breakingAlert.source}
          url={breakingAlert.url}
          onDismiss={dismissBreaking}
        />
      )}

      {/* Surge row */}
      {surges.size > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6, padding: '0 12px',
          height: 26, borderBottom: '1px solid var(--div)',
          background: 'var(--warning-bg)',
        }}>
          <Zap size={9} style={{ color: 'var(--warning)', flexShrink: 0 }} />
          <span style={{ fontFamily: 'var(--font-data)', fontSize: 9, color: 'var(--warning)', letterSpacing: '0.06em' }}>
            SURGE:
          </span>
          {[...surges].map((cat) => (
            <span key={cat} style={{ fontFamily: 'var(--font-data)', fontSize: 9, color: 'var(--warning)' }}>
              {cat}
            </span>
          ))}
        </div>
      )}

      {/* Category tabs */}
      <div className="cat-tabs">
        {TABS.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setActiveCat(cat)}
            className={`cat-tab${activeCat === cat ? ' active' : ''}`}
            style={{ position: 'relative' }}
          >
            {cat}
            {cat !== 'ALL' && surges.has(cat) && (
              <span style={{
                position: 'absolute', top: 4, right: 2,
                width: 3, height: 3, borderRadius: '50%', background: 'var(--warning)',
              }} />
            )}
          </button>
        ))}
      </div>

      {/* Articles */}
      {filtered.length === 0 ? (
        <div className="data-row" style={{ justifyContent: 'center', height: 44 }}>
          <span style={{ fontFamily: 'var(--font-data)', fontSize: 10, color: 'var(--t-meta)' }}>
            No {activeCat !== 'ALL' ? activeCat.toLowerCase() + ' ' : ''}stories
          </span>
        </div>
      ) : (
        filtered.map((article) => (
          <ArticleRow
            key={article.id}
            article={article}
            surging={surges.has(article.category ?? '')}
          />
        ))
      )}
    </CollapsiblePanel>
  )
}
