import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/session"
import { hasPermission } from "@/lib/permissions"
import { PermissionName, UserStatus } from "@prisma/client"
import { verifyCsrfAndOrigin } from "@/lib/csrf"

type Params = { params: Promise<{ userId: string }> }

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const guard = await verifyCsrfAndOrigin(req)
    if (guard) return NextResponse.json({ message: guard.error }, { status: guard.status })

    const session = await getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    if (!(await hasPermission(PermissionName.EDIT_USERS, session.user.id))) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 })
    }

    const { userId } = await params
    const body = await req.json().catch(() => ({}))
    const { name, email, status } = body as { name?: string; email?: string; status?: UserStatus }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        name: name ?? undefined,
        email: email ?? undefined,
        status: status ?? undefined,
      },
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        roles: {
          include: {
            role: { include: { permissions: { include: { permission: true } } } },
          },
        },
      },
    })

    return NextResponse.json({ data: updated })
  } catch (error) {
    console.error("Error updating user:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const guard = await verifyCsrfAndOrigin(_req)
    if (guard) return NextResponse.json({ message: guard.error }, { status: guard.status })

    const session = await getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    if (!(await hasPermission(PermissionName.DELETE_USERS, session.user.id))) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 })
    }

    const { userId } = await params

    await prisma.user.delete({ where: { id: userId } })
    return NextResponse.json({ message: "User deleted" })
  } catch (error) {
    console.error("Error deleting user:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}


