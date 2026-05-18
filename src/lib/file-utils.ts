/**
 * Shared file utility functions for content management routes.
 * Centralizes ZIP handling, file streaming, path sanitization, and validation.
 */

import { mkdir, unlink } from "fs/promises"
import { join, dirname, sep } from "path"
import { createWriteStream } from "fs"
import { pipeline } from "stream/promises"
import { Readable } from "stream"
import yauzl from "yauzl"
import archiver from "archiver"

// ─── File Validation ────────────────────────────────────────────────────────

export interface FileValidationError {
  error: string
  code: 'NO_FILE' | 'EMPTY_FILE' | 'FILE_TOO_LARGE' | 'INVALID_EXTENSION' | 'INVALID_CONTENT_TYPE'
}

export interface FileValidationOptions {
  maxSizeBytes?: number
  allowedExtensions?: string[]
  allowedContentTypes?: string[]
}

const DEFAULT_MAX_SIZE = 1000 * 1024 * 1024 // 1000MB

/**
 * Validate an uploaded file. Returns null if valid, or an error object.
 * Reusable across all upload/update routes.
 */
export function validateUploadedFile(
  file: File | null | undefined,
  options: FileValidationOptions = {}
): FileValidationError | null {
  const {
    maxSizeBytes = DEFAULT_MAX_SIZE,
    allowedExtensions = ['.zip'],
    allowedContentTypes,
  } = options

  if (!file) {
    return { error: "Không có file được chọn", code: 'NO_FILE' }
  }
  if (file.size === 0) {
    return { error: "File rỗng, vui lòng chọn file khác", code: 'EMPTY_FILE' }
  }
  if (file.size > maxSizeBytes) {
    const maxMB = Math.round(maxSizeBytes / (1024 * 1024))
    return { error: `File quá lớn (tối đa ${maxMB}MB, file hiện tại ${Math.round(file.size / (1024 * 1024))}MB)`, code: 'FILE_TOO_LARGE' }
  }
  if (allowedExtensions.length > 0) {
    const ext = '.' + file.name.split('.').pop()?.toLowerCase()
    if (!allowedExtensions.includes(ext)) {
      return { error: `Chỉ chấp nhận file ${allowedExtensions.join(', ')}. File "${file.name}" không hợp lệ.`, code: 'INVALID_EXTENSION' }
    }
  }
  if (allowedContentTypes && allowedContentTypes.length > 0) {
    if (!allowedContentTypes.includes(file.type)) {
      return { error: `Loại file không hợp lệ: ${file.type}`, code: 'INVALID_CONTENT_TYPE' }
    }
  }
  return null
}

/**
 * Sanitize a filename for safe use in file system paths.
 * Handles spaces, Vietnamese characters, and special characters.
 * Preserves the file extension.
 */
export function sanitizeFileName(fileName: string): string {
  // Split extension
  const lastDot = fileName.lastIndexOf('.')
  const name = lastDot > 0 ? fileName.slice(0, lastDot) : fileName
  const ext = lastDot > 0 ? fileName.slice(lastDot) : ''

  const sanitized = name
    // Normalize unicode (decompose Vietnamese diacritics)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    // Replace đ/Đ
    .replace(/[đĐ]/g, 'd')
    // Replace spaces and common separators with underscore
    .replace(/[\s\-]+/g, '_')
    // Remove any remaining special characters (keep alphanumeric, underscore, dot)
    .replace(/[^a-zA-Z0-9_]/g, '')
    // Collapse multiple underscores
    .replace(/_+/g, '_')
    // Trim underscores from start/end
    .replace(/^_+|_+$/g, '')
    .toLowerCase()

  // Fallback if name becomes empty after sanitization
  return (sanitized || 'file') + ext.toLowerCase()
}

/**
 * Convert a file system path to use forward slashes (POSIX style).
 * Critical for cross-platform compatibility — Windows uses backslashes
 * but URLs and stored paths must always use forward slashes.
 */
export function toPosixPath(fsPath: string): string {
  return fsPath.split(sep).join('/')
}

