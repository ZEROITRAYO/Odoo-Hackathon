"use client"

import { useState } from "react"
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, Legend,
} from "recharts"
import {
  BarChart3, Users, TrendingUp, Download, FileSpreadsheet,
  FileDown, Star, Trophy, Truck, IndianRupee, Target,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PageHeader } from "@/components/page-header"
import { EmptyState } from "@/components/empty-state"
import { formatCurrency, cn } from "@/lib/utils"
import type { VendorPerformanceRow, ProcurementStats } from "@/lib/actions/report.actions"

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  vendorPerformance: VendorPerformanceRow[]
  procurementStats: ProcurementStats
  userRole: string
}

// ─── Vendor Scorecard card ─────────────────────────────────────────────────────

function ScoreBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-gray-500">
        <span>{label}</span>
        <span className="font-medium text-gray-700">{typeof value === "number" && value % 1 !== 0 ? value.toFixed(1) : value}</span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={cn("h-full rounded-full transition-all", color)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

// ─── Export helpers ────────────────────────────────────────────────────────────

async function exportCSV(data: VendorPerformanceRow[]) {
  const { default: Papa } = await import("papaparse" as never as string) as { default: { unparse: (d: unknown) => string } }
  const rows = data.map(r => ({
    "Vendor Code": r.vendorCode,
    "Company": r.companyName,
    "Category": r.category,
    "Rating": r.rating ?? "N/A",
    "Total Quotations": r.totalQuotations,
    "Won": r.wonQuotations,
    "Win Rate %": r.winRate,
    "Avg Price (₹)": r.avgPrice,
    "Avg Delivery Days": r.avgDeliveryDays,
    "Total PO Value (₹)": r.totalPOValue,
  }))
  const csv = Papa.unparse(rows)
  const blob = new Blob([csv], { type: "text/csv" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a"); a.href = url; a.download = "vendor-performance.csv"; a.click()
  URL.revokeObjectURL(url)
}

async function exportExcel(data: VendorPerformanceRow[]) {
  const XLSX = await import("xlsx")
  const ws = XLSX.utils.json_to_sheet(data.map(r => ({
    "Vendor Code": r.vendorCode,
    "Company": r.companyName,
    "Category": r.category,
    "Rating": r.rating,
    "Win Rate %": r.winRate,
    "Avg Price": r.avgPrice,
    "Avg Delivery Days": r.avgDeliveryDays,
    "Total PO Value": r.totalPOValue,
  })))
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, "Vendor Performance")
  XLSX.writeFile(wb, "vendor-performance.xlsx")
}

async function exportPDF(data: VendorPerformanceRow[]) {
  const { default: jsPDF } = await import("jspdf")
  const { default: autoTable } = await import("jspdf-autotable")
  const doc = new jsPDF({ orientation: "landscape" })
  doc.setFontSize(14)
  doc.text("Vendor Performance Report", 14, 18)
  doc.setFontSize(9)
  doc.setTextColor(100)
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 25)
  autoTable(doc, {
    startY: 30,
    head: [["Vendor Code", "Company", "Category", "Rating", "Quotations", "Won", "Win %", "Avg Price", "Avg Days", "Total PO Value"]],
    body: data.map(r => [
      r.vendorCode, r.companyName, r.category, r.rating ?? "—",
      r.totalQuotations, r.wonQuotations, `${r.winRate}%`,
      `₹${r.avgPrice.toLocaleString()}`, r.avgDeliveryDays, `₹${r.totalPOValue.toLocaleString()}`,
    ]),
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: [79, 70, 229] },
  })
  doc.save("vendor-performance.pdf")
}

// ─── Spending Heatmap ─────────────────────────────────────────────────────────

function SpendingHeatmap({ data }: { data: { month: string; spend: number; poCount: number }[] }) {
  const maxSpend = Math.max(...data.map(d => d.spend), 1)

  return (
    <div className="grid grid-cols-6 gap-2">
      {data.map((d) => {
        const intensity = d.spend / maxSpend
        const bg = intensity === 0
          ? "bg-gray-50 border-gray-100"
          : intensity < 0.33
          ? "bg-indigo-100 border-indigo-200"
          : intensity < 0.66
          ? "bg-indigo-300 border-indigo-400"
          : "bg-indigo-500 border-indigo-600"
        const text = intensity > 0.5 ? "text-white" : "text-indigo-900"

        return (
          <div
            key={d.month}
            className={cn("rounded-xl border p-3 flex flex-col gap-1 cursor-default hover:opacity-90 transition-opacity", bg)}
            title={`${d.month}: ${formatCurrency(d.spend)} (${d.poCount} POs)`}
          >
            <span className={cn("text-xs font-medium", text)}>{d.month.slice(0, 3)}</span>
            <span className={cn("text-xs font-bold", text)}>{d.spend > 0 ? formatCurrency(d.spend) : "—"}</span>
            <span className={cn("text-xs opacity-70", text)}>{d.poCount} POs</span>
          </div>
        )
      })}
    </div>
  )
}

