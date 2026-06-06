"use client"

import { useState, useTransition } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import {
  Plus, Search, FileText, Calendar, Users, ChevronLeft, ChevronRight,
  ExternalLink, Clock, MoreHorizontal, Eye, XCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { PageHeader } from "@/components/page-header"
import { StatusBadge } from "@/components/status-badge"
import { EmptyState } from "@/components/empty-state"
import { closeRFQ } from "@/lib/actions/rfq.actions"
import { useToast } from "@/hooks/use-toast"
import { formatRelativeTime } from "@/lib/utils"

interface RFQItem {
  id: string
  rfqNumber: string
  title: string
  description: string | null
  quantity: number
  deadline: Date
  status: string
  createdAt: Date
  createdBy: { id: string; name: string }
  vendors: { vendor: { id: string; companyName: string } }[]
  _count: { quotations: number }
}

interface Props {
  initialRFQs: RFQItem[]
  total: number
  totalPages: number
  currentPage: number
  filters: { status?: string; search?: string }
  role: string
}

const STATUS_TABS = ["ALL", "OPEN", "DRAFT", "CLOSED"] as const

const STATUS_COLORS: Record<string, string> = {
  OPEN: "bg-emerald-50 text-emerald-700 border-emerald-200",
  DRAFT: "bg-gray-50 text-gray-600 border-gray-200",
  CLOSED: "bg-red-50 text-red-600 border-red-200",
}

export function RFQsClient({ initialRFQs, total, totalPages, currentPage, filters, role }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()
  const [search, setSearch] = useState(filters.search ?? "")
  const [activeTab, setActiveTab] = useState(filters.status?.toUpperCase() ?? "ALL")
  const [closingId, setClosingId] = useState<string | null>(null)

  const canCreate = ["ADMIN", "PROCUREMENT_OFFICER"].includes(role)
  const canClose = ["ADMIN", "PROCUREMENT_OFFICER"].includes(role)

  function navigate(params: Record<string, string | undefined>) {
    const sp = new URLSearchParams()
    const merged = { search, status: activeTab === "ALL" ? undefined : activeTab, ...params }
    Object.entries(merged).forEach(([k, v]) => { if (v) sp.set(k, v) })
    startTransition(() => router.push(`${pathname}?${sp}`))
  }

  function handleSearch(val: string) {
    setSearch(val)
    navigate({ search: val || undefined, page: "1" })
  }

  function handleTab(tab: string) {
    setActiveTab(tab)
    navigate({ status: tab === "ALL" ? undefined : tab, page: "1" })
  }

  async function handleClose(id: string, rfqNumber: string) {
    setClosingId(id)
    const result = await closeRFQ(id)
    if (result.success) {
      toast({ title: "RFQ Closed", description: `${rfqNumber} has been closed.` })
      router.refresh()
    } else {
      toast({ title: "Error", description: result.error, variant: "destructive" })
    }
    setClosingId(null)
  }

  const isOverdue = (deadline: Date) => new Date(deadline) < new Date()

  return (
    <div className="space-y-5">
      <PageHeader title="RFQs" subtitle="Request for Quotation management">
        {canCreate && (
          <Button asChild className="gap-2 bg-[#1a2e1a] hover:bg-[#2d4d2d] text-white rounded-xl h-9">
            <Link href="/rfqs/create">
              <Plus className="w-4 h-4" /> New RFQ
            </Link>
          </Button>
        )}
      </PageHeader>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Search by title, RFQ number..."
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          className="pl-10 h-11 rounded-xl border-gray-200 bg-white"
        />
      </div>

      {/* Status Tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => handleTab(tab)}
            className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-all border ${
              activeTab === tab
                ? "bg-[#1a2e1a] text-white border-[#1a2e1a]"
                : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
            }`}
          >
            {tab.charAt(0) + tab.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {isPending ? (
          <div className="p-12 text-center text-sm text-gray-400">Loading…</div>
        ) : initialRFQs.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No RFQs found"
            description="Try adjusting your filters or create a new RFQ."
          >
            {canCreate && (
              <Button asChild className="gap-2 bg-[#1a2e1a] text-white rounded-xl h-9">
                <Link href="/rfqs/create"><Plus className="w-4 h-4" /> Create First RFQ</Link>
              </Button>
            )}
          </EmptyState>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50/60">
                <tr>
                  {["RFQ Number", "Title", "Deadline", "Vendors", "Quotations", "Status", "Action"].map((h) => (
                    <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                <AnimatePresence>
                  {initialRFQs.map((rfq, i) => {
                    const overdue = rfq.status === "OPEN" && isOverdue(rfq.deadline)
                    return (
                      <motion.tr
                        key={rfq.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.03 }}
                        className="hover:bg-gray-50/60 transition-colors"
                      >
                        <td className="px-5 py-3.5">
                          <span className="font-mono text-xs font-semibold text-[#1a2e1a] bg-[#1a2e1a]/5 px-2 py-1 rounded">
                            {rfq.rfqNumber}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 max-w-[240px]">
                          <p className="font-semibold text-gray-800 truncate">{rfq.title}</p>
                          {rfq.description && (
                            <p className="text-xs text-gray-400 truncate mt-0.5">{rfq.description}</p>
                          )}
                        </td>
                        <td className="px-5 py-3.5">
                          <div className={`flex items-center gap-1.5 ${overdue ? "text-red-500" : "text-gray-600"}`}>
                            <Clock className="w-3.5 h-3.5 shrink-0" />
                            <span className="text-xs font-medium">
                              {new Date(rfq.deadline).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                            </span>
                            {overdue && <span className="text-xs text-red-500 font-semibold">· Overdue</span>}
                          </div>
                          <p className="text-xs text-gray-400 mt-0.5 ml-5">
                            {formatRelativeTime(rfq.createdAt)}
                          </p>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-1.5 text-gray-600">
                            <Users className="w-3.5 h-3.5" />
                            <span className="font-medium">{rfq.vendors.length}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                            rfq._count.quotations > 0
                              ? "bg-purple-50 text-purple-700"
                              : "bg-gray-50 text-gray-400"
                          }`}>
                            {rfq._count.quotations} received
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <StatusBadge status={rfq.status} />
                        </td>
                        <td className="px-5 py-3.5">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="w-8 h-8 rounded-lg">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-44">
                              <DropdownMenuItem asChild className="gap-2 text-sm">
                                <Link href={`/rfqs/${rfq.id}`}>
                                  <Eye className="w-3.5 h-3.5 text-gray-400" /> View Details
                                </Link>
                              </DropdownMenuItem>
                              {rfq._count.quotations > 0 && canCreate && (
                                <DropdownMenuItem asChild className="gap-2 text-sm">
                                  <Link href={`/procurement/compare/${rfq.id}`}>
                                    <ExternalLink className="w-3.5 h-3.5 text-gray-400" /> Compare Quotes
                                  </Link>
                                </DropdownMenuItem>
                              )}
                              {canClose && rfq.status === "OPEN" && (
                                <DropdownMenuItem
                                  className="gap-2 text-sm text-red-600 focus:text-red-600 focus:bg-red-50"
                                  disabled={closingId === rfq.id}
                                  onClick={() => handleClose(rfq.id, rfq.rfqNumber)}
                                >
                                  <XCircle className="w-3.5 h-3.5" />
                                  {closingId === rfq.id ? "Closing…" : "Close RFQ"}
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </motion.tr>
                    )
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3.5 border-t border-gray-50">
            <p className="text-xs text-gray-400">
              Showing {(currentPage - 1) * 15 + 1}–{Math.min(currentPage * 15, total)} of {total} RFQs
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" className="w-8 h-8 rounded-lg"
                disabled={currentPage <= 1}
                onClick={() => navigate({ page: String(currentPage - 1) })}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm font-medium text-gray-600">{currentPage} / {totalPages}</span>
              <Button variant="outline" size="icon" className="w-8 h-8 rounded-lg"
                disabled={currentPage >= totalPages}
                onClick={() => navigate({ page: String(currentPage + 1) })}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
