import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { getRFQs } from "@/lib/actions/rfq.actions"
import { VendorRFQsClient } from "./vendor-rfqs-client"

interface PageProps {
  searchParams: Promise<{ status?: string; search?: string; page?: string }>
}

export default async function VendorRFQsPage({ searchParams }: PageProps) {
  const session = await auth()
  if (!session?.user) redirect("/login")
  if (!["VENDOR", "ADMIN"].includes(session.user.role)) redirect("/dashboard")

  const sp = await searchParams

  // Find vendor linked to this user's email
  const vendor = await db.vendor.findFirst({
    where: { email: session.user.email! },
  })

  if (!vendor) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
        <div className="text-4xl mb-4">🏢</div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">No vendor profile found</h2>
        <p className="text-gray-500 max-w-sm">
          Your account is not linked to a vendor profile. Please contact your procurement officer.
        </p>
      </div>
    )
  }

  const page = Number(sp.page ?? 1)
  const { rfqs, total, totalPages } = await getRFQs({
    status: sp.status !== "ALL" ? sp.status : undefined,
    search: sp.search,
    page,
    pageSize: 15,
    vendorId: vendor.id,
  })

  // Get existing quotations by this vendor for these RFQs
  const rfqIds = rfqs.map((r) => r.id)
  const existingQuotations = await db.quotation.findMany({
    where: { vendorId: vendor.id, rfqId: { in: rfqIds } },
    select: { rfqId: true, id: true, status: true, price: true, deliveryDays: true, notes: true, quotationNumber: true },
  })
  const quotationsByRfq = Object.fromEntries(
    existingQuotations.map((q) => [q.rfqId, q])
  )

  return (
    <VendorRFQsClient
      rfqs={rfqs as any}
      total={total}
      totalPages={totalPages}
      currentPage={page}
      filters={{ status: sp.status, search: sp.search }}
      quotationsByRfq={quotationsByRfq}
      vendorId={vendor.id}
    />
  )
}
