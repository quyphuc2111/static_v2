import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/session"
import { verifyCsrfAndOrigin } from "@/lib/csrf"

type Params = { params: Promise<{ id: string; moduleId: string }> }

export async function PATCH(req: Request, { params }: Params) {
  try {
    const guard = await verifyCsrfAndOrigin(req as any)
    if (guard) return NextResponse.json({ message: guard.error }, { status: guard.status })

    const session = await getSession()
    if (!session.user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })

    const body = await req.json()
    const name = (body?.name ?? "").trim()
    const description = (body?.description ?? "").trim()
    const status = body?.status
    
    if (!name) return NextResponse.json({ message: "Tên module là bắt buộc" }, { status: 400 })

    try {
      const { moduleId } = await params
      const updateData: any = { name }
      if (description !== undefined) updateData.description = description || null
      if (status !== undefined) updateData.status = status
      
      const updated = await prisma.module.update({
        where: { id: moduleId },
        data: updateData,
      })
      return NextResponse.json({ data: updated })
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

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const guard = await verifyCsrfAndOrigin(_req as any)
    if (guard) return NextResponse.json({ message: guard.error }, { status: guard.status })

    const session = await getSession()
    if (!session.user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })

    const { moduleId } = await params
    await prisma.module.delete({ where: { id: moduleId } })
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ message: "Server error" }, { status: 500 })
  }
}


