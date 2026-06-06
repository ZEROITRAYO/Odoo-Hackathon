import { cn } from "@/lib/utils"

type StatusVariant =
  | "DRAFT" | "OPEN" | "CLOSED"
  | "SUBMITTED" | "SELECTED" | "REJECTED"
  | "PENDING" | "APPROVED"
  | "GENERATED" | "SENT" | "ACCEPTED"
  | "PAID"
  | "ACTIVE" | "INACTIVE" | "BLOCKED"

const STATUS_STYLES: Record<StatusVariant | string, string> = {
  // RFQ
  DRAFT:     "bg-gray-100 text-gray-600",
  OPEN:      "bg-green-100 text-green-700",
  CLOSED:    "bg-red-100 text-red-600",
  // Quotation
  SUBMITTED: "bg-blue-100 text-blue-700",
  SELECTED:  "bg-purple-100 text-purple-700",
  REJECTED:  "bg-red-100 text-red-600",
  // Approval
  PENDING:   "bg-amber-100 text-amber-700",
  APPROVED:  "bg-green-100 text-green-700",
  // PO
  GENERATED: "bg-blue-100 text-blue-700",
  SENT:      "bg-indigo-100 text-indigo-700",
  ACCEPTED:  "bg-green-100 text-green-700",
  // Invoice
  PAID:      "bg-emerald-100 text-emerald-700",
  // Vendor
  ACTIVE:    "bg-green-100 text-green-700",
  INACTIVE:  "bg-gray-100 text-gray-600",
  BLOCKED:   "bg-red-100 text-red-600",
}

interface StatusBadgeProps {
  status: string
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize",
        STATUS_STYLES[status] ?? "bg-gray-100 text-gray-600",
        className
      )}
    >
      {status.replace(/_/g, " ").toLowerCase()}
    </span>
  )
}
