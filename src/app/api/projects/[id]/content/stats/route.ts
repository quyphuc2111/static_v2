import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params

    // Verify project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId }
    })

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    // Get content statistics for this project
    const stats = await prisma.contentData.groupBy({
      by: ['status'],
      where: {
        projectId,
        isDeleted: false
      },
      _count: {
        id: true 
      }
    })

    // Calculate totals
    const total = stats.reduce((sum, stat) => sum + stat._count.id, 0)
    const completed = stats.find(s => s.status === 'COMPLETED')?._count.id || 0
    const processing = stats.find(s => s.status === 'PROCESSING')?._count.id || 0
    const failed = stats.find(s => s.status === 'FAILED')?._count.id || 0

    return NextResponse.json({
      data: {
        total,
        completed,
        processing,
        failed
      }
    })
  } catch (error) {
    console.error("Error fetching content stats:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
