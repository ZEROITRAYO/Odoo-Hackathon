'use server'

import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { sendEmail, FROM_EMAIL } from '@/lib/email'
import { createNotification } from './notification.actions'
import React from 'react'

async function logActivity(
  userId: string,
  action: string,
  entityType: string,
  entityId: string,
) {
  await db.activityLog.create({ data: { userId, action, entityType, entityId } })
}

// ─── getInvoices ──────────────────────────────────────────────────────────────

export interface GetInvoicesParams {
  status?: string
  search?: string
  page?: number
  pageSize?: number
}

export async function getInvoices(params: GetInvoicesParams = {}) {
  const session = await auth()
  if (!session?.user) return { invoices: [], total: 0 }

  const { status, search, page = 1, pageSize = 20 } = params

  const where: Record<string, unknown> = {}
  if (status) where.status = status
  if (search) {
    where.OR = [
      { invoiceNumber: { contains: search, mode: 'insensitive' } },
      { purchaseOrder: { vendor: { companyName: { contains: search, mode: 'insensitive' } } } },
    ]
  }

  const [invoices, total] = await Promise.all([
    db.invoice.findMany({
      where,
      orderBy: { generatedAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        purchaseOrder: {
          include: {
            vendor: { select: { id: true, companyName: true, email: true } },
            approval: {
              select: { quotation: { select: { rfq: { select: { title: true } } } } },
            },
          },
        },
      },
    }),
    db.invoice.count({ where }),
  ])

  return { invoices, total, page, pageSize, totalPages: Math.ceil(total / pageSize) }
}

// ─── getInvoiceById ───────────────────────────────────────────────────────────

export async function getInvoiceById(id: string) {
  return db.invoice.findUnique({
    where: { id },
    include: {
      purchaseOrder: {
        include: {
          vendor: true,
          approval: {
            include: {
              quotation: {
                include: { rfq: true },
              },
            },
          },
        },
      },
    },
  })
}

// ─── updateInvoiceStatus ──────────────────────────────────────────────────────

export async function updateInvoiceStatus(
  id: string,
  status: 'DRAFT' | 'SENT' | 'PAID',
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth()
    if (!session?.user) return { success: false, error: 'Unauthenticated' }
    if (!['ADMIN', 'PROCUREMENT_OFFICER'].includes(session.user.role)) {
      return { success: false, error: 'Unauthorized' }
    }

    await db.invoice.update({ where: { id }, data: { status } })
    revalidatePath('/procurement/orders')
    return { success: true }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update invoice status'
    return { success: false, error: message }
  }
}

// ─── emailInvoice ─────────────────────────────────────────────────────────────

export async function emailInvoice(
  invoiceId: string,
  overrideEmail?: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth()
    if (!session?.user) return { success: false, error: 'Unauthenticated' }

    const invoice = await getInvoiceById(invoiceId)
    if (!invoice) return { success: false, error: 'Invoice not found' }

    const recipientEmail = overrideEmail ?? invoice.purchaseOrder.vendor.email
    const vendorName = invoice.purchaseOrder.vendor.companyName

    // Dynamically import to avoid SSR issues
    const { InvoiceEmail } = await import('@/emails/InvoiceEmail')

    const emailBody = React.createElement(InvoiceEmail, {
      invoiceNumber: invoice.invoiceNumber,
      vendorName,
      poNumber: invoice.purchaseOrder.poNumber,
      rfqTitle: invoice.purchaseOrder.approval?.quotation?.rfq?.title ?? 'N/A',
      subtotal: invoice.subtotal,
      tax: invoice.tax,
      total: invoice.total,
      pdfUrl: invoice.pdfUrl ?? undefined,
    })

    const result = await sendEmail({
      to: recipientEmail,
      subject: `Invoice ${invoice.invoiceNumber} from VendorBridge`,
      react: emailBody,
    })

    if (!result.success) {
      return { success: false, error: 'Failed to send email' }
    }

    // Mark invoice as SENT
    await db.invoice.update({
      where: { id: invoiceId },
      data: { status: 'SENT' },
    })

    await logActivity(
      session.user.id,
      `Emailed invoice ${invoice.invoiceNumber} to ${recipientEmail}`,
      'Invoice',
      invoiceId,
    )

    // Notify vendor user if exists
    const vendorUser = await db.user.findFirst({
      where: { email: invoice.purchaseOrder.vendor.email, role: 'VENDOR' },
    })
    if (vendorUser) {
      await createNotification({
        userId: vendorUser.id,
        title: 'Invoice Received',
        message: `Invoice ${invoice.invoiceNumber} has been issued to you. Total: ₹${invoice.total.toLocaleString()}`,
      })
    }

    revalidatePath('/procurement/orders')
    return { success: true }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to email invoice'
    return { success: false, error: message }
  }
}

// ─── getInvoicePDFData ────────────────────────────────────────────────────────
// Returns structured data for PDF rendering on the client

export async function getInvoicePDFData(invoiceId: string) {
  const session = await auth()
  if (!session?.user) return null

  const invoice = await getInvoiceById(invoiceId)
  if (!invoice) return null

  return {
    invoiceNumber: invoice.invoiceNumber,
    generatedAt: invoice.generatedAt,
    status: invoice.status,
    subtotal: invoice.subtotal,
    tax: invoice.tax,
    total: invoice.total,
    vendor: invoice.purchaseOrder.vendor,
    poNumber: invoice.purchaseOrder.poNumber,
    rfqTitle: invoice.purchaseOrder.approval?.quotation?.rfq?.title,
  }
}

// ─── storePDFUrl ──────────────────────────────────────────────────────────────
// Called from client after UploadThing upload of generated PDF

export async function storeInvoicePDFUrl(
  invoiceId: string,
  pdfUrl: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth()
    if (!session?.user) return { success: false, error: 'Unauthenticated' }

    await db.invoice.update({ where: { id: invoiceId }, data: { pdfUrl } })
    revalidatePath('/procurement/orders')
    return { success: true }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to store PDF URL'
    return { success: false, error: message }
  }
}

export async function storePOPDFUrl(
  poId: string,
  pdfUrl: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth()
    if (!session?.user) return { success: false, error: 'Unauthenticated' }

    await db.purchaseOrder.update({ where: { id: poId }, data: { pdfUrl } })
    revalidatePath('/procurement/orders')
    return { success: true }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to store PO PDF URL'
    return { success: false, error: message }
  }
}
