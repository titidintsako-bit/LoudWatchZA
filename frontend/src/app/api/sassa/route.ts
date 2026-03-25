import { NextResponse } from 'next/server'
import { SASSA_GRANTS } from '@/lib/constants'
import type { SASSAGrant } from '@/types'

export const revalidate = 3600

function getNextPayDate(payDay: number): Date {
  const today = new Date()
  const thisMonthPayDate = new Date(today.getFullYear(), today.getMonth(), payDay)
  if (today.getDate() >= payDay) {
    return new Date(today.getFullYear(), today.getMonth() + 1, payDay)
  }
  return thisMonthPayDate
}

function daysBetween(target: Date): number {
  const now = new Date()
  const diff = target.getTime() - now.getTime()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

export async function GET() {
  const grants: SASSAGrant[] = SASSA_GRANTS.map((g) => {
    const nextDate = getNextPayDate(g.payDay)
    return {
      type: g.type,
      amount: g.amount,
      nextPaymentDate: nextDate.toISOString().split('T')[0],
      daysUntil: daysBetween(nextDate),
    }
  })

  return NextResponse.json(
    { grants, hotline: '0800 60 10 11', website: 'https://www.sassa.gov.za' },
    {
      headers: { 'Cache-Control': 'public, s-maxage=3600' },
    },
  )
}
