import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useRef, useEffect } from "react"
import httpService from "@/services/instance"
import { toast } from "react-toastify"
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
  if (!payload.file) throw new Error("Không có file được chọn")
  if (payload.file.size === 0) throw new Error("File rỗng")
  if (payload.file.size > 1000 * 1024 * 1024) throw new Error("File quá lớn (tối đa 1000MB)")
  if (!payload.file.name.toLowerCase().endsWith('.zip')) throw new Error("Chỉ chấp nhận file ZIP")

  const formData = new FormData()
  formData.append("contentType", payload.contentType)
  formData.append("file", payload.file)

  return httpService.post<{ message: string; contentId: string }>({
    url: `projects/${projectId}/modules/${moduleId}/content/${contentId}/update-file`,
    data: formData,
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

export function useUpdateContentFile(projectId: string, moduleId: string) {
  const queryClient = useQueryClient()
  const timeoutsRef = useRef<NodeJS.Timeout[]>([])

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach(id => clearTimeout(id))
      timeoutsRef.current = []
    }
  }, [])

  return useMutation({
    mutationFn: ({ contentId, payload }: { contentId: string; payload: UpdateContentFilePayload }) =>
      updateContentFile(projectId, moduleId, contentId, payload),
    onSuccess: async () => {
      toast.success("Đang xử lý file...")
      await queryClient.invalidateQueries({
        queryKey: cachedKeys.content.list(projectId, moduleId)
      })
      await queryClient.invalidateQueries({
        queryKey: cachedKeys.content.stats(projectId)
      })
      // Background processing takes 2-10s. Schedule delayed re-invalidations
      // to catch when processing completes (polling hook handles long-running cases)
      const delays = [3000, 6000, 10000]
      delays.forEach(delay => {
        const id = setTimeout(() => {
          queryClient.invalidateQueries({ queryKey: cachedKeys.content.list(projectId, moduleId) })
          queryClient.invalidateQueries({ queryKey: cachedKeys.content.stats(projectId) })
        }, delay)
        timeoutsRef.current.push(id)
      })
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
        message = error.message
      }
      
      toast.error(message)
    }
  })
}
