"use client"

import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"

/**
 * SSE hook lắng nghe event user bị vô hiệu hoá.
 * Khi nhận được event "user_disabled" → redirect về login ngay lập tức.
 */
export function useUserSSE(userId: string | number | undefined) {
  const eventSourceRef = useRef<EventSource | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const router = useRouter()

  useEffect(() => {
    if (!userId) return

    // Validate userId conversion
    const numericUserId = Number(userId)
    if (!Number.isFinite(numericUserId)) return

    let isMounted = true

    function connect() {
      if (!isMounted) return

      // Close existing EventSource before creating a new one
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
        eventSourceRef.current = null
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
        reconnectTimeoutRef.current = null
      }

      const es = new EventSource("/api/user-events")
      eventSourceRef.current = es

      es.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          if (data.type === "user_disabled" && Number(data.userId) === numericUserId) {
            // Force logout ngay lập tức
            es.close()
            eventSourceRef.current = null
            router.replace("/login?reason=disabled")
          }
        } catch {
          // Ignore parse errors (heartbeats)
        }
      }

      es.onerror = () => {
        es.close()
        eventSourceRef.current = null
        if (isMounted) {
          reconnectTimeoutRef.current = setTimeout(connect, 5000)
        }
      }
    }

    connect()

    return () => {
      isMounted = false
      eventSourceRef.current?.close()
      eventSourceRef.current = null
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
        reconnectTimeoutRef.current = null
      }
    }
  }, [userId, router])
}
