import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/session"
import { hasPermission } from "@/lib/permissions"
import { PermissionName } from "@prisma/client"
import { verifyCsrfAndOrigin } from "@/lib/csrf"

export async function GET() {
  try {
    const session = await getSession()
    if (!session.user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })

    // Require permission to view projects
    if (!(await hasPermission(PermissionName.VIEW_PROJECTS, session.user.id))) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 })
    }

    const projects = await prisma.project.findMany({ orderBy: { createdAt: "desc" }, include: { modules: true } })
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
    if (!(await hasPermission(PermissionName.CREATE_PROJECTS, session.user.id))) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 })
    }

    const body = await req.json()
    const name = (body?.name ?? "").trim()
    const modules: string[] = Array.isArray(body?.modules) ? body.modules : []
    if (!name) return NextResponse.json({ message: "Tên dự án là bắt buộc" }, { status: 400 })

    try {
      const created = await prisma.project.create({
        data: {
          name,
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


