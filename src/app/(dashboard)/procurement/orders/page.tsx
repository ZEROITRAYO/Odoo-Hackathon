import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getPurchaseOrders } from "@/lib/actions/po.actions"
import { getInvoices } from "@/lib/actions/invoice.actions"
import { OrdersClient } from "./orders-client"

interface PageProps {
  searchParams: Promise<{
    tab?: string
    page?: string
    status?: string
    search?: string
  }>
}

export default async function OrdersPage({ searchParams }: PageProps) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const sp = await searchParams
  const page = Number(sp.page ?? 1)
  const tab = sp.tab ?? "orders"

  const [poData, invoiceData] = await Promise.all([
    getPurchaseOrders({
      status: sp.status,
      search: sp.search,
      page,
      pageSize: 15,
    }),
    getInvoices({
      status: sp.status,
      search: sp.search,
      page,
      pageSize: 15,
    }),
  ])

  return (
    <OrdersClient
      initialTab={tab}
      poData={poData as any}
      invoiceData={invoiceData as any}
      currentPage={page}
      filters={{ status: sp.status, search: sp.search }}
      userRole={session.user.role}
    />
  )
}
