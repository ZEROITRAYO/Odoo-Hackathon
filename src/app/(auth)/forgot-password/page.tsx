"use client"

import { useState } from "react"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { motion } from "framer-motion"
import { ArrowLeft, Loader2, Mail, Package2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { requestPasswordReset } from "@/lib/actions"

const schema = z.object({
  email: z.string().email("Enter a valid email address"),
})
type Form = z.infer<typeof schema>

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const { register, handleSubmit, formState: { errors }, getValues } = useForm<Form>({
    resolver: zodResolver(schema),
  })

  async function onSubmit(data: Form) {
    setIsLoading(true)
    try {
      await requestPasswordReset(data.email)
      setSubmitted(true)
    } catch {
      // always show success to prevent email enumeration
      setSubmitted(true)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8faf7] p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="flex items-center gap-2 mb-12">
          <div className="w-9 h-9 rounded-xl bg-[#1a2e1a] flex items-center justify-center">
            <Package2 className="w-5 h-5 text-[#4ade80]" />
          </div>
          <span className="text-xl font-bold text-[#1a2e1a]">VendorBridge</span>
        </div>

        {!submitted ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
            <div className="w-14 h-14 rounded-2xl bg-[#1a2e1a]/5 flex items-center justify-center mb-6">
              <Mail className="w-7 h-7 text-[#1a2e1a]" />
            </div>
            <h1 className="text-2xl font-bold text-[#1a2e1a] mb-2">Forgot your password?</h1>
            <p className="text-gray-500 text-sm mb-8">
              No worries. Enter your email address and we&apos;ll send you a link to reset your password.
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@company.com"
                  className="h-11 rounded-lg border-gray-200 focus:border-[#1a2e1a]"
                  {...register("email")}
                />
                {errors.email && <p className="text-red-500 text-xs">{errors.email.message}</p>}
              </div>
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 bg-[#1a2e1a] hover:bg-[#2d4d2d] text-white font-semibold rounded-lg"
              >
                {isLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending…</> : "Send reset link"}
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
              <Mail className="w-8 h-8 text-[#1a2e1a]" />
            </div>
            <h2 className="text-2xl font-bold text-[#1a2e1a] mb-3">Check your inbox</h2>
            <p className="text-gray-500 text-sm leading-relaxed mb-2">
              If an account exists for <strong>{getValues("email")}</strong>, we&apos;ve sent a password reset link.
            </p>
            <p className="text-gray-400 text-xs">The link expires in 1 hour. Check your spam folder if you don&apos;t see it.</p>
          </motion.div>
        )}

        <div className="mt-6 text-center">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#1a2e1a] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to sign in
          </Link>
        </div>
      </motion.div>
    </div>
  )
}
