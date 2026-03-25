/**
 * SA Source Tier Database
 * Classifies news sources by credibility for the intelligence quality system.
 *
 * T1 — Wire / Official: Primary sources, highest trust
 * T2 — Established SA Media: Verified independent journalism
 * T3 — Secondary SA Media: Mainstream but lower editorial standards
 * T4 — Aggregator / Unverified: Everything else
 */

export const SA_SOURCE_TIERS = {
  tier1: {
    label: 'T1',
    color: '#00e87a',
    description: 'Wire / Official',
    sources: [
      'sapa.org.za',
      'reuters.com',
      'apnews.com',
      'statssa.gov.za',
      'govgazette.co.za',
      'agsa.co.za',
      'resbank.co.za',
      'parliament.gov.za',
      'presidency.gov.za',
      'treasury.gov.za',
      'saps.gov.za',
      'npa.gov.za',
      'gov.za',
      'eskom.co.za',
      'nersa.org.za',
    ],
  },
  tier2: {
    label: 'T2',
    color: '#0ea5e9',
    description: 'Established SA Media',
    sources: [
      'dailymaverick.co.za',
      'amabhungane.org',
      'groundup.org.za',
      'news24.com',
      'timeslive.co.za',
      'businessday.co.za',
      'ewn.co.za',
      'sabcnews.com',
      'moneyweb.co.za',
      'businesslive.co.za',
      'fin24.com',
      'dailydispatch.co.za',
      'heraldlive.co.za',
      'pressreader.com',
    ],
  },
  tier3: {
    label: 'T3',
    color: '#d97706',
    description: 'Secondary SA Media',
    sources: [
      'iol.co.za',
      'citizen.co.za',
      'sowetanlive.co.za',
      'citypress.co.za',
      'mg.co.za',
      '702.co.za',
      'capetalk.co.za',
      'jacarandafm.com',
      'safm.co.za',
      'postonline.co.za',
      'netwerk24.com',
      'volksblad.com',
    ],
  },
  tier4: {
    label: 'T4',
    color: '#4a5568',
    description: 'Aggregator / Unverified',
    sources: [], // everything else
  },
} as const

export type SourceTier = keyof typeof SA_SOURCE_TIERS

function extractDomain(url: string): string {
  try {
    const hostname = new URL(url.startsWith('http') ? url : `https://${url}`).hostname
    return hostname.replace(/^www\./, '')
  } catch {
    return url.toLowerCase()
  }
}

export function getSourceTier(sourceUrl: string): SourceTier {
  const domain = extractDomain(sourceUrl)

  if (SA_SOURCE_TIERS.tier1.sources.some((s) => domain.includes(s))) return 'tier1'
  if (SA_SOURCE_TIERS.tier2.sources.some((s) => domain.includes(s))) return 'tier2'
  if (SA_SOURCE_TIERS.tier3.sources.some((s) => domain.includes(s))) return 'tier3'

  return 'tier4'
}

/** Return the tier config object for display (color, label, etc.) */
export function getTierConfig(tier: SourceTier) {
  return SA_SOURCE_TIERS[tier]
}
