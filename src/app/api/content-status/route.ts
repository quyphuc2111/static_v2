import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/session"
import { ContentStatus } from "@prisma/client"

export const dynamic = 'force-dynamic'

// Valid ContentStatus enum values from Prisma schema
const VALID_STATUSES = Object.values(ContentStatus)

/**
 * Polling endpoint for content status updates.
 * Replaces SSE which is blocked by Cloudflare.
 *
 * Query params:
 *   - projectId: required
 *   - moduleId: required
 *   - statuses: optional comma-separated list (default: "PROCESSING")
 *
 * Returns content items that match the given statuses.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get("projectId")
    const moduleId = searchParams.get("moduleId")
    const rawStatuses = searchParams.get("statuses")?.split(",") || ["PROCESSING"]

    if (!projectId || !moduleId) {
      return NextResponse.json(
        { error: "Thiếu tham số projectId hoặc moduleId" },
        { status: 400 }
      )
    }

    const pId = Number(projectId)
    const mId = Number(moduleId)

    if (isNaN(pId) || isNaN(mId)) {
      return NextResponse.json(
        { error: "projectId và moduleId phải là số" },
        { status: 400 }
      )
    }

    // Filter to only valid enum values to prevent Prisma errors
    const statuses = rawStatuses.filter(s => VALID_STATUSES.includes(s as ContentStatus)) as ContentStatus[]

    if (statuses.length === 0) {
      return NextResponse.json({ data: [], timestamp: Date.now() })
    }

    // Fetch content items matching the requested statuses
    const processingContent = await prisma.contentData.findMany({
      where: {
        projectId: pId as any,
        moduleId: mId as any,
        status: { in: statuses },
        isDeleted: false,
      },
      select: {
        id: true,
        status: true,
        progress: true,
        title: true,
      },
      orderBy: { updatedAt: "desc" },
    })

    return NextResponse.json({
      data: processingContent,
      timestamp: Date.now(),
    })
  } catch (error) {
    console.error("Error fetching content status:", error)
    const message = error instanceof Error ? error.message : "Lỗi không xác định"
    return NextResponse.json(
      { error: `Lỗi server khi kiểm tra trạng thái nội dung: ${message}` },
      { status: 500 }
    )
  }
}
