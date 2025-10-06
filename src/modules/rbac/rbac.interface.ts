export interface Role {
  id: string
  name: string
  description?: string
  createdAt: string
  updatedAt: string
  permissions?: RolePermission[]
  users?: UserRole[]
}

export interface Permission {
  id: string
  name: string
  description?: string
  createdAt: string
  updatedAt: string
}

export interface RolePermission {
  roleId: string
  permissionId: string
  role?: Role
  permission?: Permission
}

export interface UserRole {
  userId: string
  roleId: string
  user?: {
    id: string
    name?: string
    email: string
  }
  role?: Role
}

export interface ContentShare {
  id: string
  contentId: string
  sharedById: string
  sharedWithId: string
  canView: boolean
  canEdit: boolean
  canDelete: boolean
  createdAt: string
  updatedAt: string
  content?: {
    id: string
    title: string
    contentType: string
    status: string
  }
  sharedBy?: {
    id: string
    name?: string
    email: string
  }
  sharedWith?: {
    id: string
    name?: string
    email: string
  }
}

export interface CreateRolePayload {
  name: string
  description?: string
  permissionIds: string[]
}

export interface AssignRolePayload {
  userId: string
  roleId: string
}

export interface ShareContentPayload {
  contentId: string
  sharedWithId: string
  canView?: boolean
  canEdit?: boolean
  canDelete?: boolean
}

export interface BulkSharePayload {
  sharedWithId: string
  canView?: boolean
  canEdit?: boolean
  canDelete?: boolean
  projectId?: string
  moduleId?: string
  ownerId?: string
  contentIds?: string[]
}

export interface UserWithRoles {
  id: string
  name?: string
  email: string
  status: string
  createdAt: string
  updatedAt: string
  roles?: UserRole[]
}

export interface CreateUserPayload {
  name?: string
  email: string
  status?: string
  roleId?: string
  password?: string
}

export interface UpdateUserPayload {
  name?: string
  email?: string
  status?: string
}

export interface RoleWithPermissions extends Role {
  permissions: (RolePermission & { permission: Permission })[]
}
