"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { signIn } from "next-auth/react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { motion } from "framer-motion"
import { Eye, EyeOff, Loader2, Package2, ShieldCheck, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"

const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional(),
})
type LoginForm = z.infer<typeof loginSchema>

const features = [
  { icon: Package2, label: "Vendor Management", desc: "Centralise supplier profiles and performance" },
  { icon: ShieldCheck, label: "Approval Workflows", desc: "Multi-level approval chains with SLA tracking" },
  { icon: TrendingUp, label: "Procurement Analytics", desc: "Real-time spend insights and trend reports" },
]

export default function LoginPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) })

  const rememberMe = watch("rememberMe")

  async function onSubmit(data: LoginForm) {
    setIsLoading(true)
    try {
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      })
      if (result?.error) {
        toast({ title: "Login failed", description: "Invalid email or password.", variant: "destructive" })
      } else {
        router.push("/dashboard")
        router.refresh()
      }
    } catch {
      toast({ title: "Something went wrong", description: "Please try again.", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex bg-[#f8faf7]">
      {/* Left panel — branding */}
      <motion.div
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="hidden lg:flex flex-col justify-between w-[480px] shrink-0 bg-[#1a2e1a] text-white p-12"
      >
        <div>
          <div className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 rounded-xl bg-[#4ade80] flex items-center justify-center">
              <Package2 className="w-5 h-5 text-[#1a2e1a]" />
            </div>
            <span className="text-2xl font-bold tracking-tight">VendorBridge</span>
          </div>
          <h1 className="text-4xl font-bold leading-tight mb-4">
            Procurement.<br />
            <span className="text-[#4ade80]">Simplified.</span>
          </h1>
          <p className="text-white/60 text-lg leading-relaxed">
            Manage vendors, RFQs, approvals and purchase orders from one unified platform.
          </p>
        </div>

        <div className="space-y-6">
          {features.map((f, i) => (
            <motion.div
              key={f.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.1 }}
              className="flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-white/10"
            >
              <div className="w-9 h-9 rounded-lg bg-[#4ade80]/20 flex items-center justify-center shrink-0">
                <f.icon className="w-4 h-4 text-[#4ade80]" />
              </div>
              <div>
                <p className="font-semibold text-sm">{f.label}</p>
                <p className="text-white/50 text-xs mt-0.5">{f.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <p className="text-white/30 text-sm">© 2025 VendorBridge. All rights reserved.</p>
      </motion.div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="w-full max-w-md"
        >
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-10 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-[#1a2e1a] flex items-center justify-center">
              <Package2 className="w-4 h-4 text-[#4ade80]" />
            </div>
            <span className="text-xl font-bold text-[#1a2e1a]">VendorBridge</span>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-bold text-[#1a2e1a] mb-1">Welcome back</h2>
            <p className="text-gray-500">Sign in to your account to continue</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email address</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@company.com"
                autoComplete="email"
                className="h-11 border-gray-200 focus:border-[#1a2e1a] focus:ring-[#1a2e1a]/10 rounded-lg"
                {...register("email")}
              />
              {errors.email && <p className="text-red-500 text-xs">{errors.email.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm font-medium text-gray-700">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="h-11 pr-11 border-gray-200 focus:border-[#1a2e1a] focus:ring-[#1a2e1a]/10 rounded-lg"
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs">{errors.password.message}</p>}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="rememberMe"
                  checked={!!rememberMe}
                  onCheckedChange={(v) => setValue("rememberMe", !!v)}
                  className="border-gray-300 data-[state=checked]:bg-[#1a2e1a] data-[state=checked]:border-[#1a2e1a]"
                />
                <Label htmlFor="rememberMe" className="text-sm text-gray-600 cursor-pointer">Remember me</Label>
              </div>
              <Link href="/forgot-password" className="text-sm font-medium text-[#1a2e1a] hover:text-[#4ade80] transition-colors">
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 bg-[#1a2e1a] hover:bg-[#2d4d2d] text-white font-semibold rounded-lg transition-colors"
            >
              {isLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Signing in…</> : "Sign in"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="font-semibold text-[#1a2e1a] hover:text-[#4ade80] transition-colors">
              Create account
            </Link>
          </p>

          {/* Demo credentials */}
          <div className="mt-8 p-4 rounded-xl bg-[#1a2e1a]/5 border border-[#1a2e1a]/10">
            <p className="text-xs font-semibold text-[#1a2e1a] mb-2 uppercase tracking-wide">Demo credentials</p>
            <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
              <div><span className="font-medium">Admin:</span> admin@vendorbridge.com</div>
              <div><span className="font-medium">Manager:</span> manager@vendorbridge.com</div>
              <div><span className="font-medium">Procurement:</span> procurement@vendorbridge.com</div>
              <div><span className="font-medium">Vendor:</span> vendor@vendorbridge.com</div>
            </div>
            <p className="text-xs text-gray-400 mt-1.5">All use password: <code className="font-mono">password123</code></p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
