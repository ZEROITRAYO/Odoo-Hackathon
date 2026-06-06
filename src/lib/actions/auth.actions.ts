"use server"

import crypto from "crypto"
import bcrypt from "bcryptjs"
import { db } from "@/lib/db"
import { sendResetPasswordEmail } from "@/lib/email"

export async function requestPasswordReset(email: string) {
  // Always return success-like to avoid email enumeration
  const user = await db.user.findUnique({ where: { email } })
  if (!user) return { success: true }

  // Invalidate old tokens
  await db.passwordResetToken.deleteMany({ where: { email } })

  const token = crypto.randomBytes(32).toString("hex")
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

  await db.passwordResetToken.create({ data: { email, token, expiresAt } })

  const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password/${token}`
  await sendResetPasswordEmail({ to: email, name: user.name, resetUrl })

  return { success: true }
}

export async function resetPassword(token: string, newPassword: string) {
  if (!token || !newPassword) return { error: "Invalid request" }

  const record = await db.passwordResetToken.findFirst({ where: { token } })
  if (!record) return { error: "Invalid or expired reset link" }
  if (record.expiresAt < new Date()) {
    await db.passwordResetToken.delete({ where: { id: record.id } })
    return { error: "Reset link has expired. Please request a new one." }
  }

  const hashed = await bcrypt.hash(newPassword, 12)
  await db.user.update({ where: { email: record.email }, data: { password: hashed } })
  await db.passwordResetToken.delete({ where: { id: record.id } })

  return { success: true }
}
