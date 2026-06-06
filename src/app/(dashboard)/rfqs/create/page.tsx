import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { CreateRFQClient } from "./create-rfq-client"

export default async function CreateRFQPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  if (!["ADMIN", "PROCUREMENT_OFFICER"].includes(session.user.role)) {
    redirect("/dashboard")
  }

  const vendors = await db.vendor.findMany({
    where: { status: "ACTIVE" },
    select: { id: true, companyName: true, category: true, vendorCode: true },
    orderBy: { companyName: "asc" },
  })

  return <CreateRFQClient vendors={vendors} />
}
