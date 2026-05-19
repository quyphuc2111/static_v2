import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/session"
import { hasPermission as checkPermission } from "@/lib/permissions"
import { PermissionName } from "@prisma/client"

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // Check permission
    const hasAccess = await checkPermission(
      PermissionName.VIEW_DASHBOARD_STATS,
      session.user.id
    )
    if (!hasAccess) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 })
    }

    // Get user's role to determine data scope
    const userRoles = await prisma.userRole.findMany({
      where: { userId: Number(session.user.id) as any },
      include: { role: true }
    })

    const isAdmin = userRoles.some(ur => ur.role.name === 'ADMINISTRATOR')
    const canManageAll = await checkPermission(PermissionName.MANAGE_ALL_CONTENT, session.user.id)

    // Only use audit logs as the single source of truth — no more duplicate entity queries
    const recentActivities = await prisma.auditLog.findMany({
      where: {
        OR: [
          { actorId: Number(session.user.id) as any }, // User's own actions
          ...(isAdmin || canManageAll ? [{}] : []) // Admin can see all
        ]
      },
      orderBy: { createdAt: 'desc' },
      take: 30,
      include: {
        actor: {
          select: { id: true, name: true, email: true }
        }
      }
    })

    // Filter out login/logout for cleaner feed (optional, keep if desired)
    const filteredActivities = recentActivities
      .filter(a => a.action !== 'login' && a.action !== 'logout')
      .slice(0, 20)

    const allActivities = filteredActivities.map(activity => ({
      id: activity.id,
      type: 'audit' as const,
      action: activity.action,
      entityType: activity.entityType,
      entityId: activity.entityId,
      actor: activity.actor,
      createdAt: activity.createdAt,
      metadata: activity.metadata
    }))

    return NextResponse.json({
      message: "Recent activity retrieved successfully",
      data: allActivities
    })
  } catch (error) {
    console.error("Error fetching recent activity:", error)
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}
