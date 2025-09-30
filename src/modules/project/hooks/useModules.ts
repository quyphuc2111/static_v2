import { useQuery } from "@tanstack/react-query"
import { listModules } from "../project.service"

export function useModules(projectId: string, enabled = true) {
  return useQuery({
    queryKey: ["projects", projectId, "modules"],
    queryFn: () => listModules(projectId),
    enabled,
  })
}