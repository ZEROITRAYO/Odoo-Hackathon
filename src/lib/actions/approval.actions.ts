'use server'

import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { approvalSchema } from '@/lib/validations'
import { z } from 'zod'
import { createNotification } from './notification.actions'

async function generatePONumber(): Promise<string> {
  const count = await db.purchaseOrder.count()
  const year = new Date().getFullYear()
  return `PO-${year}-${String(count + 1).padStart(5, '0')}`
}

async function generateInvoiceNumber(): Promise<string> {
  const count = await db.invoice.count()
  const year = new Date().getFullYear()
  return `INV-${year}-${String(count + 1).padStart(5, '0')}`
}

async function logActivity(
  userId: string,
  action: string,
  entityType: string,
  entityId: string,
) {
  await db.activityLog.create({ data: { userId, action, entityType, entityId } })
}

// ─── getPendingApprovals ──────────────────────────────────────────────────────

export async function getPendingApprovals(params: {
  page?: number
  pageSize?: number
} = {}) {
  const session = await auth()
  if (!session?.user) return { approvals: [], total: 0 }

  const { page = 1, pageSize = 20 } = params

  const where: Record<string, unknown> = { status: 'PENDING' }

  // Managers see their own; admins see all
  if (session.user.role === 'MANAGER') {
    where.approverId = session.user.id
  }

  const now = new Date()
  const slaThreshold = new Date(now.getTime() - 48 * 60 * 60 * 1000) // 48h ago

  const [approvals, total] = await Promise.all([
    db.approval.findMany({
      where,
      orderBy: { createdAt: 'asc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        quotation: {
          include: {
            vendor: true,
            rfq: { select: { id: true, rfqNumber: true, title: true } },
          },
        },
        approver: { select: { id: true, name: true } },
      },
    }),
    db.approval.count({ where }),
  ])

  // Annotate with SLA breach flag
  const annotated = approvals.map((a) => ({
    ...a,
    slaBreach: a.createdAt < slaThreshold,
  }))

  return { approvals: annotated, total, page, pageSize }
}

// ─── approveQuotation ─────────────────────────────────────────────────────────

export async function approveQuotation(
  input: z.infer<typeof approvalSchema>,
): Promise<{
  success: boolean
  data?: { approvalId: string; poId: string; invoiceId: string }
  error?: string
}> {
  try {
    const session = await auth()
    if (!session?.user) return { success: false, error: 'Unauthenticated' }
    if (!['ADMIN', 'MANAGER'].includes(session.user.role)) {
      return { success: false, error: 'Only managers can approve quotations' }
    }

    const parsed = approvalSchema.safeParse(input)
    if (!parsed.success) {
      return { success: false, error: parsed.error.errors[0].message }
    }

    if (parsed.data.action !== 'APPROVE') {
      return { success: false, error: 'Use rejectQuotation for rejections' }
    }

    const { quotationId, remarks } = parsed.data

    const approval = await db.approval.findFirst({
      where: { quotationId, status: 'PENDING' },
      include: {
        quotation: {
          include: {
            vendor: true,
            rfq: { select: { id: true, rfqNumber: true, title: true, createdById: true } },
          },
        },
      },
    })
    if (!approval) return { success: false, error: 'Pending approval not found' }

    const quotation = approval.quotation

    // Update approval
    await db.approval.update({
      where: { id: approval.id },
      data: {
        status: 'APPROVED',
        remarks,
        approvedAt: new Date(),
      },
    })

    // ── Create Purchase Order ──────────────────────────────────────────────────
    const subtotal = quotation.price
    const tax = +(subtotal * 0.18).toFixed(2)  // 18% GST
    const total = +(subtotal + tax).toFixed(2)
    const poNumber = await generatePONumber()

    const po = await db.purchaseOrder.create({
      data: {
        poNumber,
        quotationId,
        vendorId: quotation.vendorId,
        subtotal,
        tax,
        total,
        status: 'GENERATED',
      },
    })

    // ── Create Invoice ─────────────────────────────────────────────────────────
    const invoiceNumber = await generateInvoiceNumber()
    const invoice = await db.invoice.create({
      data: {
        invoiceNumber,
        poId: po.id,
        subtotal,
        tax,
        total,
        status: 'DRAFT',
      },
    })

    await logActivity(
      session.user.id,
      `Approved quotation ${quotation.quotationNumber} → PO ${poNumber} created`,
      'Approval',
      approval.id,
    )

    // Notify the procurement officer who created the RFQ
    if (quotation.rfq.createdById) {
      await createNotification({
        userId: quotation.rfq.createdById,
        title: 'Quotation Approved',
        message: `PO ${poNumber} has been created for ${quotation.vendor.companyName} — ${quotation.rfq.title}`,
      })
    }

    revalidatePath('/manager/approvals')
    revalidatePath('/procurement/orders')

    return {
      success: true,
      data: { approvalId: approval.id, poId: po.id, invoiceId: invoice.id },
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to approve quotation'
    return { success: false, error: message }
  }
}

// ─── rejectQuotation ──────────────────────────────────────────────────────────

export async function rejectQuotation(
  input: z.infer<typeof approvalSchema>,
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth()
    if (!session?.user) return { success: false, error: 'Unauthenticated' }
    if (!['ADMIN', 'MANAGER'].includes(session.user.role)) {
      return { success: false, error: 'Only managers can reject quotations' }
    }

    const parsed = approvalSchema.safeParse(input)
    if (!parsed.success) {
      return { success: false, error: parsed.error.errors[0].message }
    }

    const { quotationId, remarks } = parsed.data

    const approval = await db.approval.findFirst({
      where: { quotationId, status: 'PENDING' },
      include: {
        quotation: { include: { vendor: true, rfq: { select: { createdById: true, title: true } } } },
      },
    })
    if (!approval) return { success: false, error: 'Pending approval not found' }

    await db.approval.update({
      where: { id: approval.id },
      data: { status: 'REJECTED', remarks, approvedAt: new Date() },
    })

    // Revert quotation status so it can be reconsidered
    await db.quotation.update({
      where: { id: quotationId },
      data: { status: 'REJECTED' },
    })

    await logActivity(
      session.user.id,
      `Rejected quotation ${approval.quotation.quotationNumber}`,
      'Approval',
      approval.id,
    )

    // Notify procurement officer
    if (approval.quotation.rfq.createdById) {
      await createNotification({
        userId: approval.quotation.rfq.createdById,
        title: 'Quotation Rejected',
        message: `Quotation from ${approval.quotation.vendor.companyName} for "${approval.quotation.rfq.title}" was rejected. Remarks: ${remarks ?? 'None'}`,
      })
    }

    revalidatePath('/manager/approvals')
    revalidatePath('/procurement/orders')
    return { success: true }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to reject quotation'
    return { success: false, error: message }
  }
}
