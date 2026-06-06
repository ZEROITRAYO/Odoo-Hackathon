"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import {
  User, Mail, Shield, Calendar, Activity,
  FileText, CheckCircle, Pencil, KeyRound, Loader2, Eye, EyeOff,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PageHeader } from "@/components/page-header"
import { useToast } from "@/hooks/use-toast"

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Administrator",
  PROCUREMENT_OFFICER: "Procurement Officer",
  MANAGER: "Manager",
  VENDOR: "Vendor",
}

const ROLE_COLORS: Record<string, string> = {
  ADMIN: "bg-red-100 text-red-700 border-red-200",
  PROCUREMENT_OFFICER: "bg-blue-100 text-blue-700 border-blue-200",
  MANAGER: "bg-purple-100 text-purple-700 border-purple-200",
  VENDOR: "bg-amber-100 text-amber-700 border-amber-200",
}

interface ProfileUser {
  id: string
  name: string
  email: string
  role: string
  status: string
  createdAt: Date
  _count: { rfqs: number; approvals: number; activityLogs: number }
}

interface Props {
  user: ProfileUser
}

export function ProfileClient({ user }: Props) {
  const router = useRouter()
  const { toast } = useToast()
  const [, startTransition] = useTransition()

  // Edit name state
  const [editingName, setEditingName] = useState(false)
  const [nameValue, setNameValue] = useState(user.name)
  const [savingName, setSavingName] = useState(false)

  // Change password state
  const [changingPassword, setChangingPassword] = useState(false)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)

  async function handleSaveName() {
    if (!nameValue.trim() || nameValue === user.name) {
      setEditingName(false)
      return
    }
    setSavingName(true)
    try {
      const res = await fetch("/api/profile/update-name", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: nameValue.trim() }),
      })
      if (res.ok) {
        toast({ title: "Name updated", description: "Your display name has been saved." })
        setEditingName(false)
        startTransition(() => router.refresh())
      } else {
        const data = await res.json()
        toast({ title: "Error", description: data.error ?? "Failed to update name", variant: "destructive" })
      }
    } catch {
      toast({ title: "Error", description: "Network error", variant: "destructive" })
    } finally {
      setSavingName(false)
    }
  }

  async function handleChangePassword() {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({ title: "All fields required", variant: "destructive" })
      return
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "Passwords don't match", variant: "destructive" })
      return
    }
    if (newPassword.length < 8) {
      toast({ title: "Password too short", description: "Must be at least 8 characters", variant: "destructive" })
      return
    }
    setSavingPassword(true)
    try {
      const res = await fetch("/api/profile/change-password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      if (res.ok) {
        toast({ title: "Password changed", description: "Your password has been updated." })
        setChangingPassword(false)
        setCurrentPassword("")
        setNewPassword("")
        setConfirmPassword("")
      } else {
        const data = await res.json()
        toast({ title: "Error", description: data.error ?? "Failed to change password", variant: "destructive" })
      }
    } catch {
      toast({ title: "Error", description: "Network error", variant: "destructive" })
    } finally {
      setSavingPassword(false)
    }
  }

  const initials = user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
  const joinedDate = new Date(user.createdAt).toLocaleDateString("en-IN", {
    day: "numeric", month: "long", year: "numeric",
  })

  const stats = [
    { icon: FileText, label: "RFQs Created", value: user._count.rfqs, color: "text-blue-600 bg-blue-50" },
    { icon: CheckCircle, label: "Approvals", value: user._count.approvals, color: "text-emerald-600 bg-emerald-50" },
    { icon: Activity, label: "Actions Logged", value: user._count.activityLogs, color: "text-purple-600 bg-purple-50" },
  ]

  return (
    <div className="space-y-6">
      <PageHeader title="Profile" subtitle="Manage your personal information and security" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left: Avatar + stats */}
        <div className="space-y-4">
          {/* Avatar card */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-gray-100 p-6 text-center"
          >
            <div className="w-20 h-20 rounded-2xl bg-[#1a2e1a] flex items-center justify-center mx-auto mb-4 ring-4 ring-[#4ade80]/20">
              <span className="text-2xl font-bold text-white">{initials}</span>
            </div>
            <h2 className="text-lg font-bold text-gray-900">{user.name}</h2>
            <p className="text-sm text-gray-400 mt-0.5">{user.email}</p>
            <span className={`inline-flex items-center mt-3 px-3 py-1 rounded-full text-xs font-semibold border ${ROLE_COLORS[user.role] ?? "bg-gray-100 text-gray-600 border-gray-200"}`}>
              {ROLE_LABELS[user.role] ?? user.role}
            </span>
            <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-center gap-1.5 text-xs text-gray-400">
              <Calendar className="w-3.5 h-3.5" />
              Joined {joinedDate}
            </div>
          </motion.div>

          {/* Stats */}
          <div className="space-y-2">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white rounded-xl border border-gray-100 px-4 py-3 flex items-center gap-3"
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${stat.color}`}>
                  <stat.icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-gray-400">{stat.label}</p>
                  <p className="text-lg font-bold text-gray-800 leading-tight">{stat.value}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Right: Edit forms */}
        <div className="lg:col-span-2 space-y-4">

          {/* Account info */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-white rounded-2xl border border-gray-100 p-6"
          >
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-semibold text-gray-900">Account Information</h3>
                <p className="text-xs text-gray-400 mt-0.5">Update your display name</p>
              </div>
              {!editingName && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 rounded-xl h-8 text-xs"
                  onClick={() => setEditingName(true)}
                >
                  <Pencil className="w-3.5 h-3.5" /> Edit
                </Button>
              )}
            </div>

            <div className="space-y-4">
              {/* Name */}
              <div>
                <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" /> Display Name
                </Label>
                {editingName ? (
                  <div className="flex gap-2">
                    <Input
                      value={nameValue}
                      onChange={(e) => setNameValue(e.target.value)}
                      className="h-10 rounded-xl border-gray-200"
                      placeholder="Your name"
                      autoFocus
                    />
                    <Button
                      size="sm"
                      onClick={handleSaveName}
                      disabled={savingName}
                      className="h-10 px-4 bg-[#1a2e1a] hover:bg-[#2d4d2d] text-white rounded-xl shrink-0"
                    >
                      {savingName ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Save"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => { setNameValue(user.name); setEditingName(false) }}
                      className="h-10 px-4 rounded-xl shrink-0"
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <div className="h-10 flex items-center px-3 rounded-xl bg-gray-50 text-sm text-gray-800 font-medium">
                    {user.name}
                  </div>
                )}
              </div>

              {/* Email (read-only) */}
              <div>
                <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" /> Email Address
                </Label>
                <div className="h-10 flex items-center gap-2 px-3 rounded-xl bg-gray-50 text-sm text-gray-500">
                  {user.email}
                  <span className="ml-auto text-[10px] bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded font-medium">Read-only</span>
                </div>
              </div>

              {/* Role (read-only) */}
              <div>
                <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5" /> Role
                </Label>
                <div className="h-10 flex items-center gap-2 px-3 rounded-xl bg-gray-50 text-sm text-gray-500">
                  {ROLE_LABELS[user.role] ?? user.role}
                  <span className="ml-auto text-[10px] bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded font-medium">Read-only</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Change password */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl border border-gray-100 p-6"
          >
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-semibold text-gray-900">Password & Security</h3>
                <p className="text-xs text-gray-400 mt-0.5">Change your account password</p>
              </div>
              {!changingPassword && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 rounded-xl h-8 text-xs"
                  onClick={() => setChangingPassword(true)}
                >
                  <KeyRound className="w-3.5 h-3.5" /> Change Password
                </Button>
              )}
            </div>

            {changingPassword ? (
              <div className="space-y-4">
                {[
                  { label: "Current Password", value: currentPassword, set: setCurrentPassword, show: showCurrent, toggle: () => setShowCurrent(v => !v) },
                  { label: "New Password", value: newPassword, set: setNewPassword, show: showNew, toggle: () => setShowNew(v => !v) },
                  { label: "Confirm New Password", value: confirmPassword, set: setConfirmPassword, show: showConfirm, toggle: () => setShowConfirm(v => !v) },
                ].map(({ label, value, set, show, toggle }) => (
                  <div key={label}>
                    <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">{label}</Label>
                    <div className="relative">
                      <Input
                        type={show ? "text" : "password"}
                        value={value}
                        onChange={(e) => set(e.target.value)}
                        className="h-10 rounded-xl border-gray-200 pr-10"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={toggle}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                ))}
                <div className="flex gap-2 pt-1">
                  <Button
                    onClick={handleChangePassword}
                    disabled={savingPassword}
                    className="bg-[#1a2e1a] hover:bg-[#2d4d2d] text-white rounded-xl h-10 px-5"
                  >
                    {savingPassword ? <><Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> Saving…</> : "Update Password"}
                  </Button>
                  <Button
                    variant="outline"
                    className="rounded-xl h-10 px-5"
                    onClick={() => {
                      setChangingPassword(false)
                      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("")
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="h-10 flex items-center px-3 rounded-xl bg-gray-50 text-sm text-gray-400">
                ••••••••••••
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  )
}
