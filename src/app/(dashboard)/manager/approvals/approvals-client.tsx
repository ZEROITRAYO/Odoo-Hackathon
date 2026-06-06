"use client"

import { useState, useTransition } from "react"
import { useRouter, usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  CheckCircle2, XCircle, Clock, AlertTriangle, Loader2,
  ChevronLeft, ChevronRight, IndianRupee, Truck, Star,
  FileText, Building2, ShieldCheck, MessageSquare, BadgeAlert,
  CalendarClock,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog"
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip"
import { PageHeader } from "@/components/page-header"
import { StatusBadge } from "@/components/status-badge"
import { EmptyState } from "@/components/empty-state"
import { approveQuotation, rejectQuotation } from "@/lib/actions/approval.actions"
import { useToast } from "@/hooks/use-toast"
import { formatCurrency, formatDate, formatRelativeTime, cn } from "@/lib/utils"

// ─── Types ────────────────────────────────────────────────────────────────────

interface ApprovalItem {
  id: string
  status: string
  remarks: string | null
  createdAt: Date
  approvedAt: Date | null
  slaBreach: boolean
  quotation: {
    id: string
    quotationNumber: string
    price: number
    deliveryDays: number
    notes: string | null
    status: string
    vendor: {
      id: string
      companyName: string
      category: string
      rating: number | null
      email: string
    }
    rfq: { id: string; rfqNumber: string; title: string }
  }
  approver: { id: string; name: string }
}

interface Props {
  approvals: ApprovalItem[]
  total: number
  currentPage: number
  pageSize: number
  userRole: string
}

type DialogMode = "approve" | "reject" | null

// ─── SLA Badge ────────────────────────────────────────────────────────────────

function SLABadge({ createdAt, breach }: { createdAt: Date; breach: boolean }) {
  const hours = Math.round((Date.now() - new Date(createdAt).getTime()) / 3_600_000)
  return (
    <Tooltip>
      <TooltipTrigger>
        <span
          className={cn(
            "inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full",
            breach
              ? "bg-red-100 text-red-700 border border-red-200"
              : "bg-gray-100 text-gray-500",
          )}
        >
          <CalendarClock className="w-3 h-3" />
          {hours < 1 ? "< 1h" : `${hours}h`}
          {breach && <BadgeAlert className="w-3 h-3 ml-0.5" />}
        </span>
      </TooltipTrigger>
      <TooltipContent>
        {breach ? "⚠ SLA breached (>48h pending)" : `Pending for ${hours} hours`}
      </TooltipContent>
    </Tooltip>
  )
}

// ─── Approval Card ────────────────────────────────────────────────────────────

function ApprovalCard({
  approval,
  onApprove,
  onReject,
  isSubmitting,
}: {
  approval: ApprovalItem
  onApprove: (a: ApprovalItem) => void
  onReject: (a: ApprovalItem) => void
  isSubmitting: boolean
}) {
  const q = approval.quotation

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      className={cn(
        "bg-white rounded-2xl border p-6 space-y-4 hover:shadow-sm transition-all",
        approval.slaBreach ? "border-red-200" : "border-gray-100",
      )}
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="font-mono text-xs text-gray-400">{q.quotationNumber}</span>
            <StatusBadge status={q.status} />
            {approval.slaBreach && (
              <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200">
                <AlertTriangle className="w-3 h-3" /> SLA Breach
              </span>
            )}
          </div>
          <h3 className="font-semibold text-gray-900 text-base truncate">{q.rfq.title}</h3>
          <p className="text-xs text-gray-400 mt-0.5 font-mono">{q.rfq.rfqNumber}</p>
        </div>
        <SLABadge createdAt={approval.createdAt} breach={approval.slaBreach} />
      </div>

      {/* Vendor + Quotation Details */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-gray-50 rounded-xl p-3 flex items-start gap-2 col-span-2 sm:col-span-1">
          <Building2 className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs text-gray-400 font-medium">Vendor</p>
            <p className="text-sm font-semibold text-gray-800">{q.vendor.companyName}</p>
            <p className="text-xs text-gray-400">{q.vendor.category}</p>
          </div>
        </div>

        <div className="bg-gray-50 rounded-xl p-3 flex items-start gap-2">
          <IndianRupee className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs text-gray-400 font-medium">Quote Price</p>
            <p className="text-sm font-bold text-gray-900">{formatCurrency(q.price)}</p>
            <p className="text-xs text-gray-400">
              +18% GST = {formatCurrency(q.price * 1.18)}
            </p>
          </div>
        </div>

        <div className="bg-gray-50 rounded-xl p-3 flex items-start gap-2">
          <Truck className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs text-gray-400 font-medium">Delivery</p>
            <p className="text-sm font-bold text-gray-900">{q.deliveryDays} days</p>
          </div>
        </div>

        <div className="bg-gray-50 rounded-xl p-3 flex items-start gap-2">
          <Star className="w-4 h-4 text-amber-400 fill-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs text-gray-400 font-medium">Rating</p>
            <p className="text-sm font-bold text-gray-900">
              {q.vendor.rating?.toFixed(1) ?? "—"} / 5
            </p>
          </div>
        </div>
      </div>

      {/* Notes */}
      {q.notes && (
        <div className="flex items-start gap-2 text-sm text-gray-600 bg-blue-50 rounded-lg px-4 py-2.5">
          <MessageSquare className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
          <p className="text-xs">{q.notes}</p>
        </div>
      )}

      {/* Totals summary */}
      <div className="flex items-center justify-between text-sm border-t border-gray-50 pt-3">
        <div className="text-gray-500">
          <span className="font-medium text-gray-700">Subtotal:</span> {formatCurrency(q.price)} &nbsp;|&nbsp;
          <span className="font-medium text-gray-700">GST (18%):</span> {formatCurrency(q.price * 0.18)} &nbsp;|&nbsp;
          <span className="font-semibold text-gray-900">Total: {formatCurrency(q.price * 1.18)}</span>
        </div>
        <span className="text-xs text-gray-400">
          Submitted {formatRelativeTime(approval.createdAt)}
        </span>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-3 pt-1">
        <Button
          size="sm"
          className="bg-green-600 hover:bg-green-700 text-white flex-1 sm:flex-none"
          onClick={() => onApprove(approval)}
          disabled={isSubmitting}
        >
          <CheckCircle2 className="w-4 h-4 mr-1.5" />
          Approve &amp; Generate PO
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="border-red-200 text-red-700 hover:bg-red-50 flex-1 sm:flex-none"
          onClick={() => onReject(approval)}
          disabled={isSubmitting}
        >
          <XCircle className="w-4 h-4 mr-1.5" />
          Reject
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="text-gray-500 text-xs"
          onClick={() => window.open(`/procurement/compare/${q.rfq.id}`, "_blank")}
        >
          <FileText className="w-3.5 h-3.5 mr-1" />
          Compare All
        </Button>
      </div>
    </motion.div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ApprovalsClient({ approvals, total, currentPage, pageSize, userRole }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()

  const [activeApproval, setActiveApproval] = useState<ApprovalItem | null>(null)
  const [dialogMode, setDialogMode] = useState<DialogMode>(null)
  const [remarks, setRemarks] = useState("")
  const [submittingId, setSubmittingId] = useState<string | null>(null)

  const totalPages = Math.ceil(total / pageSize)
  const slaBreachCount = approvals.filter((a) => a.slaBreach).length

  const openDialog = (approval: ApprovalItem, mode: DialogMode) => {
    setActiveApproval(approval)
    setDialogMode(mode)
    setRemarks("")
  }

  const closeDialog = () => {
    setActiveApproval(null)
    setDialogMode(null)
    setRemarks("")
  }

  const handleSubmit = () => {
    if (!activeApproval || !dialogMode) return
    const qId = activeApproval.quotation.id
    setSubmittingId(qId)
    closeDialog()

    startTransition(async () => {
      if (dialogMode === "approve") {
        const res = await approveQuotation({ quotationId: qId, remarks, action: "APPROVE" })
        if (res.success) {
          toast({
            title: "✅ Quotation approved",
            description: `PO and Invoice have been auto-generated.`,
          })
          router.refresh()
        } else {
          toast({ title: "Error", description: res.error, variant: "destructive" })
        }
      } else {
        const res = await rejectQuotation({ quotationId: qId, remarks, action: "REJECT" })
        if (res.success) {
          toast({
            title: "Quotation rejected",
            description: `Procurement officer has been notified.`,
          })
          router.refresh()
        } else {
          toast({ title: "Error", description: res.error, variant: "destructive" })
        }
      }
      setSubmittingId(null)
    })
  }

  const navigate = (p: number) => {
    const params = new URLSearchParams({ page: String(p) })
    router.push(`${pathname}?${params}`)
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header */}
        <PageHeader
          title="Pending Approvals"
          subtitle={`${total} approval${total !== 1 ? "s" : ""} awaiting your decision`}
        >
          {slaBreachCount > 0 && (
            <div className="flex items-center gap-1.5 text-sm font-medium text-red-700 bg-red-50 border border-red-200 px-3 py-1.5 rounded-xl">
              <AlertTriangle className="w-4 h-4" />
              {slaBreachCount} SLA breach{slaBreachCount !== 1 ? "es" : ""}
            </div>
          )}
        </PageHeader>

        {/* SLA explanation */}
        {slaBreachCount > 0 && (
          <div className="flex items-start gap-3 bg-red-50 border border-red-100 rounded-2xl px-5 py-4">
            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-800">SLA Breached</p>
              <p className="text-sm text-red-600 mt-0.5">
                {slaBreachCount} quotation{slaBreachCount !== 1 ? "s have" : " has"} been pending for
                more than 48 hours. Please review and take action immediately.
              </p>
            </div>
          </div>
        )}

        {/* Approvals list */}
        {approvals.length === 0 ? (
          <EmptyState
            icon={ShieldCheck}
            title="No pending approvals"
            description="All quotations have been reviewed. Check back later."
          />
        ) : (
          <>
            <div className="space-y-4">
              <AnimatePresence>
                {approvals.map((approval) => (
                  <ApprovalCard
                    key={approval.id}
                    approval={approval}
                    onApprove={(a) => openDialog(a, "approve")}
                    onReject={(a) => openDialog(a, "reject")}
                    isSubmitting={submittingId === approval.quotation.id || isPending}
                  />
                ))}
              </AnimatePresence>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-2">
                <p className="text-sm text-gray-500">
                  Showing {(currentPage - 1) * pageSize + 1}–
                  {Math.min(currentPage * pageSize, total)} of {total}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigate(currentPage - 1)}
                    disabled={currentPage <= 1 || isPending}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-sm font-medium text-gray-700 px-2">
                    {currentPage} / {totalPages}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigate(currentPage + 1)}
                    disabled={currentPage >= totalPages || isPending}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Approve / Reject Dialog */}
      <Dialog open={!!dialogMode} onOpenChange={closeDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {dialogMode === "approve" ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  Approve Quotation
                </>
              ) : (
                <>
                  <XCircle className="w-5 h-5 text-red-500" />
                  Reject Quotation
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {dialogMode === "approve"
                ? "Approving will auto-generate a Purchase Order and Invoice. This action cannot be undone."
                : "The quotation will be marked as rejected and the procurement officer will be notified."}
            </DialogDescription>
          </DialogHeader>

          {activeApproval && (
            <div className="py-2 space-y-4">
              {/* Summary */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Vendor</span>
                  <span className="font-semibold text-gray-900">
                    {activeApproval.quotation.vendor.companyName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Quotation</span>
                  <span className="font-mono text-gray-700">
                    {activeApproval.quotation.quotationNumber}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Price</span>
                  <span className="font-semibold text-gray-900">
                    {formatCurrency(activeApproval.quotation.price)}
                  </span>
                </div>
                {dialogMode === "approve" && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-500">GST (18%)</span>
                      <span className="text-gray-700">
                        {formatCurrency(activeApproval.quotation.price * 0.18)}
                      </span>
                    </div>
                    <div className="flex justify-between border-t border-gray-200 pt-1.5">
                      <span className="font-semibold text-gray-700">Total</span>
                      <span className="font-bold text-gray-900">
                        {formatCurrency(activeApproval.quotation.price * 1.18)}
                      </span>
                    </div>
                  </>
                )}
              </div>

              {/* Remarks */}
              <div className="space-y-1.5">
                <Label htmlFor="remarks" className="text-sm font-medium">
                  Remarks {dialogMode === "reject" && <span className="text-red-500">*</span>}
                </Label>
                <Textarea
                  id="remarks"
                  placeholder={
                    dialogMode === "approve"
                      ? "Optional comments for the record…"
                      : "Reason for rejection (required)…"
                  }
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  rows={3}
                  className="resize-none text-sm"
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={closeDialog}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={
                isPending ||
                (dialogMode === "reject" && !remarks.trim())
              }
              className={cn(
                dialogMode === "approve"
                  ? "bg-green-600 hover:bg-green-700 text-white"
                  : "bg-red-600 hover:bg-red-700 text-white",
              )}
            >
              {isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : dialogMode === "approve" ? (
                <CheckCircle2 className="w-4 h-4 mr-1.5" />
              ) : (
                <XCircle className="w-4 h-4 mr-1.5" />
              )}
              {dialogMode === "approve" ? "Confirm Approval" : "Confirm Rejection"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  )
}
