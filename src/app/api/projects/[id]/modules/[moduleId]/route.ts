import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/session"
import { verifyCsrfAndOrigin } from "@/lib/csrf"

type Params = { params: { id: string; moduleId: string } }

export async function PATCH(req: Request, { params }: Params) {
  try {
    const guard = await verifyCsrfAndOrigin(req as any)
    if (guard) return NextResponse.json({ message: guard.error }, { status: guard.status })

    const session = await getSession()
    if (!session.user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })

    const { name } = await req.json()
    const moduleName = (name ?? "").trim()
    if (!moduleName) return NextResponse.json({ message: "Tên module là bắt buộc" }, { status: 400 })

    try {
      const updated = await prisma.module.update({
        where: { id: params.moduleId },
        data: { name: moduleName },
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

    await prisma.module.delete({ where: { id: params.moduleId } })
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ message: "Server error" }, { status: 500 })
  }
}


