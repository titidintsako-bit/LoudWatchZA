'use client'

import { useState } from 'react'
import { Layers } from 'lucide-react'
import { GlassCard } from '@/components/ui/GlassCard'
import { NeonBadge } from '@/components/ui/NeonBadge'
import { useStore } from '@/store/useStore'
import type { NewsArticle } from '@/types'

type NeonVariant = 'cyan' | 'green' | 'red' | 'amber' | 'purple' | 'grey'

const TOPIC_KEYWORDS: Record<string, string[]> = {
  LOADSHEDDING: ['loadshed', 'eskom', 'power cut'],
  'WATER CRISIS': ['water', 'dam', 'drought', 'day zero'],
  PROTESTS: ['protest', 'strike', 'march', 'unrest'],
  CRIME: ['crime', 'murder', 'robbery', 'hijack'],
  ECONOMY: ['rand', 'inflation', 'budget', 'unemployment'],
  GOVERNMENT: ['minister', 'parliament', 'cabinet', 'policy'],
}

const TOPIC_VARIANTS: Record<string, NeonVariant> = {
  LOADSHEDDING: 'amber',
  'WATER CRISIS': 'cyan',
  PROTESTS: 'red',
  CRIME: 'purple',
  ECONOMY: 'green',
  GOVERNMENT: 'grey',
}

function matchesTopic(article: NewsArticle, keywords: string[]): boolean {
  const text = `${article.title} ${article.summary ?? ''}`.toLowerCase()
  return keywords.some((kw) => text.includes(kw.toLowerCase()))
}

export default function LiveNewsClusterPanel() {
  const articles = useStore((s) => s.articles)
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set())

  function toggleTopic(topic: string) {
    setExpandedTopics((prev) => {
      const next = new Set(prev)
      if (next.has(topic)) {
        next.delete(topic)
      } else {
        next.add(topic)
      }
      return next
    })
  }

  const clusters = Object.entries(TOPIC_KEYWORDS)
    .map(([topic, keywords]) => {
      const matched = articles.filter((a) => matchesTopic(a, keywords))
      return { topic, keywords, articles: matched, count: matched.length }
    })
    .filter((c) => c.count >= 1)

  return (
    <GlassCard
      title="NEWS CLUSTERS"
      titleIcon={<Layers className="w-3.5 h-3.5" />}
      collapsible
    >
      {clusters.length === 0 ? (
        <p className="text-[var(--t-meta)] text-xs font-fira text-center py-3">
          No news clusters detected
        </p>
      ) : (
        <div className="space-y-0.5">
          {clusters.map(({ topic, articles: topicArticles, count }) => {
            const variant = TOPIC_VARIANTS[topic] ?? 'grey'
            const isExpanded = expandedTopics.has(topic)
            const displayArticles = topicArticles.slice(0, 5)

            return (
              <div key={topic}>
                <button
                  className="w-full flex items-center justify-between py-1.5 px-1 rounded hover:bg-white/5 transition-colors cursor-pointer"
                  onClick={() => toggleTopic(topic)}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="text-[9px] font-orbitron tracking-wider uppercase"
                      style={{
                        color:
                          variant === 'amber'
                            ? 'var(--warning)'
                            : variant === 'cyan'
                              ? 'var(--accent)'
                              : variant === 'red'
                                ? 'var(--critical)'
                                : variant === 'purple'
                                  ? '#7b2fff'
                                  : variant === 'green'
                                    ? 'var(--normal)'
                                    : 'var(--t-label)',
                      }}
                    >
                      {topic}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <NeonBadge variant={variant}>{count}</NeonBadge>
                    <span className="text-[var(--t-meta)] text-[9px]">{isExpanded ? '▲' : '▼'}</span>
                  </div>
                </button>

                {isExpanded && (
                  <div className="pl-2 pb-1 space-y-0.5">
                    {displayArticles.map((article) => (
                      <p
                        key={article.id}
                        className="text-[10px] text-[var(--t-label)] hover:text-[var(--t-value)] cursor-pointer transition-colors truncate py-0.5"
                        onClick={() => window.open(article.url, '_blank')}
                        title={article.title}
                      >
                        · {article.title}
                      </p>
                    ))}
                    {topicArticles.length > 5 && (
                      <p className="text-[8px] text-[var(--t-meta)] font-fira pl-2">
                        +{topicArticles.length - 5} more
                      </p>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </GlassCard>
  )
}
