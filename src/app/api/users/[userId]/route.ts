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
    const { username, name, email, status, password, roleId } = body as { 
      username?: string;
      name?: string; 
      email?: string; 
      status?: UserStatus;
      password?: string;
      roleId?: string;
    }

    // Prepare update data - only include fields that are provided
    const updateData: any = {}
    
    if (username !== undefined) updateData.username = username
    if (name !== undefined) updateData.name = name
    if (email !== undefined) updateData.email = email
    if (status !== undefined) updateData.status = status

    // Handle password update
    if (password) {
      const bcrypt = require('bcryptjs')
      updateData.password = await bcrypt.hash(password, 10)
    }

    // Handle role update
    if (roleId) {
      // First, remove all existing roles for this user
      await prisma.userRole.deleteMany({
        where: { userId }
      })
      
      // Then add the new role
      await prisma.userRole.create({
        data: {
          userId,
          roleId
        }
      })
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        username: true,
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
  } catch (error: any) {
    console.error("Error updating user:", error)
    let message = "Internal server error"
    if (error?.code === "P2002") {
      const target = error?.meta?.target?.[0]
      message = target === "username" ? "Username đã tồn tại" : "Email đã tồn tại"
    }
    return NextResponse.json({ message }, { status: 500 })
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

    if (!(await hasPermission(PermissionName.HARD_DELETE_USERS, session.user.id))) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 })
    }

    const { userId } = await params

    // Delete related records first to avoid foreign key constraint violations
    await prisma.$transaction(async (tx) => {
      // Delete user roles
      await tx.userRole.deleteMany({
        where: { userId }
      })

      // Delete user permissions
      await tx.userPermission.deleteMany({
        where: { userId }
      })

      // Delete content shares where user is sharedBy or sharedWith
      await tx.contentShare.deleteMany({
        where: {
          OR: [
            { sharedById: userId },
            { sharedWithId: userId }
          ]
        }
      })

      // Delete share batches where user is sharedBy or sharedWith
      await tx.shareBatch.deleteMany({
        where: {
          OR: [
            { sharedById: userId },
            { sharedWithId: userId }
          ]
        }
      })

      // Update content ownership to null (set ownerId to null)
      await tx.contentData.updateMany({
        where: { ownerId: userId },
        data: { ownerId: null }
      })

      // Finally delete the user
      await tx.user.delete({ where: { id: userId } })
    })

    return NextResponse.json({ message: "User deleted" })
  } catch (error) {
    console.error("Error deleting user:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}


