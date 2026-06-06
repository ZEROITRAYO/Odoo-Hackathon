'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

// ─── getVendorPerformance ─────────────────────────────────────────────────────

export interface VendorPerformanceRow {
  vendorId: string
  companyName: string
  vendorCode: string
  category: string
  rating: number | null
  totalQuotations: number
  wonQuotations: number  // quotations that became POs
  winRate: number        // %
  avgPrice: number
  avgDeliveryDays: number
  totalPOValue: number
}

export async function getVendorPerformance(): Promise<VendorPerformanceRow[]> {
  const session = await auth()
  if (!session?.user) return []

  const vendors = await db.vendor.findMany({
    include: {
      quotations: {
        include: {
          approval: {
            include: {
              purchaseOrder: true,
            },
          },
        },
      },
    },
    orderBy: { companyName: 'asc' },
  })

  return vendors.map((v) => {
    const allQuotations = v.quotations
    const wonQuotations = allQuotations.filter((q) => q.approval?.purchaseOrder != null)
    const totalPOValue = wonQuotations.reduce(
      (sum, q) => sum + (q.approval?.purchaseOrder?.total ?? 0),
      0,
    )
    const avgPrice =
      allQuotations.length > 0
        ? allQuotations.reduce((s, q) => s + q.price, 0) / allQuotations.length
        : 0
    const avgDeliveryDays =
      allQuotations.length > 0
        ? allQuotations.reduce((s, q) => s + q.deliveryDays, 0) / allQuotations.length
        : 0

    return {
      vendorId: v.id,
      companyName: v.companyName,
      vendorCode: v.vendorCode,
      category: v.category,
      rating: v.rating,
      totalQuotations: allQuotations.length,
      wonQuotations: wonQuotations.length,
      winRate:
        allQuotations.length > 0
          ? +((wonQuotations.length / allQuotations.length) * 100).toFixed(1)
          : 0,
      avgPrice: +avgPrice.toFixed(2),
      avgDeliveryDays: +avgDeliveryDays.toFixed(1),
      totalPOValue: +totalPOValue.toFixed(2),
    }
  })
}

// ─── getProcurementStats ──────────────────────────────────────────────────────

export interface MonthlySpend {
  month: string   // "Jan 2025"
  spend: number
  poCount: number
}

export interface ProcurementStats {
  totalVendors: number
  activeRFQs: number
  pendingApprovals: number
  posThisMonth: number
  invoicesThisMonth: number
  totalSpendThisYear: number
  monthlySpend: MonthlySpend[]
  topVendorsByPOValue: { vendorId: string; companyName: string; total: number }[]
}

export async function getProcurementStats(): Promise<ProcurementStats> {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfYear = new Date(now.getFullYear(), 0, 1)

  const [
    totalVendors,
    activeRFQs,
    pendingApprovals,
    posThisMonth,
    invoicesThisMonth,
    allPOsThisYear,
  ] = await Promise.all([
    db.vendor.count({ where: { status: 'ACTIVE' } }),
    db.rFQ.count({ where: { status: 'OPEN' } }),
    db.approval.count({ where: { status: 'PENDING' } }),
    db.purchaseOrder.count({ where: { generatedAt: { gte: startOfMonth } } }),
    db.invoice.count({ where: { generatedAt: { gte: startOfMonth } } }),
    db.purchaseOrder.findMany({
      where: { generatedAt: { gte: startOfYear } },
      select: { total: true, generatedAt: true, vendorId: true, vendor: { select: { companyName: true } } },
    }),
  ])

  const totalSpendThisYear = allPOsThisYear.reduce((s, po) => s + po.total, 0)

  // Build monthly spend for last 6 months
  const monthlySpend: MonthlySpend[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const label = d.toLocaleString('en-IN', { month: 'short', year: 'numeric' })
    const endOfMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59)

    const pos = await db.purchaseOrder.findMany({
      where: { generatedAt: { gte: d, lte: endOfMonth } },
      select: { total: true },
    })

    monthlySpend.push({
      month: label,
      spend: +pos.reduce((s, po) => s + po.total, 0).toFixed(2),
      poCount: pos.length,
    })
  }

  // Top 5 vendors by PO value
  const vendorTotals: Record<string, { companyName: string; total: number }> = {}
  for (const po of allPOsThisYear) {
    if (!vendorTotals[po.vendorId]) {
      vendorTotals[po.vendorId] = { companyName: po.vendor.companyName, total: 0 }
    }
    vendorTotals[po.vendorId].total += po.total
  }

  const topVendorsByPOValue = Object.entries(vendorTotals)
    .map(([vendorId, { companyName, total }]) => ({ vendorId, companyName, total: +total.toFixed(2) }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5)

  return {
    totalVendors,
    activeRFQs,
    pendingApprovals,
    posThisMonth,
    invoicesThisMonth,
    totalSpendThisYear: +totalSpendThisYear.toFixed(2),
    monthlySpend,
    topVendorsByPOValue,
  }
}

