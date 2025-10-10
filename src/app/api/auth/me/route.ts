import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { prisma } from "@/lib/prisma"
import { getOrCreateCsrfToken } from "@/lib/csrf"

export async function GET() {
  try {
    const session = await getSession()
    if (!session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: { permission: true }
                }
              }
            }
          }
        },
        permissions: { include: { permission: true } }
      }
    })

    if (!dbUser) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const roles = dbUser.roles.map(ur => ({
      id: ur.role.id,
      name: ur.role.name,
      description: ur.role.description ?? undefined,
    }))

    const rolePermissionObjects = dbUser.roles.flatMap(ur => ur.role.permissions.map(rp => rp.permission))
    const directPermissionObjects = dbUser.permissions.map(up => up.permission)
    const permissionMap = new Map<string, { id: string; name: any; description?: string }>()
    for (const p of [...rolePermissionObjects, ...directPermissionObjects]) {
      if (!permissionMap.has(p.id)) {
        permissionMap.set(p.id, { id: p.id, name: p.name, description: p.description ?? undefined })
      }
    }

    const permissions = Array.from(permissionMap.values())

    const me = {
      id: dbUser.id,
      email: dbUser.email,
      name: dbUser.name ?? undefined,
      status: dbUser.status,
      roles,
      permissions,
    }

    const csrfToken = await getOrCreateCsrfToken()

    return NextResponse.json({ user: me, csrfToken })
  } catch (e) {
    console.error("/api/auth/me error:", e)
    return NextResponse.json({ message: "Server error" }, { status: 500 })
  }
}


