"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { updateRole } from "../rbac.service"
import cachedKeys from "@/constants/cachedKeys"

interface UpdateRolePayload {
  name: string
  description?: string
  permissionIds: string[]
}

export function useUpdateRole() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ roleId, payload }: { roleId: string; payload: UpdateRolePayload }) =>
      updateRole(roleId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cachedKeys.rbac.roles })
      queryClient.invalidateQueries({ queryKey: cachedKeys.rbac.permissions })
    },
  })
}
