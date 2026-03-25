'use client'

import { useEffect, useState } from 'react'
import { Brain } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { GlassCard } from '@/components/ui/GlassCard'
import DataWrapper from '@/components/ui/DataWrapper'
import { BACKEND_URL } from '@/lib/constants'

export default function SADailyBriefPanel() {
  const [content, setContent] = useState<string | null>(null)
  const [generatedAt, setGeneratedAt] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(false)

    fetch(`${BACKEND_URL}/api/ai-brief`)
      .then((r) => {
        if (!r.ok) throw new Error('Failed')
        return r.json()
      })
      .then((data) => {
        if (cancelled) return
        setContent(data.content ?? null)
        setGeneratedAt(data.generated_at ?? data.generatedAt ?? null)
        setLoading(false)
      })
      .catch(() => {
        if (cancelled) return
        setError(true)
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <GlassCard
      title="SA INTEL BRIEF"
      titleIcon={<Brain className="w-3.5 h-3.5" />}
      collapsible
      defaultOpen
    >
      <p className="text-[9px] font-fira text-[var(--critical)] mb-2 tracking-widest uppercase">
        CLASSIFICATION: UNCLASSIFIED // SA CIVIC
      </p>

      <DataWrapper
        loading={loading}
        error={error ? 'Brief unavailable — check back at 06:00 SAST' : null}
        empty={!content}
        emptyMessage="No brief available"
        skeletonRows={3}
      >
        <p className="font-inter text-xs text-[var(--t-value)] leading-relaxed whitespace-pre-line">
          {content}
        </p>
        {generatedAt && (
          <p className="text-[9px] font-fira text-[var(--normal)] mt-2">
            UPDATED:{' '}
            {(() => {
              try { return format(parseISO(generatedAt), 'HH:mm dd MMM') }
              catch { return generatedAt }
            })()}
          </p>
        )}
      </DataWrapper>
    </GlassCard>
  )
}
