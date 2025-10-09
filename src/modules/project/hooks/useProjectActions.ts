import { useMutation, useQueryClient } from "@tanstack/react-query"
import { getCsrfToken } from "@/lib/csrf-client"

interface ProjectActionResponse {
  message: string
  data?: any
}

/**
 * Hook for soft deleting a project
 */
export function useSoftDeleteProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (projectId: string): Promise<ProjectActionResponse> => {
      const csrfToken = await getCsrfToken()
      const response = await fetch(`/api/projects/${projectId}/soft-delete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": csrfToken,
        },
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to soft delete project")
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] })
    },
  })
}

/**
 * Hook for hard deleting a project
 */
export function useHardDeleteProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (projectId: string): Promise<ProjectActionResponse> => {
      const csrfToken = await getCsrfToken()
      const response = await fetch(`/api/projects/${projectId}/hard-delete`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": csrfToken,
        },
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to hard delete project")
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] })
    },
  })
}

/**
 * Hook for restoring a deleted project
 */
export function useRestoreProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (projectId: string): Promise<ProjectActionResponse> => {
      const csrfToken = await getCsrfToken()
      const response = await fetch(`/api/projects/${projectId}/restore`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": csrfToken,
        },
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to restore project")
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] })
    },
  })
}
