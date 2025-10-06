import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createUser, deleteUser, getUsers, updateUser } from "../rbac.service"
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
    mutationFn: ({ userId, payload }: { userId: string; payload: UpdateUserPayload }) => updateUser(userId, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["rbac", "users"] }),
  })

  const remove = useMutation({
    mutationFn: (userId: string) => deleteUser(userId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["rbac", "users"] }),
  })

  return { ...list, create, update, remove }
}
