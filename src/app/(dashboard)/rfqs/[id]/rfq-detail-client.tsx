"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import {
  ArrowLeft, Calendar, Users, FileText, Clock, Star, Package,
  ExternalLink, XCircle, Paperclip, CheckCircle2, AlertCircle,
  ChevronRight, Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/status-badge"
import { closeRFQ } from "@/lib/actions/rfq.actions"
import { useToast } from "@/hooks/use-toast"
import { formatRelativeTime, formatCurrency } from "@/lib/utils"

interface Quotation {
  id: string
  quotationNumber: string
  price: number
  deliveryDays: number
  notes: string | null
  status: string
  submittedAt: Date
  vendor: {
    id: string
    companyName: string
    vendorCode: string
    rating: number | null
    category: string
  }
}

interface RFQDetail {
  id: string
  rfqNumber: string
  title: string
  description: string | null
  quantity: number
  deadline: Date
  status: string
  attachmentUrl: string | null
  createdAt: Date
  createdBy: { id: string; name: string; email: string }
  vendors: { vendor: { id: string; companyName: string; category: string; rating: number | null; vendorCode: string } }[]
  quotations: Quotation[]
}

interface Props {
  rfq: RFQDetail
  role: string
  userId: string
}

export function RFQDetailClient({ rfq, role, userId }: Props) {
  const router = useRouter()
  const { toast } = useToast()
  const [isClosing, setIsClosing] = useState(false)

  const canManage = ["ADMIN", "PROCUREMENT_OFFICER"].includes(role)
  const isOverdue = rfq.status === "OPEN" && new Date(rfq.deadline) < new Date()
  const deadlineStr = new Date(rfq.deadline).toLocaleDateString("en-IN", {
    day: "numeric", month: "long", year: "numeric"
  })

  async function handleClose() {
    setIsClosing(true)
    const result = await closeRFQ(rfq.id)
    if (result.success) {
      toast({ title: "RFQ Closed", description: `${rfq.rfqNumber} has been closed.` })
      router.refresh()
    } else {
      toast({ title: "Error", description: result.error, variant: "destructive" })
    }
    setIsClosing(false)
  }

  const lowestPrice = rfq.quotations.length > 0
    ? Math.min(...rfq.quotations.map((q) => q.price))
    : null

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild className="rounded-xl h-9 w-9">
          <Link href="/rfqs"><ArrowLeft className="w-4 h-4" /></Link>
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="font-mono text-sm font-bold text-[#1a2e1a] bg-[#1a2e1a]/8 px-2.5 py-1 rounded-lg">
              {rfq.rfqNumber}
            </span>
            <StatusBadge status={rfq.status} />
            {isOverdue && (
              <span className="flex items-center gap-1 text-xs text-red-600 font-semibold bg-red-50 px-2.5 py-1 rounded-full border border-red-200">
                <AlertCircle className="w-3 h-3" /> Overdue
              </span>
            )}
          </div>
          <h1 className="text-xl font-bold text-gray-900 mt-1 truncate">{rfq.title}</h1>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {canManage && rfq.quotations.length > 0 && (
            <Button asChild variant="outline" className="gap-2 rounded-xl h-9 text-sm">
              <Link href={`/procurement/compare/${rfq.id}`}>
                <ExternalLink className="w-3.5 h-3.5" /> Compare Quotes
              </Link>
            </Button>
          )}
          {canManage && rfq.status === "OPEN" && (
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isClosing}
              className="gap-2 rounded-xl h-9 text-sm border-red-200 text-red-600 hover:bg-red-50"
            >
              {isClosing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
              Close RFQ
            </Button>
          )}
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: Package, label: "Quantity", value: rfq.quantity.toLocaleString() },
          { icon: Calendar, label: "Deadline", value: deadlineStr, accent: isOverdue ? "text-red-600" : "" },
          { icon: Users, label: "Vendors", value: `${rfq.vendors.length} assigned` },
          { icon: FileText, label: "Quotations", value: `${rfq.quotations.length} received` },
        ].map(({ icon: Icon, label, value, accent }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-100 px-4 py-3">
            <div className="flex items-center gap-2 mb-1">
              <Icon className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-xs text-gray-500">{label}</span>
            </div>
            <p className={`text-sm font-semibold text-gray-800 ${accent}`}>{value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Main info */}
        <div className="lg:col-span-2 space-y-5">
          {/* Description */}
          {rfq.description && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Description</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{rfq.description}</p>
            </div>
          )}

          {/* Quotations */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-700">
                Quotations Received <span className="text-gray-400 font-normal">({rfq.quotations.length})</span>
              </h3>
              {canManage && rfq.quotations.length > 0 && (
                <Button asChild variant="ghost" size="sm" className="gap-1.5 h-7 text-xs rounded-lg">
                  <Link href={`/procurement/compare/${rfq.id}`}>
                    Compare All <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </Button>
              )}
            </div>

            {rfq.quotations.length === 0 ? (
              <div className="p-8 text-center">
                <FileText className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-400">No quotations received yet</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {rfq.quotations.map((q, i) => {
                  const isLowest = q.price === lowestPrice
                  return (
                    <motion.div
                      key={q.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className={`px-5 py-4 flex items-center justify-between gap-4 ${isLowest ? "bg-emerald-50/60" : ""}`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm text-gray-800">{q.vendor.companyName}</span>
                          <span className="font-mono text-xs text-gray-400">{q.quotationNumber}</span>
                          {isLowest && (
                            <span className="text-xs font-semibold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">
                              Lowest
                            </span>
                          )}
                          <StatusBadge status={q.status} />
                        </div>
                        <div className="flex items-center gap-4 mt-1.5 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {q.deliveryDays} days
                          </span>
                          {q.vendor.rating && (
                            <span className="flex items-center gap-1">
                              <Star className="w-3 h-3 fill-amber-400 text-amber-400" /> {q.vendor.rating.toFixed(1)}
                            </span>
                          )}
                          {q.notes && <span className="truncate max-w-[160px]">{q.notes}</span>}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-base font-bold text-gray-900">{formatCurrency(q.price)}</p>
                        <p className="text-xs text-gray-400">{formatRelativeTime(q.submittedAt)}</p>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Meta */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
            <h3 className="text-sm font-semibold text-gray-700">Details</h3>
            <dl className="space-y-2.5 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">Created by</dt>
                <dd className="font-medium text-gray-800">{rfq.createdBy.name}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Created</dt>
                <dd className="font-medium text-gray-800">{formatRelativeTime(rfq.createdAt)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Quantity</dt>
                <dd className="font-medium text-gray-800">{rfq.quantity.toLocaleString()}</dd>
              </div>
              {rfq.attachmentUrl && (
                <div className="pt-1">
                  <a
                    href={rfq.attachmentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-[#1a2e1a] text-xs font-medium hover:underline"
                  >
                    <Paperclip className="w-3.5 h-3.5" /> View Attachment
                  </a>
                </div>
              )}
            </dl>
          </div>

          {/* Assigned Vendors */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              Assigned Vendors <span className="text-gray-400 font-normal">({rfq.vendors.length})</span>
            </h3>
            <div className="space-y-2.5">
              {rfq.vendors.map(({ vendor }) => {
                const submitted = rfq.quotations.some((q) => q.vendor.id === vendor.id)
                return (
                  <div key={vendor.id} className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{vendor.companyName}</p>
                      <p className="text-xs text-gray-400">{vendor.category}</p>
                    </div>
                    {submitted ? (
                      <span className="flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full shrink-0">
                        <CheckCircle2 className="w-3 h-3" /> Quoted
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400 shrink-0">Pending</span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
