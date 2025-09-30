import { useMutation, useQueryClient } from "@tanstack/react-query"
import { createModule } from "../project.service"
import { toast } from "react-toastify"

export function useCreateModule(projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (name: string) => createModule(projectId, name),
    onSuccess: () => {
      toast.success("Tạo module thành công")
      queryClient.invalidateQueries({ queryKey: ["projects", projectId, "modules"] })
      queryClient.invalidateQueries({ queryKey: ["projects", "list"] })
    },
    onError: (e: any) => {
      if (e?.response?.status === 409) {
        toast.error(e?.response?.data?.message || "Module đã tồn tại")
      } else {
        toast.error("Tạo module thất bại")
      }
    },
  })
}
