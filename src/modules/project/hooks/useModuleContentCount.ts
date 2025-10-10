"use client"

import { useQuery } from "@tanstack/react-query"
import { getModuleContentCount } from "../project.service"

export function useModuleContentCount(moduleId: string) {
  return useQuery({
    queryKey: ["module-content-count", moduleId],
    queryFn: () => getModuleContentCount(moduleId),
    enabled: !!moduleId,
  })
}
