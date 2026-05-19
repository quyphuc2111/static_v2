import { NextRequest, NextResponse } from "next/server"
import path from "path"
import { promises as fsp } from "fs"
import { createReadStream, existsSync } from "fs"
import { Readable } from "stream"

const UPLOADS_ROOT = path.resolve(process.cwd(), "public", "uploads")

function contentTypeFor(filePath: string) {
  const lower = filePath.toLowerCase()
  if (lower.endsWith(".html") || lower.endsWith(".htm")) return "text/html; charset=utf-8"
  if (lower.endsWith(".css")) return "text/css; charset=utf-8"
  if (lower.endsWith(".js")) return "application/javascript; charset=utf-8"
  if (lower.endsWith(".json")) return "application/json; charset=utf-8"
  if (lower.endsWith(".png")) return "image/png"
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg"
  if (lower.endsWith(".gif")) return "image/gif"
  if (lower.endsWith(".webp")) return "image/webp"
  if (lower.endsWith(".svg")) return "image/svg+xml"
  if (lower.endsWith(".ico")) return "image/x-icon"
  if (lower.endsWith(".mp4")) return "video/mp4"
  if (lower.endsWith(".webm")) return "video/webm"
  if (lower.endsWith(".woff")) return "font/woff"
  if (lower.endsWith(".woff2")) return "font/woff2"
  if (lower.endsWith(".ttf")) return "font/ttf"
  if (lower.endsWith(".otf")) return "font/otf"
  if (lower.endsWith(".txt")) return "text/plain; charset=utf-8"
  if (lower.endsWith(".xml")) return "application/xml; charset=utf-8"
  if (lower.endsWith(".pdf")) return "application/pdf"
  return "application/octet-stream"
}

function noCacheHeaders(filePath: string) {
  return {
    "Content-Type": contentTypeFor(filePath),
    "Cache-Control": "no-cache, no-store, must-revalidate, max-age=0",
    "Pragma": "no-cache",
    "Expires": "0",
    "CDN-Cache-Control": "no-store"
  }
}

/**
 * Stream a file as response instead of loading entirely into memory.
 */
function streamFileResponse(absPath: string) {
  const nodeStream = createReadStream(absPath)
  const webStream = Readable.toWeb(nodeStream) as ReadableStream
  return new NextResponse(webStream, {
    headers: noCacheHeaders(absPath),
  })
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: pathSegments } = await params
  const cleanSegments = (pathSegments || []).filter(Boolean)
  const rel = cleanSegments.join("/")

  // Security: resolve the absolute path and verify it's within uploads root
  const abs = path.resolve(UPLOADS_ROOT, rel)
  if (!abs.startsWith(UPLOADS_ROOT)) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 })
  }

  try {
    const stat = await fsp.stat(abs)
    if (stat.isDirectory()) {
      // Try index.html
      const indexHtml = path.join(abs, "index.html")
      if (existsSync(indexHtml)) {
        return streamFileResponse(indexHtml)
      }

      // Try first html in folder
      const entries = await fsp.readdir(abs)
      const firstHtml = entries.find(
        (f) => f.toLowerCase().endsWith(".html") || f.toLowerCase().endsWith(".htm")
      )
      if (firstHtml) {
        return streamFileResponse(path.join(abs, firstHtml))
      }

      // Directory listing fallback
      const listing = entries
        .map((e) => `<li><a href="${req.nextUrl.pathname.replace(/\/$/, "")}/${e}">${e}</a></li>`)
        .join("")
      return new NextResponse(`<ul>${listing}</ul>`, {
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "no-cache, no-store, must-revalidate, max-age=0",
          "Pragma": "no-cache",
          "Expires": "0",
        },
      })
    }

    // Stream file response
    return streamFileResponse(abs)
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
}
