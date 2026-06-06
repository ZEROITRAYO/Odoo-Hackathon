import { getVendors, getVendorCategories } from "@/lib/actions/vendor.actions"
import { VendorsClient } from "./vendors-client"

interface SearchParams {
  search?: string
  status?: string
  category?: string
  page?: string
}

export default async function VendorsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const sp = await searchParams
  const page = Number(sp.page ?? 1)

  const [{ vendors, total, totalPages }, categories] = await Promise.all([
    getVendors({
      search: sp.search,
      status: sp.status,
      category: sp.category,
      page,
      pageSize: 15,
    }),
    getVendorCategories(),
  ])

  return (
    <VendorsClient
      initialVendors={vendors}
      total={total}
      totalPages={totalPages}
      currentPage={page}
      categories={categories}
      filters={{ search: sp.search, status: sp.status, category: sp.category }}
    />
  )
}
