import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/session"
import { verifyCsrfAndOrigin } from "@/lib/csrf"
import { hasPermission } from "@/lib/permissions"
import { PermissionName, ShareScope } from "@prisma/client"

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')
    const contentId = searchParams.get('contentId')

    let whereClause: any = {}

    if (userId) {
      whereClause.sharedWithId = userId
    }

    if (contentId) {
      whereClause.contentId = contentId
    }

    const shares = await prisma.contentShare.findMany({
      where: whereClause,
      include: {
        content: {
          select: {
            id: true,
            title: true,
            contentType: true,
            status: true
          }
        },
        sharedBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        sharedWith: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        batch: {
          select: {
            id: true,
            scope: true,
            projectId: true,
            moduleId: true,
            ownerId: true,
            itemsCount: true,
            createdAt: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({ data: shares })
  } catch (error) {
    console.error("Error fetching content shares:", error)
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const guard = await verifyCsrfAndOrigin(req)
    if (guard) return NextResponse.json({ message: guard.error }, { status: guard.status })

    const session = await getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // Check SHARE_CONTENT_ACCESS permission
    const canShare = await hasPermission(PermissionName.SHARE_CONTENT_ACCESS, session.user.id)
    if (!canShare) {
      return NextResponse.json({ message: "Forbidden: Missing SHARE_CONTENT_ACCESS permission" }, { status: 403 })
    }

    const body = await req.json()
    const {
      contentId,
      sharedWithId,
      canView = true,
      canEdit = false,
      canDelete = false,
      // Admin bulk share inputs (optional)
      projectId,
      moduleId,
      ownerId,
      contentIds
    } = body

    const isAdmin = Array.isArray(session.user?.roles) && (session.user!.roles as any[]).includes("ADMINISTRATOR")
    const canManageAll = await hasPermission(PermissionName.MANAGE_ALL_CONTENT, session.user.id)

    // ADMIN/MANAGER BULK SHARE: project/module/owner/contentIds
    if ((isAdmin || canManageAll) && sharedWithId && (projectId || moduleId || ownerId || (Array.isArray(contentIds) && contentIds.length > 0))) {
      // Collect content IDs by filters
      const whereClause: any = { isDeleted: false }
      if (projectId) whereClause.projectId = projectId
      if (moduleId) whereClause.moduleId = moduleId
      if (ownerId) whereClause.ownerId = ownerId
      if (Array.isArray(contentIds) && contentIds.length > 0) whereClause.id = { in: contentIds }

      const contents = await prisma.contentData.findMany({ where: whereClause, select: { id: true } })
      if (contents.length === 0) {
        return NextResponse.json({ message: "No content found for specified criteria" }, { status: 404 })
      }

      // Ensure target user exists
      const user = await prisma.user.findUnique({ where: { id: sharedWithId } })
      if (!user) {
        return NextResponse.json({ message: "User not found" }, { status: 404 })
      }

      // Create batch record
      const scope: ShareScope = projectId
        ? ShareScope.PROJECT
        : moduleId
        ? ShareScope.MODULE
        : ownerId
        ? ShareScope.OWNER
        : ShareScope.LIST

      const batch = await prisma.shareBatch.create({
        data: {
          scope,
          sharedById: session.user!.id,
          sharedWithId,
          projectId: projectId || null,
          moduleId: moduleId || null,
          ownerId: ownerId || null,
          canView,
          canEdit,
          canDelete,
          itemsCount: contents.length,
        },
      })

      // Upsert shares for all content IDs and tag with batchId
      const operations = contents.map((c) =>
        prisma.contentShare.upsert({
          where: { contentId_sharedWithId: { contentId: c.id, sharedWithId } },
          update: { canView, canEdit, canDelete, batchId: batch.id },
          create: { contentId: c.id, sharedById: session.user!.id, sharedWithId, canView, canEdit, canDelete, batchId: batch.id },
        })
      )
      const results = await prisma.$transaction(operations)
      return NextResponse.json({ data: { count: results.length, batchId: batch.id } }, { status: 201 })
    }

    // STANDARD SHARE: owner can share their own content
    if (!contentId || !sharedWithId) {
      return NextResponse.json({ message: "Content ID and shared with user ID are required" }, { status: 400 })
    }

    // Check if content exists and user has permission to share it
    const content = await prisma.contentData.findFirst({
      where: isAdmin
        ? { id: contentId }
        : { id: contentId, ownerId: session.user.id }
    })

    if (!content) {
      return NextResponse.json({ message: "Content not found or you don't have permission to share it" }, { status: 404 })
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: sharedWithId }
    })

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 })
    }

    // Check if share already exists
    const existingShare = await prisma.contentShare.findUnique({
      where: {
        contentId_sharedWithId: {
          contentId,
          sharedWithId
        }
      }
    })

    if (existingShare) {
      // Update existing share (only if it's active)
      if (existingShare.status === 'ACTIVE') {
        const updatedShare = await prisma.contentShare.update({
          where: {
            contentId_sharedWithId: {
              contentId,
              sharedWithId
            }
          },
          data: {
            canView,
            canEdit,
            canDelete
          },
          include: {
            content: {
              select: {
                id: true,
                title: true,
                contentType: true,
                status: true
              }
            },
            sharedBy: {
              select: {
                id: true,
                name: true,
                email: true
              }
            },
            sharedWith: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        })

        return NextResponse.json({ data: updatedShare })
      } else {
        // If share is revoked, create a new share
        const newShare = await prisma.contentShare.create({
          data: {
            contentId,
            sharedById: session.user!.id,
            sharedWithId,
            canView,
            canEdit,
            canDelete,
            status: 'ACTIVE'
          },
          include: {
            content: {
              select: {
                id: true,
                title: true,
                contentType: true,
                status: true
              }
            },
            sharedBy: {
              select: {
                id: true,
                name: true,
                email: true
              }
            },
            sharedWith: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        })

        return NextResponse.json({ data: newShare })
      }
    } else {
      // Create new share
      const newShare = await prisma.contentShare.create({
        data: {
          contentId,
          sharedById: session.user.id,
          sharedWithId,
          canView,
          canEdit,
          canDelete
        },
        include: {
          content: {
            select: {
              id: true,
              title: true,
              contentType: true,
              status: true
            }
          },
          sharedBy: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          sharedWith: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      })

      return NextResponse.json({ data: newShare }, { status: 201 })
    }
  } catch (error) {
    console.error("Error sharing content:", error)
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const guard = await verifyCsrfAndOrigin(req)
    if (guard) return NextResponse.json({ message: guard.error }, { status: guard.status })

    const session = await getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const contentId = searchParams.get('contentId')
    const sharedWithId = searchParams.get('sharedWithId')

    if (!contentId || !sharedWithId) {
      return NextResponse.json({ message: "Content ID and shared with user ID are required" }, { status: 400 })
    }

    // Check if user has permission to remove the share
    const share = await prisma.contentShare.findFirst({
      where: {
        contentId,
        sharedWithId,
        OR: [
          { sharedById: session.user.id },
          { sharedWithId: session.user.id }
        ]
      }
    })

    if (!share) {
      return NextResponse.json({ message: "Share not found or you don't have permission to remove it" }, { status: 404 })
    }

    await prisma.contentShare.delete({
      where: {
        contentId_sharedWithId: {
          contentId,
          sharedWithId
        }
      }
    })

    return NextResponse.json({ message: "Content share removed successfully" })
  } catch (error) {
    console.error("Error removing content share:", error)
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}
