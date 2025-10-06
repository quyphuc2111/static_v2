import { getSession } from "@/lib/session"
import { prisma } from "@/lib/prisma"

export interface PermissionCheck {
  permission: string
  userId?: string
}

export async function hasPermission(permission: string, userId?: string): Promise<boolean> {
  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return false
    }

    const targetUserId = userId || session.user.id

    // Get user with roles and permissions
    const user = await prisma.user.findUnique({
      where: { id: targetUserId },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true
                  }
                }
              }
            }
          }
        },
        permissions: {
          include: {
            permission: true
          }
        }
      }
    })

    if (!user) {
      return false
    }

    // Check role permissions
    const rolePermissions = user.roles.flatMap(ur => 
      ur.role.permissions.map(rp => rp.permission.name)
    )
    
    // Check direct user permissions
    const directPermissions = user.permissions.map(up => up.permission.name)
    
    // Combine all permissions
    const allPermissions = [...rolePermissions, ...directPermissions]
    
    return allPermissions.includes(permission)
  } catch (error) {
    console.error("Error checking permission:", error)
    return false
  }
}

export async function hasAnyPermission(permissions: string[], userId?: string): Promise<boolean> {
  for (const permission of permissions) {
    if (await hasPermission(permission, userId)) {
      return true
    }
  }
  return false
}

export async function hasAllPermissions(permissions: string[], userId?: string): Promise<boolean> {
  for (const permission of permissions) {
    if (!(await hasPermission(permission, userId))) {
      return false
    }
  }
  return true
}

export function createPermissionMiddleware(requiredPermission: string) {
  return async (req: Request) => {
    const session = await getSession()
    if (!session?.user?.id) {
      return { error: "Unauthorized", status: 401 }
    }

    const hasAccess = await hasPermission(requiredPermission, session.user.id)
    if (!hasAccess) {
      return { error: "Forbidden", status: 403 }
    }

    return null
  }
}

