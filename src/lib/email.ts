// src/lib/email.ts
import { Resend } from 'resend'

export const resend = new Resend(process.env.RESEND_API_KEY)

export const FROM_EMAIL = 'VendorBridge <noreply@vendorbridge.com>'

export async function sendEmail({
  to,
  subject,
  react,
  attachments,
}: {
  to: string | string[]
  subject: string
  react: React.ReactElement
  attachments?: Array<{ filename: string; content: Buffer }>
}) {
  try {
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      react,
      attachments,
    })
    return { success: true, id: result.data?.id }
  } catch (error) {
    console.error('Email send failed:', error)
    return { success: false, error }
  }
}
