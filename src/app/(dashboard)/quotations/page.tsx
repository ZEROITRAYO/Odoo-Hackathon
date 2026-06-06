import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { PageHeader } from "@/components/page-header"
import { StatusBadge } from "@/components/status-badge"
import { EmptyState } from "@/components/empty-state"
import { MessageSquare } from "lucide-react"
import { formatDate } from "@/lib/utils"

export default async function QuotationsPage() {
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

  const quotations = await db.quotation.findMany({
    where: isVendor
      ? vendorId
        ? { vendorId }
        : { id: "no-match" } // no linked vendor → return empty safely
      : {},
    include: {
      rfq: { select: { title: true, rfqNumber: true } },
      vendor: { select: { companyName: true } },
    },
    orderBy: { submittedAt: "desc" },
    take: 50,
  })

  return (
    <div className="space-y-5">
      <PageHeader title="Quotations" subtitle="Track all submitted quotations" />

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {quotations.length === 0 ? (
          <EmptyState icon={MessageSquare} title="No quotations yet" description="Quotations will appear here once vendors submit them." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50/60">
                <tr>
                  {["Quotation #", "RFQ", "Vendor", "Price", "Delivery", "Status", "Submitted"].map((h) => (
                    <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {quotations.map((q) => (
                  <tr key={q.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3.5 font-mono text-xs text-gray-600">{q.quotationNumber}</td>
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-gray-800">{q.rfq.title}</p>
                      <p className="text-xs text-gray-400">{q.rfq.rfqNumber}</p>
                    </td>
                    <td className="px-5 py-3.5 text-gray-700">{q.vendor.companyName}</td>
                    <td className="px-5 py-3.5 font-semibold text-gray-800">₹{q.price.toLocaleString("en-IN")}</td>
                    <td className="px-5 py-3.5 text-gray-600">{q.deliveryDays}d</td>
                    <td className="px-5 py-3.5"><StatusBadge status={q.status} /></td>
                    <td className="px-5 py-3.5 text-gray-500 text-xs">{formatDate(q.submittedAt)}</td>
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
