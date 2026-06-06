import { auth } from "@/lib/auth"
import { redirect, notFound } from "next/navigation"
import { getRFQById } from "@/lib/actions/rfq.actions"
import { RFQDetailClient } from "./rfq-detail-client"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function RFQDetailPage({ params }: PageProps) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const { id } = await params
  const rfq = await getRFQById(id)
  if (!rfq) notFound()

  // getRFQById returns `rfqVendors` but the client expects `vendors`
  const mappedRfq = { ...rfq, vendors: (rfq as any).rfqVendors ?? [] }

  return <RFQDetailClient rfq={mappedRfq as any} role={session.user.role} userId={session.user.id} />
}