/**
 * Get the relative path from a base directory, always using forward slashes.
 * Replaces patterns like: filePath.replace(baseDir + '/', '')
 */
export function relativePosixPath(filePath: string, baseDir: string): string {
  const normalizedFile = toPosixPath(filePath)
  const normalizedBase = toPosixPath(baseDir)
  if (normalizedFile.startsWith(normalizedBase + '/')) {
    return normalizedFile.slice(normalizedBase.length + 1)
  }
  if (normalizedFile.startsWith(normalizedBase)) {
    return normalizedFile.slice(normalizedBase.length)
  }
  return normalizedFile
}

/**
 * Remove Vietnamese diacritics and sanitize string for file system paths.
 * Converts to lowercase, replaces spaces with underscores, removes special chars.
 */
export function sanitizeVietnameseString(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .replace(/\s+/g, '_')
    .toLowerCase()
}

/**
 * Stream a Web API File/Blob to disk without loading it entirely into memory.
 * Uses pipeline() for proper backpressure handling.
 */
export async function streamFileToDisk(file: File, destPath: string): Promise<void> {
  const dir = dirname(destPath)
  await mkdir(dir, { recursive: true })
  const webStream = file.stream() as unknown as import("stream/web").ReadableStream
  const nodeReadable = Readable.fromWeb(webStream)
  const writeStream = createWriteStream(destPath)
  await pipeline(nodeReadable, writeStream)
}

/**
 * Safely remove a temp ZIP file, ignoring errors.
 */
export async function cleanupTempZip(path: string): Promise<void> {
  try { await unlink(path) } catch { /* ignore */ }
}

/**
 * Detect common top-level wrapper folder in a list of file paths.
 * Returns the folder name if all files share the same top-level directory.
 */
export function detectWrapperFolder(files: string[]): string | null {
  if (files.length === 0) return null
  const firstSegments = files.map(f => f.split('/')[0])
  const first = firstSegments[0]
  if (firstSegments.every(s => s === first) && files.some(f => f.includes('/'))) {
    return first
  }
  return null
}

/**
 * Scan ZIP file on disk to collect all file paths and detect wrapper folder.
 * Memory-efficient: only reads the central directory, not file contents.
 */
export function scanZipEntries(zipPath: string): Promise<{
  allFiles: string[]
  htmlFiles: string[]
  wrapperFolder: string | null
}> {
  return new Promise((resolve, reject) => {
    yauzl.open(zipPath, { lazyEntries: true, autoClose: true }, (err, zipfile) => {
      if (err || !zipfile) return reject(err ?? new Error("Failed to open ZIP"))

      const allFiles: string[] = []
      const htmlFiles: string[] = []

      zipfile.readEntry()
      zipfile.on("entry", (entry) => {
        const name = entry.fileName.replace(/\\/g, '/')
        if (!/\/$/.test(name) && !name.startsWith('__MACOSX/')) {
          allFiles.push(name)
          if (name.toLowerCase().endsWith('.html') || name.toLowerCase().endsWith('.htm')) {
            htmlFiles.push(name)
          }
        }
        zipfile.readEntry()
      })

      zipfile.on("end", () => {
        const wrapperFolder = detectWrapperFolder(allFiles)
        resolve({ allFiles, htmlFiles, wrapperFolder })
      })

      zipfile.on("error", reject)
    })
  })
}

/**
 * Extract ZIP from disk with optional prefix stripping. Memory-efficient — streams each entry.
 * Returns list of extracted file paths and HTML files found.
 */
