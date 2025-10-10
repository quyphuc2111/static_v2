import httpService from "@/services/instance"
import { API_BASE_URL } from "@/constants/apiUrl"
import { 
  Role, 
  Permission, 
  UserRole, 
  ContentShare, 
  CreateRolePayload, 
  AssignRolePayload, 
  ShareContentPayload,
  BulkSharePayload,
  UserWithRoles,
  CreateUserPayload,
  UpdateUserPayload,
  RoleWithPermissions
} from "./rbac.interface"

const RBAC_API_URL = {
  ROLES: "roles",
  PERMISSIONS: "permissions",
  USER_ROLES: (userId: string) => `users/${userId}/roles`,
  CONTENT_SHARING: "content-sharing",
}

export async function getRoles(): Promise<RoleWithPermissions[]> {
  const res = await httpService.get<{ data: RoleWithPermissions[] }>({ 
    url: RBAC_API_URL.ROLES
  })
  return res.data
}

export async function createRole(payload: CreateRolePayload): Promise<Role> {
  const res = await httpService.post<{ data: Role }>({ 
    url: RBAC_API_URL.ROLES,
    data: payload
  })
  return res.data
}

export async function updateRole(roleId: string, payload: Partial<CreateRolePayload>): Promise<Role> {
  const res = await httpService.patch<{ data: Role }>({ 
    url: `${RBAC_API_URL.ROLES}/${roleId}`,
    data: payload
  })
  return res.data
}

export async function deleteRole(roleId: string): Promise<void> {
  return httpService.delete({ 
    url: `${RBAC_API_URL.ROLES}/${roleId}`
  })
}

export async function cloneRole(roleId: string): Promise<Role> {
  const res = await httpService.post<{ data: Role }>({ 
    url: `${RBAC_API_URL.ROLES}/${roleId}/clone`
  })
  return res.data
}

export async function toggleRoleStatus(roleId: string): Promise<Role> {
  const res = await httpService.post<{ data: Role }>({ 
    url: `${RBAC_API_URL.ROLES}/${roleId}/toggle`
  })
  return res.data
}

export async function getPermissions(): Promise<Permission[]> {
  const res = await httpService.get<{ data: Permission[] }>({ 
    url: RBAC_API_URL.PERMISSIONS
  })
  return res.data
}

export async function getUserRoles(userId: string): Promise<UserRole[]> {
  const res = await httpService.get<{ data: UserRole[] }>({ 
    url: RBAC_API_URL.USER_ROLES(userId)
  })
  return res.data
}

export async function assignRoleToUser(payload: AssignRolePayload): Promise<UserRole> {
  const res = await httpService.post<{ data: UserRole }>({ 
    url: RBAC_API_URL.USER_ROLES(payload.userId),
    data: { roleId: payload.roleId }
  })
  return res.data
}

export async function removeRoleFromUser(userId: string, roleId: string): Promise<void> {
  return httpService.delete({ 
    url: `${RBAC_API_URL.USER_ROLES(userId)}?roleId=${roleId}`
  })
}

export async function getContentShares(userId?: string, contentId?: string): Promise<ContentShare[]> {
  const params = new URLSearchParams()
  if (userId) params.append('userId', userId)
  if (contentId) params.append('contentId', contentId)
  
  const res = await httpService.get<{ data: ContentShare[] }>({ 
    url: `${RBAC_API_URL.CONTENT_SHARING}?${params.toString()}`
  })
  return res.data
}

export async function shareContent(payload: ShareContentPayload): Promise<ContentShare> {
  const res = await httpService.post<{ data: ContentShare }>({ 
    url: RBAC_API_URL.CONTENT_SHARING,
    data: payload
  })
  return res.data
}

export async function removeContentShare(contentId: string, sharedWithId: string): Promise<void> {
  return httpService.delete({ 
    url: `${RBAC_API_URL.CONTENT_SHARING}?contentId=${contentId}&sharedWithId=${sharedWithId}`
  })
}

export async function bulkShareContent(payload: BulkSharePayload): Promise<{ count: number }> {
  const res = await httpService.post<{ data: { count: number } }>({
    url: RBAC_API_URL.CONTENT_SHARING,
    data: payload
  })
  return res.data
}

export async function revokeContentShare(shareId?: string, batchId?: string): Promise<void> {
  return httpService.patch({ 
    url: `${RBAC_API_URL.CONTENT_SHARING}/revoke`,
    data: { shareId, batchId }
  })
}

export async function updateContentShare(shareId: string, canView: boolean, canDownload: boolean, canEdit: boolean, canDelete: boolean): Promise<ContentShare> {
  const res = await httpService.patch<{ data: ContentShare }>({ 
    url: `${RBAC_API_URL.CONTENT_SHARING}/${shareId}`,
    data: { canView, canDownload, canEdit, canDelete }
  })
  return res.data
}

export async function getUsers(): Promise<UserWithRoles[]> {
  const res = await httpService.get<{ data: UserWithRoles[] }>({ 
    url: "users"
  })
  return res.data
}

export async function createUser(payload: CreateUserPayload): Promise<{ data: UserWithRoles; tempPassword?: string }> {
  const res = await httpService.post<{ data: UserWithRoles; tempPassword?: string }>({
    url: "users",
    data: payload,
  })
  // Return entire response to allow tempPassword access
  return res
}

export async function updateUser(userId: string, payload: UpdateUserPayload): Promise<UserWithRoles> {
  const res = await httpService.patch<{ data: UserWithRoles }>({
    url: `users/${userId}`,
    data: payload,
  })
  return res.data
}

export async function deleteUser(userId: string): Promise<void> {
  await httpService.delete({ url: `users/${userId}` })
}

export async function toggleUserStatus(userId: string): Promise<UserWithRoles> {
  const res = await httpService.patch<{ data: UserWithRoles }>({
    url: `users/${userId}/toggle-status`,
  })
  return res.data
}

export async function resetUserPassword(userId: string, newPassword: string): Promise<UserWithRoles> {
  const res = await httpService.patch<{ data: UserWithRoles }>({
    url: `users/${userId}/reset-password`,
    data: { newPassword },
  })
  return res.data
}
