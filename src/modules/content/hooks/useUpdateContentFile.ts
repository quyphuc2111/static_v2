import { useMutation, useQueryClient } from "@tanstack/react-query"
import httpService from "@/services/instance"
import { toast } from "react-toastify"
import { useEffect, useRef } from "react"
import cachedKeys from "@/constants/cachedKeys"

interface UpdateContentFilePayload {
  contentType: "FILE_ZIP_HTML" | "FILE_ZIP_SCORM"
  file: File
}

async function updateContentFile(
  projectId: string, 
  moduleId: string, 
  contentId: string, 
  payload: UpdateContentFilePayload
) {
  // Validate file
  if (!payload.file) {
    throw new Error("Không có file được chọn")
  }
  
  if (payload.file.size === 0) {
    throw new Error("File rỗng")
  }
  
  if (payload.file.size > 1000 * 1024 * 1024) { // 1000MB limit
    throw new Error("File quá lớn (tối đa 1000MB)")
  }
  
  if (!payload.file.name.toLowerCase().endsWith('.zip')) {
    throw new Error("Chỉ chấp nhận file ZIP")
  }

  // CSRF token should be available from httpService automatically
  // No need to call getMe() here as it can cause unnecessary refetches

  const formData = new FormData()
  formData.append("contentType", payload.contentType)
  formData.append("file", payload.file)

  const res = await httpService.post<{ message: string; contentId: string }>({ 
    url: `projects/${projectId}/modules/${moduleId}/content/${contentId}/update-file`,
    data: formData,
    headers: { 'Content-Type': 'multipart/form-data' }
  })
  
  return res
}

