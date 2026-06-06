<div align="center">

# VendorBridge

**End-to-end procurement & vendor management platform**

[![Next.js](https://img.shields.io/badge/Next.js_15-black?style=flat-square&logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat-square&logo=postgresql&logoColor=white)](https://postgresql.org)
[![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=flat-square&logo=prisma)](https://prisma.io)
[![License: MIT](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)
[![Demo](https://img.shields.io/badge/Demo-Google_Drive-4285F4?style=flat-square&logo=googledrive&logoColor=white)](https://drive.google.com/file/d/1c4roysXTYV5wFjujik9N79V2aVWCu8jA/view)

</div>

---

## Overview

VendorBridge is a full-stack procurement ERP that manages the complete vendor lifecycle — from onboarding and RFQ creation to quotation comparison, approval workflows, purchase orders, and invoice generation — under a single role-based platform.

<!-- 📸 SCREENSHOT: Landing page / Login screen -->
> `screenshots/login.png`

---

## Demo

▶️ [Watch Demo Video](https://drive.google.com/file/d/1c4roysXTYV5wFjujik9N79V2aVWCu8jA/view)

---

## Features

### Procurement Workflow
The core flow moves linearly through these stages:

```
Vendor Onboarding → RFQ Creation → Quotation Submission → Comparison → Approval → PO → Invoice
```

| Stage | Details |
|---|---|
| **Vendor Management** | Register, verify, rate, and categorize suppliers with GST details |
| **RFQ Creation** | Multi-step wizard with line items, vendor assignment, and file attachments |
| **Quotation Submission** | Vendor portal with inline price and delivery-day entry |
| **Quotation Comparison** | Side-by-side table with AI scoring: 60% price · 25% rating · 15% delivery |
| **Approval Workflow** | Multi-stage chain with 48-hour SLA tracking (overdue items highlighted) |
| **PO & Invoice Generation** | Auto-generated on approval with Indian GST (CGST + SGST) breakdown |

<!-- 📸 SCREENSHOT: Quotation comparison table showing AI scoring -->
> `screenshots/quotation-compare.png`

<!-- 📸 SCREENSHOT: Approval workflow / manager approvals page -->
> `screenshots/approvals.png`

### Analytics & Reports
- Monthly spend trends (last 6 months)
- Top vendors by PO value
- Spend by category
- Vendor performance scorecards
- Procurement KPIs dashboard

<!-- 📸 SCREENSHOT: Dashboard with charts and KPI cards -->
> `screenshots/dashboard.png`

<!-- 📸 SCREENSHOT: Reports page with spend breakdown -->
> `screenshots/reports.png`

### Other Highlights
- **Role-based access** — 4 roles with route-level middleware enforcement
- **Immutable audit logs** — write-once activity trail, no edits or deletes
- **Real-time notifications** — 10-second polling
- **PDF export** — download, print, or email invoices
- **Data export** — CSV, XLSX, and jsPDF exports
- **Dark / Light mode**

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 App Router, TypeScript |
| Styling | TailwindCSS, Shadcn UI, Framer Motion |
| Forms | React Hook Form + Zod |
| State | Zustand (client), TanStack Query (server) |
| Backend | Next.js Server Actions |
| ORM / DB | Prisma + PostgreSQL |
| Auth | NextAuth.js v5 (JWT) |
| Storage | UploadThing |
| Email | Resend + React Email |
| PDF / Export | @react-pdf/renderer, react-csv, jsPDF |

---

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL database
- [UploadThing](https://uploadthing.com) account
- [Resend](https://resend.com) account

### 1. Clone & Install

```bash
git clone <repo-url> vendorbridge
cd vendorbridge
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env.local
```

Fill in the following in `.env.local`:

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `AUTH_SECRET` | 32-char random secret — `openssl rand -base64 32` |
| `UPLOADTHING_SECRET` | From UploadThing dashboard |
| `UPLOADTHING_APP_ID` | From UploadThing dashboard |
| `RESEND_API_KEY` | From Resend dashboard |

### 3. Set Up Database

```bash
npm run db:push       # Push schema (development)
npm run db:migrate    # Run migrations (production)
npm run db:seed       # Load demo data
```

### 4. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Demo Credentials

| Role | Email | Password |
|---|---|---|
| Admin | admin@vendorbridge.com | password123 |
| Procurement Officer | procurement@vendorbridge.com | password123 |
| Manager | manager@vendorbridge.com | password123 |
| Vendor | vendor@vendorbridge.com | password123 |

---

## Role-Based Access

| Role | Access |
|---|---|
| `ADMIN` | Full access to all routes |
| `PROCUREMENT_OFFICER` | RFQs, vendors, quotations, orders |
| `MANAGER` | Approval workflows |
| `VENDOR` | Own RFQs and quotation submission |

Route protection is enforced in `src/middleware.ts` using NextAuth session + role checks.

<!-- 📸 SCREENSHOT: Sidebar showing role-specific navigation items -->
> `screenshots/sidebar-role-view.png`

---

## Project Structure

```
vendorbridge/
├── prisma/
│   ├── schema.prisma          # DB schema (Users, RFQs, Quotations, POs, Invoices, Logs)
│   └── seed.ts                # Demo data seeder
├── src/
│   ├── app/
│   │   ├── (auth)/            # Login, Signup, Forgot/Reset Password
│   │   ├── (dashboard)/       # All protected pages (vendors, rfqs, procurement, reports…)
│   │   └── api/               # UploadThing + NextAuth route handlers
│   ├── components/
│   │   ├── ui/                # Shadcn primitives
│   │   ├── sidebar.tsx
│   │   └── navbar.tsx
│   ├── lib/
│   │   ├── actions/           # Server Actions — business logic per domain
│   │   ├── auth.ts
│   │   ├── db.ts
│   │   └── utils.ts
│   └── middleware.ts          # RBAC + session enforcement
└── emails/                    # React Email templates (approvals, invoices, password reset)
```

---

## Database Scripts

```bash
npm run db:studio    # Open Prisma Studio (visual DB browser)
npm run db:reset     # Drop all data, re-migrate, re-seed
```

---

## Deployment

1. Set `NODE_ENV=production` and a strong `AUTH_SECRET`
2. Point `DATABASE_URL` to a managed PostgreSQL instance (Supabase, Neon, or RDS)
3. Deploy to **Vercel** (recommended — UploadThing and Resend integrate seamlessly)
4. Run `npm run db:migrate` on first deploy

---

## License

MIT
