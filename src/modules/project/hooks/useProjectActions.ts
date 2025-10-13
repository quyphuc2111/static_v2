import { useMutation, useQueryClient } from "@tanstack/react-query"
import { softDeleteProject, hardDeleteProject, restoreProject } from "../project.service"
import cachedKeys from "@/constants/cachedKeys"

/**
 * Hook for soft deleting a project
 */
export function useSoftDeleteProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: softDeleteProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects", "list"] })
    },
  })
}

/**
 * Hook for hard deleting a project
 */
export function useHardDeleteProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: hardDeleteProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects", "list"] })
    },
  })
}

/**
 * Hook for restoring a deleted project
 */
export function useRestoreProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: restoreProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects", "list"] })
    },
  })
}
