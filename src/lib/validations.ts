// src/lib/validations.ts
import { z } from 'zod'

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Must contain at least one number'),
  confirmPassword: z.string(),
  role: z.enum(['ADMIN', 'PROCUREMENT_OFFICER', 'MANAGER']),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
})

export const resetPasswordSchema = z.object({
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Must contain at least one number'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

// ─── Vendor ───────────────────────────────────────────────────────────────────

export const vendorSchema = z.object({
  companyName: z.string().min(2, 'Company name is required').max(200),
  gstNumber: z.string()
    .min(15, 'GST number must be 15 characters')
    .max(15, 'GST number must be 15 characters')
    .regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Invalid GST number format'),
  category: z.string().min(1, 'Category is required'),
  contactPerson: z.string().min(2, 'Contact person name is required'),
  phone: z.string()
    .min(10, 'Phone number must be at least 10 digits')
    .regex(/^[+]?[\d\s-]{10,}$/, 'Invalid phone number'),
  email: z.string().email('Invalid email address'),
  address: z.string().min(10, 'Address is required'),
  status: z.enum(['ACTIVE', 'PENDING', 'BLOCKED']).optional(),
})

export type VendorFormData = z.infer<typeof vendorSchema>

// ─── RFQ ──────────────────────────────────────────────────────────────────────

export const rfqSchema = z.object({
  title: z.string().min(3, 'Title is required').max(200),
  description: z.string().max(2000).optional(),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  deadline: z.string().refine((val) => new Date(val) > new Date(), {
    message: 'Deadline must be in the future',
  }),
  attachmentUrl: z.string().url().optional().or(z.literal('')),
  vendorIds: z.array(z.string()).min(1, 'Select at least one vendor'),
  status: z.enum(['DRAFT', 'OPEN']).optional(),
})

export type RFQFormData = z.infer<typeof rfqSchema>

// ─── Quotation ────────────────────────────────────────────────────────────────

export const quotationSchema = z.object({
  rfqId: z.string().min(1),
  price: z.number().min(1, 'Price must be greater than 0'),
  deliveryDays: z.number().min(1, 'Delivery days must be at least 1').max(365),
  notes: z.string().max(1000).optional(),
  status: z.enum(['DRAFT', 'SUBMITTED']).optional(),
})

export type QuotationFormData = z.infer<typeof quotationSchema>

// ─── Approval ─────────────────────────────────────────────────────────────────

export const approvalSchema = z.object({
  quotationId: z.string().min(1),
  remarks: z.string().max(500).optional(),
  action: z.enum(['APPROVE', 'REJECT']),
})

export type ApprovalFormData = z.infer<typeof approvalSchema>

// ─── Invoice Email ─────────────────────────────────────────────────────────────

export const emailInvoiceSchema = z.object({
  invoiceId: z.string().min(1),
  recipientEmail: z.string().email().optional(),
  message: z.string().max(500).optional(),
})
