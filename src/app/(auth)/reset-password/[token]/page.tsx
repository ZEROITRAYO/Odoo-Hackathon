"use client"

import { useState } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { motion } from "framer-motion"
import { Eye, EyeOff, Loader2, Lock, Package2, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { resetPassword } from "@/lib/actions"

const schema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
})
type Form = z.infer<typeof schema>

export default function ResetPasswordPage() {
  const params = useParams()
  const token = params?.token as string
  const router = useRouter()
  const { toast } = useToast()
  const [showPass, setShowPass] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [done, setDone] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<Form>({
    resolver: zodResolver(schema),
  })

  async function onSubmit(data: Form) {
    setIsLoading(true)
    try {
      const result = await resetPassword(token, data.password)
      if (result?.error) throw new Error(result.error)
      setDone(true)
      setTimeout(() => router.push("/login"), 3000)
    } catch (e: unknown) {
      toast({
        title: "Reset failed",
        description: e instanceof Error ? e.message : "The link may have expired.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8faf7] p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="flex items-center gap-2 mb-12">
          <div className="w-9 h-9 rounded-xl bg-[#1a2e1a] flex items-center justify-center">
            <Package2 className="w-5 h-5 text-[#4ade80]" />
          </div>
          <span className="text-xl font-bold text-[#1a2e1a]">VendorBridge</span>
        </div>

        {!done ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
            <div className="w-14 h-14 rounded-2xl bg-[#1a2e1a]/5 flex items-center justify-center mb-6">
              <Lock className="w-7 h-7 text-[#1a2e1a]" />
            </div>
            <h1 className="text-2xl font-bold text-[#1a2e1a] mb-2">Set new password</h1>
            <p className="text-gray-500 text-sm mb-8">
              Choose a strong password that you haven&apos;t used before.
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">New password</Label>
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
                <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">Confirm new password</Label>
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

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 bg-[#1a2e1a] hover:bg-[#2d4d2d] text-white font-semibold rounded-lg"
              >
                {isLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Resetting…</> : "Reset password"}
              </Button>
            </form>
          </div>
        ) : (
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center"
          >
            <div className="w-16 h-16 rounded-full bg-[#4ade80]/20 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-8 h-8 text-[#1a2e1a]" />
            </div>
            <h2 className="text-2xl font-bold text-[#1a2e1a] mb-2">Password reset!</h2>
            <p className="text-gray-500 text-sm">Your password has been updated. Redirecting you to login…</p>
          </motion.div>
        )}

        <div className="mt-6 text-center">
          <Link href="/login" className="text-sm text-gray-500 hover:text-[#1a2e1a] transition-colors">
            Back to sign in
          </Link>
        </div>
      </motion.div>
    </div>
  )
}
