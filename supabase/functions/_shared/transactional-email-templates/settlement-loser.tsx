/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Img, Preview, Text, Hr,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'Econsult Africa'
const LOGO_URL = 'https://iysutjnviccsgygpiqfe.supabase.co/storage/v1/object/public/email-assets/econsult-logo.png'

interface SettlementLoserProps {
  pollTitle?: string
  winningOption?: string
  userOption?: string
  stakeAmount?: string
  arenaUrl?: string
  userName?: string
  isStaked?: boolean
}

const SettlementLoserEmail = ({
  pollTitle = 'Forecast Question',
  winningOption = 'Yes',
  userOption = 'No',
  stakeAmount = '$1.00',
  arenaUrl = 'https://econsultafricaweb.lovable.app/forecast-arena',
  userName,
  isStaked = false,
}: SettlementLoserProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>This one didn't go your way — and that's {isStaked ? 'part of the process' : 'okay'}.</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img src={LOGO_URL} alt="Econsult Africa" width="160" height="auto" style={logo} />
        <Heading style={h1}>
          {userName ? `Hi ${userName},` : 'Hi there,'}
        </Heading>
        {isStaked ? (
          <>
            <Text style={text}>
              This one didn't go your way — and that's part of the process.
            </Text>
            <Text style={text}>
              Here's how it played out:
            </Text>
            <Text style={detailText}>
              • Amount staked: <strong>{stakeAmount}</strong>{'\n'}
              • Outcome: Did not match your forecast
            </Text>
            <Text style={text}>
              The best forecasters aren't right every time — they improve faster
              than others. Take a moment to reflect on what informed your view
              and how the outcome differed.
            </Text>
            <Text style={text}>
              That's where your edge is built.
            </Text>
          </>
        ) : (
          <>
            <Text style={text}>
              This one didn't go your way — and that's okay.
            </Text>
            <Text style={text}>
              Forecasting is a skill built over time. Each prediction helps you
              refine how you interpret information and uncertainty.
            </Text>
            <Text style={text}>
              Stay in the game — consistency is what separates top forecasters.
            </Text>
          </>
        )}
        <Button style={button} href={arenaUrl}>
          {isStaked ? 'Try another forecast' : 'Make your next prediction'}
        </Button>
        <Hr style={hr} />
        <Text style={text}>
          {isStaked
            ? 'Stay consistent — your accuracy (and returns) improve over time.'
            : 'Every call sharpens your edge. Keep going.'}
        </Text>
        <Text style={footer}>
          — {SITE_NAME} Forecast Arena
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: SettlementLoserEmail,
  subject: (data: Record<string, any>) =>
    `Forecast resolved: "${data.pollTitle || 'Question'}" → ${data.winningOption || 'settled'}`,
  displayName: 'Forecast settlement — loser',
  previewData: {
    pollTitle: 'Will Kenya\'s inflation breach 5% in Q2 2026?',
    winningOption: 'Yes',
    userOption: 'No',
    stakeAmount: '$1.00',
    arenaUrl: 'https://econsultafricaweb.lovable.app/forecast-arena',
    userName: 'John',
    isStaked: true,
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Helvetica Neue', Arial, sans-serif" }
const container = { padding: '30px 25px' }
const logo = { margin: '0 0 24px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#1a2744', margin: '0 0 20px' }
const text = { fontSize: '14px', color: '#636b7a', lineHeight: '1.6', margin: '0 0 25px' }
const detailText = { fontSize: '14px', color: '#636b7a', lineHeight: '1.8', margin: '0 0 25px', whiteSpace: 'pre-line' as const }
const button = { backgroundColor: '#3660be', color: '#ffffff', fontSize: '14px', borderRadius: '4px', padding: '12px 24px', textDecoration: 'none' }
const hr = { borderColor: '#e5e7eb', margin: '30px 0' }
const footer = { fontSize: '12px', color: '#999999', margin: '0 0 8px' }
