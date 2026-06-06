import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { getQuotationsForRFQ } from "@/lib/actions/quotation.actions"
import { QuotationCompareClient } from "./quotation-compare-client"

interface Props {
  params: Promise<{ rfqId: string }>
}

export default async function QuotationComparePage({ params }: Props) {
  const session = await auth()
  if (!session) redirect("/login")

  const { role } = session.user
  if (!["ADMIN", "PROCUREMENT_OFFICER", "MANAGER"].includes(role)) {
    redirect("/dashboard")
  }

  const { rfqId } = await params

  const rfq = await db.rFQ.findUnique({
    where: { id: rfqId },
    include: {
      creator: { select: { id: true, name: true } },
      rfqVendors: { include: { vendor: { select: { id: true, companyName: true } } } },
    },
  })

  if (!rfq) redirect("/rfqs")

  const quotations = await getQuotationsForRFQ(rfqId)

  return (
    <QuotationCompareClient
      rfq={{
        id: rfq.id,
        rfqNumber: rfq.rfqNumber,
        title: rfq.title,
        description: rfq.description,
        quantity: rfq.quantity,
        deadline: rfq.deadline,
        status: rfq.status,
        createdBy: rfq.creator,
        assignedVendorCount: rfq.rfqVendors.length,
      }}
      quotations={quotations}
      userRole={role}
    />
  )
}
