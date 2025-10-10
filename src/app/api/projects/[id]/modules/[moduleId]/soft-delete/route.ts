import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/session"
import { hasPermission as checkPermission } from "@/lib/permissions"
import { PermissionName } from "@prisma/client"

type Params = { params: Promise<{ id: string; moduleId: string }> }

export async function POST(
  req: NextRequest,
  context: Params
) {
  try {
    const params = await context.params
    const session = await getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // Check permission
    const hasAccess = await checkPermission(
      PermissionName.SOFT_DELETE_MODULES,
      session.user.id
    )
    if (!hasAccess) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 })
    }

    const { moduleId } = params

    // Check if module exists and not already deleted
    const module = await prisma.module.findUnique({
      where: { id: moduleId },
    })

    if (!module) {
      return NextResponse.json({ message: "Module not found" }, { status: 404 })
    }

    if (module.isDeleted) {
      return NextResponse.json(
        { message: "Module is already deleted" },
        { status: 400 }
      )
    }

    // Soft delete the module with cascade to content
    const updatedModule = await prisma.$transaction(async (tx) => {
      // Soft delete the module
      const module = await tx.module.update({
        where: { id: moduleId },
        data: {
          isDeleted: true,
          deletedAt: new Date(),
          updatedAt: new Date(),
          status: 'INACTIVE', // Set status to INACTIVE when soft deleted
        },
      })

      // Soft delete all content in this module
      await tx.contentData.updateMany({
        where: { 
          moduleId: moduleId,
          isDeleted: false 
        },
        data: {
          isDeleted: true,
          deletedAt: new Date(),
          updatedAt: new Date(),
        },
      })

      return module
    })

    return NextResponse.json({
      message: "Module soft deleted successfully",
      data: updatedModule,
    })
  } catch (error) {
    console.error("Error soft deleting module:", error)
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}
