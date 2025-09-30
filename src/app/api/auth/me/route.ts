import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"

export async function GET() {
  const session = await getSession()
  if (!session.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }
  return NextResponse.json({ user: session.user })
}


