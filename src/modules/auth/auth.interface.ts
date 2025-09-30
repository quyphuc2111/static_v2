import { PermissionName, RoleName, UserStatus } from "@prisma/client"

export type LoginPayload = {
  email: string
  password: string
}

export type AuthUser = {
  id: string
  email: string
  name?: string | null
  status: UserStatus
  roles: RoleName[]
  permissions: PermissionName[]
  token?: string
}

export type LoginResponse = {
  user: AuthUser
}


