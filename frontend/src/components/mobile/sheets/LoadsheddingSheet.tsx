'use client'

import { useState } from 'react'
import { Zap, Search } from 'lucide-react'
import { useStore } from '@/store/useStore'

const STAGE_COLORS: Record<number, string> = {
  0: 'var(--live)',
  1: 'var(--warning)',
  2: 'var(--warning)',
  3: 'var(--critical)',
  4: 'var(--critical)',
  5: 'var(--critical)',
  6: 'var(--critical)',
}

export default function LoadsheddingSheet() {
  const loadshedding = useStore((s) => s.loadshedding)
  const [suburb, setSuburb] = useState('')
  const [schedule, setSchedule] = useState<null | { day: string; times: string[] }[]>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const stage = loadshedding?.stage ?? 0
  const stageColor = STAGE_COLORS[stage] ?? 'var(--critical)'
  const nextSlot = loadshedding?.next_change_at ?? null

  async function searchSuburb() {
    if (!suburb.trim()) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/loadshedding/schedule?suburb=${encodeURIComponent(suburb)}`)
      if (!res.ok) throw new Error('No schedule found')
      const data = await res.json()
      setSchedule(data.schedule ?? [])
    } catch {
      setError('Suburb not found. Try "Cape Town City Bowl" or "Sandton".')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      {/* Stage hero */}
      <div style={{ padding: '20px 16px 16px', textAlign: 'center', borderBottom: '1px solid var(--border)' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 10,
          background: `${stageColor}12`, border: `1px solid ${stageColor}44`,
          borderRadius: 12, padding: '12px 24px',
        }}>
          <Zap size={24} style={{ color: stageColor }} fill={stageColor} />
          <div>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 28, fontWeight: 700, color: stageColor, lineHeight: 1 }}>
              {stage === 0 ? 'NONE' : `STAGE ${stage}`}
            </p>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', marginTop: 4 }}>
              {stage === 0 ? 'No loadshedding' : 'Currently active'}
            </p>
          </div>
        </div>
        {nextSlot && (
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', marginTop: 10 }}>
            Next: <span style={{ color: 'var(--text-secondary)' }}>{nextSlot}</span>
          </p>
        )}
      </div>

      {/* Suburb search */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', marginBottom: 8, letterSpacing: '0.05em' }}>
          CHECK YOUR SUBURB SCHEDULE
        </p>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            value={suburb}
            onChange={(e) => setSuburb(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && searchSuburb()}
            placeholder="Enter suburb name..."
            style={{
              flex: 1, background: 'var(--bg-elevated)', border: '1px solid var(--border)',
              borderRadius: 8, padding: '8px 12px',
              fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-primary)',
              outline: 'none',
            }}
          />
          <button
            type="button"
            aria-label="Search suburb"
            onClick={searchSuburb}
            disabled={loading}
            style={{
              background: 'var(--accent)18', border: '1px solid var(--accent)44',
              borderRadius: 8, padding: '8px 12px', cursor: 'pointer',
              color: 'var(--accent)', display: 'flex', alignItems: 'center',
            }}
          >
            <Search size={14} />
          </button>
        </div>
        {error && <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--critical)', marginTop: 6 }}>{error}</p>}
      </div>

      {/* Schedule */}
      {schedule && (
        <div>
          {schedule.length === 0 ? (
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', padding: '16px', textAlign: 'center' }}>
              No outages scheduled this week
            </p>
          ) : (
            schedule.map((day) => (
              <div key={day.day} style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)' }}>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-secondary)', marginBottom: 6 }}>{day.day}</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {day.times.map((t) => (
                    <span key={t} style={{
                      fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--warning)',
                      background: 'var(--warning)12', border: '1px solid var(--warning)44',
                      borderRadius: 6, padding: '2px 8px',
                    }}>{t}</span>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Current info from API */}
      {loadshedding && (
        <div style={{ padding: '12px 16px' }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.05em', marginBottom: 8 }}>NATIONAL STATUS</p>
          {[
            { label: 'Eskom Stage', value: `Stage ${loadshedding.stage ?? 0}` },
            { label: 'Updated', value: loadshedding.updated_at ?? 'Just now' },
          ].map((row) => (
            <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)' }}>{row.label}</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-primary)' }}>{row.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
