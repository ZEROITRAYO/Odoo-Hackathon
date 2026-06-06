// prisma/seed.ts
import { PrismaClient, UserRole, VendorStatus, RFQStatus, QuotationStatus, ApprovalStatus, POStatus, InvoiceStatus } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // ─── Users ─────────────────────────────────────────────────────────────────
  const hashedPassword = await bcrypt.hash('password123', 12)

  const admin = await prisma.user.upsert({
    where: { email: 'admin@vendorbridge.com' },
    update: {},
    create: {
      name: 'Arjun Sharma',
      email: 'admin@vendorbridge.com',
      password: hashedPassword,
      role: UserRole.ADMIN,
    },
  })

  const procurement = await prisma.user.upsert({
    where: { email: 'procurement@vendorbridge.com' },
    update: {},
    create: {
      name: 'Rahul Mehta',
      email: 'procurement@vendorbridge.com',
      password: hashedPassword,
      role: UserRole.PROCUREMENT_OFFICER,
    },
  })

  const manager = await prisma.user.upsert({
    where: { email: 'manager@vendorbridge.com' },
    update: {},
    create: {
      name: 'Priya Shah',
      email: 'manager@vendorbridge.com',
      password: hashedPassword,
      role: UserRole.MANAGER,
    },
  })

  const vendorUser = await prisma.user.upsert({
    where: { email: 'vendor@vendorbridge.com' },
    update: {},
    create: {
      name: 'Vikram Patel',
      email: 'vendor@vendorbridge.com',
      password: hashedPassword,
      role: UserRole.VENDOR,
    },
  })

  console.log('✅ Users created')

  // ─── Vendors ────────────────────────────────────────────────────────────────
  const vendor1 = await prisma.vendor.upsert({
    where: { vendorCode: 'VEN-001' },
    update: { email: 'vendor@vendorbridge.com' },
    create: {
      vendorCode: 'VEN-001',
      companyName: 'Infra Supplies Pvt Ltd',
      gstNumber: '27AABCS1929B1Z0',
      category: 'Furniture',
      contactPerson: 'Vikram Patel',
      phone: '+91-9876543210',
      email: 'vendor@vendorbridge.com',  // matches the VENDOR user login email
      address: '456, Industrial Estate, Surat, Gujarat 395003',
      rating: 4.5,
      status: VendorStatus.ACTIVE,
    },
  })

  const vendor2 = await prisma.vendor.upsert({
    where: { vendorCode: 'VEN-002' },
    update: {},
    create: {
      vendorCode: 'VEN-002',
      companyName: 'TechCore Ltd',
      gstNumber: '27AABCS1929B2Z0',
      category: 'IT',
      contactPerson: 'Sneha Kapoor',
      phone: '+91-9876543211',
      email: 'sneha@techcore.com',
      address: '102, Tech Park, Pune, Maharashtra 411001',
      rating: 4.2,
      status: VendorStatus.ACTIVE,
    },
  })

  const vendor3 = await prisma.vendor.upsert({
    where: { vendorCode: 'VEN-003' },
    update: {},
    create: {
      vendorCode: 'VEN-003',
      companyName: 'FastLog Transport',
      gstNumber: '27AABCS1929B3Z0',
      category: 'Logistics',
      contactPerson: 'Ravi Gupta',
      phone: '+91-9876543212',
      email: 'ravi@fastlog.com',
      address: '78, Transport Nagar, Ahmedabad, Gujarat 380001',
      rating: 3.8,
      status: VendorStatus.BLOCKED,
    },
  })

  const vendor4 = await prisma.vendor.upsert({
    where: { vendorCode: 'VEN-004' },
    update: {},
    create: {
      vendorCode: 'VEN-004',
      companyName: 'Office Need Co.',
      gstNumber: '27AABCS1929B4Z0',
      category: 'Stationery',
      contactPerson: 'Meera Joshi',
      phone: '+91-9876543213',
      email: 'meera@officeneed.com',
      address: '23, Commercial Zone, Mumbai, Maharashtra 400001',
      rating: 4.0,
      status: VendorStatus.PENDING,
    },
  })

  const vendor5 = await prisma.vendor.upsert({
    where: { vendorCode: 'VEN-005' },
    update: {},
    create: {
      vendorCode: 'VEN-005',
      companyName: 'BuildRight Constructions',
      gstNumber: '27AABCS1929B5Z0',
      category: 'Construction',
      contactPerson: 'Anil Verma',
      phone: '+91-9876543214',
      email: 'anil@buildright.com',
      address: '55, Builder Colony, Delhi 110001',
      rating: 4.7,
      status: VendorStatus.ACTIVE,
    },
  })

  console.log('✅ Vendors created')

  // ─── RFQs ───────────────────────────────────────────────────────────────────
  const rfq1 = await prisma.rFQ.upsert({
    where: { rfqNumber: 'RFQ-2025-0001' },
    update: {},
    create: {
      rfqNumber: 'RFQ-2025-0001',
      title: 'Office Furniture Procurement Q2',
      description: 'Ergonomic chairs and standing desks for 3rd floor renovation. High quality required.',
      quantity: 35,
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      status: RFQStatus.OPEN,
      createdBy: procurement.id,
      rfqVendors: {
        create: [
          { vendorId: vendor1.id },
          { vendorId: vendor2.id },
          { vendorId: vendor4.id },
        ],
      },
    },
  })

  const rfq2 = await prisma.rFQ.upsert({
    where: { rfqNumber: 'RFQ-2025-0002' },
    update: {},
    create: {
      rfqNumber: 'RFQ-2025-0002',
      title: 'IT Hardware Refresh Q2',
      description: 'Laptops, monitors, and peripherals for new hires batch.',
      quantity: 20,
      deadline: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago (closed)
      status: RFQStatus.CLOSED,
      createdBy: procurement.id,
      rfqVendors: {
        create: [
          { vendorId: vendor2.id },
          { vendorId: vendor1.id },
        ],
      },
    },
  })

  const rfq3 = await prisma.rFQ.upsert({
    where: { rfqNumber: 'RFQ-2025-0003' },
    update: {},
    create: {
      rfqNumber: 'RFQ-2025-0003',
      title: 'Annual Stationery Supply',
      description: 'Office stationery for all departments – pens, paper, files, folders.',
      quantity: 500,
      deadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      status: RFQStatus.DRAFT,
      createdBy: procurement.id,
    },
  })

  console.log('✅ RFQs created')

  // ─── Quotations ──────────────────────────────────────────────────────────────
  const quot1 = await prisma.quotation.upsert({
    where: { quotationNumber: 'QUO-2025-0001' },
    update: {},
    create: {
      quotationNumber: 'QUO-2025-0001',
      rfqId: rfq1.id,
      vendorId: vendor1.id,
      price: 185000,
      deliveryDays: 10,
      notes: 'Premium ergonomic chairs with 3-year warranty. Free installation.',
      status: QuotationStatus.SELECTED,
      submittedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    },
  })

  const quot2 = await prisma.quotation.upsert({
    where: { quotationNumber: 'QUO-2025-0002' },
    update: {},
    create: {
      quotationNumber: 'QUO-2025-0002',
      rfqId: rfq1.id,
      vendorId: vendor2.id,
      price: 200010,
      deliveryDays: 14,
      notes: 'Standard ergonomic collection. GST included.',
      status: QuotationStatus.REJECTED,
      submittedAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000),
    },
  })

  const quot3 = await prisma.quotation.upsert({
    where: { quotationNumber: 'QUO-2025-0003' },
    update: {},
    create: {
      quotationNumber: 'QUO-2025-0003',
      rfqId: rfq1.id,
      vendorId: vendor4.id,
      price: 214800,
      deliveryDays: 7,
      notes: 'Fast delivery available. Payment terms: 15 days.',
      status: QuotationStatus.REJECTED,
      submittedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
    },
  })

  const quot4 = await prisma.quotation.upsert({
    where: { quotationNumber: 'QUO-2025-0004' },
    update: {},
    create: {
      quotationNumber: 'QUO-2025-0004',
      rfqId: rfq2.id,
      vendorId: vendor2.id,
      price: 420000,
      deliveryDays: 5,
      notes: 'All items ex-stock. 1-year warranty.',
      status: QuotationStatus.SELECTED,
      submittedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
    },
  })

  console.log('✅ Quotations created')

  // ─── Approvals ───────────────────────────────────────────────────────────────
  const approval1 = await prisma.approval.upsert({
    where: { quotationId: quot1.id },
    update: {},
    create: {
      quotationId: quot1.id,
      approverId: manager.id,
      remarks: 'Approved. Infra Supplies has best price and good track record.',
      status: ApprovalStatus.APPROVED,
      approvedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    },
  })

  const approval2 = await prisma.approval.upsert({
    where: { quotationId: quot4.id },
    update: {},
    create: {
      quotationId: quot4.id,
      approverId: manager.id,
      remarks: 'Approved for IT hardware.',
      status: ApprovalStatus.APPROVED,
      approvedAt: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000),
    },
  })

  console.log('✅ Approvals created')

  // ─── Purchase Orders ─────────────────────────────────────────────────────────
  const po1 = await prisma.purchaseOrder.upsert({
    where: { poNumber: 'PO-2025-0001' },
    update: {},
    create: {
      poNumber: 'PO-2025-0001',
      approvalId: approval1.id,
      vendorId: vendor1.id,
      subtotal: 185000,
      tax: 33300, // 18%
      total: 218300,
      status: POStatus.SENT,
      generatedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
    },
  })

  const po2 = await prisma.purchaseOrder.upsert({
    where: { poNumber: 'PO-2025-0002' },
    update: {},
    create: {
      poNumber: 'PO-2025-0002',
      approvalId: approval2.id,
      vendorId: vendor2.id,
      subtotal: 420000,
      tax: 75600,
      total: 495600,
      status: POStatus.ACCEPTED,
      generatedAt: new Date(Date.now() - 17 * 24 * 60 * 60 * 1000),
    },
  })

  console.log('✅ Purchase Orders created')

  // ─── Invoices ────────────────────────────────────────────────────────────────
  await prisma.invoice.upsert({
    where: { invoiceNumber: 'INV-2025-0001' },
    update: {},
    create: {
      invoiceNumber: 'INV-2025-0001',
      poId: po1.id,
      subtotal: 185000,
      tax: 33300,
      total: 218300,
      status: InvoiceStatus.SENT,
      generatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    },
  })

  await prisma.invoice.upsert({
    where: { invoiceNumber: 'INV-2025-0002' },
    update: {},
    create: {
      invoiceNumber: 'INV-2025-0002',
      poId: po2.id,
      subtotal: 420000,
      tax: 75600,
      total: 495600,
      status: InvoiceStatus.PAID,
      generatedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
    },
  })

  console.log('✅ Invoices created')

  // ─── Activity Logs (immutable) ───────────────────────────────────────────────
  const logs = [
    { userId: admin.id, action: 'Vendor Added', entityType: 'Vendor', entityId: vendor3.id, metadata: { companyName: 'FastLog Transport', note: 'Registered and pending verification' } },
    { userId: procurement.id, action: 'RFQ Published', entityType: 'RFQ', entityId: rfq1.id, metadata: { title: 'Office Furniture Procurement Q2', vendorCount: 3 } },
    { userId: procurement.id, action: 'Quotation Selected', entityType: 'Quotation', entityId: quot1.id, metadata: { vendor: 'Infra Supplies Pvt Ltd', rfq: 'Office Furniture Q2' } },
    { userId: manager.id, action: 'Approval Pending', entityType: 'Approval', entityId: approval1.id, metadata: { note: 'Awaiting L2 approval by Priya Shah' } },
    { userId: manager.id, action: 'Approval Granted', entityType: 'Approval', entityId: approval1.id, metadata: { remarks: 'Best price and track record' } },
    { userId: procurement.id, action: 'PO Generated', entityType: 'PurchaseOrder', entityId: po1.id, metadata: { poNumber: 'PO-2025-0001', total: 218300 } },
    { userId: procurement.id, action: 'Invoice Generated', entityType: 'Invoice', entityId: 'INV-2025-0001', metadata: { invoiceNumber: 'INV-2025-0001' } },
  ]

  for (const log of logs) {
    await prisma.activityLog.create({ data: log })
  }

  console.log('✅ Activity logs created')

  // ─── Notifications ───────────────────────────────────────────────────────────
  await prisma.notification.createMany({
    data: [
      { userId: procurement.id, title: 'New Quotation Received', message: 'Infra Supplies Pvt Ltd submitted a quotation for RFQ-2025-0001', read: true },
      { userId: procurement.id, title: 'Approval Granted', message: 'Manager approved quotation QUO-2025-0001. PO-2025-0001 has been generated.', read: false },
      { userId: manager.id, title: 'Approval Request', message: 'Quotation QUO-2025-0001 is pending your approval', read: true },
      { userId: vendorUser.id, title: 'RFQ Assigned', message: 'You have been assigned to RFQ-2025-0001: Office Furniture Procurement Q2', read: false },
    ],
  })

  console.log('✅ Notifications created')
  console.log('\n🎉 Database seeded successfully!')
  console.log('\n📋 Demo Credentials:')
  console.log('  Admin:               admin@vendorbridge.com / password123')
  console.log('  Procurement Officer: procurement@vendorbridge.com / password123')
  console.log('  Manager:             manager@vendorbridge.com / password123')
  console.log('  Vendor:              vendor@vendorbridge.com / password123')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
