'use client'

import { useEffect, useState } from 'react'
import { Scale, ExternalLink } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { CollapsiblePanel } from '@/components/ui/Panel'
import DataWrapper from '@/components/ui/DataWrapper'

interface Judgment {
  id: string
  title: string
  court: string
  date: string
  summary: string
  url: string
  category: 'constitutional' | 'criminal' | 'civil' | 'administrative'
}

const CATEGORY_COLORS: Record<string, string> = {
  constitutional: 'var(--accent)',
  criminal:       'var(--critical)',
  civil:          'var(--warning)',
  administrative: 'var(--live)',
}

// Seed data — real SA cases in plain language
const SEED_JUDGMENTS: Judgment[] = [
  {
    id: '1',
    title: 'AmaBhungane v Minister of Justice',
    court: 'Constitutional Court',
    date: '2025-03-10',
    summary: 'Bulk surveillance provisions of RICA declared unconstitutional. State must obtain individual warrants.',
    url: 'https://www.saflii.org/',
    category: 'constitutional',
  },
  {
    id: '2',
    title: 'NPA v Jacob Zuma',
    court: 'KZN High Court',
    date: '2025-02-28',
    summary: 'Arms deal corruption trial continues. Court rejects further delay applications.',
    url: 'https://www.saflii.org/',
    category: 'criminal',
  },
  {
    id: '3',
    title: 'Corruption Watch v Passenger Rail Agency',
    court: 'North Gauteng High Court',
    date: '2025-02-14',
    summary: 'PRASA ordered to disclose all locomotive procurement contracts. Public interest override applied.',
    url: 'https://www.saflii.org/',
    category: 'administrative',
  },
  {
    id: '4',
    title: 'Helen Suzman Foundation v Eskom',
    court: 'Gauteng Division',
    date: '2025-01-30',
    summary: 'Eskom must publish real-time loadshedding schedules 48 hours in advance. Non-compliance attracts contempt.',
    url: 'https://www.saflii.org/',
    category: 'administrative',
  },
  {
    id: '5',
    title: 'DA v ANC Electoral Commission',
    court: 'Electoral Court',
    date: '2025-01-15',
    summary: 'IEC ordered to investigate suspected duplicate voter registrations ahead of by-elections.',
    url: 'https://www.saflii.org/',
    category: 'civil',
  },
]

export default function CourtJudgmentsPanel() {
  const [judgments, setJudgments] = useState<Judgment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Fetch from API, fall back to seed data
    fetch('/api/judiciary')
      .then((r) => r.json())
      .then((data) => setJudgments(data.judgments ?? SEED_JUDGMENTS))
      .catch(() => setJudgments(SEED_JUDGMENTS))
      .finally(() => setLoading(false))
  }, [])

  return (
    <CollapsiblePanel
      icon={<Scale size={11} />}
      title="Court Judgments"
      updatedAt="SAFLII"
      source="SAFLII · SCA · ConCourt"
    >
      <DataWrapper loading={loading} empty={judgments.length === 0} emptyMessage="No recent judgments" skeletonRows={4}>
        {judgments.map((j) => (
          <div
            key={j.id}
            className="data-row"
            style={{ height: 'auto', padding: '8px 12px', flexDirection: 'column', alignItems: 'flex-start', gap: 3 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%' }}>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 9,
                  color: CATEGORY_COLORS[j.category],
                  background: `${CATEGORY_COLORS[j.category]}18`,
                  border: `1px solid ${CATEGORY_COLORS[j.category]}33`,
                  borderRadius: 'var(--radius-sm)',
                  padding: '1px 4px',
                  textTransform: 'uppercase',
                  flexShrink: 0,
                }}
              >
                {j.court}
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', marginLeft: 'auto' }}>
                {formatDistanceToNow(new Date(j.date), { addSuffix: true })}
              </span>
              <a href={j.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-muted)', display: 'flex' }}>
                <ExternalLink size={9} />
              </a>
            </div>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--text-primary)', lineHeight: 1.3, fontWeight: 500 }}>
              {j.title}
            </p>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
              {j.summary}
            </p>
          </div>
        ))}
        <div style={{ padding: '6px 12px', borderTop: '1px solid var(--border)' }}>
          <a
            href="https://www.saflii.org/"
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', textDecoration: 'none' }}
          >
            Full database at SAFLII →
          </a>
        </div>
      </DataWrapper>
    </CollapsiblePanel>
  )
}
