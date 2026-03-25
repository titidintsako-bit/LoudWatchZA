import { useEffect, useRef, useState } from 'react'
import { useStore } from '@/store/useStore'
import { WS_URL } from '@/lib/constants'

export function useWebSocket() {
  const [connected, setConnected] = useState(false)
  const [lastMessage, setLastMessage] = useState<unknown>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectDelay = useRef(1000)
  const unmounted = useRef(false)

  const setLoadshedding = useStore((s) => s.setLoadshedding)
  const articles = useStore((s) => s.articles)
  const protests = useStore((s) => s.protests)
  const setArticles = useStore((s) => s.setArticles)
  const setProtests = useStore((s) => s.setProtests)

  useEffect(() => {
    if (!WS_URL || typeof window === 'undefined') return

    function connect() {
      if (unmounted.current) return
      try {
        const ws = new WebSocket(`${WS_URL}/ws/live`)
        wsRef.current = ws

        ws.onopen = () => {
          setConnected(true)
          reconnectDelay.current = 1000
        }

        ws.onmessage = (event) => {
          try {
            const payload = JSON.parse(event.data as string)
            setLastMessage(payload)
            if (payload.type === 'loadshedding') {
              setLoadshedding(payload.data)
            } else if (payload.type === 'news') {
              setArticles([payload.data, ...articles].slice(0, 50))
            } else if (payload.type === 'protest') {
              setProtests([payload.data, ...protests])
            }
          } catch {
            // Ignore malformed messages
          }
        }

        ws.onclose = () => {
          setConnected(false)
          if (!unmounted.current) {
            const delay = Math.min(reconnectDelay.current, 30_000)
            reconnectDelay.current = delay * 2
            setTimeout(connect, delay)
          }
        }

        ws.onerror = () => {
          ws.close()
        }
      } catch {
        // WS not available — backend may not be running
        setConnected(false)
      }
    }

    connect()

    return () => {
      unmounted.current = true
      wsRef.current?.close()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return { connected, lastMessage }
}