// ─── Custom tooltip for Recharts ──────────────────────────────────────────────

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number; name: string }[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-100 rounded-xl px-3 py-2 shadow-lg text-xs">
      <p className="font-semibold text-gray-700 mb-1">{label}</p>
      {payload.map(p => (
        <p key={p.name} className="text-gray-600">
          {p.name}: <span className="font-bold text-gray-900">{typeof p.value === "number" && p.value > 1000 ? formatCurrency(p.value) : p.value}</span>
        </p>
      ))}
    </div>
  )
}

const CHART_COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"]

// ─── Main Component ───────────────────────────────────────────────────────────

export function ReportsClient({ vendorPerformance, procurementStats, userRole }: Props) {
  const [exporting, setExporting] = useState<"csv" | "xlsx" | "pdf" | null>(null)

  const doExport = async (type: "csv" | "xlsx" | "pdf") => {
    setExporting(type)
    try {
      if (type === "csv") await exportCSV(vendorPerformance)
      else if (type === "xlsx") await exportExcel(vendorPerformance)
      else await exportPDF(vendorPerformance)
    } finally {
      setExporting(null)
    }
  }

  const topVendors = [...vendorPerformance]
    .sort((a, b) => b.totalPOValue - a.totalPOValue)
    .slice(0, 5)

  const monthlyChartData = procurementStats.monthlySpend.map(m => ({
    month: m.month,
    spend: m.spend,
    poCount: m.poCount,
  }))

  return (
    <div className="space-y-6">
      <PageHeader title="Reports & Analytics" subtitle="Procurement intelligence and vendor insights" />

      <Tabs defaultValue="vendor">
        <TabsList className="bg-gray-100/80 rounded-xl mb-2">
          <TabsTrigger value="vendor" className="gap-1.5 data-[state=active]:bg-white rounded-lg">
            <Users className="w-3.5 h-3.5" />
            Vendor Performance
          </TabsTrigger>
          <TabsTrigger value="procurement" className="gap-1.5 data-[state=active]:bg-white rounded-lg">
            <TrendingUp className="w-3.5 h-3.5" />
            Procurement Report
          </TabsTrigger>
          <TabsTrigger value="heatmap" className="gap-1.5 data-[state=active]:bg-white rounded-lg">
            <BarChart3 className="w-3.5 h-3.5" />
            Spending Heatmap
          </TabsTrigger>
        </TabsList>

        {/* ── Vendor Performance Tab ─────────────────────────────────────── */}
        <TabsContent value="vendor" className="space-y-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">{vendorPerformance.length} vendors analysed</p>
            <div className="flex gap-2">
              {(["csv", "xlsx", "pdf"] as const).map(type => (
                <Button
                  key={type}
                  size="sm"
                  variant="outline"
                  className="text-xs gap-1.5"
                  onClick={() => doExport(type)}
                  disabled={exporting === type}
                >
                  {type === "csv" ? <Download className="w-3.5 h-3.5" /> : type === "xlsx" ? <FileSpreadsheet className="w-3.5 h-3.5" /> : <FileDown className="w-3.5 h-3.5" />}
                  {exporting === type ? "Exporting…" : type.toUpperCase()}
                </Button>
              ))}
            </div>
          </div>

          {vendorPerformance.length === 0 ? (
            <EmptyState icon={Users} title="No vendor data" description="Vendor performance data will appear once quotations are submitted." />
          ) : (
            <>
              {/* Top 5 chart */}
              <div className="bg-white rounded-2xl border border-gray-100 p-5">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">Top 5 Vendors by PO Value</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={topVendors} margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                    <XAxis dataKey="companyName" tick={{ fontSize: 11 }} tickFormatter={n => n.split(" ")[0]} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="totalPOValue" name="Total PO Value" radius={[6, 6, 0, 0]}>
                      {topVendors.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Scorecard table */}
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="px-5 py-3 border-b border-gray-50 bg-gray-50/60">
                  <h3 className="text-sm font-semibold text-gray-700">Vendor Scorecard</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100">
                        {["#", "Vendor", "Category", "Rating", "Quotations", "Win Rate", "Avg Price", "Avg Delivery", "Total PO Value"].map(h => (
                          <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {vendorPerformance.map((v, i) => (
                        <tr key={v.vendorId} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-4 py-3 text-gray-400 text-xs">{i + 1}</td>
                          <td className="px-4 py-3">
                            <p className="font-semibold text-gray-900">{v.companyName}</p>
                            <p className="text-xs text-gray-400 font-mono">{v.vendorCode}</p>
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-600">{v.category}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1">
                              <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                              <span className="text-sm font-medium">{v.rating?.toFixed(1) ?? "—"}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-gray-700">{v.totalQuotations}</td>
                          <td className="px-4 py-3">
                            <span className={cn(
                              "text-xs font-bold px-2 py-0.5 rounded-full",
                              v.winRate >= 50 ? "bg-green-100 text-green-700" : v.winRate >= 25 ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-600",
                            )}>
                              {v.winRate}%
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-700">{formatCurrency(v.avgPrice)}</td>
                          <td className="px-4 py-3 text-gray-700">{v.avgDeliveryDays}d</td>
                          <td className="px-4 py-3 font-bold text-gray-900">{formatCurrency(v.totalPOValue)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </TabsContent>

        {/* ── Procurement Report Tab ─────────────────────────────────────── */}
        <TabsContent value="procurement" className="space-y-5">
          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Total Vendors", value: procurementStats.totalVendors, icon: Users, color: "#6366f1" },
              { label: "Active RFQs", value: procurementStats.activeRFQs, icon: Target, color: "#10b981" },
              { label: "POs This Month", value: procurementStats.posThisMonth, icon: BarChart3, color: "#f59e0b" },
              { label: "Year-to-Date Spend", value: formatCurrency(procurementStats.totalSpendThisYear), icon: IndianRupee, color: "#ef4444" },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${color}18` }}>
                  <Icon className="w-4 h-4" style={{ color }} />
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-medium">{label}</p>
                  <p className="text-lg font-bold text-gray-900">{value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Monthly spend chart */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Monthly Spend (Last 12 Months)</h3>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={monthlyChartData} margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                <Tooltip content={<ChartTooltip />} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="spend"
                  name="Spend (₹)"
                  stroke="#6366f1"
                  strokeWidth={2}
                  dot={{ r: 4, fill: "#6366f1" }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* PO count bar */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">PO Count by Month</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={monthlyChartData} margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="poCount" name="PO Count" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </TabsContent>

        {/* ── Spending Heatmap Tab ───────────────────────────────────────── */}
        <TabsContent value="heatmap" className="space-y-5">
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-sm font-semibold text-gray-700">Monthly Spending Intensity</h3>
                <p className="text-xs text-gray-400 mt-0.5">Darker = higher spend. Hover for details.</p>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <span>Low</span>
                <div className="flex gap-1">
                  {["bg-gray-100", "bg-indigo-100", "bg-indigo-300", "bg-indigo-500"].map(c => (
                    <div key={c} className={cn("w-5 h-5 rounded", c)} />
                  ))}
                </div>
                <span>High</span>
              </div>
            </div>
            <SpendingHeatmap data={monthlyChartData} />
          </div>

          {/* Summary table under heatmap */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-50 bg-gray-50/60">
              <h3 className="text-sm font-semibold text-gray-700">Monthly Summary</h3>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {["Month", "Total Spend", "PO Count", "Avg per PO"].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {monthlyChartData.map(row => (
                  <tr key={row.month} className="hover:bg-gray-50/50">
                    <td className="px-5 py-2.5 font-medium text-gray-700">{row.month}</td>
                    <td className="px-5 py-2.5 font-semibold text-gray-900">{formatCurrency(row.spend)}</td>
                    <td className="px-5 py-2.5 text-gray-600">{row.poCount}</td>
                    <td className="px-5 py-2.5 text-gray-500">
                      {row.poCount > 0 ? formatCurrency(row.spend / row.poCount) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
