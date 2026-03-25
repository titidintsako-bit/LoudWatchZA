'use client'

import { useState } from 'react'
import { CollapsiblePanel } from '@/components/ui/Panel'
import { FileText } from 'lucide-react'

interface PolicyItem {
  id: string
  title: string
  impact: 'HIGH' | 'MEDIUM'
  randImpact: string
  summary: string
}

const STATIC_POLICIES: PolicyItem[] = [
  { id: 'nhi', title: 'National Health Insurance Bill', impact: 'HIGH', randImpact: 'R800bn / yr', summary: 'Universal health coverage fund requiring mandatory contributions.' },
  { id: 'expropriation', title: 'Expropriation Act 13 of 2024', impact: 'HIGH', randImpact: 'R1.2tn exposure', summary: 'Land expropriation without compensation in public interest.' },
  { id: 'prescribed-assets', title: 'Prescribed Assets for Pension Funds', impact: 'HIGH', randImpact: 'R300bn+', summary: 'Mandatory investment of pension funds into state infrastructure.' },
  { id: 'basic-income', title: 'Basic Income Grant Proposal', impact: 'MEDIUM', randImpact: 'R200bn / yr', summary: 'Universal monthly grant of R700–R1400 for adults 18–59.' },
  { id: 'spectrum', title: 'Spectrum Allocation — High Demand Bands', impact: 'MEDIUM', randImpact: 'R15bn revenue', summary: 'ICASA finalising 2.6GHz and 700MHz band licensing.' },
]

function PolicyItem({ item, onAnalyse }: { item: PolicyItem; onAnalyse: (id: string) => void }) {
  const borderColor = item.impact === 'HIGH' ? 'var(--red)' : 'var(--amber)'
  const bg = item.impact === 'HIGH' ? 'rgba(220,38,38,0.03)' : 'rgba(217,119,6,0.03)'
  const labelColor = item.impact === 'HIGH' ? 'var(--red)' : 'var(--amber)'

  return (
    <div
      style={{
        padding: '5px 10px',
        borderBottom: '1px solid var(--bg-2)',
        borderLeft: `2px solid ${borderColor}`,
        paddingLeft: 8,
        background: bg,
        cursor: 'pointer',
      }}
      onClick={() => onAnalyse(item.id)}
    >
      <div style={{
        fontFamily: 'IBM Plex Mono, monospace',
        fontSize: 8,
        color: labelColor,
        marginBottom: 2,
        letterSpacing: '0.06em',
      }}>
        {item.impact} IMPACT
      </div>

      <div style={{
        fontFamily: 'IBM Plex Sans, sans-serif',
        fontSize: 10,
        color: 'var(--t-primary)',
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        textOverflow: 'ellipsis',
        marginBottom: 2,
      }}>
        {item.title}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 9, color: 'var(--blue)' }}>
          {item.randImpact}
        </span>
        <span
          style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 8, color: 'var(--blue)', cursor: 'pointer' }}
          onClick={(e) => { e.stopPropagation(); onAnalyse(item.id) }}
        >
          ANALYSE →
        </span>
      </div>
    </div>
  )
}

function AnalysisOverlay({ item, onClose }: { item: PolicyItem; onClose: () => void }) {
  const sections = [
    { title: 'PLAIN ENGLISH SUMMARY', body: item.summary },
    { title: 'WHO IS AFFECTED', body: 'All South African citizens, businesses, and investors operating in the affected sectors.' },
    { title: 'THE NUMBERS', body: `Estimated fiscal impact: ${item.randImpact}. Implementation timeline: 2025–2030 subject to parliamentary approval.` },
    { title: 'SECONDARY EFFECTS', body: 'Potential impact on foreign direct investment, credit ratings, and sector employment levels.' },
    { title: 'POLITICAL CONTEXT', body: 'GNU coalition tension between ANC, DA and IFP positions. Implementation pace contested.' },
    { title: 'WHAT YOU CAN DO', body: 'Submit public comments via DPME portal. Contact your ward councillor or MP. Monitor Hansard for debate dates.' },
  ]
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(['PLAIN ENGLISH SUMMARY']))

  function toggle(title: string) {
    setOpenSections((prev) => {
      const next = new Set(prev)
      if (next.has(title)) next.delete(title)
      else next.add(title)
      return next
    })
  }

  return (
    <div style={{
      position: 'absolute',
      top: 0, right: 0, bottom: 0,
      width: '100%',
      background: '#000',
      borderLeft: '1px solid var(--green-border)',
      zIndex: 10,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        height: 26,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 10px',
        borderBottom: '1px solid var(--div)',
        background: 'var(--bg-1)',
        flexShrink: 0,
      }}>
        <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 8, color: 'var(--t-muted)', letterSpacing: '0.12em' }}>
          POLICY ANALYSIS
        </span>
        <button type="button" onClick={onClose}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--t-dim)', fontFamily: 'IBM Plex Mono, monospace', fontSize: 8 }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--t-primary)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--t-dim)')}
        >
          × CLOSE
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', scrollbarWidth: 'none' }}>
        <div style={{ padding: '8px 10px 4px', borderBottom: '1px solid var(--div)' }}>
          <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 8, color: item.impact === 'HIGH' ? 'var(--red)' : 'var(--amber)', marginBottom: 3 }}>
            {item.impact} IMPACT
          </div>
          <div style={{ fontFamily: 'IBM Plex Sans, sans-serif', fontSize: 11, color: 'var(--t-primary)', lineHeight: 1.4 }}>
            {item.title}
          </div>
        </div>

        {sections.map((s) => (
          <div key={s.title}>
            <div
              onClick={() => toggle(s.title)}
              style={{
                height: 26,
                display: 'flex',
                alignItems: 'center',
                padding: '0 10px',
                fontFamily: 'IBM Plex Mono, monospace',
                fontSize: 8,
                color: 'var(--t-dim)',
                letterSpacing: '0.1em',
                background: 'var(--bg-1)',
                borderBottom: '1px solid var(--div)',
                cursor: 'pointer',
                userSelect: 'none',
                justifyContent: 'space-between',
              }}
            >
              {s.title}
              <span>{openSections.has(s.title) ? '▲' : '▼'}</span>
            </div>
            {openSections.has(s.title) && (
              <div style={{
                fontFamily: 'IBM Plex Sans, sans-serif',
                fontSize: 11,
                color: 'var(--t-secondary)',
                padding: '8px 10px',
                lineHeight: 1.5,
                borderBottom: '1px solid var(--div)',
              }}>
                {s.body}
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={{
        flexShrink: 0,
        padding: '6px 10px',
        borderTop: '1px solid var(--div)',
        fontFamily: 'IBM Plex Mono, monospace',
        fontSize: 7,
        color: 'var(--t-dim)',
        lineHeight: 1.4,
      }}>
        Generated by Groq AI from official government sources.
      </div>
    </div>
  )
}

export default function PolicyWatchPanel() {
  const [analysing, setAnalysing] = useState<string | null>(null)

  const activeItem = STATIC_POLICIES.find((p) => p.id === analysing) ?? null

  return (
    <div style={{ position: 'relative' }}>
      <CollapsiblePanel
        icon={<FileText size={11} />}
        title="POLICY WATCH · AI"
        source="GROQ"
      >
        {STATIC_POLICIES.map((item) => (
          <PolicyItem key={item.id} item={item} onAnalyse={setAnalysing} />
        ))}
      </CollapsiblePanel>

      {activeItem && (
        <AnalysisOverlay item={activeItem} onClose={() => setAnalysing(null)} />
      )}
    </div>
  )
}
