import { NextRequest, NextResponse } from 'next/server'
import { redis } from '@/lib/redis'
import { getSourceTier } from '@/lib/sa-source-tiers'
import { isSouthAfricanContent } from '@/lib/sa-relevance-filter'
import { verifyWithGemini } from '@/services/gemini-client'

export const runtime = 'edge'

interface ArticleInput {
  id: string
  title: string
  url: string
  source: string
  published_at: string
  summary?: string
  image_url?: string
}

interface EnrichedArticle {
  id: string
  category: string
  sentiment: number
  severity: 'low' | 'medium' | 'high'
  summary: string
  province: string | null
  municipality: string | null
  tags: string[]
  is_breaking: boolean
  source_tier: string
  convergence_status: string
  plain_summary: string | null
  verified: boolean | null
  verification_reason: string | null
  groq_confidence: number
  requires_verification: boolean
  is_sa_relevant: boolean
}

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'

// ── Instant keyword classifier (no API call) ─────────────────────────────────
const KEYWORD_RULES: Record<string, { keywords: string[]; severity: 'low' | 'medium' | 'high' }> = {
  LOADSHEDDING: {
    keywords: ['loadshedding', 'load shedding', 'load-shedding', 'eskom', 'stage 1', 'stage 2', 'stage 3', 'stage 4', 'stage 5', 'stage 6', 'power cut', 'power outage', 'blackout'],
    severity: 'high',
  },
  WATER: {
    keywords: ['water outage', 'water cut', 'dam level', 'day zero', 'drought', 'water restriction', 'rand water', 'water shortage', 'dws'],
    severity: 'high',
  },
  UNREST: {
    keywords: ['protest', 'march', 'strike', 'riot', 'shutdown', 'blockade', 'service delivery', 'toyi-toyi', 'burning', 'barricade'],
    severity: 'high',
  },
  CRIME: {
    keywords: ['murder', 'killed', 'arrested', 'robbery', 'hijacking', 'kidnap', 'stabbed', 'shot', 'convicted', 'saps', 'gang'],
    severity: 'medium',
  },
  POLITICAL: {
    keywords: ['anc', 'da ', 'eff ', 'mk party', 'ramaphosa', 'parliament', 'cabinet', 'minister', 'corruption', 'tender', 'cadre'],
    severity: 'medium',
  },
  ECONOMY: {
    keywords: ['rand', 'jse', 'inflation', 'interest rate', 'gdp', 'unemployment', 'budget', 'treasury', 'sarb', 'petrol', 'repo rate'],
    severity: 'medium',
  },
  JUDICIARY: {
    keywords: ['court', 'judgment', 'ruling', 'verdict', 'sentenced', 'convicted', 'constitutional court', 'npa', 'hawks', 'zondo'],
    severity: 'medium',
  },
}

function classifyInstant(title: string, summary: string): { category: string; severity: 'low' | 'medium' | 'high' } {
  const text = (`${title} ${summary}`).toLowerCase()
  let best: string | null = null
  let bestCount = 0
  let bestSeverity: 'low' | 'medium' | 'high' = 'low'

  for (const [cat, rules] of Object.entries(KEYWORD_RULES)) {
    const count = rules.keywords.filter((kw) => text.includes(kw)).length
    if (count > bestCount) {
      bestCount = count
      best = cat
      bestSeverity = rules.severity
    }
  }

  return { category: best ?? 'GENERAL', severity: bestSeverity }
}

