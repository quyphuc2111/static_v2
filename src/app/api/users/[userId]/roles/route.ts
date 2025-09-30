import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/session"

interface Params {
  params: Promise<{
    userId: string
  }>
}

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { userId } = await params

    const userRoles = await prisma.userRole.findMany({
      where: {
        userId
      },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true
              }
            }
          }
        }
      }
    })

    return NextResponse.json({ data: userRoles })
  } catch (error) {
    console.error("Error fetching user roles:", error)
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { userId } = await params
    const { roleId } = await req.json()

    if (!roleId) {
      return NextResponse.json({ message: "Role ID is required" }, { status: 400 })
    }

    // Check if user already has this role
    const existingRole = await prisma.userRole.findUnique({
      where: {
        userId_roleId: {
          userId,
          roleId
        }
      }
    })

    if (existingRole) {
      return NextResponse.json({ message: "User already has this role" }, { status: 400 })
    }

    const userRole = await prisma.userRole.create({
      data: {
        userId,
        roleId
      },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true
              }
            }
          }
        }
      }
    })

    return NextResponse.json({ data: userRole }, { status: 201 })
  } catch (error) {
    console.error("Error assigning role to user:", error)
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { userId } = await params
    const { searchParams } = new URL(req.url)
    const roleId = searchParams.get('roleId')

    if (!roleId) {
      return NextResponse.json({ message: "Role ID is required" }, { status: 400 })
    }

    await prisma.userRole.delete({
      where: {
        userId_roleId: {
          userId,
          roleId
        }
      }
    })

    return NextResponse.json({ message: "Role removed successfully" })
  } catch (error) {
    console.error("Error removing role from user:", error)
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}
