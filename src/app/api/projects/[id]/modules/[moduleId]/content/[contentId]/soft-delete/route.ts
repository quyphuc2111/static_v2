import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/session"
import { hasPermission as checkPermission, hasAnyPermission } from "@/lib/permissions"
import { PermissionName } from "@prisma/client"
import { verifyCsrfAndOrigin } from "@/lib/csrf"
import { logContentAction } from "@/lib/audit"

type Params = { params: Promise<{ id: string; moduleId: string; contentId: string }> }

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const guard = await verifyCsrfAndOrigin(request)
    if (guard) return NextResponse.json({ error: guard.error }, { status: guard.status })

    const session = await getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: projectId, moduleId, contentId } = await params

    // Check if content exists and not already deleted
    const content = await prisma.contentData.findFirst({
      where: {
        id: contentId,
        projectId,
        moduleId,
        isDeleted: false
      }
    })

    if (!content) {
      return NextResponse.json({ error: "Content not found or already deleted" }, { status: 404 })
    }

    // Check permission
    const isAdmin = (session.user.roles || []).includes("ADMINISTRATOR")
    const canSoftDelete = await hasAnyPermission([PermissionName.SOFT_DELETE_CONTENT, PermissionName.MANAGE_OWN_CONTENT], session.user.id)
    const canManageAll = await hasAnyPermission([PermissionName.MANAGE_ALL_CONTENT], session.user.id)

    if (!isAdmin && !canSoftDelete && !canManageAll) {
      return NextResponse.json({ error: "Bạn không có quyền xóa mềm nội dung" }, { status: 403 })
    }

    // Check ownership for non-admin users
    if (!isAdmin && !canManageAll) {
      const isOwner = content.ownerId === session.user.id
      if (!isOwner) {
        const share = await prisma.contentShare.findFirst({
          where: { contentId: content.id, sharedWithId: session.user.id, canDelete: true }
        })
        if (!share) {
          return NextResponse.json({ error: "Bạn không có quyền xóa nội dung này" }, { status: 403 })
        }
      }
    }

    // Soft delete the content
    const updatedContent = await prisma.contentData.update({
      where: { id: contentId },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        updatedAt: new Date()
      }
    })

    // Log audit action
    await logContentAction(session.user.id, 'soft_deleted', contentId, {
      contentTitle: content.title,
      contentType: content.contentType,
      projectId: content.projectId,
      moduleId: content.moduleId
    })

    return NextResponse.json({
      message: "Content moved to trash successfully",
      data: updatedContent
    })

  } catch (error) {
    console.error("Error soft deleting content:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
