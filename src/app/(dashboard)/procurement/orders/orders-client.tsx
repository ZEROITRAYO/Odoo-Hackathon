"use client"

import { useState, useTransition } from "react"
import { useRouter, usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  ShoppingCart, Receipt, Download, Mail, Printer, Eye,
  ChevronLeft, ChevronRight, Search, Filter, Loader2,
  CheckCircle2, Clock, Package, Send, IndianRupee,
  FileText, Building2, X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog"
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from "@/components/ui/tabs"
import { PageHeader } from "@/components/page-header"
import { StatusBadge } from "@/components/status-badge"
import { EmptyState } from "@/components/empty-state"
import { updatePOStatus } from "@/lib/actions/po.actions"
import { updateInvoiceStatus, emailInvoice } from "@/lib/actions/invoice.actions"
import { useToast } from "@/hooks/use-toast"
import { formatCurrency, formatDate, cn } from "@/lib/utils"

// ─── Types ────────────────────────────────────────────────────────────────────

interface POItem {
  id: string
  poNumber: string
  subtotal: number
  tax: number
  total: number
  status: string
  generatedAt: Date
  pdfUrl: string | null
  vendor: { id: string; companyName: string; vendorCode: string; email: string }
  invoice: { id: string; invoiceNumber: string; status: string } | null
  approval: {
    id: string
    status: string
    quotation: {
      id: string
      quotationNumber: string
      rfq: { id: string; rfqNumber: string; title: string }
    } | null
  } | null
}

interface InvoiceItem {
  id: string
  invoiceNumber: string
  subtotal: number
  tax: number
  total: number
  status: string
  generatedAt: Date
  pdfUrl: string | null
  po: {
    poNumber: string
    vendor: { id: string; companyName: string; email: string }
    approval: { quotation: { rfq: { title: string } } | null } | null
  }
}

interface Props {
  initialTab: string
  poData: { orders: POItem[]; total: number; totalPages: number; page: number; pageSize: number }
  invoiceData: { invoices: InvoiceItem[]; total: number; totalPages: number; page: number; pageSize: number }
  currentPage: number
  filters: { status?: string; search?: string }
  userRole: string
}

const PO_STATUSES = ["GENERATED", "SENT", "ACCEPTED", "CLOSED"]
const INV_STATUSES = ["DRAFT", "SENT", "PAID"]

// ─── PDF Print helper ─────────────────────────────────────────────────────────

function printDocument(url: string) {
  const win = window.open(url, "_blank")
  win?.addEventListener("load", () => win.print())
}

// ─── PO Table ─────────────────────────────────────────────────────────────────

function POTable({
  orders, userRole, onStatusChange,
}: {
  orders: POItem[]
  userRole: string
  onStatusChange: (id: string, status: string) => void
}) {
  const canAct = ["ADMIN", "PROCUREMENT_OFFICER"].includes(userRole)

  if (orders.length === 0) {
    return (
      <EmptyState icon={ShoppingCart} title="No purchase orders found" description="Approve quotations to auto-generate POs." />
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100">
            {["PO Number", "Vendor", "RFQ", "Subtotal", "GST", "Total", "Status", "Generated", "Invoice", "Actions"].map(h => (
              <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {orders.map((po, i) => (
            <motion.tr
              key={po.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="hover:bg-gray-50/60 transition-colors"
            >
              <td className="px-4 py-3 font-mono text-xs font-semibold text-indigo-700">{po.poNumber}</td>
              <td className="px-4 py-3">
                <p className="font-medium text-gray-900 truncate max-w-[140px]">{po.vendor.companyName}</p>
                <p className="text-xs text-gray-400">{po.vendor.vendorCode}</p>
              </td>
              <td className="px-4 py-3 max-w-[150px]">
                <p className="text-xs text-gray-600 truncate">{po.approval?.quotation?.rfq.title ?? "—"}</p>
                <p className="text-xs text-gray-400 font-mono">{po.approval?.quotation?.rfq.rfqNumber ?? "—"}</p>
              </td>
              <td className="px-4 py-3 text-gray-700 font-medium">{formatCurrency(po.subtotal)}</td>
              <td className="px-4 py-3 text-gray-500 text-xs">{formatCurrency(po.tax)}</td>
              <td className="px-4 py-3 font-bold text-gray-900">{formatCurrency(po.total)}</td>
              <td className="px-4 py-3">
                {canAct ? (
                  <Select
                    defaultValue={po.status}
                    onValueChange={(v) => onStatusChange(po.id, v)}
                  >
                    <SelectTrigger className="h-7 text-xs w-[110px] border-gray-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PO_STATUSES.map(s => <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                ) : (
                  <StatusBadge status={po.status} />
                )}
              </td>
              <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{formatDate(po.generatedAt)}</td>
              <td className="px-4 py-3">
                {po.invoice ? (
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-mono text-gray-600">{po.invoice.invoiceNumber}</span>
                    <StatusBadge status={po.invoice.status} />
                  </div>
                ) : (
                  <span className="text-xs text-gray-300 italic">—</span>
                )}
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-1">
                  {po.pdfUrl && (
                    <Button size="icon" variant="ghost" className="h-7 w-7" asChild>
                      <a href={po.pdfUrl} target="_blank" rel="noopener noreferrer">
                        <Download className="w-3.5 h-3.5" />
                      </a>
                    </Button>
                  )}
                  {po.pdfUrl && (
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => printDocument(po.pdfUrl!)}>
                      <Printer className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── Invoice Table ─────────────────────────────────────────────────────────────

function InvoiceTable({
  invoices, userRole, onStatusChange, onEmail,
}: {
  invoices: InvoiceItem[]
  userRole: string
  onStatusChange: (id: string, status: string) => void
  onEmail: (invoice: InvoiceItem) => void
}) {
  const canAct = ["ADMIN", "PROCUREMENT_OFFICER"].includes(userRole)

  if (invoices.length === 0) {
    return (
      <EmptyState icon={Receipt} title="No invoices found" description="Invoices are auto-generated when quotations are approved." />
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100">
            {["Invoice No.", "Vendor", "RFQ / PO", "Subtotal", "GST", "Total", "Status", "Generated", "Actions"].map(h => (
              <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {invoices.map((inv, i) => (
            <motion.tr
              key={inv.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="hover:bg-gray-50/60 transition-colors"
            >
              <td className="px-4 py-3 font-mono text-xs font-semibold text-emerald-700">{inv.invoiceNumber}</td>
              <td className="px-4 py-3">
                <p className="font-medium text-gray-900 truncate max-w-[140px]">{inv.purchaseOrder.vendor.companyName}</p>
                <p className="text-xs text-gray-400">{inv.purchaseOrder.vendor.email}</p>
              </td>
              <td className="px-4 py-3 max-w-[150px]">
                <p className="text-xs text-gray-600 truncate">{inv.purchaseOrder.approval?.quotation?.rfq.title ?? "—"}</p>
                <p className="text-xs font-mono text-gray-400">{inv.purchaseOrder.poNumber}</p>
              </td>
              <td className="px-4 py-3 text-gray-700 font-medium">{formatCurrency(inv.subtotal)}</td>
              <td className="px-4 py-3 text-gray-500 text-xs">{formatCurrency(inv.tax)}</td>
              <td className="px-4 py-3 font-bold text-gray-900">{formatCurrency(inv.total)}</td>
              <td className="px-4 py-3">
                {canAct ? (
                  <Select defaultValue={inv.status} onValueChange={(v) => onStatusChange(inv.id, v)}>
                    <SelectTrigger className="h-7 text-xs w-[90px] border-gray-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {INV_STATUSES.map(s => <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                ) : (
                  <StatusBadge status={inv.status} />
                )}
              </td>
              <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{formatDate(inv.generatedAt)}</td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-1">
                  {inv.pdfUrl && (
                    <Button size="icon" variant="ghost" className="h-7 w-7" asChild>
                      <a href={inv.pdfUrl} target="_blank" rel="noopener noreferrer" title="Download PDF">
                        <Download className="w-3.5 h-3.5" />
                      </a>
                    </Button>
                  )}
                  {inv.pdfUrl && (
                    <Button size="icon" variant="ghost" className="h-7 w-7" title="Print" onClick={() => printDocument(inv.pdfUrl!)}>
                      <Printer className="w-3.5 h-3.5" />
                    </Button>
                  )}
                  {canAct && (
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-indigo-600 hover:text-indigo-700" title="Email invoice" onClick={() => onEmail(inv)}>
                      <Mail className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function OrdersClient({ initialTab, poData, invoiceData, currentPage, filters, userRole }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()
  const [search, setSearch] = useState(filters.search ?? "")
  const [activeTab, setActiveTab] = useState(initialTab)
  const [emailTarget, setEmailTarget] = useState<InvoiceItem | null>(null)
  const [emailLoading, setEmailLoading] = useState(false)

  const pushParams = (extra: Record<string, string>) => {
    const sp = new URLSearchParams({
      tab: activeTab,
      page: "1",
      ...(filters.status ? { status: filters.status } : {}),
      ...(search ? { search } : {}),
      ...extra,
    })
    router.push(`${pathname}?${sp}`)
  }

  const handleSearch = () => pushParams({ search, page: "1" })

  const handleStatusFilter = (val: string) => {
    pushParams({ status: val === "ALL" ? "" : val, page: "1" })
  }

  const handlePOStatusChange = (id: string, status: string) => {
    startTransition(async () => {
      const res = await updatePOStatus(id, status as "GENERATED" | "SENT" | "ACCEPTED" | "CLOSED")
      if (res.success) {
        toast({ title: "PO status updated" })
        router.refresh()
      } else {
        toast({ title: "Error", description: res.error, variant: "destructive" })
      }
    })
  }

  const handleInvoiceStatusChange = (id: string, status: string) => {
    startTransition(async () => {
      const res = await updateInvoiceStatus(id, status as "DRAFT" | "SENT" | "PAID")
      if (res.success) {
        toast({ title: "Invoice status updated" })
        router.refresh()
      } else {
        toast({ title: "Error", description: res.error, variant: "destructive" })
      }
    })
  }

  const handleSendEmail = async () => {
    if (!emailTarget) return
    setEmailLoading(true)
    const res = await emailInvoice(emailTarget.id)
    setEmailLoading(false)
    setEmailTarget(null)
    if (res.success) {
      toast({ title: "Invoice emailed", description: `Sent to ${emailTarget.purchaseOrder.vendor.email}` })
      router.refresh()
    } else {
      toast({ title: "Email failed", description: res.error, variant: "destructive" })
    }
  }

  const navigate = (p: number) => pushParams({ page: String(p) })

  const data = activeTab === "orders" ? poData : invoiceData
  const totalPages = data.totalPages ?? 1

  const poStatuses = ["ALL", ...PO_STATUSES]
  const invStatuses = ["ALL", ...INV_STATUSES]
  const statusOptions = activeTab === "orders" ? poStatuses : invStatuses

  return (
    <div className="space-y-6">
      <PageHeader
        title="Purchase Orders & Invoices"
        subtitle="Track all generated POs and invoices"
      />

      <Tabs
        value={activeTab}
        onValueChange={(v) => {
          setActiveTab(v)
          pushParams({ tab: v, page: "1" })
        }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
          <TabsList className="bg-gray-100/80 rounded-xl">
            <TabsTrigger value="orders" className="gap-1.5 data-[state=active]:bg-white rounded-lg">
              <ShoppingCart className="w-3.5 h-3.5" />
              Purchase Orders
              <span className="ml-1 bg-indigo-100 text-indigo-700 text-xs px-1.5 py-0.5 rounded-full font-medium">
                {poData.total}
              </span>
            </TabsTrigger>
            <TabsTrigger value="invoices" className="gap-1.5 data-[state=active]:bg-white rounded-lg">
              <Receipt className="w-3.5 h-3.5" />
              Invoices
              <span className="ml-1 bg-emerald-100 text-emerald-700 text-xs px-1.5 py-0.5 rounded-full font-medium">
                {invoiceData.total}
              </span>
            </TabsTrigger>
          </TabsList>

          {/* Filters */}
          <div className="flex items-center gap-2 ml-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <Input
                placeholder="Search…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="pl-8 h-8 w-48 text-sm"
              />
            </div>
            <Select defaultValue={filters.status ?? "ALL"} onValueChange={handleStatusFilter}>
              <SelectTrigger className="h-8 w-32 text-xs">
                <Filter className="w-3 h-3 mr-1" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map(s => <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* PO Tab */}
        <TabsContent value="orders">
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <POTable
              orders={poData.orders}
              userRole={userRole}
              onStatusChange={handlePOStatusChange}
            />
          </div>
        </TabsContent>

        {/* Invoices Tab */}
        <TabsContent value="invoices">
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <InvoiceTable
              invoices={invoiceData.invoices}
              userRole={userRole}
              onStatusChange={handleInvoiceStatusChange}
              onEmail={setEmailTarget}
            />
          </div>
        </TabsContent>
      </Tabs>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Page {currentPage} of {totalPages} · {data.total} records
          </p>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" disabled={currentPage <= 1 || isPending} onClick={() => navigate(currentPage - 1)}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button size="sm" variant="outline" disabled={currentPage >= totalPages || isPending} onClick={() => navigate(currentPage + 1)}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Email Confirm Dialog */}
      <Dialog open={!!emailTarget} onOpenChange={() => setEmailTarget(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-indigo-600" />
              Email Invoice
            </DialogTitle>
            <DialogDescription>
              This will send invoice{" "}
              <span className="font-semibold">{emailTarget?.invoiceNumber}</span> to the vendor.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-gray-50 rounded-xl p-4 text-sm space-y-1.5">
            <div className="flex justify-between">
              <span className="text-gray-500">Recipient</span>
              <span className="font-medium">{emailTarget?.purchaseOrder.vendor.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Total</span>
              <span className="font-bold">{emailTarget ? formatCurrency(emailTarget.total) : ""}</span>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setEmailTarget(null)}>Cancel</Button>
            <Button
              onClick={handleSendEmail}
              disabled={emailLoading}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {emailLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-1.5" />}
              Send Invoice
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
