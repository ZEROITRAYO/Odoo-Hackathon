import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { db } from "@/lib/db"
import { z } from "zod"

const signupSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["ADMIN", "PROCUREMENT_OFFICER", "MANAGER"]),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const data = signupSchema.parse(body)

    const existing = await db.user.findUnique({ where: { email: data.email } })
    if (existing) {
      return NextResponse.json({ error: "Email already in use" }, { status: 409 })
    }

    const hashed = await bcrypt.hash(data.password, 12)
    await db.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashed,
        role: data.role,
        status: "ACTIVE",
      },
    })

    return NextResponse.json({ success: true }, { status: 201 })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input", details: err.errors }, { status: 400 })
    }
    console.error("[SIGNUP]", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
