import { cn } from "@/lib/utils"
import type { LucideIcon } from "lucide-react"

interface StatCardProps {
  label: string
  value: string | number
  icon: LucideIcon
  trend?: { value: number; label: string }
  accent?: string
  className?: string
}

export function StatCard({ label, value, icon: Icon, trend, accent = "#1a2e1a", className }: StatCardProps) {
  return (
    <div className={cn("bg-white rounded-2xl border border-gray-100 p-6 flex items-start justify-between", className)}>
      <div className="space-y-1">
        <p className="text-sm text-gray-500 font-medium">{label}</p>
        <p className="text-3xl font-bold text-gray-900">{value}</p>
        {trend && (
          <p className={cn("text-xs font-medium", trend.value >= 0 ? "text-emerald-600" : "text-red-500")}>
            {trend.value >= 0 ? "↑" : "↓"} {Math.abs(trend.value)}% {trend.label}
          </p>
        )}
      </div>
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
        style={{ backgroundColor: `${accent}15` }}
      >
        <Icon className="w-5 h-5" style={{ color: accent }} />
      </div>
    </div>
  )
}
