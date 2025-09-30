import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getRoles, createRole, updateRole, deleteRole } from "../rbac.service"
import { CreateRolePayload } from "../rbac.interface"

export function useRoles() {
  return useQuery({
    queryKey: ["rbac", "roles"],
    queryFn: getRoles,
  })
}

export function useCreateRole() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateRolePayload) => createRole(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rbac", "roles"] })
    },
  })
}

export function useUpdateRole() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ roleId, payload }: { roleId: string; payload: Partial<CreateRolePayload> }) => 
      updateRole(roleId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rbac", "roles"] })
    },
  })
}

export function useDeleteRole() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (roleId: string) => deleteRole(roleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rbac", "roles"] })
    },
  })
}
