import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/session"
import { hasPermission as checkPermission } from "@/lib/permissions"
import { PermissionName } from "@prisma/client"
import { verifyCsrfAndOrigin } from "@/lib/csrf"

export async function GET(req: Request) {
  try {
    const session = await getSession()
    if (!session.user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })

    // Require permission to view projects
    if (!(await checkPermission(PermissionName.VIEW_PROJECTS, session.user.id))) {
      return NextResponse.json({ message: "Bạn không có quyền xem danh sách dự án" }, { status: 403 })
    }

    // Check if user wants to view deleted projects
    const url = new URL(req.url)
    const includeDeleted = url.searchParams.get("includeDeleted") === "true"
    const onlyDeleted = url.searchParams.get("onlyDeleted") === "true"

    let where = {}
    if (onlyDeleted) {
      // Check permission to view deleted projects
      if (!(await checkPermission(PermissionName.VIEW_DELETED_PROJECTS, session.user.id))) {
        return NextResponse.json({ message: "Forbidden" }, { status: 403 })
      }
      where = { isDeleted: true }
    } else if (!includeDeleted) {
      where = { isDeleted: false }
    }

    const projects = await prisma.project.findMany({ 
      where,
      orderBy: { createdAt: "desc" }, 
      include: { modules: true } 
    })
    return NextResponse.json({ data: projects })
  } catch (e) {
    return NextResponse.json({ message: "Server error" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const guard = await verifyCsrfAndOrigin(req as any)
    if (guard) return NextResponse.json({ message: guard.error }, { status: guard.status })

    const session = await getSession()
    if (!session.user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })

    // Require permission to create projects
    if (!(await checkPermission(PermissionName.CREATE_PROJECTS, session.user.id))) {
      return NextResponse.json({ message: "Bạn không có quyền tạo dự án" }, { status: 403 })
    }

    const body = await req.json()
    const name = (body?.name ?? "").trim()
    const description = (body?.description ?? "").trim()
    const status = body?.status ?? "ACTIVE"
    const modules: string[] = Array.isArray(body?.modules) ? body.modules : []
    if (!name) return NextResponse.json({ message: "Tên dự án là bắt buộc" }, { status: 400 })

    try {
      const created = await prisma.project.create({
        data: {
          name,
          description: description || null,
          status,
          modules: modules.length
            ? {
                create: modules
                  .map((m) => (typeof m === "string" ? m.trim() : ""))
                  .filter((m) => !!m)
                  .map((m) => ({ name: m })),
              }
            : undefined,
        },
        include: { modules: true },
      })
      return NextResponse.json({ data: created }, { status: 201 })
    } catch (err: any) {
      if (err?.code === "P2002") {
        return NextResponse.json({ message: "Tên dự án đã tồn tại" }, { status: 409 })
      }
      throw err
    }
  } catch (e) {
    return NextResponse.json({ message: "Server error" }, { status: 500 })
  }
}


