import { NextRequest, NextResponse } from 'next/server'
import Groq from 'groq-sdk'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const category = formData.get('category') as string
    const description = formData.get('description') as string
    const location = formData.get('location') as string
    const anonymous = formData.get('anonymous') === 'true'

    if (!category || !description || description.trim().length < 20) {
      return NextResponse.json({ error: 'Invalid submission' }, { status: 400 })
    }

    const prompt = `You are an AI analyst for LoudWatch ZA, a South African civic intelligence platform.

Analyse this citizen-submitted intelligence report and respond with a JSON object only.

Category: ${category}
Description: ${description}
Location: ${location || 'Not specified'}
Anonymous: ${anonymous}

Respond with exactly this JSON structure (no markdown, no explanation):
{
  "relevance": <0-100 integer, how relevant this is to South African civic affairs>,
  "credibility": <0-100 integer, how credible the report seems based on detail and plausibility>,
  "sensitivity": <"low" | "medium" | "high">,
  "municipality": <best-guess South African municipality name, or "Unknown">,
  "summary": <1-2 sentence neutral summary of the report>,
  "published": <true if relevance >= 60 AND credibility >= 70, else false>
}`

    const completion = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
      max_tokens: 300,
    })

    const raw = completion.choices[0]?.message?.content?.trim() ?? ''

    // Strip markdown code fences if present
    const json = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
    const result = JSON.parse(json)

    return NextResponse.json(result)
  } catch (err) {
    console.error('[citizen-intel]', err)
    // Return a safe fallback so the UI still shows a result
    return NextResponse.json({
      relevance: 50,
      credibility: 40,
      sensitivity: 'medium',
      municipality: 'Unknown',
      summary: 'Your report has been received and queued for manual review.',
      published: false,
    })
  }
}
