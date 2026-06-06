import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getPendingApprovals } from "@/lib/actions/approval.actions"
import { ApprovalsClient } from "./approvals-client"

interface Props {
  searchParams: Promise<{ page?: string }>
}

export default async function ApprovalsPage({ searchParams }: Props) {
  const session = await auth()
  if (!session) redirect("/login")

  const { role } = session.user
  if (!["ADMIN", "MANAGER"].includes(role)) {
    redirect("/dashboard")
  }

  const { page } = await searchParams
  const currentPage = Math.max(1, parseInt(page ?? "1", 10))

  const { approvals, total, pageSize } = await getPendingApprovals({
    page: currentPage,
    pageSize: 15,
  })

  return (
    <ApprovalsClient
      approvals={approvals}
      total={total}
      currentPage={currentPage}
      pageSize={pageSize}
      userRole={role}
    />
  )
}
