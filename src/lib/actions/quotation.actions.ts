'use server'

import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { quotationSchema } from '@/lib/validations'
import { z } from 'zod'
import { createNotification } from './notification.actions'

async function generateQuotationNumber(): Promise<string> {
  const count = await db.quotation.count()
  const year = new Date().getFullYear()
  return `QT-${year}-${String(count + 1).padStart(4, '0')}`
}

async function logActivity(
  userId: string,
  action: string,
  entityType: string,
  entityId: string,
) {
  await db.activityLog.create({ data: { userId, action, entityType, entityId } })
}

// ─── submitQuotation ──────────────────────────────────────────────────────────

export async function submitQuotation(
  input: z.infer<typeof quotationSchema>,
): Promise<{ success: boolean; data?: { id: string }; error?: string }> {
  try {
    const session = await auth()
    if (!session?.user) return { success: false, error: 'Unauthenticated' }
    if (!['VENDOR', 'ADMIN'].includes(session.user.role)) {
      return { success: false, error: 'Only vendors can submit quotations' }
    }

    const parsed = quotationSchema.safeParse(input)
    if (!parsed.success) {
      return { success: false, error: parsed.error.errors[0].message }
    }

    const { rfqId, price, deliveryDays, notes } = parsed.data

    // Look up the vendor record tied to this user's email
    const vendor = await db.vendor.findFirst({
      where: { email: session.user.email! },
    })
    if (!vendor) return { success: false, error: 'Vendor profile not found' }

    // Ensure this vendor is assigned to the RFQ
    const rfq = await db.rFQ.findUnique({
      where: { id: rfqId },
      include: { vendors: { where: { vendorId: vendor.id } } },
    })
    if (!rfq) return { success: false, error: 'RFQ not found' }
    if (rfq.vendors.length === 0) {
      return { success: false, error: 'You are not assigned to this RFQ' }
    }
    if (rfq.status !== 'OPEN') {
      return { success: false, error: 'RFQ is not open for quotations' }
    }
    if (new Date(rfq.deadline) < new Date()) {
      return { success: false, error: 'RFQ deadline has passed' }
    }

    // One quotation per vendor per RFQ
    const existing = await db.quotation.findFirst({
      where: { rfqId, vendorId: vendor.id },
    })
    if (existing) {
      return { success: false, error: 'You have already submitted a quotation for this RFQ. Use update instead.' }
    }

    const quotationNumber = await generateQuotationNumber()

    const quotation = await db.quotation.create({
      data: {
        quotationNumber,
        rfqId,
        vendorId: vendor.id,
        price,
        deliveryDays,
        notes,
        status: 'SUBMITTED',
      },
    })

    await logActivity(
      session.user.id,
      `Submitted quotation ${quotationNumber} for RFQ ${rfq.rfqNumber}`,
      'Quotation',
      quotation.id,
    )

    // Notify procurement officers
    const procurementOfficers = await db.user.findMany({
      where: { role: 'PROCUREMENT_OFFICER', status: 'ACTIVE' },
    })
    for (const officer of procurementOfficers) {
      await createNotification({
        userId: officer.id,
        title: 'New Quotation Submitted',
        message: `${vendor.companyName} submitted a quotation for ${rfq.title} (${rfq.rfqNumber})`,
      })
    }

    revalidatePath(`/rfqs/${rfqId}`)
    revalidatePath('/vendor/rfqs')
    return { success: true, data: { id: quotation.id } }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to submit quotation'
    return { success: false, error: message }
  }
}

// ─── updateQuotation ──────────────────────────────────────────────────────────

export async function updateQuotation(
  quotationId: string,
  input: Partial<z.infer<typeof quotationSchema>>,
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth()
    if (!session?.user) return { success: false, error: 'Unauthenticated' }

    const quotation = await db.quotation.findUnique({
      where: { id: quotationId },
      include: { rfq: true, vendor: true },
    })
    if (!quotation) return { success: false, error: 'Quotation not found' }

    // Deadline check
    if (new Date(quotation.rfq.deadline) < new Date()) {
      return { success: false, error: 'RFQ deadline has passed – cannot update quotation' }
    }

    if (quotation.status === 'SELECTED') {
      return { success: false, error: 'Cannot update a selected quotation' }
    }

    await db.quotation.update({
      where: { id: quotationId },
      data: {
        price: input.price,
        deliveryDays: input.deliveryDays,
        notes: input.notes,
        updatedAt: new Date(),
      },
    })

    await logActivity(
      session.user.id,
      `Updated quotation ${quotation.quotationNumber}`,
      'Quotation',
      quotationId,
    )

    revalidatePath(`/rfqs/${quotation.rfqId}`)
    revalidatePath('/vendor/rfqs')
    return { success: true }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update quotation'
    return { success: false, error: message }
  }
}

