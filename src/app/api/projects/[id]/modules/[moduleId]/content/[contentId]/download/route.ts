import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/session"
import { existsSync } from "fs"
import { join } from "path"
import archiver from "archiver"
import { RoleName } from "@prisma/client"

type Params = { params: Promise<{ id: string; moduleId: string; contentId: string }> }

export async function GET(request: NextRequest, { params }: Params) {
  try {
    console.log('Download API called')
    
    const session = await getSession()
    console.log('Session:', session)
    
    if (!session.user) {
      console.log('No session user found')
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: projectId, moduleId, contentId } = await params
    console.log('Params:', { projectId, moduleId, contentId })

    // Verify content exists
    const content = await prisma.contentData.findFirst({
      where: {
        id: contentId,
        projectId,
        moduleId,
        isDeleted: false
      }
    })

    console.log('Content found:', content)

    if (!content) {
      console.log('Content not found')
      return NextResponse.json({ error: "Content not found" }, { status: 404 })
    }

    // Permission: owner, admin, or shared canView
    const isAdmin = (session.user.roles || []).includes(RoleName.ADMINISTRATOR)
    if (!isAdmin) {
      const isOwner = content.ownerId === session.user.id
      if (!isOwner) {
        const share = await prisma.contentShare.findFirst({
          where: { contentId: content.id, sharedWithId: session.user.id, canView: true }
        })
        if (!share) {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }
      }
    }

    // Get the content directory path
    const contentDir = join(process.cwd(), 'public', content.contentUrl)
    console.log('Content directory:', contentDir)
    
    if (!existsSync(contentDir)) {
      console.log('Content directory does not exist')
      return NextResponse.json({ error: "Content files not found" }, { status: 404 })
    }

    // Create ZIP archive
    const archive = archiver('zip', {
      zlib: { level: 9 } // Maximum compression
    })

    // Collect chunks
    const chunks: Buffer[] = []
    
    archive.on('data', (chunk) => {
      chunks.push(chunk)
    })

    archive.on('error', (err) => {
      console.error('Archive error:', err)
      throw err
    })

    // Add directory to archive and wait for completion
    try {
      archive.directory(contentDir, false)
      
      // Wait for archive to complete
      await new Promise<void>((resolve, reject) => {
        archive.on('end', () => {
          console.log('Archive completed')
          resolve()
        })
        archive.on('error', reject)
        
        // Finalize the archive
        archive.finalize()
      })
      
      console.log('Archive finalized successfully')
    } catch (archiveError) {
      console.error('Error creating archive:', archiveError)
      return NextResponse.json({ error: "Failed to create ZIP archive" }, { status: 500 })
    }

    // Combine all chunks
    const buffer = Buffer.concat(chunks)
    console.log('Buffer size:', buffer.length)

    // Set response headers
    const headers = new Headers()
    headers.set('Content-Type', 'application/zip')
    headers.set('Content-Disposition', `attachment; filename="${content.title}.zip"`)
    headers.set('Content-Length', buffer.length.toString())
    headers.set('Cache-Control', 'no-cache')

    console.log('Returning ZIP file with size:', buffer.length)
    return new NextResponse(buffer, { headers })

  } catch (error) {
    console.error("Error downloading content:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
