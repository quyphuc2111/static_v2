import { useMutation, useQueryClient } from "@tanstack/react-query"
import { updateModule } from "../project.service"
import { toast } from "react-toastify"

export function useUpdateModule(projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => updateModule(projectId, id, name),
    onSuccess: () => {
      toast.success("Cập nhật module thành công")
      queryClient.invalidateQueries({ queryKey: ["projects", projectId, "modules"] })
    },
    onError: (e: any) => {
      if (e?.response?.status === 409) {
        toast.error(e?.response?.data?.message || "Module đã tồn tại")
      } else {
        toast.error("Cập nhật module thất bại")
      }
    },
  })
}
