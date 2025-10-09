import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/session"
import { PermissionName } from "@prisma/client"
import { hasPermission as checkPermission, hasAnyPermission } from "@/lib/permissions"
import { Prisma } from "@prisma/client"
import { writeFile, mkdir } from "fs/promises"
import { join, dirname } from "path"
import { existsSync, createWriteStream } from "fs"
// @ts-ignore
import unzipper from "unzipper"
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

// Helper function to detect wrapper folder in ZIP
function detectWrapperFolder(allFiles: string[]): string | null {
  if (allFiles.length === 0) return null
  
  // Find common prefix in all file paths
  const paths = allFiles.map(f => f.split('/'))
  if (paths.length === 0) return null
  
  const firstPath = paths[0]
  let commonPrefix = ''
  
  for (let i = 0; i < firstPath.length; i++) {
    const segment = firstPath[i]
    if (paths.every(path => path[i] === segment)) {
      commonPrefix += (commonPrefix ? '/' : '') + segment
    } else {
      break
    }
  }
  
  // If all files share a common prefix folder, that's likely the wrapper
  if (commonPrefix && paths.every(path => path.length > 1 && path[0] === commonPrefix.split('/')[0])) {
    return commonPrefix.split('/')[0]
  }
  
  return null
}

// Helper function to validate ZIP contains expected HTML file
async function validateZipContainsHtmlFile(
  buffer: Buffer, 
  expectedHtmlFile: string | null, 
  launchDir: string | null
): Promise<{ isValid: boolean; error?: string; foundFiles?: string[]; wrapperFolder?: string }> {
  return new Promise((resolve) => {
    const stream = unzipper.Parse()
    let foundExpectedFile = false
    let foundAnyHtmlFile = false
    const foundHtmlFiles: string[] = []
    const allFiles: string[] = []
    
    stream.on('entry', (entry: any) => {
      const fileName = entry.path.replace(/\\/g, '/')
      const type = entry.type
      
      if (type === 'Directory') {
        entry.autodrain()
        return
      }
      
      allFiles.push(fileName)
      
      // Check if it's an HTML file
      if (fileName.toLowerCase().endsWith('.html') || fileName.toLowerCase().endsWith('.htm')) {
        foundAnyHtmlFile = true
        foundHtmlFiles.push(fileName)
        
        // If we have a specific expected file, check for it with multiple patterns
        if (expectedHtmlFile && launchDir) {
          // Pattern 1: exact match with launchDir
          const expectedPath1 = `${launchDir}/${expectedHtmlFile}`
          // Pattern 2: file in any subdirectory with same name
          const expectedPath2 = `**/${expectedHtmlFile}`
          // Pattern 3: file in root with same name
          const expectedPath3 = expectedHtmlFile
          
          if (fileName === expectedPath1 || 
              fileName.endsWith(`/${expectedHtmlFile}`) ||
              fileName === expectedPath3 ||
              fileName.includes(`/${expectedHtmlFile}`)) {
            foundExpectedFile = true
          }
        } else if (expectedHtmlFile) {
          // If no launchDir, check if file exists anywhere
          if (fileName === expectedHtmlFile || 
              fileName.endsWith(`/${expectedHtmlFile}`) ||
              fileName.includes(`/${expectedHtmlFile}`)) {
            foundExpectedFile = true
          }
        }
      }
      
      entry.autodrain()
    })
    
    stream.on('end', () => {
      // Detect wrapper folder
      const wrapperFolder = detectWrapperFolder(allFiles)
      
      if (expectedHtmlFile) {
        if (foundExpectedFile) {
          resolve({ 
            isValid: true, 
            wrapperFolder: wrapperFolder || undefined
          })
        } else {
          resolve({ 
            isValid: false, 
            error: `File ZIP không chứa file HTML mong đợi: ${expectedHtmlFile}. Các file HTML tìm thấy: ${foundHtmlFiles.join(', ')}. ${wrapperFolder ? `Phát hiện folder wrapper: ${wrapperFolder}` : ''} Vui lòng kiểm tra lại cấu trúc file ZIP.`,
            foundFiles: foundHtmlFiles,
            wrapperFolder: wrapperFolder || undefined
          })
        }
      } else {
        if (foundAnyHtmlFile) {
          resolve({ 
            isValid: true,
            wrapperFolder: wrapperFolder || undefined
          })
        } else {
          resolve({ 
            isValid: false, 
            error: "File ZIP không chứa file HTML nào. Vui lòng kiểm tra lại file ZIP." 
          })
        }
      }
    })
    
    stream.on('error', () => {
      resolve({ 
        isValid: false, 
        error: "Lỗi khi đọc file ZIP. Vui lòng kiểm tra lại file." 
      })
    })
    
    stream.end(buffer)
  })
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
    const hasManageOwnContent = await checkPermission(session.user.id, PermissionName.MANAGE_OWN_CONTENT)
    const hasManageAllContent = await checkPermission(session.user.id, PermissionName.MANAGE_ALL_CONTENT)

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

    // Update content status to PROCESSING and reset progress to 0 using transaction
    await prisma.$transaction(async (tx) => {
      await tx.contentData.update({
        where: { id: contentId },
        data: { 
          status: "PROCESSING",
          progress: 0,
          contentType: contentType as "FILE_ZIP_HTML" | "FILE_ZIP_SCORM"
        }
      })
    })

    // Process file asynchronously
    setTimeout(async () => {
      try {
        const buffer = Buffer.from(await file.arrayBuffer())
        const uploadsDir = join(process.cwd(), "public", "uploads")
        const contentDir = join(uploadsDir, currentContentUrl.replace('/uploads/', ''))
        
        // Get current launchFile from existing content description
        let currentLaunchFile: string | null = null
        if (content.description) {
          try {
            const desc = typeof content.description === 'string' 
              ? JSON.parse(content.description) 
              : content.description
            currentLaunchFile = desc.launchFile || null
          } catch (e) {
            console.warn("Failed to parse existing description:", e)
          }
        }
        
        // First, remove ALL contents from the content directory (contentUrl)
        const fs = require('fs')
        if (existsSync(contentDir)) {
          // Function to recursively remove directory contents
          const removeDirectoryContents = (dir: string) => {
            if (fs.existsSync(dir)) {
              const files = fs.readdirSync(dir)
              for (const file of files) {
                const filePath = join(dir, file)
                const stat = fs.statSync(filePath)
                if (stat.isDirectory()) {
                  // Recursively remove subdirectory
                  removeDirectoryContents(filePath)
                  fs.rmdirSync(filePath)
                } else {
                  // Remove file
                  fs.unlinkSync(filePath)
                }
              }
            }
          }
          
          // Remove all contents of the content directory
          removeDirectoryContents(contentDir)
        }
        
        // Determine target directory based on current launchFile to preserve URL structure
        let targetDir = contentDir
        let launchDir: string | null = null
        let expectedHtmlFile: string | null = null
        
        if (currentLaunchFile && currentLaunchFile.includes('/')) {
          // Extract directory from launchFile (e.g., "chon_so_thich_hop/index.html" -> "chon_so_thich_hop")
          launchDir = currentLaunchFile.split('/')[0]
          expectedHtmlFile = currentLaunchFile.split('/')[1] // e.g., "index.html"
          targetDir = join(contentDir, launchDir)
        }
        
        // Ensure target directory exists
        await mkdir(targetDir, { recursive: true })

        // First, validate that the ZIP contains the expected HTML file
        const zipValidationResult = await validateZipContainsHtmlFile(buffer, expectedHtmlFile, launchDir)
        if (!zipValidationResult.isValid) {
          // Rollback: remove the created directory and update status to FAILED
          const fs = require('fs')
          if (existsSync(targetDir)) {
            fs.rmSync(targetDir, { recursive: true, force: true })
          }
          
          await prisma.$transaction(async (tx) => {
            await tx.contentData.update({
              where: { id: contentId },
              data: { 
                status: "FAILED",
                description: {
                  error: zipValidationResult.error,
                  originalLaunchFile: currentLaunchFile,
                  foundFiles: zipValidationResult.foundFiles || [],
                  wrapperFolder: zipValidationResult.wrapperFolder
                } as Prisma.InputJsonValue
              }
            })
          })
          
          console.log(`ZIP validation failed for content ${contentId}:`, {
            expectedHtmlFile,
            launchDir,
            foundFiles: zipValidationResult.foundFiles,
            wrapperFolder: zipValidationResult.wrapperFolder,
            error: zipValidationResult.error
          })
          
          throw new Error(zipValidationResult.error)
        }

        // Store wrapper folder info for extraction
        const wrapperFolder = zipValidationResult.wrapperFolder

        // Extract ZIP file using unzipper
        await new Promise<void>((resolve, reject) => {
          const stream = unzipper.Parse()
          let processedEntries = 0
          let totalEntries = 0
          let isComplete = false

          // First pass: count total files
          const countStream = unzipper.Parse()
          countStream.on('entry', (entry: any) => {
            if (entry.type === 'File') {
              totalEntries++
            }
            entry.autodrain()
          })
          
          countStream.on('end', () => {
            // Second pass: extract files
            const extractStream = unzipper.Parse()
            
            extractStream.on('entry', async (entry: any) => {
              const fileName = entry.path
              const type = entry.type
              
              if (type === 'Directory') {
                entry.autodrain()
                return
              }

              // Normalize entry path and handle wrapper folder
              const normalizedEntry = fileName.replace(/\\/g, '/')
              let relativePath = normalizedEntry
              
              // First, strip wrapper folder if detected
              if (wrapperFolder && relativePath.startsWith(wrapperFolder + '/')) {
                relativePath = relativePath.slice(wrapperFolder.length + 1)
              }
              
              // Then, if we already extract into launchDir, and the zip entries also start with the same folder,
              // strip that prefix to avoid duplicated nested folders like launchDir/launchDir/...
              if (launchDir && targetDir !== contentDir) {
                const prefix = launchDir + '/'
                if (relativePath.startsWith(prefix)) {
                  relativePath = relativePath.slice(prefix.length)
                }
              }
              
              const filePath = join(targetDir, relativePath)
              const dir = dirname(filePath)
              
              try {
                // Ensure directory exists
                await mkdir(dir, { recursive: true })
                
                // Create write stream and pipe entry to it
                const writeStream = createWriteStream(filePath)
                entry.pipe(writeStream)
                
                writeStream.on('close', () => {
                  processedEntries++
                  if (isComplete && processedEntries === totalEntries) {
                    resolve()
                  }
                })
                
                writeStream.on('error', (err) => {
                  reject(err)
                })
              } catch (err) {
                reject(err)
              }
            })

            extractStream.on('end', () => {
              isComplete = true
              if (processedEntries === totalEntries) {
                resolve()
              }
            })

            extractStream.on('error', (err: any) => {
              reject(err)
            })

            // Start extraction
            extractStream.end(buffer)
          })
          
          countStream.on('error', (err: any) => {
            reject(err)
          })
          
          // Count entries first
          countStream.end(buffer)
        })

        // Process based on content type
        let description: any = {}
        let launchFile: string | null = null

        if (contentType === "FILE_ZIP_SCORM") {
          // Process SCORM package
          const scormData = await SCORMService.parseManifest(targetDir)
          
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
          // Keep the existing launchFile to preserve URL structure
          if (currentLaunchFile) {
            // Use the existing launchFile to maintain the same URL
            launchFile = currentLaunchFile
            description = {
              launchFile,
              type: "html"
            }
          } else {
            // Fallback: Find HTML launch file if no existing launchFile
            const fs = require('fs')
            const findHtmlFile = (dir: string): string | null => {
              const files = fs.readdirSync(dir)
              
              // First, look for subdirectories that might contain index.html
              const subdirs = files.filter((f: string) => {
                const filePath = join(dir, f)
                const stat = fs.statSync(filePath)
                return stat.isDirectory()
              })
              
              // Check subdirectories for index.html first (priority)
              for (const subdir of subdirs) {
                const subdirPath = join(dir, subdir)
                const subdirFiles = fs.readdirSync(subdirPath)
                const indexFile = subdirFiles.find((f: string) => f.toLowerCase() === 'index.html')
                if (indexFile) {
                  return join(subdir, indexFile)
                }
              }
              
              // Then look for index.html in root directory
              const indexFile = files.find((f: string) => f.toLowerCase() === 'index.html')
              if (indexFile) {
                return indexFile
              }
              
              // Look for any HTML file in subdirectories
              for (const subdir of subdirs) {
                const subdirPath = join(dir, subdir)
                const subdirFiles = fs.readdirSync(subdirPath)
                const htmlFile = subdirFiles.find((f: string) => f.toLowerCase().endsWith('.html'))
                if (htmlFile) {
                  return join(subdir, htmlFile)
                }
              }
              
              // Finally, look for any HTML file in root
              const htmlFile = files.find((f: string) => f.toLowerCase().endsWith('.html'))
              if (htmlFile) {
                return htmlFile
              }
              
              return null
            }
            
            const absoluteLaunchFile = findHtmlFile(targetDir)
            if (!absoluteLaunchFile) {
              throw new Error("No HTML file found in package")
            }
            
            // Convert absolute path to relative path for launchFile
            launchFile = absoluteLaunchFile.replace(targetDir + '/', '')
            
            description = {
              launchFile,
              type: "html"
            }
          }
        }

        // Update content with new description and status using transaction
        await prisma.$transaction(async (tx) => {
          await tx.contentData.update({
            where: { id: contentId },
            data: {
              description: description as Prisma.InputJsonValue,
              status: "COMPLETED",
              progress: 100
            }
          })
        })

        console.log(`Successfully updated content ${contentId} with new file`)

      } catch (error) {
        console.error("Error processing file for content:", contentId, error)
        
        // Update content status to FAILED using transaction
        try {
          await prisma.$transaction(async (tx) => {
            await tx.contentData.update({
              where: { id: contentId },
              data: { status: "FAILED" }
            })
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
