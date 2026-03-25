'use client'

import { useState, useEffect, useCallback } from 'react'

export type PushPermission = 'default' | 'granted' | 'denied' | 'unsupported'

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const base64url = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64url)
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)))
}

export function usePushNotifications() {
  const [permission, setPermission] = useState<PushPermission>('default')
  const [subscribed, setSubscribed] = useState(false)

  useEffect(() => {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      setPermission('unsupported')
      return
    }
    setPermission(Notification.permission as PushPermission)
  }, [])

  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return false

    try {
      const permission = await Notification.requestPermission()
      setPermission(permission as PushPermission)
      if (permission !== 'granted') return false

      const reg = await navigator.serviceWorker.ready
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      if (!vapidKey) {
        console.warn('[Push] NEXT_PUBLIC_VAPID_PUBLIC_KEY not set')
        return false
      }

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey).buffer as ArrayBuffer,
      })

      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sub.toJSON()),
      })

      setSubscribed(true)
      localStorage.setItem('lw_push_subscribed', '1')
      return true
    } catch (err) {
      console.error('[Push] Subscribe error:', err)
      return false
    }
  }, [])

  const unsubscribe = useCallback(async () => {
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (sub) {
        await sub.unsubscribe()
        await fetch('/api/push/subscribe', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        })
      }
      setSubscribed(false)
      localStorage.removeItem('lw_push_subscribed')
    } catch (err) {
      console.error('[Push] Unsubscribe error:', err)
    }
  }, [])

  // Check existing subscription
  useEffect(() => {
    if (localStorage.getItem('lw_push_subscribed')) setSubscribed(true)
  }, [])

  return { permission, subscribed, subscribe, unsubscribe }
}
