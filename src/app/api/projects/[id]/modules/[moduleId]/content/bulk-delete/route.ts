import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/session"
import { RoleName } from "@prisma/client"

interface Params {
  params: Promise<{
    id: string
    moduleId: string
  }>
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { contentIds } = await req.json()
    
    if (!Array.isArray(contentIds) || contentIds.length === 0) {
      return NextResponse.json({ message: "Content IDs are required" }, { status: 400 })
    }

    const { id: projectId, moduleId } = await params

    // Verify project exists
    const project = await prisma.project.findUnique({
      where: {
        id: projectId
      }
    })

    if (!project) {
      return NextResponse.json({ message: "Project not found" }, { status: 404 })
    }

    const module = await prisma.module.findFirst({
      where: {
        id: moduleId,
        projectId: projectId
      }
    })

    if (!module) {
      return NextResponse.json({ message: "Module not found" }, { status: 404 })
    }

    // Verify all content items exist and belong to the module
    const existingContent = await prisma.contentData.findMany({
      where: {
        id: { in: contentIds },
        moduleId: moduleId
      },
      select: { id: true, title: true }
    })

    if (existingContent.length !== contentIds.length) {
      return NextResponse.json({ 
        message: "Some content items not found or don't belong to this module" 
      }, { status: 400 })
    }

    const isAdmin = (session.user.roles || []).includes(RoleName.ADMINISTRATOR)

    // Non-admin permission check: all items must be owned by user or shared with canDelete
    if (!isAdmin) {
      const unauthorized = await prisma.contentData.findMany({
        where: {
          id: { in: contentIds },
          moduleId: moduleId,
          NOT: [
            { ownerId: session.user.id },
            { shares: { some: { sharedWithId: session.user.id, canDelete: true } } }
          ]
        },
        select: { id: true }
      })
      if (unauthorized.length > 0) {
        return NextResponse.json({ message: "Forbidden" }, { status: 403 })
      }
    }

    // Use transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
      if (isAdmin) {
        // Admin: hard delete DB records
        const deleteResult = await tx.contentData.deleteMany({
          where: {
            id: { in: contentIds },
            moduleId: moduleId
          }
        })
        return deleteResult
      } else {
        // Non-admin: soft delete only
        const updateResult = await tx.contentData.updateMany({
          where: {
            id: { in: contentIds },
            moduleId: moduleId
          },
          data: { isDeleted: true }
        })
        return { count: updateResult.count }
      }
    })

    return NextResponse.json({
      message: `Successfully ${isAdmin ? 'deleted' : 'soft-deleted'} ${result.count} content items`,
      deletedCount: result.count
    })

  } catch (error) {
    console.error("Bulk delete error:", error)
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}
