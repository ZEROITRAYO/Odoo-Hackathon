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

interface ApprovalRequestEmailProps {
  managerName: string
  vendorName: string
  rfqTitle: string
  rfqNumber: string
  quotationNumber: string
  price: number
  deliveryDays: number
  vendorRating: number | null
  approvalLink: string
}

export function ApprovalRequestEmail({
  managerName,
  vendorName,
  rfqTitle,
  rfqNumber,
  quotationNumber,
  price,
  deliveryDays,
  vendorRating,
  approvalLink,
}: ApprovalRequestEmailProps) {
  const fmt = (n: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(n)

  return (
    <Html>
      <Head />
      <Preview>Approval required: {quotationNumber} for {rfqTitle}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={logo}>VendorBridge</Heading>
            <Text style={tagline}>Approval Required</Text>
          </Section>

          <Section style={content}>
            <Heading as="h2" style={h2}>
              Quotation Approval Request
            </Heading>
            <Text style={paragraph}>Hi {managerName},</Text>
            <Text style={paragraph}>
              A procurement quotation has been selected and requires your approval. Please review
              the details below and take action.
            </Text>
          </Section>

          <Section style={detailsBox}>
            <Row>
              <Column>
                <Text style={label}>RFQ</Text>
                <Text style={value}>{rfqTitle}</Text>
                <Text style={subValue}>{rfqNumber}</Text>
              </Column>
              <Column>
                <Text style={label}>Quotation No.</Text>
                <Text style={value}>{quotationNumber}</Text>
              </Column>
            </Row>
            <Hr style={innerDivider} />
            <Row>
              <Column>
                <Text style={label}>Vendor</Text>
                <Text style={value}>{vendorName}</Text>
              </Column>
              <Column>
                <Text style={label}>Rating</Text>
                <Text style={value}>{vendorRating ? `${vendorRating}/5` : 'N/A'}</Text>
              </Column>
            </Row>
            <Hr style={innerDivider} />
            <Row>
              <Column>
                <Text style={label}>Quoted Price</Text>
                <Text style={{ ...value, color: '#1d4ed8', fontSize: '20px' }}>{fmt(price)}</Text>
              </Column>
              <Column>
                <Text style={label}>Delivery</Text>
                <Text style={value}>{deliveryDays} days</Text>
              </Column>
            </Row>
          </Section>

          <Section style={{ textAlign: 'center' as const, padding: '24px 32px' }}>
            <Button href={approvalLink} style={approveButton}>
              Review & Approve
            </Button>
          </Section>

          <Hr style={divider} />
          <Text style={footer}>
            This request was generated automatically by VendorBridge. Log in to the platform to
            approve, reject, or add remarks.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export default ApprovalRequestEmail

const main = { backgroundColor: '#f6f9fc', fontFamily: 'Arial, sans-serif' }
const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  maxWidth: '600px',
  borderRadius: '8px',
  overflow: 'hidden',
}
const header = { backgroundColor: '#7c3aed', padding: '24px 32px' }
const logo = { color: '#ffffff', fontSize: '22px', fontWeight: 'bold', margin: 0 }
const tagline = { color: '#ddd6fe', fontSize: '13px', margin: '4px 0 0' }
const content = { padding: '32px 32px 0' }
const h2 = { fontSize: '20px', color: '#111827', margin: '0 0 12px' }
const paragraph = { color: '#374151', fontSize: '14px', lineHeight: '1.6', margin: '0 0 12px' }
const detailsBox = {
  backgroundColor: '#faf5ff',
  border: '1px solid #e9d5ff',
  borderRadius: '6px',
  padding: '20px 24px',
  margin: '16px 32px 0',
}
const label = { color: '#7c3aed', fontSize: '11px', textTransform: 'uppercase' as const, letterSpacing: '0.05em', margin: '0 0 2px' }
const value = { color: '#111827', fontSize: '15px', fontWeight: '600', margin: '0 0 4px' }
const subValue = { color: '#6b7280', fontSize: '12px', margin: '0 0 8px' }
const innerDivider = { borderColor: '#e9d5ff', margin: '12px 0' }
const approveButton = {
  backgroundColor: '#7c3aed',
  borderRadius: '6px',
  color: '#ffffff',
  fontSize: '14px',
  fontWeight: '600',
  padding: '12px 28px',
  textDecoration: 'none',
  display: 'inline-block',
}
const divider = { borderColor: '#e5e7eb', margin: '0 32px' }
const footer = { color: '#9ca3af', fontSize: '12px', textAlign: 'center' as const, padding: '16px 32px 24px' }