export function useUpdateContentFile(projectId: string, moduleId: string) {
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
      console.log(`🛑 [UPDATE FILE POLLING] Stopping polling...`)
      clearInterval(pollingIntervalRef.current)
      pollingIntervalRef.current = null
      console.log(`✅ [UPDATE FILE POLLING] Polling stopped successfully`)
    } else {
      console.log(`⚠️ [UPDATE FILE POLLING] stopPolling called but interval ref is already null`)
    }
  }

  const startPolling = () => {
    // Clear any existing interval
    stopPolling()

    let pollCount = 0
    let hasSeenProcessing = false // Track if we've seen PROCESSING status
    const maxPolls = 30 // 1 minutes (30 * 2 seconds)
    const maxPollsWithoutProcessing = 10 // 20 seconds (10 * 2 seconds) - if no PROCESSING seen, assume done

    console.log(`🔄 [UPDATE FILE POLLING] Started for project ${projectId}, module ${moduleId}`)

    // Poll every 2 seconds to check for processing status updates
    pollingIntervalRef.current = setInterval(() => {
      // Check if interval should still be running
      if (!pollingIntervalRef.current) {
        console.log(`⚠️ [UPDATE FILE POLLING] Interval ref is null, stopping`)
        return
      }

      pollCount++
      console.log(`🔄 [UPDATE FILE POLLING] Poll #${pollCount}/${maxPolls}`)
      
      // Fetch fresh data and check status
      const queryKey = cachedKeys.content.list(projectId, moduleId)
      console.log(`🔍 [UPDATE FILE POLLING] Refetching with key:`, queryKey)
      
      queryClient.refetchQueries({ queryKey }).then(() => {
        // Double check if interval is still running before processing
        if (!pollingIntervalRef.current) {
          console.log(`⚠️ [UPDATE FILE POLLING] Interval ref is null after refetch, stopping`)
          return
        }

        // Get the latest data from cache after refetch
        const data = queryClient.getQueryData(queryKey) as any
        console.log(`📦 [UPDATE FILE POLLING] Data from cache:`, data)
        
        // Data is either an array directly OR { data: array }
        const contentArray = Array.isArray(data) ? data : data?.data
        console.log(`📋 [UPDATE FILE POLLING] Content array:`, contentArray)
        
        if (contentArray && Array.isArray(contentArray)) {
          const processingItems = contentArray.filter((item: any) => item.status === "PROCESSING")
          const hasProcessing = processingItems.length > 0
          
          console.log(`📊 [UPDATE FILE POLLING] Processing items: ${processingItems.length}, hasSeenProcessing: ${hasSeenProcessing}`)
          
          // Track if we've seen PROCESSING
          if (hasProcessing) {
            hasSeenProcessing = true
            console.log(`✅ [UPDATE FILE POLLING] Detected PROCESSING status, flag set to true`)
          }
          
          // Only stop polling if we've seen PROCESSING and now there's none
          if (hasSeenProcessing && !hasProcessing) {
            console.log(`🎉 [UPDATE FILE POLLING] Processing complete! Stopping polling`)
            toast.success("Xử lý file hoàn tất!")
            stopPolling()
            return
          }
          
          // If we haven't seen PROCESSING after maxPollsWithoutProcessing, assume it's done
          if (!hasSeenProcessing && pollCount >= maxPollsWithoutProcessing) {
            console.log(`⚡ [UPDATE FILE POLLING] No PROCESSING status detected after ${maxPollsWithoutProcessing} polls (${maxPollsWithoutProcessing * 2}s). Assuming processing is already complete or very fast.`)
            toast.success("Xử lý file hoàn tất!")
            stopPolling()
            return
          }
        } else {
          console.log(`⚠️ [UPDATE FILE POLLING] No valid content array found`)
        }
        
        // Safety: stop after max polls (2 minutes)
        if (pollCount >= maxPolls) {
          console.log(`⏱️ [UPDATE FILE POLLING] Reached max polls (${maxPolls}), stopping`)
          stopPolling()
        }
      })
    }, 2000)
  }

  return useMutation({
    mutationFn: ({ contentId, payload }: { contentId: string; payload: UpdateContentFilePayload }) =>
      updateContentFile(projectId, moduleId, contentId, payload),
    onSuccess: async () => {
      console.log(`🚀 [UPDATE FILE] Upload successful, starting processing...`)
      toast.success("Đang xử lý file...")
      
      // Invalidate and wait for refetch to complete
      console.log(`🔄 [UPDATE FILE] Invalidating queries...`)
      await queryClient.invalidateQueries({ 
        queryKey: cachedKeys.content.list(projectId, moduleId) 
      })
      await queryClient.invalidateQueries({ 
        queryKey: cachedKeys.content.stats(projectId) 
      })
      console.log(`✅ [UPDATE FILE] Queries invalidated`)
      
      // Wait a bit to ensure backend has started processing
      console.log(`⏳ [UPDATE FILE] Waiting 1s before starting polling...`)
      setTimeout(() => {
        console.log(`🎬 [UPDATE FILE] Starting polling now...`)
        // Start polling to get real-time progress updates
        startPolling()
      }, 1000)
    },
    onError: (error: any) => {
      console.error("Update content file error:", error)
      
      let message = "Lỗi khi cập nhật file"
      
      if (error?.response?.status === 500) {
        message = "Lỗi server: " + (error?.response?.data?.error || "Internal Server Error")
      } else if (error?.response?.status === 400) {
        message = "Dữ liệu không hợp lệ: " + (error?.response?.data?.error || "Bad Request")
      } else if (error?.response?.status === 401) {
        message = "Không có quyền truy cập"
      } else if (error?.response?.status === 403) {
        message = "Bị cấm truy cập"
      } else if (error?.response?.status === 404) {
        message = "Không tìm thấy tài liệu"
      } else if (error?.response?.status === 409) {
        message = error?.response?.data?.error || "Tiêu đề đã tồn tại"
      } else if (error?.message) {
        // Check if it's a validation error from our new logic
        if (error.message.includes("File ZIP không chứa file HTML")) {
          message = error.message
        } else if (error.message.includes("Lỗi khi đọc file ZIP")) {
          message = error.message
        } else {
          message = error.message
        }
      }
      
      toast.error(message)
    }
  })
}
