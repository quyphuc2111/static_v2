import { useMutation, useQueryClient } from "@tanstack/react-query"
import { deleteModule } from "../project.service"
import cachedKeys from "@/constants/cachedKeys"

export function useDeleteModule() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteModule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cachedKeys.project.list() })
    },
  })
}