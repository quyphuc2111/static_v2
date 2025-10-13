import { useMutation, useQueryClient } from "@tanstack/react-query"
import httpService from "@/services/instance"
import { toast } from "react-toastify"
import { useEffect, useRef } from "react"

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
            toast.success("Xử lý file hoàn tất!")
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
    mutationFn: ({ contentId, payload }: { contentId: string; payload: UpdateContentFilePayload }) =>
      updateContentFile(projectId, moduleId, contentId, payload),
    onSuccess: () => {
      toast.success("Đang xử lý file...")
      
      // Immediately refresh to show the updated content with PROCESSING status
      queryClient.invalidateQueries({ 
        queryKey: ["content", projectId, moduleId] 
      })
      queryClient.invalidateQueries({ 
        queryKey: ["content", "stats"] 
      })
      
      // Start polling to get real-time progress updates
      startPolling()
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
