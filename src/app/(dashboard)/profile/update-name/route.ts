import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 })

  const body = await req.json()
  const name = typeof body.name === "string" ? body.name.trim() : ""

  if (!name || name.length < 2) {
    return NextResponse.json({ error: "Name must be at least 2 characters" }, { status: 400 })
  }

  await db.user.update({
    where: { id: session.user.id },
    data: { name },
  })

  return NextResponse.json({ success: true })
}
