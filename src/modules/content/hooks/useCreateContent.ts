import { useMutation, useQueryClient } from "@tanstack/react-query"
import { createContent } from "../content.service"
import { CreateContentPayload } from "../content.interface"
import { toast } from "react-toastify"
import { useEffect, useRef } from "react"

export function useCreateContent(projectId: string, moduleId: string) {
  const queryClient = useQueryClient()
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
      }
    }
  }, [])

  const stopPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
      pollingIntervalRef.current = null
    }
  }

  const startPolling = () => {
    // Clear any existing interval
    stopPolling()

    let pollCount = 0
    const maxPolls = 60 // 2 minutes (60 * 2 seconds)

    // Poll every 2 seconds to check for processing status updates
    pollingIntervalRef.current = setInterval(() => {
      // Check if interval should still be running
      if (!pollingIntervalRef.current) {
        return
      }

      pollCount++
      
      // Fetch fresh data and check status
      const queryKey = ["content", projectId, moduleId]
      queryClient.refetchQueries({ queryKey }).then(() => {
        // Double check if interval is still running before processing
        if (!pollingIntervalRef.current) {
          return
        }

        // Get the latest data from cache after refetch
        const data = queryClient.getQueryData(queryKey) as any
        
        // Data is either an array directly OR { data: array }
        const contentArray = Array.isArray(data) ? data : data?.data
        
        if (contentArray && Array.isArray(contentArray)) {
          const processingItems = contentArray.filter((item: any) => item.status === "PROCESSING")
          const hasProcessing = processingItems.length > 0
          
          // Stop polling if no content is processing
          if (!hasProcessing) {
            toast.success("Xử lý nội dung hoàn tất!")
            stopPolling()
            return
          }
        }
        
        // Safety: stop after max polls (2 minutes)
        if (pollCount >= maxPolls) {
          stopPolling()
        }
      })
    }, 2000)
  }

  return useMutation({
    mutationFn: (payload: CreateContentPayload) => createContent(projectId, moduleId, payload),
    onSuccess: (data) => {
      toast.success("Đang xử lý nội dung...")
      // Immediately refresh to show the new content with PROCESSING status
      queryClient.invalidateQueries({ queryKey: ["content", projectId, moduleId] })
      queryClient.invalidateQueries({ queryKey: ["content", "stats"] })
      
      // Start polling to get real-time progress updates
      startPolling()
    },
    onError: (e: any) => {
      if (e?.response?.status === 413) {
        toast.error("File quá lớn, vui lòng chọn file nhỏ hơn")
      } else if (e?.response?.status === 400) {
        toast.error(e?.response?.data?.message || "Dữ liệu không hợp lệ")
      } else if (e?.response?.status === 409) {
        toast.error(e?.response?.data?.error || "Tiêu đề đã tồn tại")
      } else {
        toast.error("Tạo nội dung thất bại")
      }
    },
  })
}
