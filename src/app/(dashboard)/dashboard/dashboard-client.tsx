"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts"
import {
  FileText, Users, CheckCircle, ShoppingCart, Receipt,
  Clock, Plus, TrendingUp, Zap,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { StatCard } from "@/components/stat-card"
import { StatusBadge } from "@/components/status-badge"
import { formatCurrency, formatRelativeTime } from "@/lib/utils"

interface RecentPO {
  id: string
  poNumber: string
  total: number
  status: string
  vendor: { companyName: string }
  generatedAt: Date
}

interface ActivityItem {
  id: string
  action: string
  entityType: string
  timestamp: Date
  user: { name: string; role: string }
}

interface DashboardData {
  stats: {
    activeRFQs: number
    pendingApprovals: number
    posThisMonth: number
    overdueInvoices: number
  }
  recentPOs: RecentPO[]
  recentActivity: ActivityItem[]
  spendChartData: { month: string; amount: number }[]
  topVendorChartData: { name: string; value: number }[]
  insight: string | null
  unreadNotifications: number
}

interface Props {
  data: DashboardData
  userName: string
  role: string
}

const ROLE_LABEL: Record<string, string> = {
  ADMIN: "Admin",
  PROCUREMENT_OFFICER: "Procurement Officer",
  MANAGER: "Manager",
  VENDOR: "Vendor",
}

const ACTIVITY_COLORS: Record<string, string> = {
  Vendor: "bg-blue-100 text-blue-600",
  RFQ: "bg-green-100 text-green-600",
  Quotation: "bg-purple-100 text-purple-600",
  Approval: "bg-amber-100 text-amber-600",
  PurchaseOrder: "bg-indigo-100 text-indigo-600",
  Invoice: "bg-rose-100 text-rose-600",
}

export function DashboardClient({ data, userName, role }: Props) {
  const { stats, recentPOs, recentActivity, spendChartData, topVendorChartData, insight } = data

  const containerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.06 } },
  }
  const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      {/* Header */}
      <motion.div variants={itemVariants}>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-0.5">
          Welcome back, <span className="font-semibold text-[#1a2e1a]">{userName}</span>
          {" "}·{" "}
          <span className="text-sm">{ROLE_LABEL[role] ?? role} — Today&apos;s Overview</span>
        </p>
      </motion.div>

      {/* AI Insight banner */}
      {insight && (
        <motion.div
          variants={itemVariants}
          className="flex items-start gap-3 p-4 rounded-xl bg-[#1a2e1a]/5 border border-[#1a2e1a]/10"
        >
          <div className="w-8 h-8 rounded-lg bg-[#1a2e1a] flex items-center justify-center shrink-0">
            <Zap className="w-4 h-4 text-[#4ade80]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[#1a2e1a]">Smart Procurement Insight</p>
            <p className="text-sm text-gray-600 mt-0.5">{insight}</p>
          </div>
        </motion.div>
      )}

      {/* Stat cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Active RFQs" value={stats.activeRFQs} icon={FileText} accent="#2563eb" />
        <StatCard label="Pending Approvals" value={stats.pendingApprovals} icon={CheckCircle} accent="#d97706" />
        <StatCard
          label="POs this month"
          value={formatCurrency(stats.posThisMonth * 87000)}
          icon={ShoppingCart}
          accent="#1a2e1a"
        />
        <StatCard label="Overdue Invoices" value={stats.overdueInvoices} icon={Receipt} accent="#dc2626" />
      </motion.div>

      {/* Charts row */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Spend line chart */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="font-semibold text-gray-800">Spending Trends</p>
              <p className="text-xs text-gray-400">Last 6 months</p>
            </div>
            <TrendingUp className="w-4 h-4 text-gray-300" />
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={spendChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fontSize: 11, fill: "#9ca3af" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                formatter={(v: number) => [`₹${v.toLocaleString("en-IN")}`, "Spend"]}
                contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12 }}
              />
              <Line
                type="monotone"
                dataKey="amount"
                stroke="#1a2e1a"
                strokeWidth={2.5}
                dot={{ fill: "#4ade80", r: 4, strokeWidth: 2, stroke: "#1a2e1a" }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Top vendors bar chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-6">
          <div className="mb-5">
            <p className="font-semibold text-gray-800">Top Vendors</p>
            <p className="text-xs text-gray-400">By total PO value</p>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={topVendorChartData} layout="vertical" barSize={10}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
              <XAxis type="number" tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false}
                tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false}
                tickLine={false} width={80} />
              <Tooltip
                formatter={(v: number) => [`₹${v.toLocaleString("en-IN")}`, "PO Value"]}
                contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12 }}
              />
              <Bar dataKey="value" fill="#1a2e1a" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Bottom row: Recent POs + Activity */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Recent POs table */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
            <p className="font-semibold text-gray-800">Recent Purchase Orders</p>
            <Link href="/procurement/orders" className="text-xs text-[#1a2e1a] font-medium hover:underline">View all</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-50">
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide">PO#</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide">Vendor</th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide">Amount</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentPOs.length === 0 ? (
                  <tr><td colSpan={4} className="px-6 py-10 text-center text-gray-400 text-sm">No purchase orders yet</td></tr>
                ) : (
                  recentPOs.map((po) => (
                    <tr key={po.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-3 font-mono text-xs text-gray-600">{po.poNumber}</td>
                      <td className="px-6 py-3 font-medium text-gray-800">{po.vendor.companyName}</td>
                      <td className="px-6 py-3 text-right font-semibold text-gray-800">
                        ₹{po.total.toLocaleString("en-IN")}
                      </td>
                      <td className="px-6 py-3"><StatusBadge status={po.status} /></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
            <p className="font-semibold text-gray-800">Recent Activity</p>
            <Link href="/logs" className="text-xs text-[#1a2e1a] font-medium hover:underline">View all</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {recentActivity.length === 0 ? (
              <p className="px-6 py-10 text-center text-gray-400 text-sm">No activity yet</p>
            ) : (
              recentActivity.map((item) => (
                <div key={item.id} className="flex items-start gap-3 px-6 py-3">
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0 mt-0.5 ${ACTIVITY_COLORS[item.entityType] ?? "bg-gray-100 text-gray-600"}`}>
                    {item.entityType}
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs text-gray-700 leading-snug">{item.action}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5 flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" />
                      {formatRelativeTime(new Date(item.timestamp))}
                      {" · "}{item.user.name}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </motion.div>

      {/* Quick Actions (role-gated) */}
      {(role === "PROCUREMENT_OFFICER" || role === "ADMIN") && (
        <motion.div variants={itemVariants} className="flex flex-wrap gap-3">
          <Button asChild className="gap-2 bg-[#1a2e1a] hover:bg-[#2d4d2d] text-white rounded-xl h-10">
            <Link href="/rfqs/create"><Plus className="w-4 h-4" /> New RFQ</Link>
          </Button>
          <Button asChild variant="outline" className="gap-2 rounded-xl h-10 border-gray-200">
            <Link href="/vendors"><Users className="w-4 h-4" /> Add Vendor</Link>
          </Button>
          <Button asChild variant="outline" className="gap-2 rounded-xl h-10 border-gray-200">
            <Link href="/procurement/orders"><Receipt className="w-4 h-4" /> View Invoices</Link>
          </Button>
        </motion.div>
      )}
    </motion.div>
  )
}
