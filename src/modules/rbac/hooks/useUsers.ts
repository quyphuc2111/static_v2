import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createUser, deleteUser, getUsers, updateUser, toggleUserStatus, resetUserPassword } from "../rbac.service"
import { CreateUserPayload, UpdateUserPayload, UserWithRoles } from "../rbac.interface"

export function useUsers() {
  const qc = useQueryClient()

  const list = useQuery({
    queryKey: ["rbac", "users"],
    queryFn: getUsers,
  })

  const create = useMutation({
    mutationFn: (payload: CreateUserPayload) => createUser(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["rbac", "users"] }),
  })

  const update = useMutation({
    mutationFn: ({ id, ...payload }: { id: string } & UpdateUserPayload) => updateUser(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["rbac", "users"] }),
  })

  const remove = useMutation({
    mutationFn: (userId: string) => deleteUser(userId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["rbac", "users"] }),
  })

  const toggleStatus = useMutation({
    mutationFn: (userId: string) => toggleUserStatus(userId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["rbac", "users"] }),
  })

  const resetPassword = useMutation({
    mutationFn: ({ userId, newPassword }: { userId: string; newPassword: string }) => 
      resetUserPassword(userId, newPassword),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["rbac", "users"] }),
  })

  return { ...list, create, update, remove, toggleStatus, resetPassword }
}
