/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Img, Link, Preview, Text, Hr,
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
}

const SettlementLoserEmail = ({
  pollTitle = 'Forecast Question',
  winningOption = 'Yes',
  userOption = 'No',
  stakeAmount = '$1.00',
  arenaUrl,
  userName,
}: SettlementLoserProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Forecast resolved: "{pollTitle}" → {winningOption}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img src={LOGO_URL} alt="Econsult Africa" width="160" height="auto" style={logo} />
        <Heading style={h1}>
          {userName ? `${userName}, your forecast has been resolved` : 'Your forecast has been resolved'}
        </Heading>
        <Text style={text}>
          The question <strong>"{pollTitle}"</strong> has been settled.
          The outcome was <strong>{winningOption}</strong>.
        </Text>
        <Text style={text}>
          You predicted <strong>{userOption}</strong> with a stake of {stakeAmount}.
          Unfortunately, this time the outcome didn't go your way.
        </Text>
        <Text style={text}>
          Every forecast sharpens your analytical edge. The best forecasters learn from
          outcomes and adjust their models. Your participation still contributes valuable
          signal to Africa's collective intelligence.
        </Text>
        {arenaUrl && (
          <Button style={button} href={arenaUrl}>
            Explore Active Forecasts
          </Button>
        )}
        <Hr style={hr} />
        <Text style={text}>
          Check the leaderboard to see how you compare, and keep forecasting to improve your accuracy.
        </Text>
        <Text style={footer}>
          — The {SITE_NAME} Forecast Arena Team
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
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Helvetica Neue', Arial, sans-serif" }
const container = { padding: '30px 25px' }
const logo = { margin: '0 0 24px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#1a2744', margin: '0 0 20px' }
const text = { fontSize: '14px', color: '#636b7a', lineHeight: '1.6', margin: '0 0 25px' }
const button = { backgroundColor: '#3660be', color: '#ffffff', fontSize: '14px', borderRadius: '4px', padding: '12px 24px', textDecoration: 'none' }
const hr = { borderColor: '#e5e7eb', margin: '30px 0' }
const footer = { fontSize: '12px', color: '#999999', margin: '0 0 8px' }
