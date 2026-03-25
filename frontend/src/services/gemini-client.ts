/**
 * Gemini Flash client — edge-compatible via direct fetch.
 * Used for verification of HIGH/CRITICAL items from T3/T4 sources.
 *
 * Free tier: 15 req/min, 1M tokens/day — no credit card needed.
 * Get key at: aistudio.google.com
 */

const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent'

export interface GeminiVerificationResult {
  verified: boolean | null
  confidence: number
  flags: string[]
  recommendation: 'PUBLISH' | 'HOLD' | 'REJECT'
  reason: string
}

/**
 * Verify a HIGH/CRITICAL news item from a low-trust source.
 * Returns null if the API key is not configured or the call fails.
 */
export async function verifyWithGemini(
  title: string,
  sourceTier: string,
  category: string,
  severity: string,
): Promise<GeminiVerificationResult | null> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return null

  const prompt = `You are a South African news fact-checker for LoudWatch ZA.

Check this claim for accuracy and consistency with known facts about South Africa:

Headline: "${title}"
Source tier: ${sourceTier}
Claimed category: ${category}
Claimed severity: ${severity}

Questions:
1. Is this claim plausible given what is known about South Africa?
2. Are there red flags suggesting this is misinformation or sensationalism?
3. Is the severity rating appropriate?

Return ONLY valid JSON (no markdown, no explanation):
{
  "verified": true,
  "confidence": 0.85,
  "flags": [],
  "recommendation": "PUBLISH",
  "reason": "Consistent with known Eskom patterns"
}`

  try {
    const res = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0, maxOutputTokens: 200 },
      }),
      signal: AbortSignal.timeout(10_000),
    })

    if (!res.ok) return null

    const data = await res.json()
    const text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? ''

    // Strip markdown fences if present
    const clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    return JSON.parse(clean) as GeminiVerificationResult
  } catch {
    return null
  }
}

/**
 * Generate a plain-English daily brief using Gemini Flash.
 * Fallback for when Groq is rate-limited.
 */
export async function generateBriefWithGemini(
  headlines: string[],
  date: string,
): Promise<string | null> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return null

  const prompt = `You are an intelligence analyst briefing the South African public.
Write a 3-paragraph situation report for ${date} based on these headlines:

${headlines.slice(0, 15).map((h, i) => `${i + 1}. ${h}`).join('\n')}

Format: plain English, no bullet points, no markdown.
Focus: what is happening, what it means for ordinary South Africans, what to watch.
Length: 3 short paragraphs, 60 words each maximum.`

  try {
    const res = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 400 },
      }),
      signal: AbortSignal.timeout(15_000),
    })

    if (!res.ok) return null
    const data = await res.json()
    return data?.candidates?.[0]?.content?.parts?.[0]?.text ?? null
  } catch {
    return null
  }
}
