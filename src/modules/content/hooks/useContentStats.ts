import { useQuery } from "@tanstack/react-query"
import { getContentStats } from "../content.service"

export function useContentStats(projectId?: string) {
  return useQuery({
    queryKey: ["content", "stats", projectId],
    queryFn: () => getContentStats(projectId),
    refetchInterval: (query) => {
      // Auto-refetch every 3 seconds if there are any processing items
      const hasProcessing = query.state.data?.processing && query.state.data.processing > 0
      return hasProcessing ? 3000 : false
    },
    refetchIntervalInBackground: true,
  })
}
