"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import {
  LayoutDashboard,
  Users,
  FileText,
  MessageSquare,
  CheckCircle,
  ShoppingCart,
  Receipt,
  BarChart3,
  Activity,
  Bell,
  ChevronLeft,
  Package2,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useUIStore } from "@/lib/store"
import { UserRole } from "@prisma/client"

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
  roles?: UserRole[]
}

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Vendors", href: "/vendors", icon: Users, roles: ["ADMIN", "PROCUREMENT_OFFICER"] },
  { label: "RFQs", href: "/rfqs", icon: FileText, roles: ["ADMIN", "PROCUREMENT_OFFICER"] },
  { label: "My RFQs", href: "/vendor/rfqs", icon: FileText, roles: ["VENDOR"] },
  { label: "Quotations", href: "/quotations", icon: MessageSquare, roles: ["ADMIN", "PROCUREMENT_OFFICER", "VENDOR"] },
  { label: "Approvals", href: "/manager/approvals", icon: CheckCircle, roles: ["ADMIN", "MANAGER"] },
  { label: "Purchase Orders", href: "/procurement/orders", icon: ShoppingCart, roles: ["ADMIN", "PROCUREMENT_OFFICER", "MANAGER"] },
  { label: "Invoices", href: "/invoices", icon: Receipt, roles: ["ADMIN", "PROCUREMENT_OFFICER", "VENDOR"] },
  { label: "Reports", href: "/reports", icon: BarChart3, roles: ["ADMIN", "PROCUREMENT_OFFICER", "MANAGER"] },
  { label: "Activity", href: "/logs", icon: Activity, roles: ["ADMIN"] },
]

interface SidebarProps {
  role?: UserRole
}

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname()
  const { sidebarOpen, setSidebarOpen } = useUIStore()

  const visible = navItems.filter((item) => {
    if (!item.roles) return true
    if (!role) return false
    return item.roles.includes(role)
  })

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-white border-r border-gray-100">
      {/* Logo */}
      <div className="flex items-center justify-between px-5 py-5 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#1a2e1a] flex items-center justify-center shrink-0">
            <Package2 className="w-4 h-4 text-[#4ade80]" />
          </div>
          <AnimatePresence>
            {sidebarOpen && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                className="font-bold text-[#1a2e1a] text-lg overflow-hidden whitespace-nowrap"
              >
                VendorBridge
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* Mobile close / desktop collapse */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="hidden lg:flex w-7 h-7 rounded-md items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <motion.div animate={{ rotate: sidebarOpen ? 0 : 180 }}>
            <ChevronLeft className="w-4 h-4" />
          </motion.div>
        </button>
        <button
          onClick={() => setSidebarOpen(false)}
          className="lg:hidden w-7 h-7 rounded-md flex items-center justify-center text-gray-400 hover:text-gray-600"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {visible.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/")
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => { if (window.innerWidth < 1024) setSidebarOpen(false) }}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group",
                active
                  ? "bg-[#1a2e1a] text-white"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <item.icon className={cn("w-4 h-4 shrink-0", active ? "text-[#4ade80]" : "text-gray-400 group-hover:text-gray-600")} />
              <AnimatePresence>
                {sidebarOpen && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    className="overflow-hidden whitespace-nowrap"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          )
        })}
      </nav>

      {/* Notifications link at bottom */}
      <div className="px-3 py-4 border-t border-gray-100">
        <Link
          href="/notifications"
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group",
            pathname === "/notifications"
              ? "bg-[#1a2e1a] text-white"
              : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
          )}
        >
          <Bell className={cn("w-4 h-4 shrink-0", pathname === "/notifications" ? "text-[#4ade80]" : "text-gray-400 group-hover:text-gray-600")} />
          <AnimatePresence>
            {sidebarOpen && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                className="overflow-hidden whitespace-nowrap"
              >
                Notifications
              </motion.span>
            )}
          </AnimatePresence>
        </Link>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <motion.aside
        animate={{ width: sidebarOpen ? 240 : 68 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="hidden lg:block shrink-0 h-screen sticky top-0 overflow-hidden z-30"
      >
        <SidebarContent />
      </motion.aside>

      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 bg-black/40 z-40 lg:hidden"
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed left-0 top-0 bottom-0 w-64 z-50 lg:hidden"
            >
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
