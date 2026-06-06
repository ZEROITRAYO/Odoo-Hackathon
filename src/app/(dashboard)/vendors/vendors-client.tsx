"use client"

import { useState, useTransition, useCallback, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  Plus, Search, Star, MoreHorizontal, Pencil, Trash2,
  Building2, Phone, Mail, MapPin, Loader2, ChevronLeft, ChevronRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { PageHeader } from "@/components/page-header"
import { StatusBadge } from "@/components/status-badge"
import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog"
import { EmptyState } from "@/components/empty-state"
import { createVendor, updateVendor, deleteVendor } from "@/lib/actions/vendor.actions"
import { vendorSchema } from "@/lib/validations"
import { useToast } from "@/hooks/use-toast"
import type { Vendor } from "@prisma/client"

type VendorForm = z.infer<typeof vendorSchema>

interface Props {
  initialVendors: Vendor[]
  total: number
  totalPages: number
  currentPage: number
  categories: string[]
  filters: { search?: string; status?: string; category?: string }
}

const STATUS_TABS = ["ALL", "ACTIVE", "PENDING", "BLOCKED"] as const

const CATEGORIES = [
  "IT", "Construction", "Logistics", "Furniture",
  "Office Supplies", "Electrical", "Mechanical", "Healthcare", "Other",
]

export function VendorsClient({ initialVendors, total, totalPages, currentPage, categories, filters }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()

  const [vendors, setVendors] = useState(initialVendors)
  const [search, setSearch] = useState(filters.search ?? "")
  const [activeTab, setActiveTab] = useState<string>(filters.status?.toUpperCase() ?? "ALL")

  const [createOpen, setCreateOpen] = useState(false)
  const [editVendor, setEditVendor] = useState<Vendor | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // sync list after server revalidation
  useEffect(() => { setVendors(initialVendors) }, [initialVendors])

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

  // Counts per status
  const counts = {
    ALL: total,
    ACTIVE: initialVendors.filter((v) => v.status === "ACTIVE").length,
    PENDING: initialVendors.filter((v) => v.status === "PENDING").length,
    BLOCKED: initialVendors.filter((v) => v.status === "BLOCKED").length,
  }

  // Form
  const form = useForm<VendorForm>({
    resolver: zodResolver(vendorSchema),
    defaultValues: { status: "ACTIVE" },
  })

  function openEdit(vendor: Vendor) {
    setEditVendor(vendor)
    form.reset({
      companyName: vendor.companyName,
      gstNumber: vendor.gstNumber,
      category: vendor.category,
      contactPerson: vendor.contactPerson,
      phone: vendor.phone,
      email: vendor.email,
      address: vendor.address,
      status: vendor.status as VendorForm["status"],
    })
  }

  function closeDialog() {
    setCreateOpen(false)
    setEditVendor(null)
    form.reset()
  }

  async function onSubmit(data: VendorForm) {
    setIsSubmitting(true)
    try {
      if (editVendor) {
        const result = await updateVendor(editVendor.id, data)
        if (!result.success) throw new Error(result.error)
        toast({ title: "Vendor updated", description: `${data.companyName} has been updated.` })
      } else {
        const result = await createVendor(data)
        if (!result.success) throw new Error(result.error)
        toast({ title: "Vendor created", description: `${data.companyName} · ${result.data.vendorCode}` })
      }
      closeDialog()
      router.refresh()
    } catch (e: unknown) {
      toast({ title: "Error", description: e instanceof Error ? e.message : "Something went wrong", variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setIsDeleting(true)
    try {
      const result = await deleteVendor(deleteTarget)
      if (!result.success) throw new Error(result.error)
      toast({ title: "Vendor deleted" })
      setDeleteTarget(null)
      router.refresh()
    } catch (e: unknown) {
      toast({ title: "Error", description: e instanceof Error ? e.message : "Cannot delete vendor", variant: "destructive" })
    } finally {
      setIsDeleting(false)
    }
  }

  const allCategories = Array.from(new Set([...CATEGORIES, ...categories])).sort()

  return (
    <div className="space-y-5">
      <PageHeader title="Vendors" subtitle="Manage supplier profiles and registrations">
        <Button
          onClick={() => { form.reset({ status: "ACTIVE" }); setCreateOpen(true) }}
          className="gap-2 bg-[#1a2e1a] hover:bg-[#2d4d2d] text-white rounded-xl h-9"
        >
          <Plus className="w-4 h-4" /> Add Vendor
        </Button>
      </PageHeader>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Search by name, GST number, category..."
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          className="pl-10 h-11 rounded-xl border-gray-200 bg-white"
        />
      </div>

      {/* Status tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        {STATUS_TABS.map((tab) => {
          const count = tab === "ALL" ? total : initialVendors.filter((v) => v.status === tab).length
          return (
            <button
              key={tab}
              onClick={() => handleTab(tab)}
              className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-all border ${
                activeTab === tab
                  ? "bg-[#1a2e1a] text-white border-[#1a2e1a]"
                  : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
              }`}
            >
              {tab.charAt(0) + tab.slice(1).toLowerCase()} ({count})
            </button>
          )
        })}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {isPending ? (
          <div className="p-12 text-center text-sm text-gray-400">Loading…</div>
        ) : vendors.length === 0 ? (
          <EmptyState
            icon={Building2}
            title="No vendors found"
            description="Try adjusting your search or add a new vendor."
          >
            <Button
              onClick={() => { form.reset({ status: "ACTIVE" }); setCreateOpen(true) }}
              className="gap-2 bg-[#1a2e1a] text-white rounded-xl h-9"
            >
              <Plus className="w-4 h-4" /> Add First Vendor
            </Button>
          </EmptyState>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50/60">
                <tr>
                  {["Vendor Name", "Category", "GST No.", "Contact No.", "Rating", "Status", "Action"].map((h) => (
                    <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                <AnimatePresence>
                  {vendors.map((vendor, i) => (
                    <motion.tr
                      key={vendor.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="hover:bg-gray-50/60 transition-colors"
                    >
                      <td className="px-5 py-3.5">
                        <div>
                          <p className="font-semibold text-gray-800">{vendor.companyName}</p>
                          <p className="text-xs text-gray-400 font-mono">{vendor.vendorCode}</p>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-medium">
                          {vendor.category}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 font-mono text-xs text-gray-600">{vendor.gstNumber}</td>
                      <td className="px-5 py-3.5 text-gray-600">{vendor.phone}</td>
                      <td className="px-5 py-3.5">
                        {vendor.rating ? (
                          <div className="flex items-center gap-1">
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                            <span className="font-medium text-gray-700">{vendor.rating.toFixed(1)}</span>
                          </div>
                        ) : (
                          <span className="text-gray-300 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <StatusBadge status={vendor.status} />
                      </td>
                      <td className="px-5 py-3.5">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="w-8 h-8 rounded-lg">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-36">
                            <DropdownMenuItem className="gap-2 text-sm" onClick={() => openEdit(vendor)}>
                              <Pencil className="w-3.5 h-3.5 text-gray-400" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="gap-2 text-sm text-red-600 focus:text-red-600 focus:bg-red-50"
                              onClick={() => setDeleteTarget(vendor.id)}
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3.5 border-t border-gray-50">
            <p className="text-xs text-gray-400">
              Showing {(currentPage - 1) * 15 + 1}–{Math.min(currentPage * 15, total)} of {total} vendors
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="w-8 h-8 rounded-lg"
                disabled={currentPage <= 1}
                onClick={() => navigate({ page: String(currentPage - 1) })}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm font-medium text-gray-600">{currentPage} / {totalPages}</span>
              <Button
                variant="outline"
                size="icon"
                className="w-8 h-8 rounded-lg"
                disabled={currentPage >= totalPages}
                onClick={() => navigate({ page: String(currentPage + 1) })}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Create / Edit Dialog */}
      <Dialog open={createOpen || !!editVendor} onOpenChange={(open) => { if (!open) closeDialog() }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editVendor ? "Edit Vendor" : "Add New Vendor"}</DialogTitle>
          </DialogHeader>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 mt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Company Name *</Label>
                <Input placeholder="Infra Supplies Pvt Ltd" className="h-10 rounded-lg" {...form.register("companyName")} />
                {form.formState.errors.companyName && <p className="text-red-500 text-xs">{form.formState.errors.companyName.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">GST Number *</Label>
                <Input placeholder="27AABCS1929B1Z0" className="h-10 rounded-lg font-mono" {...form.register("gstNumber")} />
                {form.formState.errors.gstNumber && <p className="text-red-500 text-xs">{form.formState.errors.gstNumber.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Category *</Label>
                <Select
                  defaultValue={editVendor?.category}
                  onValueChange={(v) => form.setValue("category", v)}
                >
                  <SelectTrigger className="h-10 rounded-lg">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {allCategories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
                {form.formState.errors.category && <p className="text-red-500 text-xs">{form.formState.errors.category.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Status</Label>
                <Select
                  defaultValue={editVendor?.status ?? "ACTIVE"}
                  onValueChange={(v) => form.setValue("status", v as VendorForm["status"])}
                >
                  <SelectTrigger className="h-10 rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="BLOCKED">Blocked</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5 text-gray-400" />Contact Person *</Label>
                <Input placeholder="Rahul Mehta" className="h-10 rounded-lg" {...form.register("contactPerson")} />
                {form.formState.errors.contactPerson && <p className="text-red-500 text-xs">{form.formState.errors.contactPerson.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-gray-400" />Phone *</Label>
                <Input placeholder="+91 98765 43210" className="h-10 rounded-lg" {...form.register("phone")} />
                {form.formState.errors.phone && <p className="text-red-500 text-xs">{form.formState.errors.phone.message}</p>}
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-sm font-medium flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-gray-400" />Email *</Label>
                <Input type="email" placeholder="vendor@company.com" className="h-10 rounded-lg" {...form.register("email")} />
                {form.formState.errors.email && <p className="text-red-500 text-xs">{form.formState.errors.email.message}</p>}
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-sm font-medium flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-gray-400" />Address *</Label>
                <textarea
                  placeholder="123, Industrial Area, Mumbai, Maharashtra – 400001"
                  rows={2}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a2e1a]/20 focus:border-[#1a2e1a] resize-none"
                  {...form.register("address")}
                />
                {form.formState.errors.address && <p className="text-red-500 text-xs">{form.formState.errors.address.message}</p>}
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog} className="rounded-lg">Cancel</Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="gap-2 bg-[#1a2e1a] hover:bg-[#2d4d2d] text-white rounded-lg"
              >
                {isSubmitting ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />{editVendor ? "Saving…" : "Creating…"}</> : editVendor ? "Save Changes" : "Create Vendor"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <ConfirmDeleteDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}
        title="Delete vendor?"
        description="This will permanently delete the vendor. Vendors with existing purchase orders cannot be deleted."
        onConfirm={handleDelete}
        isLoading={isDeleting}
      />
    </div>
  )
}
