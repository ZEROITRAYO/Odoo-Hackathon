"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { motion } from "framer-motion"
import { Eye, EyeOff, Loader2, Package2, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"

const signupSchema = z.object({
  firstName: z.string().min(2, "First name is too short"),
  lastName: z.string().min(2, "Last name is too short"),
  email: z.string().email("Enter a valid email"),
  phone: z.string().min(10, "Enter a valid phone number"),
  role: z.enum(["ADMIN", "PROCUREMENT_OFFICER", "MANAGER"], {
    required_error: "Select a role",
  }),
  country: z.string().min(2, "Enter your country"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
  additionalInfo: z.string().optional(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
})
type SignupForm = z.infer<typeof signupSchema>

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Admin",
  PROCUREMENT_OFFICER: "Procurement Officer",
  MANAGER: "Manager",
}

export default function SignupPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [showPass, setShowPass] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [done, setDone] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<SignupForm>({ resolver: zodResolver(signupSchema) })

  async function onSubmit(data: SignupForm) {
    setIsLoading(true)
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `${data.firstName} ${data.lastName}`,
          email: data.email,
          password: data.password,
          role: data.role,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Signup failed")
      }
      setDone(true)
    } catch (e: unknown) {
      toast({ title: "Signup failed", description: e instanceof Error ? e.message : "Please try again.", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8faf7] p-6">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center max-w-sm"
        >
          <div className="w-20 h-20 rounded-full bg-[#4ade80]/20 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-[#1a2e1a]" />
          </div>
          <h2 className="text-2xl font-bold text-[#1a2e1a] mb-2">Account created!</h2>
          <p className="text-gray-500 mb-8">Your account has been created successfully. You can now sign in.</p>
          <Button onClick={() => router.push("/login")} className="w-full bg-[#1a2e1a] text-white h-11 rounded-lg">
            Go to Login
          </Button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8faf7] p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-2xl"
      >
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 mb-6">
            <div className="w-9 h-9 rounded-xl bg-[#1a2e1a] flex items-center justify-center">
              <Package2 className="w-5 h-5 text-[#4ade80]" />
            </div>
            <span className="text-xl font-bold text-[#1a2e1a]">VendorBridge</span>
          </div>
          <h1 className="text-3xl font-bold text-[#1a2e1a] mb-2">Create your account</h1>
          <p className="text-gray-500">Join your procurement team on VendorBridge</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
          {/* Avatar placeholder */}
          <div className="flex justify-center mb-8">
            <div className="w-20 h-20 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors">
              <span className="text-xs text-gray-400 text-center leading-tight">Photo<br />(optional)</span>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Row 1 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="firstName" className="text-sm font-medium text-gray-700">First Name</Label>
                <Input id="firstName" placeholder="Rahul" className="h-11 rounded-lg border-gray-200" {...register("firstName")} />
                {errors.firstName && <p className="text-red-500 text-xs">{errors.firstName.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lastName" className="text-sm font-medium text-gray-700">Last Name</Label>
                <Input id="lastName" placeholder="Mehta" className="h-11 rounded-lg border-gray-200" {...register("lastName")} />
                {errors.lastName && <p className="text-red-500 text-xs">{errors.lastName.message}</p>}
              </div>
            </div>

            {/* Row 2 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email Address</Label>
                <Input id="email" type="email" placeholder="rahul@company.com" className="h-11 rounded-lg border-gray-200" {...register("email")} />
                {errors.email && <p className="text-red-500 text-xs">{errors.email.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone" className="text-sm font-medium text-gray-700">Phone Number</Label>
                <Input id="phone" placeholder="+91 98765 43210" className="h-11 rounded-lg border-gray-200" {...register("phone")} />
                {errors.phone && <p className="text-red-500 text-xs">{errors.phone.message}</p>}
              </div>
            </div>

            {/* Row 3 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-gray-700">Role (Admin, Officer…)</Label>
                <Select onValueChange={(v) => setValue("role", v as SignupForm["role"])}>
                  <SelectTrigger className="h-11 rounded-lg border-gray-200">
                    <SelectValue placeholder="Select your role" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(ROLE_LABELS).map(([val, label]) => (
                      <SelectItem key={val} value={val}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.role && <p className="text-red-500 text-xs">{errors.role.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="country" className="text-sm font-medium text-gray-700">Country</Label>
                <Input id="country" placeholder="India" className="h-11 rounded-lg border-gray-200" {...register("country")} />
                {errors.country && <p className="text-red-500 text-xs">{errors.country.message}</p>}
              </div>
            </div>

            {/* Row 4 — passwords */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPass ? "text" : "password"}
                    placeholder="Min. 8 characters"
                    className="h-11 pr-10 rounded-lg border-gray-200"
                    {...register("password")}
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-red-500 text-xs">{errors.password.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirm ? "text" : "password"}
                    placeholder="Repeat password"
                    className="h-11 pr-10 rounded-lg border-gray-200"
                    {...register("confirmPassword")}
                  />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="text-red-500 text-xs">{errors.confirmPassword.message}</p>}
              </div>
            </div>

            {/* Additional info */}
            <div className="space-y-1.5">
              <Label htmlFor="additionalInfo" className="text-sm font-medium text-gray-700">Additional Information (optional)</Label>
              <textarea
                id="additionalInfo"
                placeholder="Tell us about your role or department..."
                rows={3}
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a2e1a]/20 focus:border-[#1a2e1a] resize-none"
                {...register("additionalInfo")}
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 bg-[#1a2e1a] hover:bg-[#2d4d2d] text-white font-semibold rounded-lg"
            >
              {isLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating account…</> : "Register"}
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-gray-500">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-[#1a2e1a] hover:text-[#4ade80] transition-colors">Sign in</Link>
        </p>
      </motion.div>
    </div>
  )
}
