import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/session"
import { PermissionName, ShareStatus } from "@prisma/client"
import { hasPermission as checkPermission, hasAnyPermission } from "@/lib/permissions"
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

// Helper function to extract ZIP file
function extractZip(zipPath: string, extractPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    yauzl.open(zipPath, { lazyEntries: true }, (err, zipfile) => {
      if (err) {
        console.error("Error opening ZIP file:", err)
        reject(err)
        return
      }

      if (!zipfile) {
        reject(new Error("Failed to open ZIP file"))
        return
      }

      zipfile.readEntry()
      zipfile.on("entry", (entry) => {
        if (/\/$/.test(entry.fileName)) {
          // Directory entry - create directory
          const dirPath = join(extractPath, entry.fileName)
          mkdir(dirPath, { recursive: true })
            .then(() => zipfile.readEntry())
            .catch((dirErr) => {
              console.error("Error creating directory:", dirErr)
              reject(dirErr)
            })
        } else {
          // File entry
          zipfile.openReadStream(entry, (err, readStream) => {
            if (err) {
              console.error("Error opening read stream:", err)
              reject(err)
              return
            }

            if (!readStream) {
              reject(new Error("Failed to create read stream"))
              return
            }

            const filePath = join(extractPath, entry.fileName)
            const fileDir = dirname(filePath)
            
            // Ensure directory exists before writing file
            mkdir(fileDir, { recursive: true })
              .then(() => {
                const writeStream = createWriteStream(filePath)
                
                readStream.pipe(writeStream)
                writeStream.on("close", () => {
                  zipfile.readEntry()
                })
                writeStream.on("error", (writeErr) => {
                  console.error("Error writing file:", writeErr)
                  reject(writeErr)
                })
              })
              .catch((dirErr) => {
                console.error("Error creating file directory:", dirErr)
                reject(dirErr)
              })
          })
        }
      })

      zipfile.on("end", () => {
        console.log("ZIP extraction completed successfully")
        resolve()
      })

      zipfile.on("error", (zipErr) => {
        console.error("ZIP file error:", zipErr)
        reject(zipErr)
      })
    })
  })
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; moduleId: string }> }
) {
  try {
    const { id: projectId, moduleId } = await params

    // Require authenticated session
    const session = await getSession()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify project and module exist
    const project = await prisma.project.findUnique({
      where: { id: projectId }
    })

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    const module = await prisma.module.findUnique({
      where: { id: moduleId }
    })

    if (!module) {
      return NextResponse.json({ error: "Module not found" }, { status: 404 })
    }

    // Permission/Role-based visibility
    const isAdmin = (session.user.roles || []).includes("ADMINISTRATOR")
    const canViewAll = isAdmin || await checkPermission(PermissionName.MANAGE_ALL_CONTENT, session.user.id)
    const canViewDeletedAll = await checkPermission(PermissionName.VIEW_DELETED_ALL_CONTENT, session.user.id)
    const canViewDeletedOwn = await checkPermission(PermissionName.VIEW_DELETED_OWN_CONTENT, session.user.id)

    const whereClause: any = {
      projectId,
      moduleId,
    }

    if (canViewAll || canViewDeletedAll) {
      // Admin or VIEW_DELETED_ALL_CONTENT: See ALL content (including deleted)
      // No additional filters needed
    } else {
      // Regular users: complex visibility logic
      const orConditions: any[] = []
      
      // Own content
      if (canViewDeletedOwn) {
        // Can see own content (both active and deleted)
        orConditions.push({ ownerId: session.user.id })
      } else {
        // Can only see own ACTIVE content
        orConditions.push({ ownerId: session.user.id, isDeleted: false })
      }
      
      // Shared content - ALWAYS exclude deleted (shared users should NOT see deleted content)
      orConditions.push({ 
        isDeleted: false, // Critical: shared content must not be deleted
        shares: { some: { sharedWithId: session.user.id, canView: true, status: ShareStatus.ACTIVE } } 
      })
      
      whereClause.OR = orConditions
    }

    const content = await prisma.contentData.findMany({
      where: whereClause,
      include: {
        owner: {
          select: { id: true, username: true, name: true, email: true }
        },
        shares: {
          where: { sharedWithId: session.user.id, status: ShareStatus.ACTIVE },
          select: { canView: true, canDownload: true, canEdit: true, canDelete: true, sharedById: true }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    })

    // Transform to include share permissions for current user
    const transformedContent = content.map(item => {
      const share = item.shares?.[0] // Get user's share if exists
      return {
        ...item,
        isShared: !!share,
        sharePermissions: share ? {
          canView: share.canView,
          canDownload: share.canDownload,
          canEdit: share.canEdit,
          canDelete: share.canDelete
        } : null
      }
    })

    return NextResponse.json({ data: transformedContent })
  } catch (error) {
    console.error("Error fetching content:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; moduleId: string }> }
) {
  try {
    const guard = await verifyCsrfAndOrigin(request)
    if (guard) return NextResponse.json({ error: guard.error }, { status: guard.status })

    const session = await getSession()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const { id: projectId, moduleId } = await params

    // Verify project and module exist
    const project = await prisma.project.findUnique({
      where: { id: projectId }
    })

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    const module = await prisma.module.findUnique({
      where: { id: moduleId }
    })

    if (!module) {
      return NextResponse.json({ error: "Module not found" }, { status: 404 })
    }

    // Permission check for creating content
    const canCreate = await hasAnyPermission([
      PermissionName.EDIT_CONTENT,
      PermissionName.MANAGE_OWN_CONTENT
    ], session.user.id)
    if (!canCreate) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Parse form data
    const formData = await request.formData()
    const title = formData.get("title") as string
    const description = formData.get("description") as string | null
    const contentType = formData.get("contentType") as "FILE_ZIP_HTML" | "FILE_ZIP_SCORM"
    const file = formData.get("file") as File

    if (!title || !contentType || !file) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Check if content with same title already exists
    const existingContent = await prisma.contentData.findFirst({
      where: {
        projectId,
        moduleId,
        title: title as any,
        isDeleted: false
      } as any
    })

    if (existingContent) {
      return NextResponse.json(
        { error: "Content with this title already exists" },
        { status: 409 }
      )
    }

    // Create directory structure: <project_name>/<module_name>/<file_name + timestamp>
    const timestamp = Date.now()
    const fileNameWithoutExt = file.name.replace(/\.[^/.]+$/, "")
    const extractedDirName = `${fileNameWithoutExt}_${timestamp}`
    
    const uploadDir = join(
      process.cwd(), 
      "public", 
      "uploads", 
      "content",
      sanitizeVietnameseString(project.name), // Sanitize project name
      sanitizeVietnameseString(module.name),  // Sanitize module name
      extractedDirName
    )

    // Create directory structure
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    // Save ZIP file temporarily
    const tempZipPath = join(uploadDir, file.name)
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(tempZipPath, buffer)

    // Extract ZIP file
    try {
      console.log("Starting ZIP extraction...")
      console.log("ZIP path:", tempZipPath)
      console.log("Extract to:", uploadDir)
      
      await extractZip(tempZipPath, uploadDir)
      console.log("ZIP extraction completed")
      
      // Remove temporary ZIP file
      await require('fs').promises.unlink(tempZipPath)
      console.log("Temporary ZIP file removed")
    } catch (extractError) {
      console.error("Error extracting ZIP:", extractError)
      const errorMessage = extractError instanceof Error ? extractError.message : "Unknown error"
      return NextResponse.json(
        { error: "Failed to extract ZIP file", details: errorMessage },
        { status: 400 }
      )
    }

    // Create content record
    const relativePath = `/uploads/content/${project.name.replace(/[^a-zA-Z0-9]/g, "_")}/${module.name.replace(/[^a-zA-Z0-9]/g, "_")}/${extractedDirName}`
    
    const content = await prisma.contentData.create({
      data: {
        title,
        description: (() => {
          if (!description) return null
          try {
            const parsed = JSON.parse(description)
            return parsed as Prisma.InputJsonValue
          } catch {
            // if client sent plain text, wrap into object
            return { text: description } as Prisma.InputJsonValue
          }
        })(),
        contentType,
        contentUrl: relativePath,
        fileSize: file.size, // Store as number instead of BigInt
        projectId,
        moduleId,
        ownerId: session.user.id,
        status: "PROCESSING" as any,
        progress: 0
      } as any
    })

    // Process extracted content
    setTimeout(async () => {
      try {
        // Update progress: Starting extraction (10%)
        await prisma.contentData.update({
          where: { id: content.id },
          data: { progress: 10 } as any
        })

        // Use transaction to ensure atomicity
        await prisma.$transaction(async (tx) => {
        // Find index file (index.html, index.htm, or first HTML file)
        const fs = require('fs')
        const path = require('path')
        
        // Update progress: Finding files (20%)
        await tx.contentData.update({
          where: { id: content.id },
          data: { progress: 20 } as any
        })
        
        const findIndexFile = (dir: string): string | null => {
          const files = fs.readdirSync(dir)
          
          // First, look for subdirectories that might contain index.html
          const subdirs = files.filter((file: string) => {
            const fullPath = path.join(dir, file)
            return fs.statSync(fullPath).isDirectory()
          })
          
          // Check subdirectories for index.html first (priority)
          for (const subdir of subdirs) {
            const subdirPath = path.join(dir, subdir)
            const subdirFiles = fs.readdirSync(subdirPath)
            const indexFile = subdirFiles.find((f: string) => 
              f.toLowerCase() === 'index.html' || f.toLowerCase() === 'index.htm'
            )
            if (indexFile) {
              return path.join(subdirPath, indexFile)
            }
          }
          
          // Then look for index files in root directory
          const indexFiles = files.filter((file: string) => 
            file.toLowerCase() === 'index.html' || 
            file.toLowerCase() === 'index.htm'
          )
          
          if (indexFiles.length > 0) {
            return path.join(dir, indexFiles[0])
          }
          
          // Look for any HTML file in subdirectories
          for (const subdir of subdirs) {
            const subdirPath = path.join(dir, subdir)
            const subdirFiles = fs.readdirSync(subdirPath)
            const htmlFile = subdirFiles.find((f: string) => 
              f.toLowerCase().endsWith('.html') || f.toLowerCase().endsWith('.htm')
            )
            if (htmlFile) {
              return path.join(subdirPath, htmlFile)
            }
          }
          
          // Finally, look for any HTML file in root
          const htmlFiles = files.filter((file: string) => 
            file.toLowerCase().endsWith('.html') || 
            file.toLowerCase().endsWith('.htm')
          )
          
          if (htmlFiles.length > 0) {
            return path.join(dir, htmlFiles[0])
          }
          
          return null
        }
        
        const indexFile = findIndexFile(uploadDir)
        
        // Update progress: Files found (30%)
        await tx.contentData.update({
          where: { id: content.id },
          data: { progress: 30 } as any
        })
        
        let launchFile: string | null = null
        let scormInfo: any = null

        if (contentType === "FILE_ZIP_SCORM") {
          // Process SCORM package
          console.log("Processing SCORM package...")
          
          // Update progress: Validating SCORM (40%)
          await tx.contentData.update({
            where: { id: content.id },
            data: { progress: 40 } as any
          })
          
          try {
            const validation = await SCORMService.validateSCORMPackage(uploadDir)
            
            if (validation.isValid && validation.manifest) {
              const manifest = validation.manifest
              const manifestPath = join(uploadDir, 'imsmanifest.xml')
              const scormVersion = existsSync(manifestPath) 
                ? SCORMService.detectSCORMVersion(manifestPath)
                : SCORMService.getSCORMVersion(manifest)
              launchFile = SCORMService.findLaunchFile(manifest, uploadDir)
              
              scormInfo = {
                version: scormVersion,
                title: manifest.title,
                identifier: manifest.identifier,
                organizations: manifest.organizations.length,
                resources: manifest.resources.length,
                validation: {
                  errors: validation.errors,
                  warnings: validation.warnings
                }
              }
              
              // Update progress: SCORM processed (60%)
              await tx.contentData.update({
                where: { id: content.id },
                data: { progress: 60 } as any
              })
              
              console.log("SCORM package validated:", scormInfo)
            } else {
              console.warn("SCORM validation failed, falling back to HTML processing:", validation.errors)
              // Fallback to HTML processing if SCORM validation fails
              if (indexFile) {
                launchFile = indexFile.replace(uploadDir + '/', '')
              }
            }
          } catch (scormError) {
            console.warn("SCORM processing failed, falling back to HTML processing:", scormError)
            // Fallback to HTML processing if SCORM processing fails
            if (indexFile) {
              launchFile = indexFile.replace(uploadDir + '/', '')
            }
          }
        } else {
          // Process HTML package
          // Update progress: Processing HTML (50%)
          await tx.contentData.update({
            where: { id: content.id },
            data: { progress: 50 } as any
          })
          
          if (indexFile) {
            launchFile = indexFile.replace(uploadDir + '/', '')
          }
        }
        
        if (launchFile) {
          // Update progress: Saving content (80%)
          await tx.contentData.update({
            where: { id: content.id },
            data: { progress: 80 } as any
          })
          
          // Update content with directory path and SCORM info
          const relativeDirPath = uploadDir.replace(process.cwd() + '/public', '')
          
          await tx.contentData.update({
            where: { id: content.id },
            data: {
              status: "COMPLETED" as any,
              progress: 100,
              contentUrl: relativeDirPath,
              // Store description with launch file and SCORM info (if available)
              description: (() => {
                try {
                  const existingDesc = (content as any).description && typeof (content as any).description === 'object'
                    ? (content as any).description
                    : {}
                  
                  const newDesc: any = {
                    ...existingDesc,
                    launchFile: launchFile
                  }
                  
                  // Add SCORM info if it's a SCORM package
                  if (scormInfo) {
                    newDesc.scorm = {
                      version: scormInfo.version,
                      title: scormInfo.title,
                      identifier: scormInfo.identifier,
                      organizations: scormInfo.organizations,
                      resources: scormInfo.resources,
                      validation: {
                        errors: scormInfo.validation.errors,
                        warnings: scormInfo.validation.warnings
                      }
                    }
                  }
                  
                  return newDesc as Prisma.InputJsonValue
                } catch (error) {
                  console.error('Error merging existing description:', error)
                  const fallbackDesc: any = {
                    launchFile: launchFile
                  }
                  
                  if (scormInfo) {
                    fallbackDesc.scorm = {
                      version: scormInfo.version,
                      title: scormInfo.title,
                      identifier: scormInfo.identifier
                    }
                  }
                  
                  return fallbackDesc as Prisma.InputJsonValue
                }
              })()
            } as any
          })
          
          console.log(`Content processed successfully. Launch file: ${launchFile}`)
        } else {
          // No index file found, mark as failed
          await tx.contentData.update({
            where: { id: content.id },
            data: {
              status: "FAILED" as any,
              progress: 0
            } as any
          })
        }
        }) // End transaction
      } catch (error) {
        console.error("Error processing content:", error)
        // If transaction fails, update status outside transaction
        try {
          await prisma.contentData.update({
            where: { id: content.id },
            data: {
              status: "FAILED" as any,
              progress: 0
            } as any
          })
        } catch (updateError) {
          console.error("Failed to update status to FAILED:", updateError)
        }
      }
    }, 2000)

    return NextResponse.json({ data: content })
  } catch (error) {
    console.error("Error creating content:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
