"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { motion, AnimatePresence } from "framer-motion"
import {
  FileText, Calendar, Users, Upload, X, Check, ChevronRight,
  ChevronLeft, Loader2, Search, Package, ArrowLeft,
} from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { rfqSchema } from "@/lib/validations"
import { createRFQ } from "@/lib/actions/rfq.actions"
import { useToast } from "@/hooks/use-toast"
import { PageHeader } from "@/components/page-header"

type RFQForm = z.infer<typeof rfqSchema>

interface Vendor {
  id: string
  companyName: string
  category: string
  vendorCode: string
}

interface Props {
  vendors: Vendor[]
}

const STEPS = ["Details", "Vendors", "Review"]

export function CreateRFQClient({ vendors }: Props) {
  const router = useRouter()
  const { toast } = useToast()
  const [step, setStep] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [vendorSearch, setVendorSearch] = useState("")
  const [attachmentUrl, setAttachmentUrl] = useState("")

  const form = useForm<RFQForm>({
    resolver: zodResolver(rfqSchema),
    defaultValues: {
      title: "",
      description: "",
      quantity: 1,
      deadline: "",
      attachmentUrl: "",
      vendorIds: [],
      status: "OPEN",
    },
  })

  const { watch, setValue, formState: { errors } } = form
  const selectedVendorIds = watch("vendorIds") ?? []
  const formValues = watch()

  const filteredVendors = vendors.filter((v) =>
    vendorSearch === "" ||
    v.companyName.toLowerCase().includes(vendorSearch.toLowerCase()) ||
    v.category.toLowerCase().includes(vendorSearch.toLowerCase())
  )

  function toggleVendor(id: string) {
    const current = selectedVendorIds
    if (current.includes(id)) {
      setValue("vendorIds", current.filter((v) => v !== id))
    } else {
      setValue("vendorIds", [...current, id])
    }
  }

  function removeVendor(id: string) {
    setValue("vendorIds", selectedVendorIds.filter((v) => v !== id))
  }

  const selectedVendors = vendors.filter((v) => selectedVendorIds.includes(v.id))

  async function validateStep(s: number): Promise<boolean> {
    if (s === 0) {
      const valid = await form.trigger(["title", "quantity", "deadline"])
      return valid
    }
    if (s === 1) {
      const valid = await form.trigger(["vendorIds"])
      return valid
    }
    return true
  }

  async function nextStep() {
    const valid = await validateStep(step)
    if (valid) setStep((s) => Math.min(s + 1, 2))
  }

  async function onSubmit(status: "OPEN" | "DRAFT") {
    setIsSubmitting(true)
    try {
      setValue("status", status)
      setValue("attachmentUrl", attachmentUrl)
      const data = form.getValues()
      const result = await createRFQ({ ...data, status })
      if (!result.success) throw new Error(result.error)
      toast({
        title: status === "OPEN" ? "RFQ Created & Sent" : "RFQ Saved as Draft",
        description: `${result.data?.rfqNumber} has been ${status === "OPEN" ? "sent to vendors" : "saved"}.`,
      })
      router.push("/rfqs")
    } catch (e: unknown) {
      toast({ title: "Error", description: e instanceof Error ? e.message : "Failed to create RFQ", variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild className="rounded-xl h-9 w-9">
          <Link href="/rfqs"><ArrowLeft className="w-4 h-4" /></Link>
        </Button>
        <PageHeader title="Create RFQ" subtitle="Send request for quotation to vendors" />
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-0 bg-white rounded-2xl border border-gray-100 p-4">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center gap-0 flex-1">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                i < step ? "bg-[#1a2e1a] text-white" :
                i === step ? "bg-[#1a2e1a] text-white ring-4 ring-[#1a2e1a]/15" :
                "bg-gray-100 text-gray-400"
              }`}>
                {i < step ? <Check className="w-4 h-4" /> : i + 1}
              </div>
              <span className={`text-sm font-semibold ${i === step ? "text-[#1a2e1a]" : i < step ? "text-gray-500" : "text-gray-300"}`}>
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-4 transition-all ${i < step ? "bg-[#1a2e1a]" : "bg-gray-100"}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <AnimatePresence mode="wait">
          {/* Step 1: Details */}
          {step === 0 && (
            <motion.div
              key="step0"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-6 space-y-5"
            >
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4 text-[#1a2e1a]" />
                <h3 className="font-semibold text-gray-800">RFQ Details</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2 space-y-1.5">
                  <Label className="text-sm font-medium">RFQ Title *</Label>
                  <Input
                    placeholder="e.g. Office Furniture Procurement Q2"
                    className="h-11 rounded-xl"
                    {...form.register("title")}
                  />
                  {errors.title && <p className="text-red-500 text-xs">{errors.title.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label className="text-sm font-medium flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5 text-gray-400" /> Quantity *
                  </Label>
                  <Input
                    type="number"
                    min={1}
                    placeholder="25"
                    className="h-11 rounded-xl"
                    {...form.register("quantity", { valueAsNumber: true })}
                  />
                  {errors.quantity && <p className="text-red-500 text-xs">{errors.quantity.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label className="text-sm font-medium flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-gray-400" /> Deadline *
                  </Label>
                  <Input
                    type="date"
                    min={new Date().toISOString().split("T")[0]}
                    className="h-11 rounded-xl"
                    {...form.register("deadline")}
                  />
                  {errors.deadline && <p className="text-red-500 text-xs">{errors.deadline.message}</p>}
                </div>

                <div className="sm:col-span-2 space-y-1.5">
                  <Label className="text-sm font-medium">Description</Label>
                  <textarea
                    placeholder="Describe the items, specifications, and any requirements..."
                    rows={3}
                    className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a2e1a]/20 focus:border-[#1a2e1a] resize-none"
                    {...form.register("description")}
                  />
                </div>

                <div className="sm:col-span-2 space-y-1.5">
                  <Label className="text-sm font-medium flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5 text-gray-400" /> Attachment URL
                    <span className="text-gray-400 text-xs font-normal">(optional – paste UploadThing URL)</span>
                  </Label>
                  <Input
                    placeholder="https://utfs.io/f/..."
                    className="h-11 rounded-xl font-mono text-sm"
                    value={attachmentUrl}
                    onChange={(e) => setAttachmentUrl(e.target.value)}
                  />
                  <p className="text-xs text-gray-400">
                    Upload your file to UploadThing and paste the URL here, or leave blank.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 2: Vendors */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-6 space-y-4"
            >
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-[#1a2e1a]" />
                <h3 className="font-semibold text-gray-800">Assign Vendors</h3>
                <span className="ml-auto text-xs text-gray-400">{selectedVendorIds.length} selected</span>
              </div>

              {errors.vendorIds && (
                <p className="text-red-500 text-xs">{errors.vendorIds.message}</p>
              )}

              {/* Selected chips */}
              {selectedVendors.length > 0 && (
                <div className="flex flex-wrap gap-2 p-3 bg-[#1a2e1a]/5 rounded-xl">
                  {selectedVendors.map((v) => (
                    <span key={v.id} className="flex items-center gap-1.5 bg-[#1a2e1a] text-white text-xs px-3 py-1.5 rounded-full font-medium">
                      {v.companyName}
                      <button type="button" onClick={() => removeVendor(v.id)} className="hover:opacity-70">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search vendors by name or category..."
                  value={vendorSearch}
                  onChange={(e) => setVendorSearch(e.target.value)}
                  className="pl-10 h-10 rounded-xl"
                />
              </div>

              <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1">
                {filteredVendors.length === 0 ? (
                  <p className="text-center text-sm text-gray-400 py-8">No active vendors found</p>
                ) : (
                  filteredVendors.map((vendor) => {
                    const selected = selectedVendorIds.includes(vendor.id)
                    return (
                      <button
                        key={vendor.id}
                        type="button"
                        onClick={() => toggleVendor(vendor.id)}
                        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-left transition-all ${
                          selected
                            ? "border-[#1a2e1a] bg-[#1a2e1a]/5"
                            : "border-gray-100 hover:border-gray-200 hover:bg-gray-50"
                        }`}
                      >
                        <div>
                          <p className="text-sm font-semibold text-gray-800">{vendor.companyName}</p>
                          <p className="text-xs text-gray-400">{vendor.category} · {vendor.vendorCode}</p>
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                          selected ? "bg-[#1a2e1a] border-[#1a2e1a]" : "border-gray-300"
                        }`}>
                          {selected && <Check className="w-3 h-3 text-white" />}
                        </div>
                      </button>
                    )
                  })
                )}
              </div>
            </motion.div>
          )}

          {/* Step 3: Review */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-6 space-y-5"
            >
              <h3 className="font-semibold text-gray-800">Review & Submit</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">RFQ Details</p>
                  <div className="space-y-2">
                    <ReviewRow label="Title" value={formValues.title} />
                    <ReviewRow label="Quantity" value={String(formValues.quantity)} />
                    <ReviewRow label="Deadline" value={formValues.deadline ? new Date(formValues.deadline).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : "—"} />
                    {formValues.description && (
                      <ReviewRow label="Description" value={formValues.description} />
                    )}
                    {attachmentUrl && (
                      <ReviewRow label="Attachment" value="File attached" />
                    )}
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Assigned Vendors ({selectedVendors.length})
                  </p>
                  {selectedVendors.length === 0 ? (
                    <p className="text-sm text-red-500">No vendors selected — go back to select vendors.</p>
                  ) : (
                    <div className="space-y-2">
                      {selectedVendors.map((v) => (
                        <div key={v.id} className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#1a2e1a]" />
                          <span className="text-sm text-gray-700">{v.companyName}</span>
                          <span className="text-xs text-gray-400">({v.category})</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
                <strong>Send to Vendors</strong> — Vendors will be notified and can submit quotations until the deadline.
                <br />
                <strong>Save as Draft</strong> — Save privately; vendors won&apos;t be notified yet.
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer Navigation */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-50 bg-gray-50/40">
          <Button
            type="button"
            variant="outline"
            onClick={() => step === 0 ? router.push("/rfqs") : setStep((s) => s - 1)}
            className="gap-2 rounded-xl h-9"
          >
            <ChevronLeft className="w-4 h-4" />
            {step === 0 ? "Cancel" : "Back"}
          </Button>

          {step < 2 ? (
            <Button
              type="button"
              onClick={nextStep}
              className="gap-2 bg-[#1a2e1a] hover:bg-[#2d4d2d] text-white rounded-xl h-9"
            >
              Next <ChevronRight className="w-4 h-4" />
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={isSubmitting || selectedVendorIds.length === 0}
                onClick={() => onSubmit("DRAFT")}
                className="rounded-xl h-9"
              >
                {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                Save as Draft
              </Button>
              <Button
                type="button"
                disabled={isSubmitting || selectedVendorIds.length === 0}
                onClick={() => onSubmit("OPEN")}
                className="gap-2 bg-[#1a2e1a] hover:bg-[#2d4d2d] text-white rounded-xl h-9"
              >
                {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : null}
                Send to Vendors
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-xs text-gray-500 shrink-0">{label}</span>
      <span className="text-xs font-medium text-gray-800 text-right break-words max-w-[160px]">{value}</span>
    </div>
  )
}
