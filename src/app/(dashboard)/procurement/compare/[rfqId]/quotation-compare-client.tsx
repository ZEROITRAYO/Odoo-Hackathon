"use client"

import { useState, useTransition, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  ArrowUpDown, Star, Trophy, Truck, IndianRupee, Clock,
  CheckCircle2, XCircle, Loader2, Sparkles, AlertCircle,
  ChevronUp, ChevronDown, FileText, BadgeCheck, Send,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import { PageHeader } from "@/components/page-header"
import { StatusBadge } from "@/components/status-badge"
import { EmptyState } from "@/components/empty-state"
import { selectQuotationForApproval } from "@/lib/actions/quotation.actions"
import { useToast } from "@/hooks/use-toast"
import { formatCurrency, formatDate, cn } from "@/lib/utils"

// ─── Types ────────────────────────────────────────────────────────────────────

type SortField = "price" | "deliveryDays" | "rating" | "score"
type SortDir = "asc" | "desc"

interface Vendor {
  id: string
  companyName: string
  rating: number | null
  category: string
}

interface Approval {
  id: string
  status: string
  approvedAt: Date | null
  remarks: string | null
}

interface QuotationWithScore {
  id: string
  quotationNumber: string
  rfqId: string
  vendorId: string
  price: number
  deliveryDays: number
  notes: string | null
  status: string
  submittedAt: Date
  updatedAt: Date
  vendor: Vendor
  approvals: Approval[]
  recommendationScore: number
}

interface RFQSummary {
  id: string
  rfqNumber: string
  title: string
  description: string | null
  quantity: number
  deadline: Date
  status: string
  createdBy: { id: string; name: string }
  assignedVendorCount: number
}

interface Props {
  rfq: RFQSummary
  quotations: QuotationWithScore[]
  userRole: string
}

// ─── Score Ring ───────────────────────────────────────────────────────────────

function ScoreRing({ score, isBest }: { score: number; isBest: boolean }) {
  const r = 22
  const circ = 2 * Math.PI * r
  const filled = (score / 100) * circ

  return (
    <div className="relative w-14 h-14 flex items-center justify-center">
      <svg width="56" height="56" viewBox="0 0 56 56" className="-rotate-90">
        <circle cx="28" cy="28" r={r} fill="none" stroke="#e5e7eb" strokeWidth="4" />
        <circle
          cx="28" cy="28" r={r} fill="none"
          stroke={isBest ? "#16a34a" : "#6366f1"}
          strokeWidth="4"
          strokeDasharray={`${filled} ${circ}`}
          strokeLinecap="round"
        />
      </svg>
      <span className={cn("absolute text-xs font-bold", isBest ? "text-green-700" : "text-indigo-700")}>
        {score}
      </span>
    </div>
  )
}

// ─── Insight Banner ───────────────────────────────────────────────────────────

function InsightBanner({ quotations }: { quotations: QuotationWithScore[] }) {
  if (quotations.length < 2) return null

  const prices = quotations.map((q) => q.price)
  const minPrice = Math.min(...prices)
  const maxPrice = Math.max(...prices)
  const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length
  const savings = maxPrice - minPrice
  const savingsPct = ((savings / maxPrice) * 100).toFixed(0)
  const cheapest = quotations.find((q) => q.price === minPrice)!
  const best = quotations.reduce((a, b) => (a.recommendationScore > b.recommendationScore ? a : b))

  return (
    <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 flex flex-col sm:flex-row gap-4">
      <div className="flex items-start gap-3 flex-1">
        <Sparkles className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-indigo-900">Smart Procurement Insights</p>
          <p className="text-sm text-indigo-700 mt-0.5">
            <span className="font-medium">{cheapest.vendor.companyName}</span> is the most cost-effective
            — {savingsPct}% cheaper than the highest quote. Avg. price:{" "}
            <span className="font-medium">{formatCurrency(avgPrice)}</span>.
          </p>
          {best.vendor.companyName !== cheapest.vendor.companyName && (
            <p className="text-sm text-indigo-700 mt-1">
              AI recommends <span className="font-medium">{best.vendor.companyName}</span> based on
              balanced price, rating &amp; delivery speed (score: {best.recommendationScore}/100).
            </p>
          )}
        </div>
      </div>
      <div className="shrink-0 text-right">
        <p className="text-xs text-indigo-500 font-medium">Potential Savings</p>
        <p className="text-xl font-bold text-indigo-700">{formatCurrency(savings)}</p>
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function QuotationCompareClient({ rfq, quotations, userRole }: Props) {
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()
  const [sortField, setSortField] = useState<SortField>("score")
  const [sortDir, setSortDir] = useState<SortDir>("desc")
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [confirmVendorName, setConfirmVendorName] = useState("")
  const [submittingId, setSubmittingId] = useState<string | null>(null)

  const canAct = ["ADMIN", "PROCUREMENT_OFFICER"].includes(userRole)
  const isRFQOpen = rfq.status === "OPEN"
  const isPastDeadline = new Date(rfq.deadline) < new Date()

  // ── Sorting ────────────────────────────────────────────────────────────────

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortField(field)
      // For score & rating: highest first; for price & delivery: lowest first
      setSortDir(field === "score" || field === "rating" ? "desc" : "asc")
    }
  }

  const sorted = useMemo(() => {
    return [...quotations].sort((a, b) => {
      let av: number, bv: number
      if (sortField === "price") { av = a.price; bv = b.price }
      else if (sortField === "deliveryDays") { av = a.deliveryDays; bv = b.deliveryDays }
      else if (sortField === "rating") { av = a.vendor.rating ?? 0; bv = b.vendor.rating ?? 0 }
      else { av = a.recommendationScore; bv = b.recommendationScore }
      return sortDir === "asc" ? av - bv : bv - av
    })
  }, [quotations, sortField, sortDir])

  // Pre-compute highlights
  const minPrice = Math.min(...quotations.map((q) => q.price))
  const minDelivery = Math.min(...quotations.map((q) => q.deliveryDays))
  const bestScore = Math.max(...quotations.map((q) => q.recommendationScore))

  // ── Approval request ────────────────────────────────────────────────────────

  const handleRequestApproval = (q: QuotationWithScore) => {
    setConfirmId(q.id)
    setConfirmVendorName(q.vendor.companyName)
  }

  const confirmApproval = () => {
    if (!confirmId) return
    setSubmittingId(confirmId)
    setConfirmId(null)

    startTransition(async () => {
      const res = await selectQuotationForApproval(confirmId)
      setSubmittingId(null)
      if (res.success) {
        toast({ title: "Approval requested", description: `Sent to manager for review.` })
      } else {
        toast({ title: "Error", description: res.error, variant: "destructive" })
      }
    })
  }

  // ── Sort indicator ─────────────────────────────────────────────────────────

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="w-3.5 h-3.5 text-gray-300 ml-1" />
    return sortDir === "asc"
      ? <ChevronUp className="w-3.5 h-3.5 text-indigo-600 ml-1" />
      : <ChevronDown className="w-3.5 h-3.5 text-indigo-600 ml-1" />
  }

  const ColHeader = ({
    field, label, className,
  }: { field: SortField; label: string; className?: string }) => (
    <button
      onClick={() => toggleSort(field)}
      className={cn(
        "flex items-center gap-0.5 text-xs font-semibold text-gray-500 uppercase tracking-wide hover:text-indigo-600 transition-colors",
        sortField === field && "text-indigo-600",
        className,
      )}
    >
      {label}
      <SortIcon field={field} />
    </button>
  )

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header */}
        <PageHeader
          title="Quotation Comparison"
          subtitle={`${rfq.rfqNumber} · ${rfq.title}`}
        >
          <StatusBadge status={rfq.status} />
        </PageHeader>

        {/* RFQ Meta */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Quantity", value: rfq.quantity.toLocaleString(), icon: FileText },
            { label: "Deadline", value: formatDate(rfq.deadline), icon: Clock },
            { label: "Assigned Vendors", value: rfq.assignedVendorCount, icon: Truck },
            { label: "Quotations Received", value: quotations.length, icon: BadgeCheck },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4 text-gray-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-gray-400 font-medium">{label}</p>
                <p className="text-sm font-semibold text-gray-900 truncate">{value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Insight Banner */}
        {quotations.length >= 2 && <InsightBanner quotations={quotations} />}

        {/* Warnings */}
        {isPastDeadline && (
          <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
            <AlertCircle className="w-4 h-4 shrink-0" />
            RFQ deadline has passed. No new quotations can be submitted.
          </div>
        )}

        {/* Table */}
        {quotations.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No quotations yet"
            description="Assigned vendors haven't submitted any quotations for this RFQ."
          />
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            {/* Scoring legend */}
            <div className="px-6 py-3 border-b border-gray-50 bg-gray-50/60 flex items-center gap-6 text-xs text-gray-500">
              <span className="font-semibold text-gray-700">AI Score Formula:</span>
              <span>60% Price Competitiveness</span>
              <span>25% Vendor Rating</span>
              <span>15% Delivery Speed</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wide w-8">#</th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Vendor</th>
                    <th className="px-6 py-4 text-right">
                      <ColHeader field="price" label="Price" className="justify-end ml-auto" />
                    </th>
                    <th className="px-6 py-4 text-center">
                      <ColHeader field="deliveryDays" label="Delivery" className="justify-center mx-auto" />
                    </th>
                    <th className="px-6 py-4 text-center">
                      <ColHeader field="rating" label="Rating" className="justify-center mx-auto" />
                    </th>
                    <th className="px-6 py-4 text-center">
                      <ColHeader field="score" label="AI Score" className="justify-center mx-auto" />
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Notes</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                    {canAct && (
                      <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Action</th>
                    )}
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-50">
                  <AnimatePresence mode="wait">
                    {sorted.map((q, idx) => {
                      const isBestScore = q.recommendationScore === bestScore
                      const isCheapest = q.price === minPrice
                      const isFastest = q.deliveryDays === minDelivery
                      const hasPendingApproval = q.approvals.some((a) => a.status === "PENDING")
                      const hasApproved = q.approvals.some((a) => a.status === "APPROVED")
                      const isLoading = submittingId === q.id

                      return (
                        <motion.tr
                          key={q.id}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          transition={{ delay: idx * 0.04 }}
                          className={cn(
                            "hover:bg-gray-50/70 transition-colors",
                            isBestScore && "bg-green-50/30 hover:bg-green-50/50",
                          )}
                        >
                          {/* Rank */}
                          <td className="px-6 py-4 text-gray-400 font-mono text-xs">{idx + 1}</td>

                          {/* Vendor */}
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              {isBestScore && (
                                <Tooltip>
                                  <TooltipTrigger>
                                    <Trophy className="w-4 h-4 text-amber-400 shrink-0" />
                                  </TooltipTrigger>
                                  <TooltipContent>AI Recommended</TooltipContent>
                                </Tooltip>
                              )}
                              <div>
                                <p className="font-semibold text-gray-900">{q.vendor.companyName}</p>
                                <p className="text-xs text-gray-400">{q.vendor.category}</p>
                              </div>
                            </div>
                          </td>

                          {/* Price */}
                          <td className="px-6 py-4 text-right">
                            <div className="flex flex-col items-end gap-1">
                              <span className="font-bold text-gray-900 flex items-center gap-0.5">
                                <IndianRupee className="w-3.5 h-3.5" />
                                {q.price.toLocaleString("en-IN")}
                              </span>
                              {isCheapest && (
                                <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-medium">
                                  Lowest
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Delivery */}
                          <td className="px-6 py-4 text-center">
                            <div className="flex flex-col items-center gap-1">
                              <span className="font-medium text-gray-700 flex items-center gap-1">
                                <Truck className="w-3.5 h-3.5 text-gray-400" />
                                {q.deliveryDays}d
                              </span>
                              {isFastest && (
                                <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-medium">
                                  Fastest
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Rating */}
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-center gap-1">
                              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                              <span className="font-medium text-gray-700">
                                {q.vendor.rating?.toFixed(1) ?? "—"}
                              </span>
                            </div>
                          </td>

                          {/* AI Score */}
                          <td className="px-6 py-4">
                            <div className="flex justify-center">
                              <ScoreRing score={q.recommendationScore} isBest={isBestScore} />
                            </div>
                          </td>

                          {/* Notes */}
                          <td className="px-6 py-4 max-w-[180px]">
                            <p className="text-xs text-gray-500 truncate" title={q.notes ?? ""}>
                              {q.notes || <span className="text-gray-300 italic">—</span>}
                            </p>
                          </td>

                          {/* Status */}
                          <td className="px-6 py-4">
                            <StatusBadge status={q.status} />
                          </td>

                          {/* Action */}
                          {canAct && (
                            <td className="px-6 py-4 text-right">
                              {hasApproved ? (
                                <span className="inline-flex items-center gap-1 text-xs text-green-700 font-medium">
                                  <CheckCircle2 className="w-3.5 h-3.5" /> Approved
                                </span>
                              ) : hasPendingApproval ? (
                                <span className="inline-flex items-center gap-1 text-xs text-amber-600 font-medium">
                                  <Clock className="w-3.5 h-3.5" /> Pending
                                </span>
                              ) : q.status === "SUBMITTED" && isRFQOpen ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-xs border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                                  onClick={() => handleRequestApproval(q)}
                                  disabled={isLoading || isPending}
                                >
                                  {isLoading ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  ) : (
                                    <>
                                      <Send className="w-3.5 h-3.5 mr-1" />
                                      Request Approval
                                    </>
                                  )}
                                </Button>
                              ) : (
                                <span className="text-xs text-gray-300 italic">—</span>
                              )}
                            </td>
                          )}
                        </motion.tr>
                      )
                    })}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>

            {/* Table Footer */}
            <div className="px-6 py-3 border-t border-gray-50 bg-gray-50/40 flex items-center justify-between text-xs text-gray-400">
              <span>{quotations.length} quotation{quotations.length !== 1 ? "s" : ""} received</span>
              <span>Sorted by: <span className="font-medium text-gray-600">{sortField} ({sortDir})</span></span>
            </div>
          </div>
        )}

        {/* Confirm Dialog */}
        <Dialog open={!!confirmId} onOpenChange={() => setConfirmId(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Request Manager Approval</DialogTitle>
            </DialogHeader>
            <div className="py-2 space-y-3">
              <p className="text-sm text-gray-600">
                You are about to send the quotation from{" "}
                <span className="font-semibold text-gray-900">{confirmVendorName}</span> to a manager
                for approval. A Purchase Order and Invoice will be auto-generated upon approval.
              </p>
              <div className="bg-amber-50 border border-amber-100 rounded-lg px-4 py-3 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700">
                  This will mark the quotation as <strong>Selected</strong>. Other vendors will not be
                  notified until the manager approves.
                </p>
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setConfirmId(null)}>Cancel</Button>
              <Button
                onClick={confirmApproval}
                disabled={isPending}
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Confirm &amp; Send for Approval
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  )
}