export function extractZipFromDisk(
  zipPath: string,
  targetDir: string,
  stripPrefix: string = ''
): Promise<{ files: string[]; htmlFiles: string[] }> {
  return new Promise((resolve, reject) => {
    yauzl.open(zipPath, { lazyEntries: true, autoClose: true }, (err, zipfile) => {
      if (err || !zipfile) return reject(err ?? new Error("Failed to open ZIP"))

      const files: string[] = []
      const htmlFiles: string[] = []
      let pending = 0
      let ended = false

      const tryResolve = () => {
        if (ended && pending === 0) resolve({ files, htmlFiles })
      }

      zipfile.readEntry()

      zipfile.on("entry", (entry) => {
        const normalizedName = entry.fileName.replace(/\\/g, '/')

        if (/\/$/.test(normalizedName) || normalizedName.startsWith('__MACOSX/')) {
          zipfile.readEntry()
          return
        }

        // Strip prefix
        let relativePath = normalizedName
        if (stripPrefix && relativePath.startsWith(stripPrefix)) {
          relativePath = relativePath.slice(stripPrefix.length)
        }
        if (!relativePath) {
          zipfile.readEntry()
          return
        }

        files.push(relativePath)
        if (relativePath.toLowerCase().endsWith('.html') || relativePath.toLowerCase().endsWith('.htm')) {
          htmlFiles.push(relativePath)
        }

        zipfile.openReadStream(entry, (streamErr, readStream) => {
          if (streamErr || !readStream) return reject(streamErr ?? new Error("No read stream"))

          const filePath = join(targetDir, relativePath)
          const fileDir = dirname(filePath)

          pending++
          mkdir(fileDir, { recursive: true })
            .then(() => {
              const ws = createWriteStream(filePath)
              readStream.pipe(ws)
              ws.on("close", () => {
                pending--
                tryResolve()
                zipfile.readEntry()
              })
              ws.on("error", reject)
            })
            .catch(reject)
        })
      })

      zipfile.on("end", () => {
        ended = true
        tryResolve()
      })

      zipfile.on("error", reject)
    })
  })
}

/**
 * Simple ZIP extraction without prefix stripping.
 * Used by the content creation route and restore route.
 */
export function extractZipToDir(zipPath: string, destDir: string): Promise<void> {
  return new Promise((resolve, reject) => {
    yauzl.open(zipPath, { lazyEntries: true, autoClose: true }, (err, zipfile) => {
      if (err || !zipfile) return reject(err || new Error("Failed to open zip"))

      zipfile.readEntry()
      zipfile.on("entry", (entry) => {
        if (entry.fileName.replace(/\\/g, '/').startsWith('__MACOSX/')) {
          zipfile.readEntry()
          return
        }
        const fullPath = join(destDir, entry.fileName)

        if (/\/$/.test(entry.fileName)) {
          mkdir(fullPath, { recursive: true })
            .then(() => zipfile.readEntry())
            .catch(reject)
        } else {
          mkdir(join(fullPath, '..'), { recursive: true })
            .then(() => {
              zipfile.openReadStream(entry, (streamErr, readStream) => {
                if (streamErr || !readStream) return reject(streamErr || new Error("No stream"))
                const ws = createWriteStream(fullPath)
                readStream.pipe(ws)
                ws.on("close", () => zipfile.readEntry())
                ws.on("error", reject)
              })
            })
            .catch(reject)
        }
      })

      zipfile.on("end", resolve)
      zipfile.on("error", reject)
    })
  })
}

/**
 * Archive a directory into a zip file for version history.
 * Returns the size of the created archive in bytes.
 */
export function archiveDirectory(sourceDir: string, destZipPath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const output = createWriteStream(destZipPath)
    const archive = archiver('zip', { zlib: { level: 6 } })

    output.on('close', () => resolve(archive.pointer()))
    archive.on('error', reject)

    archive.pipe(output)
    archive.directory(sourceDir, false)
    archive.finalize()
  })
}

/**
 * Find the HTML launch file from a list of extracted file paths.
 * Priority: index.html in subdir > index.html in root > any .html in subdir > any .html in root
 */
export function findLaunchFileFromList(files: string[]): string | null {
  const htmlFiles = files.filter(f =>
    f.toLowerCase().endsWith('.html') || f.toLowerCase().endsWith('.htm')
  )
  if (htmlFiles.length === 0) return null

  return (
    htmlFiles.find(f => f.includes('/') && f.split('/').pop()?.toLowerCase() === 'index.html') ??
    htmlFiles.find(f => !f.includes('/') && f.toLowerCase() === 'index.html') ??
    htmlFiles.find(f => f.includes('/')) ??
    htmlFiles[0]
  )
}
