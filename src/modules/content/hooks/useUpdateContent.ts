import { useMutation, useQueryClient } from "@tanstack/react-query"
import { updateContent } from "../content.service"
import { UpdateContentPayload } from "../content.interface"
import { toast } from "react-toastify"

export function useUpdateContent(projectId: string, moduleId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ contentId, payload }: { 
      contentId: string
      payload: UpdateContentPayload
    }) => updateContent(projectId, moduleId, contentId, payload),
    onSuccess: () => {
      toast.success("Cập nhật nội dung thành công")
      queryClient.invalidateQueries({ queryKey: ["content", projectId, moduleId] })
    },
    onError: (e: any) => {
      if (e?.response?.status === 400) {
        toast.error(e?.response?.data?.message || "Dữ liệu không hợp lệ")
      } else {
        toast.error("Cập nhật nội dung thất bại")
      }
    },
  })
}
