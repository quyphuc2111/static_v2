import { PermissionName, User, UserStatus } from "@prisma/client"

export type AuthContext = {
  user: Pick<User, "id" | "status">
  roles: string[]
  permissions: PermissionName[]
}

export function hasRole(ctx: AuthContext, role: string): boolean {
  return ctx.roles.includes(role)
}

export function hasPermission(ctx: AuthContext, perm: PermissionName): boolean {
  return ctx.permissions.includes(perm) || ctx.roles.includes("ADMINISTRATOR")
}

export function canViewContent(ctx: AuthContext): boolean {
  return ctx.user.status === UserStatus.ACTIVE && hasPermission(ctx, PermissionName.VIEW_CONTENT)
}

export function canManageContent(ctx: AuthContext, ownerId?: string): boolean {
  if (ctx.user.status !== UserStatus.ACTIVE) return false
  if (hasPermission(ctx, PermissionName.MANAGE_CONTENT)) return true
  // Dev có thể quản lý content của chính mình (owner)
  return hasRole(ctx, "DEV") && ownerId === ctx.user.id
}

export function canViewOthersContent(ctx: AuthContext): boolean {
  if (ctx.user.status !== UserStatus.ACTIVE) return false
  return hasPermission(ctx, PermissionName.VIEW_OTHERS_CONTENT)
}

export function canUpload(ctx: AuthContext): boolean {
  return ctx.user.status === UserStatus.ACTIVE && hasPermission(ctx, PermissionName.UPLOAD_FILES)
}

export function canManageUsers(ctx: AuthContext): boolean {
  return ctx.user.status === UserStatus.ACTIVE && hasPermission(ctx, PermissionName.MANAGE_USERS)
}

export function canToggleUserStatus(ctx: AuthContext): boolean {
  return ctx.user.status === UserStatus.ACTIVE && hasPermission(ctx, PermissionName.TOGGLE_USER_STATUS)
}

export function canAssignRoles(ctx: AuthContext): boolean {
  return ctx.user.status === UserStatus.ACTIVE && hasPermission(ctx, PermissionName.ASSIGN_ROLES_PERMISSIONS)
}

export function canViewAuditLogs(ctx: AuthContext): boolean {
  return ctx.user.status === UserStatus.ACTIVE && hasPermission(ctx, PermissionName.VIEW_AUDIT_LOGS)
}



