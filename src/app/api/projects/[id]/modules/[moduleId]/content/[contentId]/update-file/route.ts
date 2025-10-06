import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/session"
import { PermissionName } from "@prisma/client"
import { hasPermission, hasAnyPermission } from "@/lib/permissions"
import { Prisma } from "@prisma/client"
import { writeFile, mkdir } from "fs/promises"
import { join, dirname } from "path"
import { existsSync, createWriteStream } from "fs"
import yauzl from "yauzl"
import { SCORMService } from "@/services/scormService"
import { verifyCsrfAndOrigin } from "@/lib/csrf"

// Helper function to remove Vietnamese diacritics and sanitize for file paths
function sanitizeVietnameseString(str: string): string {
  return str
    .normalize('NFD') // Decompose accented characters
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/[^a-zA-Z0-9\s]/g, '') // Remove special characters except spaces
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .toLowerCase()
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; moduleId: string; contentId: string }> }
) {
  try {
    // Verify CSRF token
    const guard = await verifyCsrfAndOrigin(request)
    if (guard) return NextResponse.json({ error: guard.error }, { status: guard.status })

    const { id: projectId, moduleId, contentId } = await params

    const session = await getSession()
    if (!session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if content exists and user has permission
    const content = await prisma.contentData.findFirst({
      where: {
        id: contentId,
        projectId,
        moduleId,
        isDeleted: false
      },
      include: {
        owner: true
      }
    })

    if (!content) {
      return NextResponse.json({ error: "Content not found" }, { status: 404 })
    }

    // Check permissions
    const isOwner = content.owner?.id === session.user.id
    const hasManageOwnContent = await hasPermission(session.user.id, PermissionName.MANAGE_OWN_CONTENT)
    const hasManageAllContent = await hasPermission(session.user.id, PermissionName.MANAGE_ALL_CONTENT)

    if (!isOwner && !hasManageAllContent) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    // Parse form data
    const formData = await request.formData()
    const contentType = formData.get("contentType") as string
    const file = formData.get("file") as File

    if (!contentType || !file) {
      return NextResponse.json({ error: "Missing contentType or file" }, { status: 400 })
    }

    if (!["FILE_ZIP_HTML", "FILE_ZIP_SCORM"].includes(contentType)) {
      return NextResponse.json({ error: "Invalid contentType" }, { status: 400 })
    }

    // Validate file
    if (file.size === 0) {
      return NextResponse.json({ error: "File is empty" }, { status: 400 })
    }

    if (file.size > 1000 * 1024 * 1024) { // 1000MB limit
      return NextResponse.json({ error: "File too large (max 1000MB)" }, { status: 400 })
    }

    if (!file.name.toLowerCase().endsWith('.zip')) {
      return NextResponse.json({ error: "Only ZIP files are allowed" }, { status: 400 })
    }

    // Get current content URL to preserve the path
    const currentContentUrl = content.contentUrl
    if (!currentContentUrl) {
      return NextResponse.json({ error: "Content has no existing file path" }, { status: 400 })
    }

    // Update content status to PROCESSING and reset progress to 0
    await prisma.contentData.update({
      where: { id: contentId },
      data: { 
        status: "PROCESSING",
        progress: 0,
        contentType: contentType as "FILE_ZIP_HTML" | "FILE_ZIP_SCORM"
      }
    })

    // Process file asynchronously
    setTimeout(async () => {
      try {
        const buffer = Buffer.from(await file.arrayBuffer())
        const uploadsDir = join(process.cwd(), "public", "uploads")
        const contentDir = join(uploadsDir, currentContentUrl.replace('/uploads/', ''))
        
        // Ensure content directory exists
        await mkdir(contentDir, { recursive: true })

        // Remove old files but keep the directory structure
        const fs = require('fs')
        if (existsSync(contentDir)) {
          const files = fs.readdirSync(contentDir)
          for (const file of files) {
            const filePath = join(contentDir, file)
            const stat = fs.statSync(filePath)
            if (stat.isFile()) {
              fs.unlinkSync(filePath)
            }
          }
        }

        // Extract ZIP file
        await new Promise<void>((resolve, reject) => {
          yauzl.fromBuffer(buffer, { lazyEntries: true }, (err, zipfile) => {
            if (err) {
              reject(err)
              return
            }

            if (!zipfile) {
              reject(new Error("Invalid ZIP file"))
              return
            }

            let processedEntries = 0
            const totalEntries = zipfile.entryCount

            zipfile.readEntry()
            zipfile.on("entry", (entry) => {
              if (/\/$/.test(entry.fileName)) {
                // Directory entry
                zipfile.readEntry()
                return
              }

              zipfile.openReadStream(entry, (err, readStream) => {
                if (err) {
                  reject(err)
                  return
                }

                const filePath = join(contentDir, entry.fileName)
                const dir = dirname(filePath)
                
                mkdir(dir, { recursive: true }).then(() => {
                  const writeStream = createWriteStream(filePath)
                  readStream.pipe(writeStream)
                  
                  writeStream.on("close", () => {
                    processedEntries++
                    if (processedEntries === totalEntries) {
                      resolve()
                    }
                    zipfile.readEntry()
                  })
                  
                  writeStream.on("error", reject)
                }).catch(reject)
              })
            })

            zipfile.on("end", () => {
              if (processedEntries === 0) {
                resolve()
              }
            })
          })
        })

        // Process based on content type
        let description: any = {}
        let launchFile: string | null = null

        if (contentType === "FILE_ZIP_SCORM") {
          // Process SCORM package
          const scormData = await SCORMService.parseManifest(contentDir)
          
          if (scormData) {
            // Find launch file from resources
            const scormLaunchFile = scormData.resources?.[0]?.href || "index.html"
            description = {
              scorm: scormData,
              launchFile: scormLaunchFile
            }
            launchFile = scormLaunchFile
          } else {
            throw new Error("Failed to process SCORM package")
          }
        } else if (contentType === "FILE_ZIP_HTML") {
          // Find HTML launch file
          const fs = require('fs')
          const findHtmlFile = (dir: string): string | null => {
            const files = fs.readdirSync(dir)
            
            // Look for index.html first
            const indexFile = files.find((f: string) => f.toLowerCase() === 'index.html')
            if (indexFile) {
              return indexFile
            }
            
            // Look for any HTML file
            const htmlFile = files.find((f: string) => f.toLowerCase().endsWith('.html'))
            if (htmlFile) {
              return htmlFile
            }
            
            // Recursively search subdirectories
            for (const file of files) {
              const filePath = join(dir, file)
              const stat = fs.statSync(filePath)
              if (stat.isDirectory()) {
                const found = findHtmlFile(filePath)
                if (found) {
                  return join(file, found)
                }
              }
            }
            
            return null
          }
          
          launchFile = findHtmlFile(contentDir)
          if (!launchFile) {
            throw new Error("No HTML file found in package")
          }
          
          description = {
            launchFile,
            type: "html"
          }
        }

        // Update content with new description and status
        await prisma.contentData.update({
          where: { id: contentId },
          data: {
            description: JSON.stringify(description),
            status: "COMPLETED"
          }
        })

        console.log(`Successfully updated content ${contentId} with new file`)

      } catch (error) {
        console.error("Error processing file for content:", contentId, error)
        
        // Update content status to FAILED
        try {
          await prisma.contentData.update({
            where: { id: contentId },
            data: { status: "FAILED" }
          })
        } catch (updateError) {
          console.error("Failed to update status to FAILED:", updateError)
        }
      }
    }, 2000)

    return NextResponse.json({ 
      message: "File update started successfully",
      contentId: contentId 
    })
  } catch (error) {
    console.error("Error updating file:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
