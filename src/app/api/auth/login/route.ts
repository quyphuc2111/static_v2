import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/session"
import bcrypt from "bcryptjs"
import { PermissionName, UserStatus } from "@prisma/client"

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json()
    if (!email || !password) {
      return NextResponse.json({ message: "Thiếu email hoặc mật khẩu" }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        roles: { include: { role: true } },
        permissions: { include: { permission: true } },
      },
    })

    if (!user || !user.passwordHash) {
      return NextResponse.json({ message: "Sai thông tin đăng nhập" }, { status: 401 })
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash)
    if (!isMatch) {
      return NextResponse.json({ message: "Sai thông tin đăng nhập" }, { status: 401 })
    }

    if (user.status === UserStatus.DISABLED) {
      return NextResponse.json({ message: "Tài khoản đã bị vô hiệu hoá" }, { status: 403 })
    }

    const roles: RoleName[] = user.roles.map((ur) => ur.role.name)
    const permissions: PermissionName[] = user.permissions.map((up) => up.permission.name)

    const session = await getSession()
    session.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      status: user.status,
      roles,
      permissions,
    }
    await session.save()

    return NextResponse.json({ user: session.user })
  } catch (error) {
    return NextResponse.json({ message: "Lỗi máy chủ" }, { status: 500 })
  }
}


