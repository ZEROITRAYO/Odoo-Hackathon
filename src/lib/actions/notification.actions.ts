'use server'

import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

// ─── createNotification ───────────────────────────────────────────────────────

export async function createNotification({
  userId,
  title,
  message,
}: {
  userId: string
  title: string
  message: string
}): Promise<void> {
  await db.notification.create({
    data: { userId, title, message, read: false },
  })
}

// ─── getNotifications ─────────────────────────────────────────────────────────

export async function getNotifications(params: {
  unreadOnly?: boolean
  page?: number
  pageSize?: number
} = {}) {
  const session = await auth()
  if (!session?.user) return { notifications: [], total: 0 }

  const { unreadOnly = false, page = 1, pageSize = 30 } = params

  const where: Record<string, unknown> = { userId: session.user.id }
  if (unreadOnly) where.read = false

  const [notifications, total, unreadCount] = await Promise.all([
    db.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.notification.count({ where }),
    db.notification.count({ where: { userId: session.user.id, read: false } }),
  ])

  return { notifications, total, unreadCount, page, pageSize }
}

// ─── markAsRead ───────────────────────────────────────────────────────────────

export async function markNotificationRead(
  notificationId: string,
): Promise<void> {
  const session = await auth()
  if (!session?.user) return

  await db.notification.updateMany({
    where: { id: notificationId, userId: session.user.id },
    data: { read: true },
  })
  revalidatePath('/notifications')
}

// ─── markAllAsRead ────────────────────────────────────────────────────────────

export async function markAllNotificationsRead(): Promise<void> {
  const session = await auth()
  if (!session?.user) return

  await db.notification.updateMany({
    where: { userId: session.user.id, read: false },
    data: { read: true },
  })
  revalidatePath('/notifications')
}

// ─── clearAllNotifications ────────────────────────────────────────────────────

export async function clearAllNotifications(): Promise<void> {
  const session = await auth()
  if (!session?.user) return

  await db.notification.deleteMany({ where: { userId: session.user.id } })
  revalidatePath('/notifications')
}

// ─── getUnreadCount ───────────────────────────────────────────────────────────
// Lightweight poller – called every 10s from client

export async function getUnreadNotificationCount(): Promise<number> {
  const session = await auth()
  if (!session?.user) return 0
  return db.notification.count({ where: { userId: session.user.id, read: false } })
}
