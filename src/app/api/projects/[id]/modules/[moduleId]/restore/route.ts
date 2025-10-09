import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/session"
import { hasPermission as checkPermission } from "@/lib/permissions"
import { PermissionName } from "@prisma/client"
import { verifyCsrfToken } from "@/lib/csrf"

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

    // Verify CSRF token
    const csrfToken = req.headers.get("x-csrf-token")
    if (!csrfToken || !(await verifyCsrfToken(csrfToken))) {
      return NextResponse.json({ message: "Invalid CSRF token" }, { status: 403 })
    }

    // Check permission
    const hasAccess = await checkPermission(
      session.user.id,
      PermissionName.RESTORE_MODULES
    )
    if (!hasAccess) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 })
    }

    const { moduleId } = params

    // Check if module exists and is deleted
    const module = await prisma.module.findUnique({
      where: { id: moduleId },
    })

    if (!module) {
      return NextResponse.json({ message: "Module not found" }, { status: 404 })
    }

    if (!module.isDeleted) {
      return NextResponse.json(
        { message: "Module is not deleted" },
        { status: 400 }
      )
    }

    // Restore the module with cascade to content
    const restoredModule = await prisma.$transaction(async (tx) => {
      // Restore the module
      const module = await tx.module.update({
        where: { id: moduleId },
        data: {
          isDeleted: false,
          deletedAt: null,
          updatedAt: new Date(),
          status: 'ACTIVE', // Restore to ACTIVE status when restored
        },
      })

      // Restore all content in this module
      await tx.contentData.updateMany({
        where: { 
          moduleId: moduleId,
          isDeleted: true 
        },
        data: {
          isDeleted: false,
          deletedAt: null,
          updatedAt: new Date(),
        },
      })

      return module
    })

    return NextResponse.json({
      message: "Module restored successfully",
      data: restoredModule,
    })
  } catch (error) {
    console.error("Error restoring module:", error)
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}
