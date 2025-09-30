import { useMutation, useQueryClient } from "@tanstack/react-query"
import { bulkDeleteContent } from "../content.service"
import { CONTENT_API_URL } from "@/constants/apiUrl"

export function useBulkDeleteContent(projectId: string, moduleId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (contentIds: string[]) => 
      bulkDeleteContent(projectId, moduleId, contentIds),
    onSuccess: () => {
      // Invalidate and refetch content queries - use the same query key format as useContent
      queryClient.invalidateQueries({
        queryKey: ["content", projectId, moduleId]
      })
      
      // Invalidate content stats - use the same query key format as useContentStats
      queryClient.invalidateQueries({
        queryKey: ["content", "stats", projectId]
      })

      // Invalidate projects list to refresh project select
      queryClient.invalidateQueries({
        queryKey: ["projects", "list"]
      })

      // Invalidate modules list to refresh module select
      queryClient.invalidateQueries({
        queryKey: ["projects", projectId, "modules"]
      })
    },
  })
}
