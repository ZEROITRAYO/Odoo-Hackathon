'use server'

import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

// ─── getPurchaseOrders ────────────────────────────────────────────────────────

export interface GetPOsParams {
  status?: string
  vendorId?: string
  search?: string
  page?: number
  pageSize?: number
}

export async function getPurchaseOrders(params: GetPOsParams = {}) {
  const session = await auth()
  if (!session?.user) return { orders: [], total: 0 }

  const { status, vendorId, search, page = 1, pageSize = 20 } = params

  const where: Record<string, unknown> = {}
  if (status) where.status = status
  if (vendorId) where.vendorId = vendorId
  if (search) {
    where.OR = [
      { poNumber: { contains: search, mode: 'insensitive' } },
      { vendor: { companyName: { contains: search, mode: 'insensitive' } } },
    ]
  }

  const [orders, total] = await Promise.all([
    db.purchaseOrder.findMany({
      where,
      orderBy: { generatedAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        vendor: { select: { id: true, companyName: true, vendorCode: true, email: true } },
        invoice: { select: { id: true, invoiceNumber: true, status: true } },
        approval: {
          select: {
            id: true,
            status: true,
            quotation: {
              select: {
                id: true,
                quotationNumber: true,
                rfq: { select: { id: true, rfqNumber: true, title: true } },
              },
            },
          },
        },
      },
    }),
    db.purchaseOrder.count({ where }),
  ])

  return { orders, total, page, pageSize, totalPages: Math.ceil(total / pageSize) }
}

// ─── getPurchaseOrderById ─────────────────────────────────────────────────────

export async function getPurchaseOrderById(id: string) {
  return db.purchaseOrder.findUnique({
    where: { id },
    include: {
      vendor: true,
      invoice: true,
      approval: {
        include: {
          quotation: {
            include: {
              rfq: true,
            },
          },
          approver: { select: { id: true, name: true } },
        },
      },
    },
  })
}

// ─── updatePOStatus ───────────────────────────────────────────────────────────

export async function updatePOStatus(
  id: string,
  status: 'GENERATED' | 'SENT' | 'ACCEPTED' | 'CLOSED',
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth()
    if (!session?.user) return { success: false, error: 'Unauthenticated' }
    if (!['ADMIN', 'PROCUREMENT_OFFICER'].includes(session.user.role)) {
      return { success: false, error: 'Unauthorized' }
    }

    await db.purchaseOrder.update({ where: { id }, data: { status } })
    revalidatePath('/procurement/orders')
    return { success: true }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update PO status'
    return { success: false, error: message }
  }
}
