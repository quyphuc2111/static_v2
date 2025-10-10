import { useMutation, useQueryClient } from "@tanstack/react-query"
import httpService from "@/services/instance"
import cachedKeys from "@/constants/cachedKeys"
import { toast } from "react-toastify"

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

  // Function to poll for completion
  const startPollingForCompletion = () => {
    const pollInterval = setInterval(async () => {
      try {
        // Refetch content data to check for completion
        await queryClient.refetchQueries({
          queryKey: cachedKeys.content.list(projectId, moduleId)
        })
        
        // Check if there are any processing items
        const contentData = queryClient.getQueryData(cachedKeys.content.list(projectId, moduleId)) as any[]
        const hasProcessing = contentData?.some((item: any) => item.status === "PROCESSING")
        
        if (!hasProcessing) {
          // No more processing items, stop polling
          clearInterval(pollInterval)
        }
      } catch (error) {
        console.error("Error polling for completion:", error)
        clearInterval(pollInterval)
      }
    }, 2000) // Poll every 2 seconds
    
    // Stop polling after 5 minutes to prevent infinite polling
    setTimeout(() => {
      clearInterval(pollInterval)
    }, 5 * 60 * 1000)
  }

  return useMutation({
    mutationFn: ({ contentId, payload }: { contentId: string; payload: UpdateContentFilePayload }) =>
      updateContentFile(projectId, moduleId, contentId, payload),
    onSuccess: () => {
      // Invalidate and refetch content data immediately
      queryClient.invalidateQueries({ 
        queryKey: cachedKeys.content.list(projectId, moduleId) 
      })
      queryClient.invalidateQueries({ 
        queryKey: cachedKeys.content.stats(projectId) 
      })
      
      // Force refetch to get updated data
      queryClient.refetchQueries({
        queryKey: cachedKeys.content.list(projectId, moduleId)
      })
      
      // Since API now updates status to COMPLETED immediately, no need for polling
      // startPollingForCompletion()
      
      toast.success("Cập nhật file thành công!")
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
