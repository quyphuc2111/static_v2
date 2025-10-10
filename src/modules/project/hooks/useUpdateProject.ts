import { useMutation, useQueryClient } from "@tanstack/react-query"
import { updateProject } from "../project.service"
import { toast } from "react-toastify"

export function useUpdateProject(projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: { name: string }) => updateProject(projectId, payload),
    onSuccess: () => {
      toast.success("Cập nhật dự án thành công")
      queryClient.invalidateQueries({ queryKey: ["projects", "list"] })
      queryClient.invalidateQueries({ queryKey: ["projects", projectId] })
    },
    onError: (e: any) => {
      if (e?.response?.status === 409) {
        toast.error(e?.response?.data?.message || "Tên dự án đã tồn tại")
      } else {
        toast.error("Cập nhật dự án thất bại")
      }
    },
  })
}
