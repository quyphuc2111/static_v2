import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getUserRoles, assignRoleToUser, removeRoleFromUser } from "../rbac.service"
import { AssignRolePayload } from "../rbac.interface"

export function useUserRoles(userId: string) {
  return useQuery({
    queryKey: ["rbac", "user-roles", userId],
    queryFn: () => getUserRoles(userId),
    enabled: !!userId,
  })
}

export function useAssignRoleToUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: AssignRolePayload) => assignRoleToUser(payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["rbac", "user-roles", variables.userId] })
      queryClient.invalidateQueries({ queryKey: ["rbac", "roles"] })
    },
  })
}

export function useRemoveRoleFromUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ userId, roleId }: { userId: string; roleId: string }) => 
      removeRoleFromUser(userId, roleId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["rbac", "user-roles", variables.userId] })
      queryClient.invalidateQueries({ queryKey: ["rbac", "roles"] })
    },
  })
}
