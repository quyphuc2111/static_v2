"use client"

import { useEffect, useRef, useCallback } from "react"
import { useQueryClient } from "@tanstack/react-query"
import cachedKeys from "@/constants/cachedKeys"
import { toast } from "react-toastify"

interface ContentStatusItem {
  id: number
  status: string
  progress: number | null
  title: string
}

/**
 * Polling-based content status hook.
 * Replaces SSE (EventSource) which is blocked by Cloudflare's proxy.
 * 
 * Strategy:
 * - Poll for items with status=PROCESSING
 * - When items disappear from PROCESSING list (became COMPLETED/FAILED), invalidate queries
 * - Fast polling (3s) when items are processing, slow (15s) when idle
 */
export function useContentSSE(projectId: string, moduleId: string) {
  const queryClient = useQueryClient()
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const isPollingRef = useRef(false)
  const abortControllerRef = useRef<AbortController | null>(null)
  const pendingImmediateRef = useRef(false)
  // Track IDs that were in PROCESSING state on previous poll
  const processingIdsRef = useRef<Set<number>>(new Set())

  const POLL_INTERVAL_ACTIVE = 3000   // 3s when processing
  const POLL_INTERVAL_IDLE = 15000    // 15s idle check

  const pollStatus = useCallback(async () => {
    if (!projectId || !moduleId || isPollingRef.current) {
      if (isPollingRef.current) pendingImmediateRef.current = true
      return
    }
    isPollingRef.current = true

    // Create abort controller for this request
    const controller = new AbortController()
    abortControllerRef.current = controller

    try {
      const res = await fetch(
        `/api/content-status?projectId=${projectId}&moduleId=${moduleId}&statuses=PROCESSING`,
        { credentials: "include", signal: controller.signal }
      )

      if (controller.signal.aborted) return

      if (!res.ok) {
        if (res.status === 401) return
        console.warn("[content-poll] Status check failed:", res.status)
        return
      }

      const { data }: { data: ContentStatusItem[] } = await res.json()

      if (controller.signal.aborted) return

      const currentProcessingIds = new Set(data.map(item => item.id))
      const previousIds = processingIdsRef.current

      // Items that were PROCESSING before but are no longer → they completed or failed
      const finishedIds: number[] = []
      for (const id of previousIds) {
        if (!currentProcessingIds.has(id)) {
          finishedIds.push(id)
        }
      }

      // If any items finished processing, invalidate queries to refresh the content list
      if (finishedIds.length > 0 && !controller.signal.aborted) {
        toast.success("Xử lý file hoàn tất!")
        queryClient.invalidateQueries({
          queryKey: cachedKeys.content.list(projectId, moduleId),
        })
        queryClient.invalidateQueries({
          queryKey: cachedKeys.content.stats(projectId),
        })
      }

      // Update tracking
      processingIdsRef.current = currentProcessingIds
    } catch (error: any) {
      if (error?.name === "AbortError") return
      console.warn("[content-poll] Network error:", error)
    } finally {
      isPollingRef.current = false
      abortControllerRef.current = null

      // If a triggerFastPoll was called while we were polling, run again immediately
      if (pendingImmediateRef.current) {
        pendingImmediateRef.current = false
        pollStatus()
      }
    }
  }, [projectId, moduleId, queryClient])

  // Effect to manage polling interval based on processingIds
  useEffect(() => {
    if (!projectId || !moduleId) return

    // Start polling
    pollStatus()
    intervalRef.current = setInterval(pollStatus, POLL_INTERVAL_IDLE)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      // Abort any in-flight request
      abortControllerRef.current?.abort()
      abortControllerRef.current = null
      processingIdsRef.current.clear()
      pendingImmediateRef.current = false
    }
  }, [projectId, moduleId, pollStatus])

  // Expose manual trigger — call after upload/update to start fast polling
  const triggerFastPoll = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }
    // Switch to fast interval
    intervalRef.current = setInterval(pollStatus, POLL_INTERVAL_ACTIVE)
    // Trigger immediate poll (or queue if one is in progress)
    if (isPollingRef.current) {
      pendingImmediateRef.current = true
    } else {
      pollStatus()
    }
  }, [pollStatus])

  return { triggerFastPoll }
}
