import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import * as React from 'react'

interface ResetPasswordEmailProps {
  resetLink: string
  userName?: string
}

export function ResetPasswordEmail({ resetLink, userName = 'User' }: ResetPasswordEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Reset your VendorBridge password</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={logo}>VendorBridge</Heading>
          </Section>
          <Section style={content}>
            <Heading as="h2" style={h2}>
              Password Reset Request
            </Heading>
            <Text style={paragraph}>Hi {userName},</Text>
            <Text style={paragraph}>
              We received a request to reset your password. Click the button below to set a new
              password. This link will expire in <strong>1 hour</strong>.
            </Text>
            <Section style={{ textAlign: 'center' as const, margin: '32px 0' }}>
              <Button href={resetLink} style={button}>
                Reset Password
              </Button>
            </Section>
            <Text style={paragraph}>
              If you didn't request a password reset, you can safely ignore this email. Your
              password will not be changed.
            </Text>
            <Hr style={divider} />
            <Text style={smallText}>
              If the button doesn't work, copy and paste this link into your browser:
            </Text>
            <Text style={linkText}>{resetLink}</Text>
          </Section>
          <Text style={footer}>VendorBridge · Procurement & Vendor Management Platform</Text>
        </Container>
      </Body>
    </Html>
  )
}

export default ResetPasswordEmail

const main = { backgroundColor: '#f6f9fc', fontFamily: 'Arial, sans-serif' }
const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  maxWidth: '540px',
  borderRadius: '8px',
  overflow: 'hidden',
}
const header = { backgroundColor: '#1d4ed8', padding: '24px 32px' }
const logo = { color: '#ffffff', fontSize: '22px', fontWeight: 'bold', margin: 0 }
const content = { padding: '32px' }
const h2 = { fontSize: '20px', color: '#111827', margin: '0 0 16px' }
const paragraph = { color: '#374151', fontSize: '14px', lineHeight: '1.6', margin: '0 0 16px' }
const button = {
  backgroundColor: '#1d4ed8',
  borderRadius: '6px',
  color: '#ffffff',
  fontSize: '14px',
  fontWeight: '600',
  padding: '12px 28px',
  textDecoration: 'none',
  display: 'inline-block',
}
const divider = { borderColor: '#e5e7eb', margin: '24px 0' }
const smallText = { color: '#6b7280', fontSize: '12px', margin: '0 0 4px' }
const linkText = { color: '#1d4ed8', fontSize: '12px', wordBreak: 'break-all' as const }
const footer = {
  color: '#9ca3af',
  fontSize: '11px',
  textAlign: 'center' as const,
  padding: '0 32px',
}
