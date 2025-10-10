import { useMutation, useQueryClient } from "@tanstack/react-query"
import { createContent } from "../content.service"
import { CreateContentPayload } from "../content.interface"
import { toast } from "react-toastify"

export function useCreateContent(projectId: string, moduleId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateContentPayload) => createContent(projectId, moduleId, payload),
    onSuccess: () => {
      toast.success("Tạo nội dung thành công")
      queryClient.invalidateQueries({ queryKey: ["content", projectId, moduleId] })
      queryClient.invalidateQueries({ queryKey: ["content", "stats"] })
    },
    onError: (e: any) => {
      if (e?.response?.status === 413) {
        toast.error("File quá lớn, vui lòng chọn file nhỏ hơn")
      } else if (e?.response?.status === 400) {
        toast.error(e?.response?.data?.message || "Dữ liệu không hợp lệ")
      } else {
        toast.error("Tạo nội dung thất bại")
      }
    },
  })
}
