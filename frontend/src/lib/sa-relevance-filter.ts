/**
 * SA Relevance Filter
 * Runs BEFORE any AI processing.
 * If an article fails this filter it never enters the pipeline at all.
 *
 * T1 sources always pass — they are SA-focused by definition.
 * Everything else must contain at least one SA keyword.
 */

import { getSourceTier } from './sa-source-tiers'

const SA_REQUIRED_KEYWORDS = [
  // Country
  'south africa', 'south african', 'republic of south africa',

  // Cities
  'johannesburg', 'cape town', 'durban', 'pretoria', 'tshwane',
  'soweto', 'sandton', 'gqeberha', 'port elizabeth', 'bloemfontein',
  'polokwane', 'nelspruit', 'mbombela', 'kimberley', 'rustenburg',
  'east london', 'pietermaritzburg', 'george', 'stellenbosch',
  'paarl', 'worcester', 'upington', 'klerksdorp', 'witbank',

  // Provinces
  'gauteng', 'kwazulu-natal', ' kzn ', 'western cape', 'eastern cape',
  'limpopo', 'mpumalanga', 'north west', 'free state', 'northern cape',

  // Institutions & people
  'eskom', 'saps', ' anc ', ' da ', ' eff ', 'mk party',
  'ramaphosa', 'parliament', 'constitutional court', ' jse ',
  ' sarb ', 'sassa', ' npa ', ' agsa ', 'stats sa',
  'treasury', 'sandf', 'hawks', 'nsfas', 'transnet',
  'prasa', 'denel', 'rand water', 'city power',
  'zuma', 'motlanthe', 'motsoaledi', 'gordhan', 'sisulu',
  'mkhwebane', 'zondo', 'constitution hill',

  // SA-specific terms
  'loadshedding', 'load shedding', 'load-shedding',
  ' rand ', ' zar ', 'braai', 'ubuntu', 'bafana bafana',
  'springbok', 'proteas', 'amapiano', 'mzansi',
  'toyi-toyi', 'tenderpreneurs', 'cadre deployment',
  'service delivery', 'stage 2', 'stage 3', 'stage 4',
  'stage 5', 'stage 6', 'stage 1 loadshedding',
  'water outage', 'day zero', 'bus rapid transit',
  'brt ', 'metrobus', 'myciti', 'promenade',
]

export interface ArticleInput {
  title: string
  summary?: string
  sourceUrl: string
}

/**
 * Returns true if the article is relevant to South Africa.
 * T1 sources always pass. Others must match at least one keyword.
 */
export function isSouthAfricanContent(article: ArticleInput): boolean {
  const tier = getSourceTier(article.sourceUrl)

  // Official / wire sources are inherently SA-relevant
  if (tier === 'tier1') return true

  const text = (`${article.title} ${article.summary ?? ''}`).toLowerCase()
  return SA_REQUIRED_KEYWORDS.some((kw) => text.includes(kw))
}

/**
 * Scores how SA-relevant an article is (0–1).
 * Used to rank articles when deduplicating.
 */
export function saRelevanceScore(article: ArticleInput): number {
  const tier = getSourceTier(article.sourceUrl)
  if (tier === 'tier1') return 1.0
  if (tier === 'tier2') return 0.85

  const text = (`${article.title} ${article.summary ?? ''}`).toLowerCase()
  const matches = SA_REQUIRED_KEYWORDS.filter((kw) => text.includes(kw)).length
  const keywordScore = Math.min(matches / 3, 1) * 0.7 // up to 0.7 from keywords

  const tierBonus = tier === 'tier3' ? 0.15 : 0.05
  return Math.min(keywordScore + tierBonus, 1.0)
}
