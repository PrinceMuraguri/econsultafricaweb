/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Img, Preview, Text, Hr, Section,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'Econsult Africa'
const LOGO_URL = 'https://iysutjnviccsgygpiqfe.supabase.co/storage/v1/object/public/email-assets/econsult-logo.png'

interface SettlementWinnerProps {
  pollTitle?: string
  winningOption?: string
  userOption?: string
  payoutAmount?: string
  stakeAmount?: string
  netGain?: string
  pollUrl?: string
  arenaUrl?: string
  userName?: string
  isStaked?: boolean
}

const SettlementWinnerEmail = ({
  pollTitle = 'Forecast Question',
  winningOption = 'Yes',
  userOption = 'Yes',
  payoutAmount = '$1.00',
  stakeAmount = '$1.00',
  netGain = '$0.00',
  pollUrl,
  arenaUrl = 'https://econsultafricaweb.lovable.app/forecast-arena-pro',
  userName,
  isStaked = false,
}: SettlementWinnerProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>
      {isStaked
        ? `Great call — you got it right and it paid off! 🎯`
        : `Great call — you got this one right! 🎯`}
    </Preview>
    <Body style={main}>
      <Container style={container}>
        <Img src={LOGO_URL} alt="Econsult Africa" width="160" height="auto" style={logo} />
        <Heading style={h1}>
          {userName ? `Hi ${userName},` : 'Hi there,'}
        </Heading>
        <Text style={text}>
          Great call — you got this one right. 🎯
        </Text>
        <Section style={pollInfoBox}>
          <Text style={pollInfoLabel}>Poll:</Text>
          <Text style={pollInfoValue}>{pollTitle}</Text>
          <Text style={pollInfoLabel}>Your prediction:</Text>
          <Text style={pollInfoValue}>{userOption}</Text>
          <Text style={pollInfoLabel}>Correct answer:</Text>
          <Text style={pollInfoValue}>{winningOption}</Text>
        </Section>
        {isStaked ? (
          <>
            <Text style={text}>
              And even better, your conviction paid off:
            </Text>
            <Section style={payoutBox}>
              <Text style={payoutDetail}>Amount staked: <strong>{stakeAmount}</strong></Text>
              <Text style={payoutValue}>Payout: {payoutAmount}</Text>
              <Text style={payoutDetail}>Net gain: <strong>{netGain}</strong></Text>
            </Section>
            <Text style={text}>
              This is where forecasting becomes powerful — not just being right,
              but knowing when to back your view.
            </Text>
            <Text style={text}>
              The goal now is consistency. Keep showing up, keep refining,
              and let your edge compound over time. Navigate to your dashboard
              to view or withdraw earnings.
            </Text>
          </>
        ) : (
          <>
            <Text style={text}>
              This is where forecasting becomes powerful — not just being right,
              but knowing when to back your view.
            </Text>
            <Text style={text}>
              The goal now is consistency. Keep showing up, keep refining,
              and let your edge compound over time. Try our <strong>Commit Capital</strong> feature
              to earn real rewards on your correct predictions next time.
            </Text>
          </>
        )}
        <Button style={button} href={arenaUrl}>
          Make your next forecast
        </Button>
        <Hr style={hr} />
        <Text style={text}>
          Let's see how far you can take this.
        </Text>
        <Text style={footer}>
          — {SITE_NAME} Forecast Arena
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: SettlementWinnerEmail,
  subject: (data: Record<string, any>) =>
    data.isStaked
      ? `🎯 Correct prediction — ${data.payoutAmount || 'payout'} credited to your wallet`
      : `🎯 Great call — you got this one right!`,
  displayName: 'Forecast settlement — winner',
  previewData: {
    pollTitle: 'Will Kenya\'s inflation breach 5% in Q2 2026?',
    winningOption: 'Yes',
    userOption: 'Yes',
    payoutAmount: '$2.85',
    stakeAmount: '$1.00',
    netGain: '$1.85',
    pollUrl: 'https://econsultafricaweb.lovable.app/forecast-arena-pro/test-poll',
    arenaUrl: 'https://econsultafricaweb.lovable.app/forecast-arena-pro',
    userName: 'Jane',
    isStaked: true,
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Helvetica Neue', Arial, sans-serif" }
const container = { padding: '30px 25px' }
const logo = { margin: '0 0 24px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#1a2744', margin: '0 0 20px' }
const text = { fontSize: '14px', color: '#636b7a', lineHeight: '1.6', margin: '0 0 25px' }
const pollInfoBox = { backgroundColor: '#f8f9fa', borderRadius: '8px', padding: '16px 20px', margin: '0 0 25px', borderLeft: '4px solid #3660be' }
const pollInfoLabel = { fontSize: '12px', color: '#999999', margin: '0 0 2px', textTransform: 'uppercase' as const, letterSpacing: '0.5px' }
const pollInfoValue = { fontSize: '14px', color: '#1a2744', fontWeight: 'bold' as const, margin: '0 0 12px' }
const payoutBox = { backgroundColor: '#f0f7f0', borderRadius: '8px', padding: '20px', margin: '0 0 25px', textAlign: 'center' as const }
const payoutValue = { fontSize: '32px', fontWeight: 'bold' as const, color: '#16a34a', margin: '0 0 8px' }
const payoutDetail = { fontSize: '14px', color: '#636b7a', margin: '0 0 4px' }
const button = { backgroundColor: '#3660be', color: '#ffffff', fontSize: '14px', borderRadius: '4px', padding: '12px 24px', textDecoration: 'none' }
const hr = { borderColor: '#e5e7eb', margin: '30px 0' }
const footer = { fontSize: '12px', color: '#999999', margin: '0 0 8px' }
