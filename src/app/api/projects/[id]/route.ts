import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/session"
import { hasPermission } from "@/lib/permissions"
import { PermissionName } from "@prisma/client"
import { verifyCsrfAndOrigin } from "@/lib/csrf"
import { promises as fs } from "fs"
import path from "path"

type Params = { params: Promise<{ id: string }> }

export async function PATCH(_req: Request, { params }: Params) {
  const { id } = await params
  try {
    const guard = await verifyCsrfAndOrigin(_req as any)
    if (guard) return NextResponse.json({ message: guard.error }, { status: guard.status })

    const session = await getSession()
    if (!session.user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    if (!(await hasPermission(PermissionName.EDIT_PROJECTS, session.user.id))) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 })
    }
    const body = await _req.json()
    const name = body?.name?.trim()
    const description = body?.description?.trim()
    const status = body?.status
    
    if (!name) return NextResponse.json({ message: "Tên dự án là bắt buộc" }, { status: 400 })
    
    const updateData: any = { name }
    if (description !== undefined) updateData.description = description || null
    if (status !== undefined) updateData.status = status
    
    const updated = await prisma.project.update({ 
      where: { id }, 
      data: updateData,
      include: { modules: true }
    })
    return NextResponse.json({ data: updated })
  } catch (e) {
    return NextResponse.json({ message: "Server error" }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params
  try {
    const guard = await verifyCsrfAndOrigin(_req as any)
    if (guard) return NextResponse.json({ message: guard.error }, { status: guard.status })

    const session = await getSession()
    if (!session.user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    if (!(await hasPermission(PermissionName.SOFT_DELETE_PROJECTS, session.user.id))) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 })
    }

    // Lấy thông tin project và tất cả content trước khi xóa
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        contentData: true,
        modules: {
          include: {
            contentData: true
          }
        }
      }
    })

    if (!project) {
      return NextResponse.json({ message: "Project not found" }, { status: 404 })
    }

    // Xóa tất cả file vật lý
    console.log(`🗑️  Starting file deletion for project: ${project.name}`)
    console.log(`📁 Project has ${project.contentData.length} direct content items`)
    console.log(`📁 Project has ${project.modules.length} modules with content`)
    
    // Xóa file từ project content
    for (const content of project.contentData) {
      if (content.contentUrl) {
        try {
          // contentUrl có format: uploads/content/... nhưng files thực tế ở public/uploads/content/...
          const filePath = path.join(process.cwd(), 'public', content.contentUrl)
          console.log(`🔍 Checking file: ${filePath}`)
          
          // Kiểm tra file có tồn tại không trước khi xóa
          try {
            await fs.access(filePath)
            await fs.unlink(filePath)
            console.log(`✅ Successfully deleted file: ${content.contentUrl}`)
          } catch (accessError) {
            console.log(`⚠️  File does not exist, skipping: ${content.contentUrl}`)
          }
        } catch (error) {
          console.warn(`❌ Failed to delete file ${content.contentUrl}:`, error)
        }
      }
    }

    // Xóa file từ module content
    for (const module of project.modules) {
      console.log(`📁 Processing module: ${module.name} with ${module.contentData.length} content items`)
      for (const content of module.contentData) {
        if (content.contentUrl) {
          try {
            // contentUrl có format: uploads/content/... nhưng files thực tế ở public/uploads/content/...
            const filePath = path.join(process.cwd(), 'public', content.contentUrl)
            console.log(`🔍 Checking file: ${filePath}`)
            
            // Kiểm tra file có tồn tại không trước khi xóa
            try {
              await fs.access(filePath)
              await fs.unlink(filePath)
              console.log(`✅ Successfully deleted file: ${content.contentUrl}`)
            } catch (accessError) {
              console.log(`⚠️  File does not exist, skipping: ${content.contentUrl}`)
            }
          } catch (error) {
            console.warn(`❌ Failed to delete file ${content.contentUrl}:`, error)
          }
        }
      }
    }

    // Xóa project (sẽ cascade xóa modules và contentData)
    await prisma.project.delete({ where: { id } })
    
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error("Error deleting project:", e)
    return NextResponse.json({ message: "Server error" }, { status: 500 })
  }
}


