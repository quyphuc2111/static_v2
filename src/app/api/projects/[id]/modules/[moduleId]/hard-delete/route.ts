import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/session"
import { hasPermission as checkPermission } from "@/lib/permissions"
import { PermissionName } from "@prisma/client"
import { verifyCsrfToken } from "@/lib/csrf"

type Params = { params: Promise<{ id: string; moduleId: string }> }

export async function DELETE(
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
      PermissionName.HARD_DELETE_MODULES
    )
    if (!hasAccess) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 })
    }

    const { moduleId } = params

    // Check if module exists
    const module = await prisma.module.findUnique({
      where: { id: moduleId },
      include: {
        contentData: true,
      },
    })

    if (!module) {
      return NextResponse.json({ message: "Module not found" }, { status: 404 })
    }

    // Hard delete the module (cascade will delete content)
    await prisma.module.delete({
      where: { id: moduleId },
    })

    return NextResponse.json({
      message: "Module permanently deleted successfully",
    })
  } catch (error) {
    console.error("Error hard deleting module:", error)
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}
