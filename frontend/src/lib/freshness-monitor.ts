/**
 * Data Freshness Monitor
 * Every data source has a maximum acceptable age before it's considered stale.
 * Used to drive amber/red staleness indicators on panel headers.
 */

export type FreshnessStatus = 'FRESH' | 'AGING' | 'STALE' | 'UNKNOWN'

const FRESHNESS_RULES = {
  loadshedding: { maxAgeMinutes: 15,    label: 'LOADSHEDDING STAGE' },
  news:         { maxAgeMinutes: 15,    label: 'NEWS FEED' },
  aircraft:     { maxAgeMinutes: 5,     label: 'AIRCRAFT DATA' },
  ships:        { maxAgeMinutes: 15,    label: 'SHIP DATA' },
  dams:         { maxAgeMinutes: 10080, label: 'DAM LEVELS' },    // 7 days
  markets:      { maxAgeMinutes: 30,    label: 'MARKET DATA' },
  protests:     { maxAgeMinutes: 1440,  label: 'PROTEST DATA' },  // 24 hours
  crime:        { maxAgeMinutes: 43200, label: 'CRIME STATS' },   // 30 days
  painIndex:    { maxAgeMinutes: 1440,  label: 'PAIN INDEX' },
  wanted:       { maxAgeMinutes: 10080, label: 'WANTED LIST' },
  exchange:     { maxAgeMinutes: 60,    label: 'EXCHANGE RATES' },
  petrol:       { maxAgeMinutes: 10080, label: 'PETROL PRICE' },
} as const

export type FreshnessSource = keyof typeof FRESHNESS_RULES

export function getFreshnessStatus(
  lastUpdated: Date | string | null | undefined,
  sourceType: FreshnessSource,
): FreshnessStatus {
  if (!lastUpdated) return 'UNKNOWN'

  const date = typeof lastUpdated === 'string' ? new Date(lastUpdated) : lastUpdated
  if (isNaN(date.getTime())) return 'UNKNOWN'

  const ageMinutes = (Date.now() - date.getTime()) / 60_000
  const maxAge = FRESHNESS_RULES[sourceType].maxAgeMinutes

  if (ageMinutes < maxAge * 0.5) return 'FRESH'
  if (ageMinutes < maxAge) return 'AGING'
  return 'STALE'
}

export function getFreshnessLabel(sourceType: FreshnessSource): string {
  return FRESHNESS_RULES[sourceType].label
}

/** Human-readable age string e.g. "3m ago", "2h ago", "4d ago" */
export function formatAge(lastUpdated: Date | string | null | undefined): string {
  if (!lastUpdated) return 'unknown'
  const date = typeof lastUpdated === 'string' ? new Date(lastUpdated) : lastUpdated
  if (isNaN(date.getTime())) return 'unknown'

  const ageMs = Date.now() - date.getTime()
  const mins = Math.floor(ageMs / 60_000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

/** CSS color for a freshness status */
export function freshnessColor(status: FreshnessStatus): string {
  switch (status) {
    case 'FRESH':   return 'var(--green)'
    case 'AGING':   return 'var(--amber)'
    case 'STALE':   return 'var(--red)'
    case 'UNKNOWN': return 'var(--t-muted)'
  }
}
