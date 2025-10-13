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

export async function updateRole(roleId: number, payload: Partial<CreateRolePayload>): Promise<Role> {
  const res = await httpService.patch<{ data: Role }>({ 
    url: `${RBAC_API_URL.ROLES}/${roleId}`,
    data: payload
  })
  return res.data
}

export async function deleteRole(roleId: number): Promise<void> {
  return httpService.delete({ 
    url: `${RBAC_API_URL.ROLES}/${roleId}`
  })
}

export async function cloneRole(roleId: number): Promise<Role> {
  const res = await httpService.post<{ data: Role }>({ 
    url: `${RBAC_API_URL.ROLES}/${roleId}/clone`
  })
  return res.data
}

export async function toggleRoleStatus(roleId: number): Promise<Role> {
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

export async function getUserRoles(userId: number): Promise<UserRole[]> {
  const res = await httpService.get<{ data: UserRole[] }>({ 
    url: RBAC_API_URL.USER_ROLES(userId.toString())
  })
  return res.data
}

export async function assignRoleToUser(payload: AssignRolePayload): Promise<UserRole> {
  const res = await httpService.post<{ data: UserRole }>({ 
    url: RBAC_API_URL.USER_ROLES(payload.userId.toString()),
    data: { roleId: payload.roleId }
  })
  return res.data
}

export async function removeRoleFromUser(userId: number, roleId: number): Promise<void> {
  return httpService.delete({ 
    url: `${RBAC_API_URL.USER_ROLES(userId.toString())}?roleId=${roleId}`
  })
}

export async function getContentShares(userId?: number, contentId?: number): Promise<ContentShare[]> {
  const params = new URLSearchParams()
  if (userId) params.append('userId', userId.toString())
  if (contentId) params.append('contentId', contentId.toString())
  
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

export async function removeContentShare(contentId: number, sharedWithId: number): Promise<void> {
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

export async function revokeContentShare(shareId?: number, batchId?: number): Promise<void> {
  return httpService.patch({ 
    url: `${RBAC_API_URL.CONTENT_SHARING}/revoke`,
    data: { shareId, batchId }
  })
}

export async function updateContentShare(shareId: number, canView: boolean, canDownload: boolean, canEdit: boolean, canDelete: boolean): Promise<ContentShare> {
  const res = await httpService.patch<{ data: ContentShare }>({ 
    url: `${RBAC_API_URL.CONTENT_SHARING}/${shareId}`,
    data: { canView, canDownload, canEdit, canDelete }
  })
  return res.data
}

export async function getUsers(params?: { page?: number; pageSize?: number; search?: string }): Promise<{ data: UserWithRoles[]; pagination: { total: number; page: number; pageSize: number; totalPages: number } }> {
  const sp = new URLSearchParams()
  if (params?.page) sp.set('page', String(params.page))
  if (params?.pageSize) sp.set('pageSize', String(params.pageSize))
  if (params?.search) sp.set('search', params.search)
  const q = sp.toString()
  const res = await httpService.get<{ data: UserWithRoles[]; pagination: { total: number; page: number; pageSize: number; totalPages: number } }>({ 
    url: q ? `users?${q}` : "users"
  })
  return res
}

export async function createUser(payload: CreateUserPayload): Promise<{ data: UserWithRoles; tempPassword?: string }> {
  const res = await httpService.post<{ data: UserWithRoles; tempPassword?: string }>({
    url: "users",
    data: payload,
  })
  // Return entire response to allow tempPassword access
  return res
}

export async function updateUser(userId: number, payload: UpdateUserPayload): Promise<UserWithRoles> {
  const res = await httpService.patch<{ data: UserWithRoles }>({
    url: `users/${userId}`,
    data: payload,
  })
  return res.data
}

export async function deleteUser(userId: number): Promise<void> {
  await httpService.delete({ url: `users/${userId}` })
}

export async function toggleUserStatus(userId: number): Promise<UserWithRoles> {
  const res = await httpService.patch<{ data: UserWithRoles }>({
    url: `users/${userId}/toggle-status`,
  })
  return res.data
}

export async function resetUserPassword(userId: number, newPassword: string): Promise<UserWithRoles> {
  const res = await httpService.patch<{ data: UserWithRoles }>({
    url: `users/${userId}/reset-password`,
    data: { newPassword },
  })
  return res.data
}
