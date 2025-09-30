import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get("projectId")

    let whereClause: any = { isDeleted: false }

    if (projectId) {
      whereClause.projectId = projectId
    }

    // Get content stats
    const [total, completed, processing, failed] = await Promise.all([
      prisma.contentData.count({ where: whereClause }),
      prisma.contentData.count({ 
        where: { ...whereClause, status: "COMPLETED" } 
      }),
      prisma.contentData.count({ 
        where: { ...whereClause, status: "PROCESSING" } 
      }),
      prisma.contentData.count({ 
        where: { ...whereClause, status: "FAILED" } 
      })
    ])

    const stats = {
      total,
      completed,
      processing,
      failed
    }

    return NextResponse.json({ data: stats })
  } catch (error) {
    console.error("Error fetching content stats:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