// ─── getSmartInsights ─────────────────────────────────────────────────────────
// "Hackathon winning" AI-style insights based on data

export interface SmartInsight {
  type: 'saving' | 'warning' | 'info'
  message: string
}

export async function getSmartInsights(): Promise<SmartInsight[]> {
  const session = await auth()
  if (!session?.user) return []

  const insights: SmartInsight[] = []

  // 1. Cheapest vendor per category vs average
  const categories = await db.vendor.findMany({
    select: { category: true },
    distinct: ['category'],
  })

  for (const { category } of categories) {
    const vendorQuotations = await db.quotation.findMany({
      where: { vendor: { category } },
      include: { vendor: { select: { companyName: true } } },
    })

    if (vendorQuotations.length < 2) continue

    const avgPrice = vendorQuotations.reduce((s, q) => s + q.price, 0) / vendorQuotations.length

    // Group by vendor
    const byVendor: Record<string, { name: string; prices: number[] }> = {}
    for (const q of vendorQuotations) {
      if (!byVendor[q.vendorId]) {
        byVendor[q.vendorId] = { name: q.vendor.companyName, prices: [] }
      }
      byVendor[q.vendorId].prices.push(q.price)
    }

    for (const [, { name, prices }] of Object.entries(byVendor)) {
      const vendorAvg = prices.reduce((s, p) => s + p, 0) / prices.length
      const diff = ((avgPrice - vendorAvg) / avgPrice) * 100
      if (diff > 10) {
        insights.push({
          type: 'saving',
          message: `${name} is ${diff.toFixed(0)}% cheaper than average for category "${category}"`,
        })
      }
    }
  }

  // 2. SLA breach warning
  const slaBreachCount = await db.approval.count({
    where: {
      status: 'PENDING',
      createdAt: { lte: new Date(Date.now() - 48 * 60 * 60 * 1000) },
    },
  })
  if (slaBreachCount > 0) {
    insights.push({
      type: 'warning',
      message: `${slaBreachCount} approval${slaBreachCount > 1 ? 's have' : ' has'} exceeded the 48-hour SLA`,
    })
  }

  // 3. Vendors with low rating
  const lowRatedVendors = await db.vendor.findMany({
    where: { rating: { lte: 2 }, status: 'ACTIVE' },
    select: { companyName: true, rating: true },
  })
  for (const v of lowRatedVendors) {
    insights.push({
      type: 'warning',
      message: `${v.companyName} has a low rating of ${v.rating}/5 — consider review`,
    })
  }

  // 4. Overdue RFQs
  const overdueRFQs = await db.rFQ.count({
    where: { status: 'OPEN', deadline: { lt: new Date() } },
  })
  if (overdueRFQs > 0) {
    insights.push({
      type: 'warning',
      message: `${overdueRFQs} RFQ${overdueRFQs > 1 ? 's are' : ' is'} past their deadline but still open`,
    })
  }

  return insights.slice(0, 5) // Limit to 5 insights
}

// ─── getActivityLogs ──────────────────────────────────────────────────────────

export async function getActivityLogs(params: {
  entityType?: string
  userId?: string
  page?: number
  pageSize?: number
} = {}) {
  const session = await auth()
  if (!session?.user) return { logs: [], total: 0 }

  const { entityType, userId, page = 1, pageSize = 50 } = params

  const where: Record<string, unknown> = {}
  if (entityType) where.entityType = entityType
  if (userId) where.userId = userId

  const [logs, total] = await Promise.all([
    db.activityLog.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        user: { select: { id: true, name: true, role: true } },
      },
    }),
    db.activityLog.count({ where }),
  ])

  return { logs, total, page, pageSize }
}

// ─── getDashboardStats ────────────────────────────────────────────────────────
// Quick combined query for the dashboard page

export async function getDashboardStats() {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const [
    totalVendors,
    activeRFQs,
    pendingApprovals,
    posThisMonth,
    invoicesThisMonth,
    recentLogs,
  ] = await Promise.all([
    db.vendor.count({ where: { status: 'ACTIVE' } }),
    db.rFQ.count({ where: { status: 'OPEN' } }),
    db.approval.count({ where: { status: 'PENDING' } }),
    db.purchaseOrder.count({ where: { generatedAt: { gte: startOfMonth } } }),
    db.invoice.count({ where: { generatedAt: { gte: startOfMonth } } }),
    db.activityLog.findMany({
      orderBy: { timestamp: 'desc' },
      take: 5,
      include: { user: { select: { name: true, role: true } } },
    }),
  ])

  return {
    totalVendors,
    activeRFQs,
    pendingApprovals,
    posThisMonth,
    invoicesThisMonth,
    recentLogs,
  }
}
