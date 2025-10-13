import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/session"
import { PermissionName } from "@prisma/client"
import { hasPermission as checkPermission, hasAnyPermission } from "@/lib/permissions"
import { Prisma } from "@prisma/client"
import { writeFile, mkdir } from "fs/promises"
import { join, dirname } from "path"
import { existsSync, createWriteStream } from "fs"
import yauzl from "yauzl"
import { SCORMService } from "@/services/scormService"

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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; moduleId: string; contentId: string }> }
) {
  try {
    const session = await getSession()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const { id: projectId, moduleId, contentId } = await params

    // Verify project and module exist
    const project = await prisma.project.findUnique({
      where: { id: Number(projectId) as any }
    })

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    const module = await prisma.module.findUnique({
      where: { id: Number(moduleId) as any }
    })

    if (!module) {
      return NextResponse.json({ error: "Module not found" }, { status: 404 })
    }

    // Find the content to update
    const content = await prisma.contentData.findUnique({
      where: { id: Number(contentId) as any },
      include: {
        owner: { select: { id: true, name: true, email: true } }
      }
    })

    if (!content) {
      return NextResponse.json({ error: "Content not found" }, { status: 404 })
    }

    // Permission check for updating content
    const isAdmin = (session.user.roles || []).includes("ADMINISTRATOR")
    const canManageAll = isAdmin || await checkPermission(PermissionName.MANAGE_ALL_CONTENT, session.user.id)
    const isOwner = content.ownerId === Number(session.user.id) as any

    if (!canManageAll && !isOwner) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const canUpdate = await hasAnyPermission([
      PermissionName.EDIT_CONTENT,
      PermissionName.MANAGE_OWN_CONTENT
    ], session.user.id)
    
    if (!canUpdate) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Parse form data
    const formData = await request.formData()
    const contentType = formData.get("contentType") as "FILE_ZIP_HTML" | "FILE_ZIP_SCORM"
    const file = formData.get("file") as File

    if (!contentType || !file) {
      return NextResponse.json(
        { error: "Missing required fields: contentType and file" },
        { status: 400 }
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

    // Update content record with new file
    const relativePath = `/uploads/content/${project.name.replace(/[^a-zA-Z0-9]/g, "_")}/${module.name.replace(/[^a-zA-Z0-9]/g, "_")}/${extractedDirName}`
    
    // Update content with new file info
    await prisma.contentData.update({
      where: { id: Number(contentId) as any },
      data: {
        contentType,
        contentUrl: relativePath,
        fileSize: file.size,
        status: "PROCESSING" as any,
        progress: 0
      } as any
    })

    // Process extracted content
    setTimeout(async () => {
      try {
        // Update progress: Starting extraction (10%)
        await prisma.contentData.update({
          where: { id: Number(contentId) as any },
          data: { progress: 10 } as any
        })

        // Use transaction to ensure atomicity
        await prisma.$transaction(async (tx) => {
        // Find index file (index.html, index.htm, or first HTML file)
        const fs = require('fs')
        const path = require('path')
        
        // Update progress: Finding files (20%)
        await tx.contentData.update({
          where: { id: Number(contentId) as any },
          data: { progress: 20 } as any
        })
        
        const findIndexFile = (dir: string): string | null => {
          const files = fs.readdirSync(dir)
          
          // Look for index files first
          const indexFiles = files.filter((file: string) => 
            file.toLowerCase() === 'index.html' || 
            file.toLowerCase() === 'index.htm'
          )
          
          if (indexFiles.length > 0) {
            return path.join(dir, indexFiles[0])
          }
          
          // Look for any HTML file
          const htmlFiles = files.filter((file: string) => 
            file.toLowerCase().endsWith('.html') || 
            file.toLowerCase().endsWith('.htm')
          )
          
          if (htmlFiles.length > 0) {
            return path.join(dir, htmlFiles[0])
          }
          
          // Look in subdirectories
          for (const file of files) {
            const fullPath = path.join(dir, file)
            if (fs.statSync(fullPath).isDirectory()) {
              const found = findIndexFile(fullPath)
              if (found) return found
            }
          }
          
          return null
        }
        
        const indexFile = findIndexFile(uploadDir)
        
        // Update progress: Files found (30%)
        await tx.contentData.update({
          where: { id: Number(contentId) as any },
          data: { progress: 30 } as any
        })
        
        let launchFile: string | null = null
        let scormInfo: any = null

        if (contentType === "FILE_ZIP_SCORM") {
          // Process SCORM package
          console.log("Processing SCORM package...")
          
          // Update progress: Validating SCORM (40%)
          await tx.contentData.update({
            where: { id: Number(contentId) as any },
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
                where: { id: Number(contentId) as any },
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
            where: { id: Number(contentId) as any },
            data: { progress: 50 } as any
          })
          
          if (indexFile) {
            launchFile = indexFile.replace(uploadDir + '/', '')
          }
        }
        
        if (launchFile) {
          // Update progress: Saving content (80%)
          await tx.contentData.update({
            where: { id: Number(contentId) as any },
            data: { progress: 80 } as any
          })
          
          // Update content with directory path and SCORM info
          const relativeDirPath = uploadDir.replace(process.cwd() + '/public', '')
          
          await tx.contentData.update({
            where: { id: Number(contentId) as any },
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
            where: { id: Number(contentId) as any },
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
            where: { id: Number(contentId) as any },
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

    return NextResponse.json({ 
      message: "File upload started successfully",
      contentId: contentId 
    })
  } catch (error) {
    console.error("Error uploading file:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
