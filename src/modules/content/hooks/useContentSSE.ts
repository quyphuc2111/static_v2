"use client"

import { useEffect, useRef, useCallback } from "react"
import { useQueryClient } from "@tanstack/react-query"
import cachedKeys from "@/constants/cachedKeys"
import { toast } from "react-toastify"

interface ContentStatusEvent {
  type: "status_changed"
  contentId: number
  projectId: number
  moduleId: number
  status: string
  progress?: number
}

/**
 * SSE-based content status hook.
 * Connects to /api/content-events and listens for real-time status changes.
 * When content finishes processing (COMPLETED/FAILED), invalidates queries.
 */
export function useContentSSE(projectId: string, moduleId: string) {
  const queryClient = useQueryClient()
  const eventSourceRef = useRef<EventSource | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const invalidateContent = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: cachedKeys.content.list(projectId, moduleId),
    })
    queryClient.invalidateQueries({
      queryKey: cachedKeys.content.stats(projectId),
    })
  }, [projectId, moduleId, queryClient])

  useEffect(() => {
    if (!projectId || !moduleId) return

    let isMounted = true

    function connect() {
      if (!isMounted) return

      // Close existing connection before creating a new one
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
        eventSourceRef.current = null
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
        reconnectTimeoutRef.current = null
      }

      const es = new EventSource("/api/content-events")
      eventSourceRef.current = es

      es.onmessage = (event) => {
        try {
          const data: ContentStatusEvent = JSON.parse(event.data)

          // Only handle events for our project/module
          if (
            data.type === "status_changed" &&
            String(data.projectId) === projectId &&
            String(data.moduleId) === moduleId
          ) {
            // Content finished processing → invalidate queries
            if (data.status === "COMPLETED" || data.status === "FAILED") {
              if (data.status === "COMPLETED") {
                toast.success("Xử lý file hoàn tất!")
              } else {
                toast.error("Xử lý file thất bại!")
              }
              invalidateContent()
            }
          }
        } catch {
          // Ignore parse errors (heartbeats are comments, not data)
        }
      }

      es.onerror = () => {
        es.close()
        eventSourceRef.current = null
        // Reconnect after 5s
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
  }, [projectId, moduleId, invalidateContent])

  // Keep triggerFastPoll for backward compatibility — now just invalidates immediately
  const triggerFastPoll = useCallback(() => {
    invalidateContent()
  }, [invalidateContent])

  return { triggerFastPoll }
}
