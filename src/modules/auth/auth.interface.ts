import { PermissionName, UserStatus } from "@prisma/client"

export type LoginPayload = {
  login: string // username or email
  password: string
}

export type AuthUser = {
  id: string
  username: string
  email?: string | null
  name?: string | null
  status: UserStatus
  roles: Array<{
    id: string
    name: string
    description?: string
  }>
  permissions: Array<{
    id: string
    name: PermissionName
    description?: string
  }>
  token?: string
}

export type LoginResponse = {
  user: AuthUser
}


