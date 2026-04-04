/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Img, Link, Preview, Text, Hr, Section,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'Econsult Africa'
const LOGO_URL = 'https://iysutjnviccsgygpiqfe.supabase.co/storage/v1/object/public/email-assets/econsult-logo.png'

interface SettlementWinnerProps {
  pollTitle?: string
  winningOption?: string
  payoutAmount?: string
  stakeAmount?: string
  pollUrl?: string
  userName?: string
}

const SettlementWinnerEmail = ({
  pollTitle = 'Forecast Question',
  winningOption = 'Yes',
  payoutAmount = '$1.00',
  stakeAmount = '$1.00',
  pollUrl,
  userName,
}: SettlementWinnerProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>You predicted correctly — {payoutAmount} has been credited to your wallet</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img src={LOGO_URL} alt="Econsult Africa" width="160" height="auto" style={logo} />
        <Heading style={h1}>
          {userName ? `Congratulations, ${userName}! 🎯` : 'Congratulations! 🎯'}
        </Heading>
        <Text style={text}>
          Your forecast on <strong>"{pollTitle}"</strong> was correct.
          The outcome resolved as <strong>{winningOption}</strong>.
        </Text>
        <Section style={payoutBox}>
          <Text style={payoutLabel}>Your payout</Text>
          <Text style={payoutValue}>{payoutAmount}</Text>
          <Text style={payoutDetail}>Staked: {stakeAmount} • Net profit: calculated after 3.5% platform fee</Text>
        </Section>
        <Text style={text}>
          The payout has been credited to your Econsult Africa wallet.
          You can use it to participate in more forecasts or withdraw via mobile money or bank transfer.
        </Text>
        {pollUrl && (
          <Button style={button} href={pollUrl}>
            View Forecast Details
          </Button>
        )}
        <Hr style={hr} />
        <Text style={text}>
          Your accuracy contributes to better collective intelligence on Africa's economic future.
          Keep forecasting to climb the leaderboard.
        </Text>
        <Text style={footer}>
          — The {SITE_NAME} Forecast Arena Team
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: SettlementWinnerEmail,
  subject: (data: Record<string, any>) =>
    `🎯 Correct prediction — ${data.payoutAmount || 'payout'} credited to your wallet`,
  displayName: 'Forecast settlement — winner',
  previewData: {
    pollTitle: 'Will Kenya\'s inflation breach 5% in Q2 2026?',
    winningOption: 'Yes',
    payoutAmount: '$2.85',
    stakeAmount: '$1.00',
    pollUrl: 'https://econsultafricaweb.lovable.app/forecast-arena/test-poll',
    userName: 'Jane',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Helvetica Neue', Arial, sans-serif" }
const container = { padding: '30px 25px' }
const logo = { margin: '0 0 24px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#1a2744', margin: '0 0 20px' }
const text = { fontSize: '14px', color: '#636b7a', lineHeight: '1.6', margin: '0 0 25px' }
const payoutBox = { backgroundColor: '#f0f7f0', borderRadius: '8px', padding: '20px', margin: '0 0 25px', textAlign: 'center' as const }
const payoutLabel = { fontSize: '12px', color: '#636b7a', margin: '0 0 4px', textTransform: 'uppercase' as const, letterSpacing: '1px' }
const payoutValue = { fontSize: '32px', fontWeight: 'bold' as const, color: '#16a34a', margin: '0 0 8px' }
const payoutDetail = { fontSize: '12px', color: '#636b7a', margin: '0' }
const button = { backgroundColor: '#3660be', color: '#ffffff', fontSize: '14px', borderRadius: '4px', padding: '12px 24px', textDecoration: 'none' }
const hr = { borderColor: '#e5e7eb', margin: '30px 0' }
const footer = { fontSize: '12px', color: '#999999', margin: '0 0 8px' }
