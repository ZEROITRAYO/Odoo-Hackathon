import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Row,
  Column,
  Section,
  Text,
} from '@react-email/components'
import * as React from 'react'

interface InvoiceEmailProps {
  invoiceNumber: string
  vendorName: string
  poNumber: string
  rfqTitle: string
  subtotal: number
  tax: number
  total: number
  pdfUrl?: string
}

export function InvoiceEmail({
  invoiceNumber,
  vendorName,
  poNumber,
  rfqTitle,
  subtotal,
  tax,
  total,
  pdfUrl,
}: InvoiceEmailProps) {
  const fmt = (n: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(n)

  return (
    <Html>
      <Head />
      <Preview>Invoice {invoiceNumber} from VendorBridge</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Heading style={logo}>VendorBridge</Heading>
            <Text style={tagline}>Procurement & Vendor Management</Text>
          </Section>

          {/* Title */}
          <Section style={content}>
            <Heading as="h2" style={h2}>
              Invoice {invoiceNumber}
            </Heading>
            <Text style={paragraph}>Dear {vendorName},</Text>
            <Text style={paragraph}>
              Please find below the invoice details for the purchase order associated with your
              quotation.
            </Text>
          </Section>

          {/* Details */}
          <Section style={detailsBox}>
            <Row>
              <Column>
                <Text style={detailLabel}>Invoice Number</Text>
                <Text style={detailValue}>{invoiceNumber}</Text>
              </Column>
              <Column>
                <Text style={detailLabel}>PO Number</Text>
                <Text style={detailValue}>{poNumber}</Text>
              </Column>
            </Row>
            <Row>
              <Column>
                <Text style={detailLabel}>Project / RFQ</Text>
                <Text style={detailValue}>{rfqTitle}</Text>
              </Column>
              <Column>
                <Text style={detailLabel}>Vendor</Text>
                <Text style={detailValue}>{vendorName}</Text>
              </Column>
            </Row>
          </Section>

          {/* Amounts */}
          <Section style={amountsBox}>
            <Row>
              <Column style={{ width: '70%' }}>
                <Text style={amountLabel}>Subtotal</Text>
              </Column>
              <Column style={{ textAlign: 'right' as const }}>
                <Text style={amountValue}>{fmt(subtotal)}</Text>
              </Column>
            </Row>
            <Row>
              <Column style={{ width: '70%' }}>
                <Text style={amountLabel}>GST (18%)</Text>
              </Column>
              <Column style={{ textAlign: 'right' as const }}>
                <Text style={amountValue}>{fmt(tax)}</Text>
              </Column>
            </Row>
            <Hr style={divider} />
            <Row>
              <Column style={{ width: '70%' }}>
                <Text style={totalLabel}>Total Amount</Text>
              </Column>
              <Column style={{ textAlign: 'right' as const }}>
                <Text style={totalValue}>{fmt(total)}</Text>
              </Column>
            </Row>
          </Section>

          {/* CTA */}
          {pdfUrl && (
            <Section style={{ textAlign: 'center' as const, marginTop: 24 }}>
              <Button href={pdfUrl} style={button}>
                Download Invoice PDF
              </Button>
            </Section>
          )}

          <Hr style={divider} />
          <Text style={footer}>
            This is an automated message from VendorBridge. Please do not reply directly to this
            email. Contact your procurement team for any queries.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export default InvoiceEmail

// ─── Styles ───────────────────────────────────────────────────────────────────

const main = { backgroundColor: '#f6f9fc', fontFamily: 'Arial, sans-serif' }

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  maxWidth: '600px',
  borderRadius: '8px',
  overflow: 'hidden',
}

const header = {
  backgroundColor: '#1d4ed8',
  padding: '24px 32px',
}

const logo = {
  color: '#ffffff',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: 0,
}

const tagline = {
  color: '#93c5fd',
  fontSize: '13px',
  margin: '4px 0 0',
}

const content = { padding: '32px 32px 16px' }

const h2 = { fontSize: '20px', color: '#111827', margin: '0 0 12px' }

const paragraph = { color: '#374151', fontSize: '14px', lineHeight: '1.6' }

const detailsBox = {
  backgroundColor: '#f9fafb',
  borderRadius: '6px',
  padding: '16px 24px',
  margin: '0 32px 16px',
}

const detailLabel = {
  color: '#6b7280',
  fontSize: '11px',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.05em',
  margin: '0 0 2px',
}

const detailValue = { color: '#111827', fontSize: '14px', fontWeight: '600', margin: '0 0 12px' }

const amountsBox = { padding: '0 32px' }

const amountLabel = { color: '#374151', fontSize: '14px', margin: '4px 0' }

const amountValue = { color: '#374151', fontSize: '14px', margin: '4px 0' }

const totalLabel = {
  color: '#111827',
  fontSize: '16px',
  fontWeight: 'bold',
  margin: '8px 0',
}

const totalValue = {
  color: '#1d4ed8',
  fontSize: '16px',
  fontWeight: 'bold',
  margin: '8px 0',
}

const divider = { borderColor: '#e5e7eb', margin: '16px 32px' }

const button = {
  backgroundColor: '#1d4ed8',
  borderRadius: '6px',
  color: '#ffffff',
  fontSize: '14px',
  fontWeight: '600',
  padding: '12px 24px',
  textDecoration: 'none',
  display: 'inline-block',
}

const footer = {
  color: '#9ca3af',
  fontSize: '12px',
  textAlign: 'center' as const,
  padding: '0 32px',
}
