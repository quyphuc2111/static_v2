import { useMutation, useQueryClient } from "@tanstack/react-query"
import { deleteModule } from "../project.service"
import { toast } from "react-toastify"

export function useDeleteModule(projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (moduleId: string) => deleteModule(projectId, moduleId),
    onSuccess: () => {
      toast.success("Xóa module thành công")
      queryClient.invalidateQueries({ queryKey: ["projects", projectId, "modules"] })
      queryClient.invalidateQueries({ queryKey: ["projects", "list"] })
    },
    onError: () => {
      toast.error("Xóa module thất bại")
    },
  })
}
