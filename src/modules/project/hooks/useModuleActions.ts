import { useMutation, useQueryClient } from "@tanstack/react-query"
import { getCsrfToken } from "@/lib/csrf-client"

interface ModuleActionResponse {
  message: string
  data?: any
}

/**
 * Hook for soft deleting a module
 */
export function useSoftDeleteModule() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      projectId,
      moduleId,
    }: {
      projectId: string
      moduleId: string
    }): Promise<ModuleActionResponse> => {
      const csrfToken = await getCsrfToken()
      const response = await fetch(
        `/api/projects/${projectId}/modules/${moduleId}/soft-delete`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-csrf-token": csrfToken,
          },
        }
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to soft delete module")
      }

      return response.json()
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["modules", variables.projectId],
      })
      queryClient.invalidateQueries({ queryKey: ["projects"] })
    },
  })
}

/**
 * Hook for hard deleting a module
 */
export function useHardDeleteModule() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      projectId,
      moduleId,
    }: {
      projectId: string
      moduleId: string
    }): Promise<ModuleActionResponse> => {
      const csrfToken = await getCsrfToken()
      const response = await fetch(
        `/api/projects/${projectId}/modules/${moduleId}/hard-delete`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            "x-csrf-token": csrfToken,
          },
        }
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to hard delete module")
      }

      return response.json()
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["modules", variables.projectId],
      })
      queryClient.invalidateQueries({ queryKey: ["projects"] })
    },
  })
}

/**
 * Hook for restoring a deleted module
 */
export function useRestoreModule() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      projectId,
      moduleId,
    }: {
      projectId: string
      moduleId: string
    }): Promise<ModuleActionResponse> => {
      const csrfToken = await getCsrfToken()
      const response = await fetch(
        `/api/projects/${projectId}/modules/${moduleId}/restore`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-csrf-token": csrfToken,
          },
        }
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to restore module")
      }

      return response.json()
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["modules", variables.projectId],
      })
      queryClient.invalidateQueries({ queryKey: ["projects"] })
    },
  })
}
