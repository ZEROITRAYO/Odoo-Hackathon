import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { DashboardClient } from "./dashboard-client"
import { redirect } from "next/navigation"

async function getDashboardData(userId: string, role: string) {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const [
    activeRFQs,
    pendingApprovals,
    posThisMonth,
    overdueInvoices,
    recentPOs,
    recentActivity,
    monthlySpend,
    topVendors,
    notifications,
  ] = await Promise.all([
    db.rFQ.count({ where: { status: "OPEN" } }),
    db.approval.count({ where: { status: "PENDING" } }),
    db.purchaseOrder.count({ where: { generatedAt: { gte: startOfMonth } } }),
    db.invoice.count({ where: { status: { in: ["DRAFT", "SENT"] }, generatedAt: { lte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) } } }),

    db.purchaseOrder.findMany({
      take: 5,
      orderBy: { generatedAt: "desc" },
      include: { vendor: { select: { companyName: true } } },
    }),

    db.activityLog.findMany({
      take: 6,
      orderBy: { timestamp: "desc" },
      include: { user: { select: { name: true, role: true } } },
    }),

    // Monthly spend last 6 months
    db.purchaseOrder.groupBy({
      by: ["generatedAt"],
      _sum: { total: true },
      where: {
        generatedAt: { gte: new Date(now.getFullYear(), now.getMonth() - 5, 1) },
      },
    }),

    // Top 5 vendors by PO value
    db.purchaseOrder.groupBy({
      by: ["vendorId"],
      _sum: { total: true },
      orderBy: { _sum: { total: "desc" } },
      take: 5,
    }),

    db.notification.count({ where: { userId, read: false } }),
  ])

  // Build 6-month spend data
  const spendByMonth: Record<string, number> = {}
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = d.toLocaleString("default", { month: "short", year: "2-digit" })
    spendByMonth[key] = 0
  }
  monthlySpend.forEach((row) => {
    const d = new Date(row.generatedAt)
    const key = d.toLocaleString("default", { month: "short", year: "2-digit" })
    if (key in spendByMonth) spendByMonth[key] = (spendByMonth[key] ?? 0) + (row._sum.total ?? 0)
  })
  const spendChartData = Object.entries(spendByMonth).map(([month, amount]) => ({ month, amount }))

  // Resolve vendor names for top vendors
  const vendorIds = topVendors.map((v) => v.vendorId)
  const vendorNames = await db.vendor.findMany({
    where: { id: { in: vendorIds } },
    select: { id: true, companyName: true },
  })
  const vendorMap = Object.fromEntries(vendorNames.map((v) => [v.id, v.companyName]))
  const topVendorChartData = topVendors.map((v) => ({
    name: vendorMap[v.vendorId] ?? "Unknown",
    value: v._sum.total ?? 0,
  }))

  // AI Insight: find cheapest vendor vs avg for a category
  const allVendorStats = await db.purchaseOrder.groupBy({
    by: ["vendorId"],
    _sum: { total: true },
    _count: true,
  })
  let insight: string | null = null
  if (allVendorStats.length >= 2) {
    const sorted = allVendorStats.sort((a, b) => (a._sum.total ?? 0) - (b._sum.total ?? 0))
    const cheapest = vendorMap[sorted[0].vendorId]
    const avgSpend = allVendorStats.reduce((s, v) => s + (v._sum.total ?? 0), 0) / allVendorStats.length
    const cheapestSpend = sorted[0]._sum.total ?? 0
    if (cheapest && avgSpend > 0) {
      const pct = Math.round(((avgSpend - cheapestSpend) / avgSpend) * 100)
      if (pct > 0) insight = `💡 ${cheapest} is ${pct}% cheaper than average across all vendors this period.`
    }
  }

  return {
    stats: { activeRFQs, pendingApprovals, posThisMonth, overdueInvoices },
    recentPOs,
    recentActivity,
    spendChartData,
    topVendorChartData,
    insight,
    unreadNotifications: notifications,
  }
}

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const data = await getDashboardData(session.user.id, session.user.role)

  return (
    <DashboardClient
      data={data}
      userName={session.user.name ?? "User"}
      role={session.user.role}
    />
  )
}
