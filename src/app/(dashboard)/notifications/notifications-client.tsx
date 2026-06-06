"use client"

import { useState, useTransition, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  Bell, BellOff, Check, CheckCheck, Trash2,
  ChevronLeft, ChevronRight, Filter, Loader2,
  Info, AlertTriangle, CheckCircle2, Package,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { PageHeader } from "@/components/page-header"
import { EmptyState } from "@/components/empty-state"
import {
  markNotificationRead,
  markAllNotificationsRead,
  clearAllNotifications,
} from "@/lib/actions/notification.actions"
import { useToast } from "@/hooks/use-toast"
import { formatRelativeTime, cn } from "@/lib/utils"

// ─── Types ────────────────────────────────────────────────────────────────────

interface NotificationItem {
  id: string
  title: string
  message: string
  read: boolean
  createdAt: Date
}

interface Props {
  notifications: NotificationItem[]
  total: number
  unreadCount: number
  currentPage: number
  pageSize: number
  unreadOnly: boolean
}

// ─── Notification icon by keyword ─────────────────────────────────────────────

function NotifIcon({ title }: { title: string }) {
  const t = title.toLowerCase()
  if (t.includes("approv") || t.includes("po") || t.includes("purchase")) {
    return <Package className="w-4 h-4 text-green-600" />
  }
  if (t.includes("reject")) {
    return <AlertTriangle className="w-4 h-4 text-red-500" />
  }
  if (t.includes("invoice") || t.includes("paid")) {
    return <CheckCircle2 className="w-4 h-4 text-emerald-600" />
  }
  return <Info className="w-4 h-4 text-indigo-500" />
}

// ─── Single notification card ─────────────────────────────────────────────────

function NotifCard({
  notif,
  onMarkRead,
  isMarking,
}: {
  notif: NotificationItem
  onMarkRead: (id: string) => void
  isMarking: boolean
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
      className={cn(
        "flex items-start gap-4 px-5 py-4 rounded-2xl border transition-all",
        notif.read
          ? "bg-white border-gray-100 opacity-70"
          : "bg-indigo-50/50 border-indigo-100",
      )}
    >
      {/* Icon */}
      <div className={cn(
        "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5",
        notif.read ? "bg-gray-100" : "bg-white shadow-sm border border-indigo-100",
      )}>
        <NotifIcon title={notif.title} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={cn("text-sm font-semibold", notif.read ? "text-gray-600" : "text-gray-900")}>
            {notif.title}
          </p>
          {!notif.read && (
            <span className="shrink-0 w-2 h-2 rounded-full bg-indigo-500 mt-1.5" />
          )}
        </div>
        <p className="text-sm text-gray-500 mt-0.5 leading-relaxed">{notif.message}</p>
        <p className="text-xs text-gray-400 mt-1.5">{formatRelativeTime(notif.createdAt)}</p>
      </div>

      {/* Mark read */}
      {!notif.read && (
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7 shrink-0 text-indigo-500 hover:text-indigo-700 hover:bg-indigo-100"
          onClick={() => onMarkRead(notif.id)}
          disabled={isMarking}
          title="Mark as read"
        >
          {isMarking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
        </Button>
      )}
    </motion.div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function NotificationsClient({
  notifications, total, unreadCount, currentPage, pageSize, unreadOnly,
}: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()
  const [markingId, setMarkingId] = useState<string | null>(null)
  const [showClearDialog, setShowClearDialog] = useState(false)

  const totalPages = Math.ceil(total / pageSize)

  // Poll for new notifications every 10s
  useEffect(() => {
    const interval = setInterval(() => router.refresh(), 10_000)
    return () => clearInterval(interval)
  }, [router])

  const navigate = (page: number, unread?: boolean) => {
    const sp = new URLSearchParams({ page: String(page) })
    if (unread ?? unreadOnly) sp.set("unread", "true")
    router.push(`${pathname}?${sp}`)
  }

  const handleMarkRead = (id: string) => {
    setMarkingId(id)
    startTransition(async () => {
      await markNotificationRead(id)
      setMarkingId(null)
      router.refresh()
    })
  }

  const handleMarkAllRead = () => {
    startTransition(async () => {
      await markAllNotificationsRead()
      toast({ title: "All notifications marked as read" })
      router.refresh()
    })
  }

  const handleClearAll = () => {
    setShowClearDialog(false)
    startTransition(async () => {
      await clearAllNotifications()
      toast({ title: "All notifications cleared" })
      router.refresh()
    })
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        subtitle={`${unreadCount} unread`}
      >
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-gray-100 rounded-xl px-3 py-1.5">
            <Switch
              id="unread-only"
              checked={unreadOnly}
              onCheckedChange={(v) => navigate(1, v)}
            />
            <Label htmlFor="unread-only" className="text-xs font-medium text-gray-600 cursor-pointer">
              Unread only
            </Label>
          </div>
          {unreadCount > 0 && (
            <Button size="sm" variant="outline" onClick={handleMarkAllRead} disabled={isPending}>
              <CheckCheck className="w-3.5 h-3.5 mr-1.5" />
              Mark all read
            </Button>
          )}
          {total > 0 && (
            <Button
              size="sm"
              variant="outline"
              className="text-red-600 border-red-200 hover:bg-red-50"
              onClick={() => setShowClearDialog(true)}
              disabled={isPending}
            >
              <Trash2 className="w-3.5 h-3.5 mr-1.5" />
              Clear all
            </Button>
          )}
        </div>
      </PageHeader>

      {/* Unread count badge */}
      {unreadCount > 0 && (
        <div className="flex items-center gap-2 text-sm text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3">
          <Bell className="w-4 h-4 shrink-0" />
          You have <strong>{unreadCount}</strong> unread notification{unreadCount !== 1 ? "s" : ""}.
        </div>
      )}

      {/* List */}
      {notifications.length === 0 ? (
        <EmptyState
          icon={BellOff}
          title={unreadOnly ? "No unread notifications" : "No notifications yet"}
          description={unreadOnly ? "Toggle off the unread filter to see all." : "You'll be notified about RFQ assignments, approvals, and invoices."}
        />
      ) : (
        <div className="space-y-2">
          <AnimatePresence>
            {notifications.map((n) => (
              <NotifCard
                key={n.id}
                notif={n}
                onMarkRead={handleMarkRead}
                isMarking={markingId === n.id}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-sm text-gray-500">
            {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, total)} of {total}
          </p>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" disabled={currentPage <= 1} onClick={() => navigate(currentPage - 1)}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button size="sm" variant="outline" disabled={currentPage >= totalPages} onClick={() => navigate(currentPage + 1)}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Clear confirm */}
      <AlertDialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear all notifications?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all {total} notification{total !== 1 ? "s" : ""}. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleClearAll} className="bg-red-600 hover:bg-red-700">
              Clear All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
