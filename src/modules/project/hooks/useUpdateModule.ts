import { useMutation, useQueryClient } from "@tanstack/react-query"
import { updateModule } from "../project.service"

export function useUpdateModule() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateModule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] })
    },
  })
}