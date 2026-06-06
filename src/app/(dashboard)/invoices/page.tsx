import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { PageHeader } from "@/components/page-header"
import { StatusBadge } from "@/components/status-badge"
import { EmptyState } from "@/components/empty-state"
import { Receipt } from "lucide-react"
import { formatDate } from "@/lib/utils"

export default async function InvoicesPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const isVendor = session.user.role === "VENDOR"

  let vendorId: string | undefined
  if (isVendor) {
    // Vendor users are linked by matching email to the Vendor table — NOT by User.id
    const vendor = await db.vendor.findFirst({
      where: { email: session.user.email! },
      select: { id: true },
    })
    vendorId = vendor?.id
  }

  const invoices = await db.invoice.findMany({
    where: isVendor
      ? vendorId
        ? { purchaseOrder: { vendorId } }
        : { id: "no-match" } // no linked vendor → return empty safely
      : {},
    include: {
      purchaseOrder: {
        include: {
          vendor: { select: { companyName: true } },
        },
      },
    },
    orderBy: { generatedAt: "desc" },
    take: 50,
  })

  return (
    <div className="space-y-5">
      <PageHeader title="Invoices" subtitle="Track all purchase invoices" />

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {invoices.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title="No invoices yet"
            description="Invoices are generated automatically after a quotation is approved."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50/60">
                <tr>
                  {["Invoice #", "PO #", "Vendor", "Subtotal", "Tax", "Total", "Status", "Date"].map((h) => (
                    <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3.5 font-mono text-xs text-gray-600">{inv.invoiceNumber}</td>
                    <td className="px-5 py-3.5 font-mono text-xs text-gray-600">{inv.purchaseOrder.poNumber}</td>
                    <td className="px-5 py-3.5 font-medium text-gray-800">{inv.purchaseOrder.vendor.companyName}</td>
                    <td className="px-5 py-3.5 text-gray-700">₹{inv.subtotal.toLocaleString("en-IN")}</td>
                    <td className="px-5 py-3.5 text-gray-500">₹{inv.tax.toLocaleString("en-IN")}</td>
                    <td className="px-5 py-3.5 font-semibold text-gray-800">₹{inv.total.toLocaleString("en-IN")}</td>
                    <td className="px-5 py-3.5"><StatusBadge status={inv.status} /></td>
                    <td className="px-5 py-3.5 text-xs text-gray-500">{formatDate(inv.generatedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
