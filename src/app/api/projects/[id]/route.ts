import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/session"

type Params = { params: { id: string } }

export async function PATCH(_req: Request, { params }: Params) {
  try {
    const session = await getSession()
    if (!session.user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    const name = (await _req.json())?.name?.trim()
    if (!name) return NextResponse.json({ message: "Tên dự án là bắt buộc" }, { status: 400 })
    const updated = await prisma.project.update({ where: { id: params.id }, data: { name } })
    return NextResponse.json({ data: updated })
  } catch (e) {
    return NextResponse.json({ message: "Server error" }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const session = await getSession()
    if (!session.user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    await prisma.project.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ message: "Server error" }, { status: 500 })
  }
}


