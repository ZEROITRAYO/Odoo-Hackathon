'use server'

import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { rfqSchema } from '@/lib/validations'
import { z } from 'zod'
import { createNotification } from './notification.actions'

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function generateRFQNumber(): Promise<string> {
  const count = await db.rFQ.count()
  const year = new Date().getFullYear()
  return `RFQ-${year}-${String(count + 1).padStart(4, '0')}`
}

async function logActivity(
  userId: string,
  action: string,
  entityType: string,
  entityId: string,
) {
  await db.activityLog.create({ data: { userId, action, entityType, entityId } })
}

// ─── createRFQ ────────────────────────────────────────────────────────────────

export async function createRFQ(
  input: z.infer<typeof rfqSchema>,
): Promise<{ success: boolean; data?: { id: string; rfqNumber: string }; error?: string }> {
  try {
    const session = await auth()
    if (!session?.user) return { success: false, error: 'Unauthenticated' }
    if (!['ADMIN', 'PROCUREMENT_OFFICER'].includes(session.user.role)) {
      return { success: false, error: 'Unauthorized' }
    }

    const parsed = rfqSchema.safeParse(input)
    if (!parsed.success) {
      return { success: false, error: parsed.error.errors[0].message }
    }

    const { vendorIds, ...rfqData } = parsed.data
    const rfqNumber = await generateRFQNumber()

    const rfq = await db.rFQ.create({
      data: {
        ...rfqData,
        rfqNumber,
        deadline: new Date(rfqData.deadline),
        status: rfqData.status ?? 'OPEN',
        createdBy: session.user.id,
        rfqVendors: {
          create: vendorIds.map((vendorId) => ({ vendorId })),
        },
      },
    })

    await logActivity(session.user.id, `Created RFQ ${rfqNumber}`, 'RFQ', rfq.id)

    // Notify assigned vendors
    const vendors = await db.vendor.findMany({
      where: { id: { in: vendorIds } },
    })
    // Find vendor users by matching email
    for (const vendor of vendors) {
      const vendorUser = await db.user.findFirst({
        where: { email: vendor.email, role: 'VENDOR' },
      })
      if (vendorUser) {
        await createNotification({
          userId: vendorUser.id,
          title: 'New RFQ Assigned',
          message: `You have been invited to quote on "${rfq.title}" (${rfqNumber})`,
        })
      }
    }

    revalidatePath('/rfqs')
    return { success: true, data: { id: rfq.id, rfqNumber: rfq.rfqNumber } }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create RFQ'
    return { success: false, error: message }
  }
}

// ─── updateRFQ ────────────────────────────────────────────────────────────────

export async function updateRFQ(
  id: string,
  input: Partial<z.infer<typeof rfqSchema>>,
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth()
    if (!session?.user) return { success: false, error: 'Unauthenticated' }

    const rfq = await db.rFQ.findUnique({ where: { id } })
    if (!rfq) return { success: false, error: 'RFQ not found' }
    if (rfq.status === 'CLOSED') {
      return { success: false, error: 'Cannot update a closed RFQ' }
    }

    const { vendorIds, ...rfqData } = input

    await db.rFQ.update({
      where: { id },
      data: {
        ...rfqData,
        ...(rfqData.deadline ? { deadline: new Date(rfqData.deadline) } : {}),
      },
    })

    // Re-assign vendors if provided
    if (vendorIds) {
      await db.rFQVendor.deleteMany({ where: { rfqId: id } })
      await db.rFQVendor.createMany({
        data: vendorIds.map((vendorId) => ({ rfqId: id, vendorId })),
      })
    }

    await logActivity(session.user.id, `Updated RFQ ${rfq.rfqNumber}`, 'RFQ', id)
    revalidatePath('/rfqs')
    revalidatePath(`/rfqs/${id}`)
    return { success: true }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update RFQ'
    return { success: false, error: message }
  }
}

// ─── closeRFQ ─────────────────────────────────────────────────────────────────

export async function closeRFQ(
  id: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth()
    if (!session?.user) return { success: false, error: 'Unauthenticated' }
    if (!['ADMIN', 'PROCUREMENT_OFFICER'].includes(session.user.role)) {
      return { success: false, error: 'Unauthorized' }
    }

    const rfq = await db.rFQ.findUnique({ where: { id } })
    if (!rfq) return { success: false, error: 'RFQ not found' }
    if (rfq.status === 'CLOSED') {
      return { success: false, error: 'RFQ is already closed' }
    }

    await db.rFQ.update({ where: { id }, data: { status: 'CLOSED' } })
    await logActivity(session.user.id, `Closed RFQ ${rfq.rfqNumber}`, 'RFQ', id)
    revalidatePath('/rfqs')
    revalidatePath(`/rfqs/${id}`)
    return { success: true }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to close RFQ'
    return { success: false, error: message }
  }
}

// ─── assignVendorsToRFQ ───────────────────────────────────────────────────────

export async function assignVendorsToRFQ(
  rfqId: string,
  vendorIds: string[],
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth()
    if (!session?.user) return { success: false, error: 'Unauthenticated' }

    const rfq = await db.rFQ.findUnique({ where: { id: rfqId } })
    if (!rfq) return { success: false, error: 'RFQ not found' }

    // Upsert – add only new ones
    const existing = await db.rFQVendor.findMany({
      where: { rfqId },
      select: { vendorId: true },
    })
    const existingIds = new Set(existing.map((e) => e.vendorId))
    const newIds = vendorIds.filter((vid) => !existingIds.has(vid))

    if (newIds.length > 0) {
      await db.rFQVendor.createMany({
        data: newIds.map((vendorId) => ({ rfqId, vendorId })),
      })
    }

    await logActivity(
      session.user.id,
      `Assigned ${newIds.length} vendors to RFQ ${rfq.rfqNumber}`,
      'RFQ',
      rfqId,
    )
    revalidatePath(`/rfqs/${rfqId}`)
    return { success: true }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to assign vendors'
    return { success: false, error: message }
  }
}

// ─── getRFQs ──────────────────────────────────────────────────────────────────

export interface GetRFQsParams {
  status?: string
  search?: string
  deadlineBefore?: string
  page?: number
  pageSize?: number
  vendorId?: string // For vendor portal: filter by assigned vendor
}

export async function getRFQs(params: GetRFQsParams = {}) {
  const { status, search, deadlineBefore, page = 1, pageSize = 20, vendorId } = params

  const where: Record<string, unknown> = {}

  if (status) where.status = status
  if (deadlineBefore) where.deadline = { lte: new Date(deadlineBefore) }
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { rfqNumber: { contains: search, mode: 'insensitive' } },
    ]
  }
  if (vendorId) {
    where.rfqVendors = { some: { vendorId } }
  }

  const [rfqs, total] = await Promise.all([
    db.rFQ.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        creator: { select: { id: true, name: true } },
        rfqVendors: { include: { vendor: { select: { id: true, companyName: true } } } },
        _count: { select: { quotations: true } },
      },
    }),
    db.rFQ.count({ where }),
  ])

  return { rfqs, total, page, pageSize, totalPages: Math.ceil(total / pageSize) }
}

// ─── getRFQById ───────────────────────────────────────────────────────────────

export async function getRFQById(id: string) {
  return db.rFQ.findUnique({
    where: { id },
    include: {
      creator: { select: { id: true, name: true, email: true } },
      rfqVendors: {
        include: {
          vendor: true,
        },
      },
      quotations: {
        include: {
          vendor: true,
          approval: true,
        },
        orderBy: { submittedAt: 'desc' },
      },
    },
  })
}
