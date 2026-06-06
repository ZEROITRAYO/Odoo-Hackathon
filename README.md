# VendorBridge — Procurement & Vendor Management ERP

A production-ready SaaS ERP platform for end-to-end procurement lifecycle management: from vendor onboarding and RFQ creation to quotation comparison, approval workflows, purchase orders, and invoice generation.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15 App Router, TypeScript, TailwindCSS, Shadcn UI, Framer Motion |
| Charts | Recharts |
| Forms | React Hook Form + Zod |
| Client State | Zustand |
| Server State | TanStack Query (React Query) |
| Backend | Next.js Server Actions |
| ORM | Prisma |
| Database | PostgreSQL |
| Auth | NextAuth.js v5 (JWT) |
| Storage | UploadThing |
| Email | Resend + React Email |
| PDF | @react-pdf/renderer |
| Exports | react-csv, xlsx, jsPDF + autoTable |

---

## Quick Start

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

Edit `.env.local` and fill in:
- `DATABASE_URL` — PostgreSQL connection string
- `AUTH_SECRET` — Random 32-char secret (`openssl rand -base64 32`)
- `UPLOADTHING_SECRET` + `UPLOADTHING_APP_ID` — from [uploadthing.com](https://uploadthing.com)
- `RESEND_API_KEY` — from [resend.com](https://resend.com)

### 3. Set Up Database

```bash
# Push schema to database
npm run db:push

# OR use migrations (recommended for production)
npm run db:migrate

# Seed with demo data
npm run db:seed
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@vendorbridge.com | password123 |
| Procurement Officer | procurement@vendorbridge.com | password123 |
| Manager | manager@vendorbridge.com | password123 |
| Vendor | vendor@vendorbridge.com | password123 |

---

## Role-Based Access

| Route Prefix | Allowed Roles |
|-------------|---------------|
| `/admin/*` | ADMIN only |
| `/procurement/*` | PROCUREMENT_OFFICER, ADMIN |
| `/vendor/*` | VENDOR, ADMIN |
| `/manager/*` | MANAGER, ADMIN |
| `/dashboard` | All authenticated users |

---

## Features

### Core Procurement Workflow
1. **Vendor Management** — Register, verify, and rate suppliers
2. **RFQ Creation** — Multi-step wizard with line items, vendor assignment, file attachments
3. **Quotation Submission** — Vendor portal with inline price entry
4. **Quotation Comparison** — Side-by-side table with AI scoring (60% price + 25% rating + 15% delivery)
5. **Approval Workflow** — Multi-stage approval chain with SLA tracking (48h threshold)
6. **PO & Invoice Generation** — Auto-generated on approval, with Indian GST (CGST + SGST) breakdown
7. **PDF Export** — Download / print / email invoices

### Analytics & Reports
- Monthly spending trends (last 6 months)
- Top 5 vendors by PO value
- Spend by category (progress bars)
- Vendor performance scores
- Procurement KPIs

### Bonus Features
- AI Vendor Recommendation (weighted scoring formula)
- Smart Procurement Insights (cheapest vendor callouts)
- Approval SLA Tracking (red highlight after 48h)
- Vendor Scorecard (price competitiveness + delivery + quality)
- Immutable Audit Logs (write-once, no edit/delete)
- Dark / Light mode
- Real-time notifications (10s polling)

---

## Project Structure

```
vendorbridge/
├── prisma/
│   ├── schema.prisma          # Full DB schema
│   └── seed.ts                # Demo data seeder
├── src/
│   ├── app/
│   │   ├── (auth)/            # Login, Signup, Reset Password
│   │   ├── (dashboard)/       # All protected pages
│   │   └── api/               # Route handlers (UploadThing, Auth)
│   ├── components/
│   │   ├── ui/                # Shadcn components
│   │   ├── sidebar.tsx
│   │   ├── navbar.tsx
│   │   └── ...
│   ├── lib/
│   │   ├── actions/           # Server Actions (business logic)
│   │   ├── auth.ts            # NextAuth config
│   │   ├── db.ts              # Prisma client
│   │   ├── uploadthing.ts     # File upload config
│   │   └── utils.ts           # Helpers, formatters, calculators
│   └── middleware.ts          # RBAC middleware
└── emails/                    # React Email templates
```

---

## Database Reset

```bash
npm run db:reset   # Drops all data, re-runs migrations, re-seeds
```

---

## Production Deployment

1. Set `NODE_ENV=production`
2. Use strong `AUTH_SECRET`
3. Point `DATABASE_URL` to a managed PostgreSQL instance (Supabase, Neon, RDS)
4. Deploy on Vercel (recommended) — UploadThing and Resend work seamlessly
5. Run `npm run db:migrate` on first deploy

---

## License

MIT
