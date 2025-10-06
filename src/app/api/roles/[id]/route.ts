import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/session"
import { hasPermission } from "@/lib/permissions"
import { verifyCsrfAndOrigin } from "@/lib/csrf"

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guard = await verifyCsrfAndOrigin(req)
    if (guard) return NextResponse.json({ message: guard.error }, { status: guard.status })

    const session = await getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // Check if user has permission to manage roles
    if (!(await hasPermission("MANAGE_USER_PERMISSIONS"))) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 })
    }

    const { name, description, permissionIds, isActive } = await req.json()
    const { id: roleId } = await params

    if (!name) {
      return NextResponse.json({ message: "Name is required" }, { status: 400 })
    }

    const role = await prisma.$transaction(async (tx) => {
      // Update role
      const updatedRole = await tx.role.update({
        where: { id: roleId },
        data: {
          name,
          description,
          ...(isActive !== undefined && { isActive })
        }
      })

      // Update permissions if provided
      if (permissionIds && Array.isArray(permissionIds)) {
        // Remove existing permissions
        await tx.rolePermission.deleteMany({
          where: { roleId }
        })

        // Add new permissions
        if (permissionIds.length > 0) {
          await tx.rolePermission.createMany({
            data: permissionIds.map((permissionId: string) => ({
              roleId,
              permissionId
            }))
          })
        }
      }

      return updatedRole
    })

    return NextResponse.json({ data: role })
  } catch (error) {
    console.error("Error updating role:", error)
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guard = await verifyCsrfAndOrigin(req)
    if (guard) return NextResponse.json({ message: guard.error }, { status: guard.status })

    const session = await getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // Check if user has permission to manage roles
    if (!(await hasPermission("MANAGE_USER_PERMISSIONS"))) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 })
    }

    const { id: roleId } = await params

    // Check if role is being used by any users
    const usersWithRole = await prisma.userRole.findFirst({
      where: { roleId }
    })

    if (usersWithRole) {
      return NextResponse.json(
        { message: "Cannot delete role that is assigned to users" },
        { status: 400 }
      )
    }

    // Delete role and its permissions
    await prisma.$transaction(async (tx) => {
      // Delete role permissions
      await tx.rolePermission.deleteMany({
        where: { roleId }
      })

      // Delete role
      await tx.role.delete({
        where: { id: roleId }
      })
    })

    return NextResponse.json({ message: "Role deleted successfully" })
  } catch (error) {
    console.error("Error deleting role:", error)
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}

