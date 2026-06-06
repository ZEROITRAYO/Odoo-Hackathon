import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getRFQs } from "@/lib/actions/rfq.actions"
import { RFQsClient } from "./rfqs-client"

interface PageProps {
  searchParams: Promise<{ status?: string; search?: string; page?: string }>
}

export default async function RFQsPage({ searchParams }: PageProps) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const sp = await searchParams
  const page = Number(sp.page ?? 1)
  const { rfqs, total, totalPages } = await getRFQs({
    status: sp.status,
    search: sp.search,
    page,
    pageSize: 15,
  })

  // The action returns `rfqVendors` but the client expects `vendors`
  const mappedRFQs = rfqs.map((rfq) => ({
    ...rfq,
    vendors: (rfq as any).rfqVendors ?? [],
  }))

  return (
    <RFQsClient
      initialRFQs={mappedRFQs as any}
      total={total}
      totalPages={totalPages}
      currentPage={page}
      filters={{ status: sp.status, search: sp.search }}
      role={session.user.role}
    />
  )
}
