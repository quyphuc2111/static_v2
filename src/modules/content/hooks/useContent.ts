import { useQuery } from "@tanstack/react-query"
import { listContent } from "../content.service"

export function useContent(projectId: string, moduleId: string, enabled = true) {
  return useQuery({
    queryKey: ["content", projectId, moduleId],
    queryFn: () => listContent(projectId, moduleId),
    enabled: enabled && !!projectId && !!moduleId,
    refetchInterval: (query) => {
      // Auto-refetch every 3 seconds if there are any processing items
      const hasProcessing = query.state.data?.some((item: any) => item.status === "PROCESSING")
      return hasProcessing ? 3000 : false
    },
    refetchIntervalInBackground: true,
  })
}
