// src/lib/utils.ts

import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { db } from "@/lib/db"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ─────────────────────────────────────────────────────────────
// ERP NUMBER GENERATORS
// ─────────────────────────────────────────────────────────────

function extractSequence(value: string): number {
  const parts = value.split("-")
  const lastPart = parts[parts.length - 1]
  return Number(lastPart) || 0
}

export async function generateRFQNumber(): Promise<string> {
  const year = new Date().getFullYear()

  const latest = await db.rFQ.findFirst({
    orderBy: {
      createdAt: "desc",
    },
    select: {
      rfqNumber: true,
    },
  })

  const next = latest?.rfqNumber
    ? extractSequence(latest.rfqNumber) + 1
    : 1

  return `RFQ-${year}-${String(next).padStart(4, "0")}`
}

export async function generateQuotationNumber(): Promise<string> {
  const year = new Date().getFullYear()

  const latest = await db.quotation.findFirst({
    orderBy: {
      submittedAt: "desc",
    },
    select: {
      quotationNumber: true,
    },
  })

  const next = latest?.quotationNumber
    ? extractSequence(latest.quotationNumber) + 1
    : 1

  return `QT-${year}-${String(next).padStart(4, "0")}`
}

export async function generatePONumber(): Promise<string> {
  const year = new Date().getFullYear()

  const latest = await db.purchaseOrder.findFirst({
    orderBy: {
      generatedAt: "desc",
    },
    select: {
      poNumber: true,
    },
  })

  const next = latest?.poNumber
    ? extractSequence(latest.poNumber) + 1
    : 1

  return `PO-${year}-${String(next).padStart(4, "0")}`
}

export async function generateInvoiceNumber(): Promise<string> {
  const year = new Date().getFullYear()

  const latest = await db.invoice.findFirst({
    orderBy: {
      generatedAt: "desc",
    },
    select: {
      invoiceNumber: true,
    },
  })

  const next = latest?.invoiceNumber
    ? extractSequence(latest.invoiceNumber) + 1
    : 1

  return `INV-${year}-${String(next).padStart(4, "0")}`
}

export async function generateVendorCode(): Promise<string> {
  const latest = await db.vendor.findFirst({
    orderBy: {
      createdAt: "desc",
    },
    select: {
      vendorCode: true,
    },
  })

  const next = latest?.vendorCode
    ? extractSequence(latest.vendorCode) + 1
    : 1

  return `VEN-${String(next).padStart(3, "0")}`
}

// ─────────────────────────────────────────────────────────────
// ACTIVITY LOGGER
// NOTE:
// Ensure ActivityLog model contains:
// metadata Json?
// ─────────────────────────────────────────────────────────────

export async function logActivity({
  userId,
  action,
  entityType,
  entityId,
  metadata,
}: {
  userId: string
  action: string
  entityType: string
  entityId: string
  metadata?: Record<string, unknown>
}) {
  await db.activityLog.create({
    data: {
      userId,
      action,
      entityType,
      entityId,
      metadata,
    },
  })
}

// ─────────────────────────────────────────────────────────────
// NOTIFICATIONS
// ─────────────────────────────────────────────────────────────

export async function createNotification({
  userId,
  title,
  message,
}: {
  userId: string
  title: string
  message: string
}) {
  await db.notification.create({
    data: {
      userId,
      title,
      message,
    },
  })
}

// ─────────────────────────────────────────────────────────────
// FORMATTERS
// ─────────────────────────────────────────────────────────────

export function formatCurrency(
  amount: number,
  currency = "INR"
): string {
  if (currency === "INR") {
    if (amount >= 10_00_000) {
      return `₹${(amount / 10_00_000).toFixed(1)}L`
    }

    if (amount >= 1_000) {
      return `₹${(amount / 1_000).toFixed(1)}k`
    }

    return `₹${amount.toLocaleString("en-IN")}`
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount)
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date))
}

export function formatDateTime(date: Date | string): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date))
}

export function formatRelativeTime(date: Date): string {
  const diff = Date.now() - date.getTime()

  const secs = Math.floor(diff / 1000)

  if (secs < 60) return "just now"

  const mins = Math.floor(secs / 60)

  if (mins < 60) return `${mins}m ago`

  const hrs = Math.floor(mins / 60)

  if (hrs < 24) return `${hrs}h ago`

  const days = Math.floor(hrs / 24)

  if (days < 7) return `${days}d ago`

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  })
}

// ─────────────────────────────────────────────────────────────
// DEADLINES
// ─────────────────────────────────────────────────────────────

export function isDeadlinePassed(
  deadline: Date | string
): boolean {
  return new Date(deadline) < new Date()
}

export function daysUntilDeadline(
  deadline: Date | string
): number {
  const diff = new Date(deadline).getTime() - Date.now()

  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

// ─────────────────────────────────────────────────────────────
// AI VENDOR RECOMMENDATION
// ─────────────────────────────────────────────────────────────

export function calculateVendorScore(
  quotation: {
    price: number
    deliveryDays: number
    vendorRating: number
  },
  allPrices: number[]
): number {
  const minPrice = Math.min(...allPrices)
  const maxPrice = Math.max(...allPrices)

  const priceScore =
    maxPrice === minPrice
      ? 1
      : 1 -
        (quotation.price - minPrice) /
          (maxPrice - minPrice)

  const ratingScore = quotation.vendorRating / 5

  const deliveryScore = Math.max(
    0,
    1 - quotation.deliveryDays / 30
  )

  return (
    priceScore * 0.6 +
    ratingScore * 0.25 +
    deliveryScore * 0.15
  )
}

// ─────────────────────────────────────────────────────────────
// GST CALCULATOR
// ─────────────────────────────────────────────────────────────

export function calculateGST(
  subtotal: number,
  gstPercent = 18
) {
  const tax = subtotal * (gstPercent / 100)

  const cgst = tax / 2
  const sgst = tax / 2

  return {
    subtotal,
    tax,
    cgst,
    sgst,
    total: subtotal + tax,
  }
}