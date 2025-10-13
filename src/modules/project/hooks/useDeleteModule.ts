import { useMutation, useQueryClient } from "@tanstack/react-query"
import { deleteModule } from "../project.service"

export function useDeleteModule() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteModule,
    onSuccess: () => {
      // Invalidate projects list query
      queryClient.invalidateQueries({ queryKey: ["projects", "list"] })
    },
  })
}