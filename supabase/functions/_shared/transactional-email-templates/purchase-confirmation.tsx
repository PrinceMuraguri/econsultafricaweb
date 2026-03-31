/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Img, Link, Preview, Text, Hr,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'Econsult Africa'
const LOGO_URL = 'https://iysutjnviccsgygpiqfe.supabase.co/storage/v1/object/public/email-assets/econsult-logo.png'

interface PurchaseConfirmationProps {
  productTitle?: string
  downloadUrl?: string
  reference?: string
  customerName?: string
}

const PurchaseConfirmationEmail = ({
  productTitle = 'Your Report',
  downloadUrl,
  reference,
  customerName,
}: PurchaseConfirmationProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your purchase from Econsult Africa is ready for download</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img src={LOGO_URL} alt="Econsult Africa" width="160" height="auto" style={logo} />
        <Heading style={h1}>
          {customerName ? `Thank you, ${customerName}!` : 'Thank you for your purchase!'}
        </Heading>
        <Text style={text}>
          Your purchase of <strong>{productTitle}</strong> has been confirmed. You're now part of
          the Econsult Africa community — a group of thinkers, builders, investors, and leaders
          who care about understanding Africa better.
        </Text>
        {reference && (
          <Text style={refStyle}>
            Payment Reference: <span style={{ fontFamily: 'monospace' }}>{reference}</span>
          </Text>
        )}
        {downloadUrl && (
          <Button style={button} href={downloadUrl}>
            Download Your Report
          </Button>
        )}
        <Text style={text}>
          This download link expires in 1 hour. If you need access again, please contact us
          at{' '}
          <Link href="mailto:info@econsult.africa" style={link}>
            info@econsult.africa
          </Link>.
        </Text>
        <Hr style={hr} />
        <Text style={footer}>
          We hope this report helps you make better decisions, see something others are missing,
          and plan more confidently for the future.
        </Text>
        <Text style={footer}>
          — The {SITE_NAME} Team
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: PurchaseConfirmationEmail,
  subject: (data: Record<string, any>) =>
    `Your ${data.productTitle || 'report'} from Econsult Africa is ready`,
  displayName: 'Purchase confirmation',
  previewData: {
    productTitle: 'Kenya 2026 Economic Outlook',
    downloadUrl: 'https://example.com/download',
    reference: 'TXN_ABC123',
    customerName: 'Jane',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Helvetica Neue', Arial, sans-serif" }
const container = { padding: '30px 25px' }
const logo = { margin: '0 0 24px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#1a2744', margin: '0 0 20px' }
const text = { fontSize: '14px', color: '#636b7a', lineHeight: '1.6', margin: '0 0 25px' }
const refStyle = { fontSize: '13px', color: '#636b7a', lineHeight: '1.6', margin: '0 0 25px' }
const link = { color: '#3660be', textDecoration: 'underline' }
const button = { backgroundColor: '#3660be', color: '#ffffff', fontSize: '14px', borderRadius: '4px', padding: '12px 24px', textDecoration: 'none' }
const hr = { borderColor: '#e5e7eb', margin: '30px 0' }
const footer = { fontSize: '12px', color: '#999999', margin: '0 0 8px' }
