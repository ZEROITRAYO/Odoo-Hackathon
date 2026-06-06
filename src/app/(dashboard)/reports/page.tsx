import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getVendorPerformance, getProcurementStats } from "@/lib/actions/report.actions"
import { ReportsClient } from "./reports-client"

export default async function ReportsPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const [vendorPerformance, procurementStats] = await Promise.all([
    getVendorPerformance(),
    getProcurementStats(),
  ])

  return (
    <ReportsClient
      vendorPerformance={vendorPerformance}
      procurementStats={procurementStats}
      userRole={session.user.role}
    />
  )
}
