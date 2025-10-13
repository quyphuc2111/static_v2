import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/session"
import { hasPermission as checkPermission } from "@/lib/permissions"
import { PermissionName } from "@prisma/client"

type Params = { params: Promise<{ id: string }> }

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

    // Check permission
    const hasAccess = await checkPermission(
      PermissionName.HARD_DELETE_PROJECTS,
      session.user.id
    )
    if (!hasAccess) {
      return NextResponse.json({ message: "Bạn không có quyền xóa dự án" }, { status: 403 })
    }

    const projectId = Number(params.id)

    // Check if project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId as any },
      include: {
        modules: true,
        contentData: true,
      },
    })

    if (!project) {
      return NextResponse.json({ message: "Project not found" }, { status: 404 })
    }

    // Hard delete the project (cascade will delete modules and content)
    await prisma.project.delete({
      where: { id: projectId as any },
    })

    return NextResponse.json({
      message: "Project permanently deleted successfully",
    })
  } catch (error) {
    console.error("Error hard deleting project:", error)
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}
