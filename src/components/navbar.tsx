"use client"

import { signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { Menu, Bell, Sun, Moon, Monitor, LogOut, User, Settings, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useUIStore } from "@/lib/store"

const ROLE_BADGE_COLOR: Record<string, string> = {
  ADMIN: "bg-red-100 text-red-700",
  PROCUREMENT_OFFICER: "bg-blue-100 text-blue-700",
  MANAGER: "bg-purple-100 text-purple-700",
  VENDOR: "bg-amber-100 text-amber-700",
}

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Admin",
  PROCUREMENT_OFFICER: "Procurement Officer",
  MANAGER: "Manager",
  VENDOR: "Vendor",
}

const THEME_ICONS = {
  light: Sun,
  dark: Moon,
  system: Monitor,
}

interface NavbarProps {
  name?: string
  email?: string
  role?: string
}

export function Navbar({ name = "User", email, role }: NavbarProps) {
  const router = useRouter()
  const { setSidebarOpen, sidebarOpen, theme, setTheme, unreadCount } = useUIStore()

  const initials = name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
  const ThemeIcon = THEME_ICONS[theme as keyof typeof THEME_ICONS] ?? Monitor

  return (
    <header className="h-16 flex items-center justify-between px-5 border-b border-gray-100 bg-white/80 backdrop-blur-sm sticky top-0 z-20">
      {/* Left: hamburger */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div id="navbar-title" />
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-2">
        {/* Theme toggle */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="w-9 h-9 text-gray-500 hover:text-gray-700">
              <ThemeIcon className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-36">
            <DropdownMenuLabel className="text-xs text-gray-400">Theme</DropdownMenuLabel>
            {(["light", "dark", "system"] as const).map((t) => {
              const Icon = THEME_ICONS[t]
              return (
                <DropdownMenuItem
                  key={t}
                  onClick={() => setTheme(t)}
                  className={`gap-2 capitalize text-sm ${theme === t ? "font-semibold text-[#1a2e1a]" : ""}`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {t}
                </DropdownMenuItem>
              )
            })}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Notifications */}
        <Link href="/notifications" className="relative">
          <Button variant="ghost" size="icon" className="w-9 h-9 text-gray-500 hover:text-gray-700">
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center"
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </motion.span>
            )}
          </Button>
        </Link>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2.5 ml-1 pl-3 border-l border-gray-100 hover:opacity-80 transition-opacity">
              <Avatar className="w-8 h-8 ring-2 ring-[#4ade80]/30">
                <AvatarFallback className="text-xs font-bold bg-[#1a2e1a] text-white">{initials}</AvatarFallback>
              </Avatar>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-semibold text-gray-800 leading-tight">{name}</p>
                {role && (
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${ROLE_BADGE_COLOR[role] ?? "bg-gray-100 text-gray-600"}`}>
                    {ROLE_LABELS[role] ?? role}
                  </span>
                )}
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400 hidden sm:block" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel>
              <p className="font-semibold text-sm">{name}</p>
              <p className="text-xs text-gray-400 font-normal">{email}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem className="gap-2 text-sm" onClick={() => router.push("/profile")}>
                <User className="w-3.5 h-3.5 text-gray-400" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2 text-sm" onClick={() => router.push("/settings")}>
                <Settings className="w-3.5 h-3.5 text-gray-400" />
                Settings
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="gap-2 text-sm text-red-600 focus:text-red-600 focus:bg-red-50"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