// ─── getQuotationsForRFQ ──────────────────────────────────────────────────────

export async function getQuotationsForRFQ(rfqId: string) {
  const quotations = await db.quotation.findMany({
    where: { rfqId },
    include: {
      vendor: true,
      // `approval` is a one-to-one relation on the schema — not `approvals`
      approval: {
        include: { approver: { select: { id: true, name: true } } },
      },
    },
    orderBy: { price: 'asc' },
  })

  // Attach a recommendation score: 60% price, 25% rating, 15% delivery speed
  if (quotations.length === 0) return []

  const minPrice = Math.min(...quotations.map((q) => q.price))
  const maxPrice = Math.max(...quotations.map((q) => q.price))
  const minDelivery = Math.min(...quotations.map((q) => q.deliveryDays))
  const maxDelivery = Math.max(...quotations.map((q) => q.deliveryDays))

  return quotations.map((q) => {
    const priceScore =
      maxPrice === minPrice
        ? 100
        : ((maxPrice - q.price) / (maxPrice - minPrice)) * 100

    const deliveryScore =
      maxDelivery === minDelivery
        ? 100
        : ((maxDelivery - q.deliveryDays) / (maxDelivery - minDelivery)) * 100

    const ratingScore = ((q.vendor.rating ?? 3) / 5) * 100

    const recommendationScore = +(
      priceScore * 0.6 +
      ratingScore * 0.25 +
      deliveryScore * 0.15
    ).toFixed(1)

    return { ...q, approvals: q.approval ? [q.approval] : [], recommendationScore }
  })
}

// ─── selectQuotationForApproval ───────────────────────────────────────────────

export async function selectQuotationForApproval(
  quotationId: string,
): Promise<{ success: boolean; data?: { approvalId: string }; error?: string }> {
  try {
    const session = await auth()
    if (!session?.user) return { success: false, error: 'Unauthenticated' }
    if (!['ADMIN', 'PROCUREMENT_OFFICER'].includes(session.user.role)) {
      return { success: false, error: 'Unauthorized' }
    }

    const quotation = await db.quotation.findUnique({
      where: { id: quotationId },
      include: { rfq: true, vendor: true },
    })
    if (!quotation) return { success: false, error: 'Quotation not found' }
    if (quotation.status !== 'SUBMITTED') {
      return { success: false, error: 'Quotation must be in SUBMITTED state' }
    }

    // Check for existing pending approval
    const existingApproval = await db.approval.findFirst({
      where: { quotationId, status: 'PENDING' },
    })
    if (existingApproval) {
      return { success: false, error: 'An approval is already pending for this quotation' }
    }

    // Update quotation status
    await db.quotation.update({
      where: { id: quotationId },
      data: { status: 'SELECTED' },
    })

    // Find a manager to approve
    const manager = await db.user.findFirst({
      where: { role: 'MANAGER', status: 'ACTIVE' },
    })

    // Create approval record
    const approval = await db.approval.create({
      data: {
        quotationId,
        approverId: manager?.id ?? session.user.id,
        status: 'PENDING',
      },
    })

    await logActivity(
      session.user.id,
      `Selected quotation ${quotation.quotationNumber} for approval`,
      'Quotation',
      quotationId,
    )

    // Notify manager
    if (manager) {
      await createNotification({
        userId: manager.id,
        title: 'Approval Required',
        message: `Quotation from ${quotation.vendor.companyName} for "${quotation.rfq.title}" needs your approval. Amount: ₹${quotation.price.toLocaleString()}`,
      })
    }

    revalidatePath(`/procurement/compare/${quotation.rfqId}`)
    revalidatePath('/manager/approvals')
    return { success: true, data: { approvalId: approval.id } }
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Failed to select quotation for approval'
    return { success: false, error: message }
  }
}
