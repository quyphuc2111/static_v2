import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/session"
import { hasPermission as checkPermission } from "@/lib/permissions"
import { PermissionName } from "@prisma/client"

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: Request, { params }: Params) {
  try {
    const session = await getSession()
    if (!session.user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })

    // Check permission to view modules
    const hasAccess = await checkPermission(PermissionName.VIEW_MODULES, session.user.id)
    if (!hasAccess) {
      return NextResponse.json({ message: "Bạn không có quyền xem danh sách module" }, { status: 403 })
    }

    const { id } = await params
    const pId = Number(id)
    const modules = await prisma.module.findMany({ where: { projectId: pId as any }, orderBy: { createdAt: "desc" } })
    return NextResponse.json({ data: modules })
  } catch (e) {
    return NextResponse.json({ message: "Server error" }, { status: 500 })
  }
}

export async function POST(req: Request, { params }: Params) {
  try {
    const session = await getSession()
    if (!session.user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })

    // Check permission to create modules
    const hasAccess = await checkPermission(PermissionName.CREATE_MODULES, session.user.id)
    if (!hasAccess) {
      return NextResponse.json({ message: "Bạn không có quyền tạo module" }, { status: 403 })
    }

    const body = await req.json()
    const name = (body?.name ?? "").trim()
    const description = (body?.description ?? "").trim()
    const status = body?.status ?? "ACTIVE"
    
    if (!name) return NextResponse.json({ message: "Tên module là bắt buộc" }, { status: 400 })

    const { id } = await params
    const pId = Number(id)
    try {
      const created = await prisma.module.create({ 
        data: { 
          name, 
          description: description || null,
          status,
          projectId: pId as any 
        } 
      })
      return NextResponse.json({ data: created }, { status: 201 })
    } catch (err: any) {
      if (err?.code === "P2002") {
        return NextResponse.json({ message: "Module đã tồn tại trong dự án" }, { status: 409 })
      }
      throw err
    }
  } catch (e) {
    return NextResponse.json({ message: "Server error" }, { status: 500 })
  }
}


