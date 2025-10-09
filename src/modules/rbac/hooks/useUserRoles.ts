import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { getUserRoles, assignRoleToUser, removeRoleFromUser } from "../rbac.service"
import { AssignRolePayload } from "../rbac.interface"

export function useUserRoles(userId?: string) {
  const qc = useQueryClient()

  const list = useQuery({
    queryKey: ["rbac", "user-roles", userId],
    queryFn: () => getUserRoles(userId!),
    enabled: !!userId,
  })

  const assign = useMutation({
    mutationFn: (payload: AssignRolePayload) => assignRoleToUser(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["rbac", "user-roles", userId] })
      qc.invalidateQueries({ queryKey: ["rbac", "users"] })
    },
  })

  const remove = useMutation({
    mutationFn: ({ userId, roleId }: { userId: string; roleId: string }) => 
      removeRoleFromUser(userId, roleId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["rbac", "user-roles", userId] })
      qc.invalidateQueries({ queryKey: ["rbac", "users"] })
    },
  })

  return { ...list, assign, remove }
}
