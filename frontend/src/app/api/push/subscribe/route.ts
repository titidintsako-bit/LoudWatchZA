import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
  : null

export async function POST(req: NextRequest) {
  try {
    const sub = await req.json()
    if (!sub?.endpoint) {
      return NextResponse.json({ error: 'Missing endpoint' }, { status: 400 })
    }

    if (supabase) {
      await supabase.from('push_subscriptions').upsert(
        { endpoint: sub.endpoint, p256dh: sub.keys?.p256dh, auth: sub.keys?.auth, subscription_json: sub },
        { onConflict: 'endpoint' }
      )
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[Push] Subscribe error:', err)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { endpoint } = await req.json()
    if (!endpoint) {
      return NextResponse.json({ error: 'Missing endpoint' }, { status: 400 })
    }

    if (supabase) {
      await supabase.from('push_subscriptions').delete().eq('endpoint', endpoint)
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[Push] Unsubscribe error:', err)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
