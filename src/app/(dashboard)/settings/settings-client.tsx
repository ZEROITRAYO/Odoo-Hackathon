"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import {
  Palette, Bell, Globe, Shield, Monitor, Sun, Moon,
  Check, ChevronRight, Volume2, VolumeX, Eye, EyeOff,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { PageHeader } from "@/components/page-header"
import { useUIStore } from "@/lib/store"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

interface Props {
  userRole: string
  userName: string
  userEmail: string
}

const THEME_OPTIONS = [
  { value: "light", label: "Light", icon: Sun, description: "Clean bright interface" },
  { value: "dark", label: "Dark", icon: Moon, description: "Easy on the eyes" },
  { value: "system", label: "System", icon: Monitor, description: "Follows OS setting" },
] as const

type ThemeValue = "light" | "dark" | "system"

const SECTION_ANIMATION = (delay: number) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { delay },
})

function SettingRow({
  label,
  description,
  children,
  border = true,
}: {
  label: string
  description?: string
  children: React.ReactNode
  border?: boolean
}) {
  return (
    <div className={cn("flex items-center justify-between py-4 gap-4", border && "border-b border-gray-50 last:border-0")}>
      <div className="min-w-0">
        <p className="text-sm font-medium text-gray-800">{label}</p>
        {description && <p className="text-xs text-gray-400 mt-0.5">{description}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}

export function SettingsClient({ userRole, userName, userEmail }: Props) {
  const { theme, setTheme } = useUIStore()
  const { toast } = useToast()
  const router = useRouter()

  // Notification preferences (stored locally — no DB column for these)
  const [notifRFQ, setNotifRFQ] = useState(true)
  const [notifQuotation, setNotifQuotation] = useState(true)
  const [notifApproval, setNotifApproval] = useState(true)
  const [notifInvoice, setNotifInvoice] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(false)

  // Display preferences
  const [dateFormat, setDateFormat] = useState("en-IN")
  const [currency, setCurrency] = useState("INR")
  const [compactMode, setCompactMode] = useState(false)
  const [showAvatarInitials, setShowAvatarInitials] = useState(true)

  function handleThemeChange(val: ThemeValue) {
    setTheme(val)
    toast({ title: `Theme set to ${val}`, description: "Your preference has been applied." })
  }

  function handleSaveNotifications() {
    toast({ title: "Notification preferences saved" })
  }

  function handleSaveDisplay() {
    toast({ title: "Display preferences saved" })
  }

  const sections = [
    {
      id: "appearance",
      icon: Palette,
      title: "Appearance",
      subtitle: "Customize how VendorBridge looks",
      color: "text-purple-600 bg-purple-50",
    },
    {
      id: "notifications",
      icon: Bell,
      title: "Notifications",
      subtitle: "Control what alerts you receive",
      color: "text-blue-600 bg-blue-50",
    },
    {
      id: "display",
      icon: Globe,
      title: "Display & Locale",
      subtitle: "Date format, currency, and layout",
      color: "text-emerald-600 bg-emerald-50",
    },
    {
      id: "privacy",
      icon: Shield,
      title: "Privacy & Security",
      subtitle: "Manage your account security",
      color: "text-orange-600 bg-orange-50",
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" subtitle="Configure your VendorBridge experience" />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

        {/* Sidebar nav */}
        <div className="lg:col-span-1">
          <nav className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            {sections.map((s, i) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 text-sm transition-colors hover:bg-gray-50",
                  i < sections.length - 1 && "border-b border-gray-50"
                )}
              >
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${s.color}`}>
                  <s.icon className="w-3.5 h-3.5" />
                </div>
                <span className="font-medium text-gray-700">{s.title}</span>
                <ChevronRight className="w-3.5 h-3.5 text-gray-300 ml-auto" />
              </a>
            ))}
          </nav>
        </div>

        {/* Main content */}
        <div className="lg:col-span-3 space-y-5">

          {/* Appearance */}
          <motion.div {...SECTION_ANIMATION(0)} id="appearance" className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 rounded-xl bg-purple-50 flex items-center justify-center">
                <Palette className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Appearance</h3>
                <p className="text-xs text-gray-400">Choose your preferred theme</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {THEME_OPTIONS.map(({ value, label, icon: Icon, description }) => {
                const isActive = theme === value
                return (
                  <button
                    key={value}
                    onClick={() => handleThemeChange(value)}
                    className={cn(
                      "relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all text-center",
                      isActive
                        ? "border-[#1a2e1a] bg-[#1a2e1a]/5"
                        : "border-gray-100 hover:border-gray-200 bg-gray-50/50"
                    )}
                  >
                    {isActive && (
                      <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-[#1a2e1a] flex items-center justify-center">
                        <Check className="w-2.5 h-2.5 text-white" />
                      </div>
                    )}
                    <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", isActive ? "bg-[#1a2e1a] text-white" : "bg-white text-gray-500 border border-gray-200")}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className={cn("text-sm font-semibold", isActive ? "text-[#1a2e1a]" : "text-gray-700")}>{label}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{description}</p>
                    </div>
                  </button>
                )
              })}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-50">
              <SettingRow label="Compact mode" description="Reduce spacing for more content on screen" border={false}>
                <Switch checked={compactMode} onCheckedChange={setCompactMode} />
              </SettingRow>
            </div>
          </motion.div>

          {/* Notifications */}
          <motion.div {...SECTION_ANIMATION(0.05)} id="notifications" className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center">
                <Bell className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Notifications</h3>
                <p className="text-xs text-gray-400">Manage in-app notification alerts</p>
              </div>
            </div>

            <div>
              <SettingRow label="RFQ updates" description="New RFQ assignments and status changes">
                <Switch checked={notifRFQ} onCheckedChange={setNotifRFQ} />
              </SettingRow>
              <SettingRow label="Quotation activity" description="When vendors submit or update quotations">
                <Switch checked={notifQuotation} onCheckedChange={setNotifQuotation} />
              </SettingRow>
              <SettingRow label="Approval decisions" description="Manager approvals and rejections">
                <Switch checked={notifApproval} onCheckedChange={setNotifApproval} />
              </SettingRow>
              <SettingRow label="Invoice notifications" description="New invoices and payment status">
                <Switch checked={notifInvoice} onCheckedChange={setNotifInvoice} />
              </SettingRow>
              <SettingRow label="Sound alerts" description="Play a sound for new notifications" border={false}>
                <div className="flex items-center gap-2">
                  {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-gray-400" /> : <VolumeX className="w-3.5 h-3.5 text-gray-400" />}
                  <Switch checked={soundEnabled} onCheckedChange={setSoundEnabled} />
                </div>
              </SettingRow>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-50 flex justify-end">
              <Button
                size="sm"
                onClick={handleSaveNotifications}
                className="bg-[#1a2e1a] hover:bg-[#2d4d2d] text-white rounded-xl h-9 px-4"
              >
                Save Preferences
              </Button>
            </div>
          </motion.div>

          {/* Display & Locale */}
          <motion.div {...SECTION_ANIMATION(0.1)} id="display" className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center">
                <Globe className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Display & Locale</h3>
                <p className="text-xs text-gray-400">Regional and layout preferences</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Date Format</Label>
                  <Select value={dateFormat} onValueChange={setDateFormat}>
                    <SelectTrigger className="h-10 rounded-xl border-gray-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en-IN">DD/MM/YYYY (India)</SelectItem>
                      <SelectItem value="en-US">MM/DD/YYYY (US)</SelectItem>
                      <SelectItem value="en-GB">DD/MM/YYYY (UK)</SelectItem>
                      <SelectItem value="ISO">YYYY-MM-DD (ISO)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Currency Display</Label>
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger className="h-10 rounded-xl border-gray-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INR">₹ Indian Rupee (INR)</SelectItem>
                      <SelectItem value="USD">$ US Dollar (USD)</SelectItem>
                      <SelectItem value="EUR">€ Euro (EUR)</SelectItem>
                      <SelectItem value="GBP">£ British Pound (GBP)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <SettingRow label="Show avatar initials" description="Display your initials in the top navigation" border={false}>
                <div className="flex items-center gap-2">
                  {showAvatarInitials ? <Eye className="w-3.5 h-3.5 text-gray-400" /> : <EyeOff className="w-3.5 h-3.5 text-gray-400" />}
                  <Switch checked={showAvatarInitials} onCheckedChange={setShowAvatarInitials} />
                </div>
              </SettingRow>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-50 flex justify-end">
              <Button
                size="sm"
                onClick={handleSaveDisplay}
                className="bg-[#1a2e1a] hover:bg-[#2d4d2d] text-white rounded-xl h-9 px-4"
              >
                Save Preferences
              </Button>
            </div>
          </motion.div>

          {/* Privacy & Security */}
          <motion.div {...SECTION_ANIMATION(0.15)} id="privacy" className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 rounded-xl bg-orange-50 flex items-center justify-center">
                <Shield className="w-4 h-4 text-orange-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Privacy & Security</h3>
                <p className="text-xs text-gray-400">Account security settings</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 border border-gray-100">
                <div>
                  <p className="text-sm font-medium text-gray-800">Account role</p>
                  <p className="text-xs text-gray-400 mt-0.5">Contact your administrator to change roles</p>
                </div>
                <span className="text-xs font-semibold bg-white border border-gray-200 text-gray-600 px-3 py-1 rounded-full">
                  {userRole.replace("_", " ")}
                </span>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 border border-gray-100">
                <div>
                  <p className="text-sm font-medium text-gray-800">Change password</p>
                  <p className="text-xs text-gray-400 mt-0.5">Update your login credentials</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-xl h-8 text-xs"
                  onClick={() => router.push("/profile")}
                >
                  Go to Profile
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-red-50 border border-red-100">
                <div>
                  <p className="text-sm font-medium text-red-700">Session management</p>
                  <p className="text-xs text-red-400 mt-0.5">You are currently signed in as {userEmail}</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-xl h-8 text-xs border-red-200 text-red-600 hover:bg-red-50"
                  onClick={() => router.push("/profile")}
                >
                  Manage
                </Button>
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  )
}
