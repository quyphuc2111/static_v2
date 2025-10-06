import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/session"
import { verifyCsrfAndOrigin } from "@/lib/csrf"

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: Request, { params }: Params) {
  try {
    const session = await getSession()
    if (!session.user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })

    const { id } = await params
    const modules = await prisma.module.findMany({ where: { projectId: id }, orderBy: { createdAt: "desc" } })
    return NextResponse.json({ data: modules })
  } catch (e) {
    return NextResponse.json({ message: "Server error" }, { status: 500 })
  }
}

export async function POST(req: Request, { params }: Params) {
  try {
    const guard = await verifyCsrfAndOrigin(req as any)
    if (guard) return NextResponse.json({ message: guard.error }, { status: guard.status })

    const session = await getSession()
    if (!session.user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })

    const { name } = await req.json()
    const moduleName = (name ?? "").trim()
    if (!moduleName) return NextResponse.json({ message: "Tên module là bắt buộc" }, { status: 400 })

    const { id } = await params
    try {
      const created = await prisma.module.create({ data: { name: moduleName, projectId: id } })
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


