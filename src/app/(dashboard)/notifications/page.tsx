import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getNotifications } from "@/lib/actions/notification.actions"
import { NotificationsClient } from "./notifications-client"

interface PageProps {
  searchParams: Promise<{
    page?: string
    unread?: string
  }>
}

export default async function NotificationsPage({ searchParams }: PageProps) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const sp = await searchParams
  const page = Number(sp.page ?? 1)
  const unreadOnly = sp.unread === "true"
  const pageSize = 20

  const { notifications, total, unreadCount } = await getNotifications({
    unreadOnly,
    page,
    pageSize,
  })

  return (
    <NotificationsClient
      notifications={notifications as any}
      total={total}
      unreadCount={unreadCount}
      currentPage={page}
      pageSize={pageSize}
      unreadOnly={unreadOnly}
    />
  )
}