// Simple hash — edge-safe
async function titleHash(title: string): Promise<string> {
  const encoded = new TextEncoder().encode(title.toLowerCase().trim())
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoded)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('').slice(0, 16)
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'GROQ_API_KEY not configured' }, { status: 503 })
  }

  let body: ArticleInput
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { id, title, url, source, published_at: _published_at, summary: rawSummary } = body
  if (!title || !url) {
    return NextResponse.json({ error: 'title and url required' }, { status: 400 })
  }

  // ── Stage 0: SA relevance gate ─────────────────────────────────────────────
  const sourceTier = getSourceTier(url || source)
  const isSARelevant = isSouthAfricanContent({ title, summary: rawSummary, sourceUrl: url || source })

  if (!isSARelevant) {
    // Reject non-SA content entirely — return a filter result, not an error
    return NextResponse.json({
      id,
      is_sa_relevant: false,
      source_tier: sourceTier,
      category: 'FILTERED',
      severity: 'low',
      sentiment: 0,
      summary: rawSummary ?? '',
      plain_summary: null,
      province: null,
      municipality: null,
      tags: [],
      is_breaking: false,
      convergence_status: 'FILTERED',
      verified: null,
      verification_reason: 'Not SA-relevant',
      groq_confidence: 0,
      requires_verification: false,
      cached: false,
    })
  }

  // ── Stage 1: Instant keyword classification (no API, synchronous) ──────────
  const instant = classifyInstant(title, rawSummary ?? '')

  // ── Check Redis dedup cache ────────────────────────────────────────────────
  const hash = await titleHash(title)
  const cacheKey = `classify:${hash}`

  if (redis) {
    try {
      const cached = await redis.get<EnrichedArticle>(cacheKey)
      if (cached) return NextResponse.json({ ...cached, id, cached: true })
    } catch { /* ignore */ }
  }

  // ── Stage 2: Groq async refinement ────────────────────────────────────────
  const prompt = `You are an intelligence analyst for LoudWatch ZA — South Africa's civic intelligence dashboard.

Classify this South African news article:
Title: "${title}"
Source: "${source}" (${SA_SOURCE_TIERS_LABEL[sourceTier] ?? sourceTier})
Snippet: "${rawSummary?.slice(0, 300) ?? ''}"

Return ONLY valid JSON (no markdown):
{
  "category": "LOADSHEDDING|WATER|CRIME|UNREST|POLITICAL|ECONOMY|JUDICIARY|HEALTH|TRANSPORT|POSITIVE|GENERAL",
  "sentiment": -1.0 to 1.0,
  "severity": "low|medium|high",
  "plain_summary": "One sentence, plain English — what happened and why it matters to SA citizens",
  "province": "SA province name or null",
  "municipality": "municipality name or null",
  "tags": ["up to 4 keywords"],
  "is_breaking": true or false,
  "confidence": 0.0 to 1.0,
  "requires_verification": true or false
}`

  try {
    const groqRes = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0,
        max_tokens: 300,
        response_format: { type: 'json_object' },
      }),
      signal: AbortSignal.timeout(8000),
    })

    if (!groqRes.ok) {
      const errText = await groqRes.text()
      return NextResponse.json({ error: `Groq error: ${groqRes.status} ${errText}` }, { status: 502 })
    }

    const groqData = await groqRes.json()
    const content = groqData.choices?.[0]?.message?.content ?? '{}'

    let parsed: Partial<{
      category: string; sentiment: number; severity: string; plain_summary: string
      province: string | null; municipality: string | null; tags: string[]
      is_breaking: boolean; confidence: number; requires_verification: boolean
    }>
    try { parsed = JSON.parse(content) } catch { parsed = {} }

    // Use Groq result only if confidence is high; otherwise fall back to instant
    const groqConfidence = typeof parsed.confidence === 'number' ? parsed.confidence : 0.5
    const useGroq = groqConfidence >= 0.6

    const category = (useGroq ? parsed.category : instant.category) ?? instant.category
    const severity = (useGroq
      ? (['low', 'medium', 'high'].includes(parsed.severity ?? '') ? parsed.severity : null)
      : instant.severity) as 'low' | 'medium' | 'high' ?? instant.severity

    // ── Stage 3: Gemini verification (HIGH severity from T3/T4 only) ─────────
    let verified: boolean | null = null
    let verificationReason: string | null = null

    const requiresVerification = parsed.requires_verification === true
      || (severity === 'high' && (sourceTier === 'tier3' || sourceTier === 'tier4'))

    if (requiresVerification && sourceTier !== 'tier1' && sourceTier !== 'tier2') {
      // T1/T2 sources are trusted — skip Gemini
      const verification = await verifyWithGemini(title, sourceTier, category, severity)
      if (verification) {
        verified = verification.verified
        verificationReason = verification.reason
        // Reject if Gemini flags it
        if (verification.recommendation === 'REJECT') {
          return NextResponse.json({
            id, is_sa_relevant: true, source_tier: sourceTier,
            category: 'FILTERED', severity: 'low', sentiment: 0,
            summary: '', plain_summary: null, province: null, municipality: null,
            tags: [], is_breaking: false, convergence_status: 'REJECTED',
            verified: false, verification_reason: verification.reason,
            groq_confidence: groqConfidence, requires_verification: true,
            cached: false,
          })
        }
      }
    } else if (sourceTier === 'tier1' || sourceTier === 'tier2') {
      verified = true
      verificationReason = 'TRUSTED_SOURCE'
    }

    // ── Assemble result ───────────────────────────────────────────────────────
    const convergenceStatus = getDefaultConvergenceStatus(sourceTier, verified)

    const enriched: EnrichedArticle = {
      id,
      category,
      sentiment: typeof parsed.sentiment === 'number' ? Math.max(-1, Math.min(1, parsed.sentiment)) : 0,
      severity,
      summary: parsed.plain_summary ?? rawSummary ?? '',
      province: parsed.province ?? null,
      municipality: parsed.municipality ?? null,
      tags: Array.isArray(parsed.tags) ? parsed.tags.slice(0, 4) : [],
      is_breaking: parsed.is_breaking === true,
      source_tier: sourceTier,
      convergence_status: convergenceStatus,
      plain_summary: parsed.plain_summary ?? null,
      verified,
      verification_reason: verificationReason,
      groq_confidence: groqConfidence,
      requires_verification: requiresVerification,
      is_sa_relevant: true,
    }

    if (redis) {
      try { await redis.set(cacheKey, enriched, { ex: 1800 }) } catch { /* ignore */ }
    }

    return NextResponse.json({ ...enriched, cached: false })
  } catch (err) {
    // Groq failed — return instant classification as fallback
    const fallback: EnrichedArticle = {
      id,
      category: instant.category,
      sentiment: 0,
      severity: instant.severity,
      summary: rawSummary ?? '',
      province: null,
      municipality: null,
      tags: [],
      is_breaking: false,
      source_tier: sourceTier,
      convergence_status: getDefaultConvergenceStatus(sourceTier, null),
      plain_summary: null,
      verified: sourceTier === 'tier1' || sourceTier === 'tier2' ? true : null,
      verification_reason: sourceTier === 'tier1' || sourceTier === 'tier2' ? 'TRUSTED_SOURCE' : null,
      groq_confidence: 0,
      requires_verification: false,
      is_sa_relevant: true,
    }
    console.error('[classify-article] Groq error, using instant fallback:', err instanceof Error ? err.message : err)
    return NextResponse.json({ ...fallback, cached: false })
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const SA_SOURCE_TIERS_LABEL: Record<string, string> = {
  tier1: 'Official/Wire',
  tier2: 'Established SA Media',
  tier3: 'Secondary SA Media',
  tier4: 'Unverified',
}

function getDefaultConvergenceStatus(
  sourceTier: string,
  verified: boolean | null,
): string {
  if (verified === false) return 'REJECTED'
  if (sourceTier === 'tier1') return 'CONFIRMED'
  if (sourceTier === 'tier2') return 'CONFIRMED'
  if (sourceTier === 'tier3') return 'EMERGING'
  return 'SINGLE_SOURCE'
}

// ── Batch endpoint ─────────────────────────────────────────────────────────────
export async function PUT(req: NextRequest) {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'GROQ_API_KEY not configured' }, { status: 503 })

  let articles: ArticleInput[]
  try {
    articles = await req.json()
    if (!Array.isArray(articles)) throw new Error('Expected array')
  } catch {
    return NextResponse.json({ error: 'Expected JSON array of articles' }, { status: 400 })
  }

  const batch = articles.slice(0, 10)
  const results = await Promise.allSettled(
    batch.map(async (article) => {
      const fakeReq = new Request('http://localhost/api/classify-article', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(article),
      })
      const res = await POST(fakeReq as NextRequest)
      return res.json()
    }),
  )

  const enriched = results
    .filter((r): r is PromiseFulfilledResult<EnrichedArticle> => r.status === 'fulfilled')
    .map((r) => r.value)
    .filter((a) => a.is_sa_relevant !== false) // drop non-SA items

  return NextResponse.json(enriched)
}
