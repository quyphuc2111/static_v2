import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/session"
import { rm } from "fs/promises"
import { join } from "path"
import { RoleName } from "@prisma/client"

type Params = { params: Promise<{ id: string; moduleId: string; contentId: string }> }

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const session = await getSession()
    if (!session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: projectId, moduleId, contentId } = await params

    // Verify content exists and base constraints
    const content = await prisma.contentData.findFirst({
      where: {
        id: contentId,
        projectId,
        moduleId,
        isDeleted: false
      }
    })

    if (!content) {
      return NextResponse.json({ error: "Content not found" }, { status: 404 })
    }

    const isAdmin = (session.user.roles || []).includes(RoleName.ADMINISTRATOR)

    // Permission: owner or shared canDelete (for non-admin)
    if (!isAdmin) {
      const isOwner = content.ownerId === session.user.id
      if (!isOwner) {
        const share = await prisma.contentShare.findFirst({
          where: { contentId: content.id, sharedWithId: session.user.id, canDelete: true }
        })
        if (!share) {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }
      }
    }

    // Use transaction to ensure atomicity
    await prisma.$transaction(async (tx) => {
      // Always mark as soft-deleted
      await tx.contentData.update({
        where: { id: contentId },
        data: { isDeleted: true }
      })

      // Only admins are allowed to remove physical files
      if (isAdmin) {
        try {
          const contentDir = join(process.cwd(), 'public', content.contentUrl)
          await rm(contentDir, { recursive: true, force: true })
          console.log(`Deleted content directory: ${contentDir}`)
        } catch (fileError) {
          console.warn(`Failed to delete content directory: ${fileError}`)
          // Don't fail the transaction if file deletion fails
        }
      }
    })

    return NextResponse.json({ message: "Content deleted successfully" })

  } catch (error) {
    console.error("Error deleting content:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}