"use client"

import { useState, useTransition } from "react"
import { useRouter, usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  Search, FileText, Calendar, Clock, ChevronLeft, ChevronRight,
  Plus, Pencil, AlertCircle, CheckCircle2, XCircle, Loader2,
  IndianRupee, Truck, StickyNote,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import { PageHeader } from "@/components/page-header"
import { StatusBadge } from "@/components/status-badge"
import { EmptyState } from "@/components/empty-state"
import { submitQuotation, updateQuotation } from "@/lib/actions/quotation.actions"
import { quotationSchema } from "@/lib/validations"
import { useToast } from "@/hooks/use-toast"
import { formatRelativeTime, formatCurrency } from "@/lib/utils"

type QuotationForm = z.infer<typeof quotationSchema>

interface RFQItem {
  id: string
  rfqNumber: string
  title: string
  description: string | null
  quantity: number
  deadline: Date
  status: string
  createdAt: Date
  createdBy: { name: string }
  vendors: { vendor: { companyName: string } }[]
}

interface ExistingQuotation {
  id: string
  quotationNumber: string
  status: string
  price: number
  deliveryDays: number
  notes: string | null
}

interface Props {
  rfqs: RFQItem[]
  total: number
  totalPages: number
  currentPage: number
  filters: { status?: string; search?: string }
  quotationsByRfq: Record<string, ExistingQuotation>
  vendorId: string
}

const STATUS_TABS = ["ALL", "OPEN", "CLOSED"] as const

export function VendorRFQsClient({
  rfqs, total, totalPages, currentPage, filters, quotationsByRfq,
}: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()
  const [search, setSearch] = useState(filters.search ?? "")
  const [activeTab, setActiveTab] = useState(filters.status?.toUpperCase() ?? "ALL")

  // Dialog state
  const [dialogRFQ, setDialogRFQ] = useState<RFQItem | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [existingQuotation, setExistingQuotation] = useState<ExistingQuotation | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<QuotationForm>({
    resolver: zodResolver(quotationSchema),
    defaultValues: { rfqId: "", price: 0, deliveryDays: 1, notes: "" },
  })

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

  function openSubmit(rfq: RFQItem) {
    setDialogRFQ(rfq)
    setIsEditing(false)
    setExistingQuotation(null)
    form.reset({ rfqId: rfq.id, price: 0, deliveryDays: 7, notes: "" })
  }

  function openEdit(rfq: RFQItem, existing: ExistingQuotation) {
    setDialogRFQ(rfq)
    setIsEditing(true)
    setExistingQuotation(existing)
    form.reset({
      rfqId: rfq.id,
      price: existing.price,
      deliveryDays: existing.deliveryDays,
      notes: existing.notes ?? "",
    })
  }

  function closeDialog() {
    setDialogRFQ(null)
    setExistingQuotation(null)
    form.reset()
  }

  async function onSubmit(data: QuotationForm) {
    setIsSubmitting(true)
    try {
      if (isEditing && existingQuotation) {
        const result = await updateQuotation(existingQuotation.id, data)
        if (!result.success) throw new Error(result.error)
        toast({ title: "Quotation updated", description: "Your quotation has been updated." })
      } else {
        const result = await submitQuotation(data)
        if (!result.success) throw new Error(result.error)
        toast({ title: "Quotation submitted!", description: "Your quotation has been sent to the procurement team." })
      }
      closeDialog()
      router.refresh()
    } catch (e: unknown) {
      toast({ title: "Error", description: e instanceof Error ? e.message : "Failed", variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }

  const price = form.watch("price") ?? 0
  const gst = Math.round(price * 0.18)
  const grandTotal = price + gst

  const isDeadlinePassed = (deadline: Date) => new Date(deadline) < new Date()

  return (
    <div className="space-y-5">
      <PageHeader title="My RFQs" subtitle="Request for Quotations assigned to you" />

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Search by title or RFQ number..."
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          className="pl-10 h-11 rounded-xl border-gray-200 bg-white"
        />
      </div>

      {/* Status tabs */}
      <div className="flex items-center gap-2">
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

      {/* RFQ Cards Grid */}
      {isPending ? (
        <div className="p-12 text-center text-sm text-gray-400">Loading…</div>
      ) : rfqs.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No RFQs assigned"
          description="You'll see RFQs here when procurement assigns them to you."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AnimatePresence>
            {rfqs.map((rfq, i) => {
              const existing = quotationsByRfq[rfq.id] ?? null
              const deadlinePassed = isDeadlinePassed(rfq.deadline)
              const canSubmit = rfq.status === "OPEN" && !deadlinePassed
              const canEdit = existing && canSubmit && !["SELECTED", "REJECTED"].includes(existing.status)

              return (
                <motion.div
                  key={rfq.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-white rounded-2xl border border-gray-100 p-5 hover:border-gray-200 transition-all hover:shadow-sm"
                >
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-mono text-xs font-bold text-[#1a2e1a] bg-[#1a2e1a]/8 px-2 py-0.5 rounded">
                          {rfq.rfqNumber}
                        </span>
                        <StatusBadge status={rfq.status} />
                      </div>
                      <h3 className="font-semibold text-gray-800 text-sm">{rfq.title}</h3>
                      {rfq.description && (
                        <p className="text-xs text-gray-400 mt-1 line-clamp-2">{rfq.description}</p>
                      )}
                    </div>
                  </div>

                  {/* Deadline */}
                  <div className={`flex items-center gap-1.5 text-xs mb-4 ${deadlinePassed ? "text-red-500" : "text-gray-500"}`}>
                    <Calendar className="w-3.5 h-3.5" />
                    <span className="font-medium">
                      {new Date(rfq.deadline).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                    {deadlinePassed && <span className="font-semibold">· Deadline passed</span>}
                    {!deadlinePassed && <span className="text-gray-400">· {formatRelativeTime(rfq.deadline)}</span>}
                  </div>

                  {/* Existing quotation status */}
                  {existing && (
                    <div className={`mb-3 p-3 rounded-xl text-xs border ${
                      existing.status === "SELECTED" ? "bg-emerald-50 border-emerald-200 text-emerald-700" :
                      existing.status === "REJECTED" ? "bg-red-50 border-red-200 text-red-700" :
                      "bg-blue-50 border-blue-200 text-blue-700"
                    }`}>
                      <div className="flex items-center gap-1.5 font-semibold mb-1">
                        {existing.status === "SELECTED" && <CheckCircle2 className="w-3.5 h-3.5" />}
                        {existing.status === "REJECTED" && <XCircle className="w-3.5 h-3.5" />}
                        {existing.status === "SUBMITTED" && <Clock className="w-3.5 h-3.5" />}
                        {existing.quotationNumber} · {existing.status}
                      </div>
                      <div className="flex items-center gap-3 text-xs opacity-80">
                        <span>₹{existing.price.toLocaleString("en-IN")}</span>
                        <span>{existing.deliveryDays} days delivery</span>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    {!existing && canSubmit && (
                      <Button
                        size="sm"
                        className="flex-1 gap-1.5 bg-[#1a2e1a] hover:bg-[#2d4d2d] text-white rounded-xl h-9 text-xs"
                        onClick={() => openSubmit(rfq)}
                      >
                        <Plus className="w-3.5 h-3.5" /> Submit Quotation
                      </Button>
                    )}
                    {canEdit && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 gap-1.5 rounded-xl h-9 text-xs"
                        onClick={() => openEdit(rfq, existing)}
                      >
                        <Pencil className="w-3.5 h-3.5" /> Edit Quotation
                      </Button>
                    )}
                    {!canSubmit && !existing && (
                      <div className="flex items-center gap-1.5 text-xs text-gray-400">
                        <AlertCircle className="w-3.5 h-3.5" />
                        {rfq.status === "CLOSED" ? "RFQ closed" : "Deadline passed"}
                      </div>
                    )}
                    {existing && ["SELECTED", "REJECTED"].includes(existing.status) && (
                      <p className="text-xs text-gray-400 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" /> Cannot edit — quotation is {existing.status.toLowerCase()}
                      </p>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white rounded-2xl border border-gray-100 px-5 py-3.5">
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

      {/* Submit / Edit Quotation Dialog */}
      <Dialog open={!!dialogRFQ} onOpenChange={(open) => { if (!open) closeDialog() }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{isEditing ? "Edit Quotation" : "Submit Quotation"}</DialogTitle>
            {dialogRFQ && (
              <p className="text-sm text-gray-500 mt-1">
                {dialogRFQ.rfqNumber} — {dialogRFQ.title}
              </p>
            )}
          </DialogHeader>

          {dialogRFQ && (
            <div className="mb-4 p-3 bg-gray-50 rounded-xl text-xs text-gray-600 space-y-1">
              <p><span className="font-medium">Quantity:</span> {dialogRFQ.quantity.toLocaleString()} units</p>
              <p><span className="font-medium">Deadline:</span> {new Date(dialogRFQ.deadline).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</p>
              {dialogRFQ.description && <p className="text-gray-500 line-clamp-2">{dialogRFQ.description}</p>}
            </div>
          )}

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium flex items-center gap-1.5">
                <IndianRupee className="w-3.5 h-3.5 text-gray-400" /> Total Price (₹) *
              </Label>
              <Input
                type="number"
                min={1}
                placeholder="185000"
                className="h-10 rounded-xl"
                {...form.register("price", { valueAsNumber: true })}
              />
              {form.formState.errors.price && (
                <p className="text-red-500 text-xs">{form.formState.errors.price.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-gray-400" /> Delivery Days *
              </Label>
              <Input
                type="number"
                min={1}
                max={365}
                placeholder="7"
                className="h-10 rounded-xl"
                {...form.register("deliveryDays", { valueAsNumber: true })}
              />
              {form.formState.errors.deliveryDays && (
                <p className="text-red-500 text-xs">{form.formState.errors.deliveryDays.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium flex items-center gap-1.5">
                <StickyNote className="w-3.5 h-3.5 text-gray-400" /> Notes / Payment Terms
              </Label>
              <textarea
                placeholder="Payment terms: 30 days net. Includes installation charges."
                rows={3}
                className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a2e1a]/20 focus:border-[#1a2e1a] resize-none"
                {...form.register("notes")}
              />
            </div>

            {/* Summary */}
            {price > 0 && (
              <div className="bg-gray-50 rounded-xl p-4 text-sm space-y-1.5">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>{formatCurrency(price)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>GST (18%)</span>
                  <span>{formatCurrency(gst)}</span>
                </div>
                <div className="flex justify-between font-bold text-gray-900 pt-1.5 border-t border-gray-200">
                  <span>Grand Total</span>
                  <span>{formatCurrency(grandTotal)}</span>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog} className="rounded-xl">Cancel</Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="gap-2 bg-[#1a2e1a] hover:bg-[#2d4d2d] text-white rounded-xl"
              >
                {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {isEditing ? "Update Quotation" : "Submit Quotation"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
