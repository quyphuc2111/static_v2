import { useMutation, useQueryClient } from "@tanstack/react-query"
import { deleteModule } from "../project.service"

export function useDeleteModule() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteModule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] })
    },
  })
}