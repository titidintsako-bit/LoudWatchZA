'use client'

import { Calendar } from 'lucide-react'
import { format, differenceInDays, addMonths, setDate, isBefore, startOfDay } from 'date-fns'
import { CollapsiblePanel } from '@/components/ui/Panel'
import { SASSA_GRANTS } from '@/lib/constants'

function getNextPayDate(payDay: number): Date {
  const today = startOfDay(new Date())
  let candidate = startOfDay(setDate(new Date(), payDay))
  if (isBefore(candidate, today)) candidate = startOfDay(setDate(addMonths(new Date(), 1), payDay))
  return candidate
}

function daysUntil(d: Date): number {
  return Math.max(0, differenceInDays(d, startOfDay(new Date())))
}

function urgencyColor(days: number): string {
  if (days <= 3) return 'var(--amber)'
  return 'var(--t-dim)'
}

export default function SASSAPanel() {
  return (
    <CollapsiblePanel
      icon={<Calendar size={11} />}
      title="SASSA GRANTS"
      source="sassa.gov.za"
    >
      {SASSA_GRANTS.map((grant) => {
        const nextDate = getNextPayDate(grant.payDay)
        const days     = daysUntil(nextDate)
        const color    = urgencyColor(days)

        return (
          <div key={grant.type} className="data-row" style={{ height: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flex: 1 }}>
              <span className="data-label">{grant.type}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
              <span style={{ fontFamily: 'var(--font-data)', fontSize: 11, color: 'var(--t-label)' }}>
                {format(nextDate, 'dd MMM')}
              </span>
              <span style={{ fontFamily: 'var(--font-data)', fontSize: 11, color, minWidth: 28, textAlign: 'right' }}>
                {days === 0 ? 'TODAY' : `${days}d`}
              </span>
            </div>
          </div>
        )
      })}

      <div className="data-row" style={{ height: 28 }}>
        <a
          href="tel:0800601011"
          style={{ fontFamily: 'var(--font-data)', fontSize: 10, color: 'var(--t-meta)', textDecoration: 'none' }}
        >
          0800 60 10 11
        </a>
        <a
          href="https://www.sassa.gov.za"
          target="_blank"
          rel="noopener noreferrer"
          style={{ fontFamily: 'var(--font-data)', fontSize: 10, color: 'var(--t-meta)', textDecoration: 'none' }}
        >
          sassa.gov.za →
        </a>
      </div>
    </CollapsiblePanel>
  )
}
