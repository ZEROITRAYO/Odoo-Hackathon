'use server'

import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { vendorSchema } from '@/lib/validations'
import { z } from 'zod'

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function generateVendorCode(): Promise<string> {
  const count = await db.vendor.count()
  return `VND-${String(count + 1).padStart(5, '0')}`
}

async function logActivity(
  userId: string,
  action: string,
  entityType: string,
  entityId: string,
) {
  await db.activityLog.create({
    data: { userId, action, entityType, entityId },
  })
}

// ─── Types ────────────────────────────────────────────────────────────────────

export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string }

// ─── createVendor ─────────────────────────────────────────────────────────────

export async function createVendor(
  input: z.infer<typeof vendorSchema>,
): Promise<ActionResult<{ id: string; vendorCode: string }>> {
  try {
    const session = await auth()
    if (!session?.user) return { success: false, error: 'Unauthenticated' }
    if (!['ADMIN', 'PROCUREMENT_OFFICER'].includes(session.user.role)) {
      return { success: false, error: 'Unauthorized' }
    }

    const parsed = vendorSchema.safeParse(input)
    if (!parsed.success) {
      return { success: false, error: parsed.error.errors[0].message }
    }

    const { data } = parsed
    const vendorCode = await generateVendorCode()

    const vendor = await db.vendor.create({
      data: {
        ...data,
        vendorCode,
        status: data.status ?? 'ACTIVE',
      },
    })

    await logActivity(session.user.id, 'Created vendor', 'Vendor', vendor.id)
    revalidatePath('/vendors')

    return { success: true, data: { id: vendor.id, vendorCode: vendor.vendorCode } }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create vendor'
    return { success: false, error: message }
  }
}

// ─── updateVendor ─────────────────────────────────────────────────────────────

export async function updateVendor(
  id: string,
  input: Partial<z.infer<typeof vendorSchema>>,
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await auth()
    if (!session?.user) return { success: false, error: 'Unauthenticated' }
    if (!['ADMIN', 'PROCUREMENT_OFFICER'].includes(session.user.role)) {
      return { success: false, error: 'Unauthorized' }
    }

    const vendor = await db.vendor.findUnique({ where: { id } })
    if (!vendor) return { success: false, error: 'Vendor not found' }

    const updated = await db.vendor.update({
      where: { id },
      data: input,
    })

    await logActivity(session.user.id, 'Updated vendor', 'Vendor', id)
    revalidatePath('/vendors')

    return { success: true, data: { id: updated.id } }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update vendor'
    return { success: false, error: message }
  }
}

// ─── deleteVendor ─────────────────────────────────────────────────────────────

export async function deleteVendor(id: string): Promise<ActionResult> {
  try {
    const session = await auth()
    if (!session?.user) return { success: false, error: 'Unauthenticated' }
    if (session.user.role !== 'ADMIN') {
      return { success: false, error: 'Only admins can delete vendors' }
    }

    // Check if vendor has POs
    const poCount = await db.purchaseOrder.count({ where: { vendorId: id } })
    if (poCount > 0) {
      return {
        success: false,
        error: 'Cannot delete vendor with existing purchase orders',
      }
    }

    await db.vendor.delete({ where: { id } })
    await logActivity(session.user.id, 'Deleted vendor', 'Vendor', id)
    revalidatePath('/vendors')

    return { success: true, data: undefined }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to delete vendor'
    return { success: false, error: message }
  }
}

// ─── getVendors ───────────────────────────────────────────────────────────────

export interface GetVendorsParams {
  search?: string
  category?: string
  status?: string
  page?: number
  pageSize?: number
}

export async function getVendors(params: GetVendorsParams = {}) {
  const { search, category, status, page = 1, pageSize = 20 } = params

  const where: Record<string, unknown> = {}

  if (search) {
    where.OR = [
      { companyName: { contains: search, mode: 'insensitive' } },
      { vendorCode: { contains: search, mode: 'insensitive' } },
      { contactPerson: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ]
  }
  if (category) where.category = category
  if (status) where.status = status

  const [vendors, total] = await Promise.all([
    db.vendor.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.vendor.count({ where }),
  ])

  return { vendors, total, page, pageSize, totalPages: Math.ceil(total / pageSize) }
}

// ─── getVendorById ────────────────────────────────────────────────────────────

export async function getVendorById(id: string) {
  return db.vendor.findUnique({
    where: { id },
    include: {
      quotations: {
        include: { rfq: true },
        orderBy: { submittedAt: 'desc' },
        take: 10,
      },
      purchaseOrders: {
        orderBy: { generatedAt: 'desc' },
        take: 10,
      },
    },
  })
}

// ─── getVendorCategories ──────────────────────────────────────────────────────

export async function getVendorCategories(): Promise<string[]> {
  const results = await db.vendor.findMany({
    select: { category: true },
    distinct: ['category'],
    orderBy: { category: 'asc' },
  })
  return results.map((r) => r.category)
}
