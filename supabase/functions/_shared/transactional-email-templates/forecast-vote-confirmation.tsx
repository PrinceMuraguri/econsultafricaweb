/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Img, Preview, Text, Hr, Section,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'Econsult Africa'
const LOGO_URL = 'https://iysutjnviccsgygpiqfe.supabase.co/storage/v1/object/public/email-assets/econsult-logo.png'

interface ForecastVoteConfirmationProps {
  pollTitle?: string
  selectedOption?: string
  resolutionDate?: string
  capitalCommitted?: string
  expectedReturn?: string
  pollUrl?: string
  arenaUrl?: string
  userName?: string
  isStaked?: boolean
}

const ForecastVoteConfirmationEmail = ({
  pollTitle = 'Forecast Question',
  selectedOption = 'Yes',
  resolutionDate = 'TBD',
  capitalCommitted,
  expectedReturn,
  pollUrl,
  arenaUrl = 'https://econsult.africa/forecast-arena',
  userName,
  isStaked = false,
}: ForecastVoteConfirmationProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Forecast confirmed: "{pollTitle}" → {selectedOption}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img src={LOGO_URL} alt="Econsult Africa" width="160" height="auto" style={logo} />
        <Heading style={h1}>
          {userName ? `${userName}, your forecast is locked in` : 'Your forecast is locked in'}
        </Heading>
        <Text style={text}>
          You've submitted a forecast on the Econsult Africa Forecast Arena.
          Here's a summary of your position:
        </Text>

        <Section style={summaryBox}>
          <Text style={summaryRow}>
            <span style={summaryLabel}>Question</span>
            <span style={summaryValue}>{pollTitle}</span>
          </Text>
          <Text style={summaryRow}>
            <span style={summaryLabel}>Your forecast</span>
            <span style={summaryValue}>{selectedOption}</span>
          </Text>
          <Text style={summaryRow}>
            <span style={summaryLabel}>Resolution date</span>
            <span style={summaryValue}>{resolutionDate}</span>
          </Text>
          {isStaked && capitalCommitted && (
            <Text style={summaryRow}>
              <span style={summaryLabel}>Capital committed</span>
              <span style={summaryValue}>{capitalCommitted}</span>
            </Text>
          )}
          {isStaked && expectedReturn && (
            <Text style={summaryRow}>
              <span style={summaryLabel}>Expected payout if correct</span>
              <span style={summaryValueGreen}>{expectedReturn}</span>
            </Text>
          )}
        </Section>

        {isStaked ? (
          <Text style={text}>
            Your capital is now committed. If <strong>{selectedOption}</strong> is the correct outcome,
            you'll receive your payout automatically — credited to your wallet within minutes of settlement.
            The platform deducts a 3.5% fee on winnings.
          </Text>
        ) : (
          <Text style={text}>
            You can strengthen your position by committing capital to your forecast.
            If <strong>{selectedOption}</strong> resolves correctly, you earn a payout proportional to your stake.
          </Text>
        )}

        <Text style={text}>
          You can also trade your position on the order book before resolution — buy more shares or
          sell your position if the market moves in your favour.
        </Text>

        {pollUrl ? (
          <Button style={button} href={pollUrl}>
            View Your Forecast
          </Button>
        ) : (
          <Button style={button} href={arenaUrl}>
            Browse Active Forecasts
          </Button>
        )}

        <Hr style={hr} />
        <Text style={footer}>
          — The {SITE_NAME} Forecast Arena Team
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: ForecastVoteConfirmationEmail,
  subject: (data: Record<string, any>) =>
    `Forecast confirmed: "${data.pollTitle || 'Question'}" → ${data.selectedOption || 'submitted'}`,
  displayName: 'Forecast vote confirmation',
  previewData: {
    pollTitle: 'Will Kenya\'s inflation breach 5% in Q2 2026?',
    selectedOption: 'Yes',
    resolutionDate: 'June 30, 2026',
    capitalCommitted: '$5.00',
    expectedReturn: '~$9.66',
    pollUrl: 'https://econsult.africa/forecast-arena/test-poll',
    userName: 'Jane',
    isStaked: true,
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Helvetica Neue', Arial, sans-serif" }
const container = { padding: '30px 25px' }
const logo = { margin: '0 0 24px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#1a2744', margin: '0 0 20px' }
const text = { fontSize: '14px', color: '#636b7a', lineHeight: '1.6', margin: '0 0 20px' }
const summaryBox = { backgroundColor: '#f8f9fc', borderRadius: '8px', padding: '20px', margin: '0 0 24px', borderLeft: '4px solid #3660be' }
const summaryRow = { fontSize: '14px', margin: '0 0 10px', display: 'block' as const }
const summaryLabel = { color: '#9ca3af', fontSize: '12px', display: 'block' as const, marginBottom: '2px', textTransform: 'uppercase' as const, letterSpacing: '0.5px' }
const summaryValue = { color: '#1a2744', fontWeight: 'bold' as const, fontSize: '14px' }
const summaryValueGreen = { color: '#16a34a', fontWeight: 'bold' as const, fontSize: '14px' }
const button = { backgroundColor: '#3660be', color: '#ffffff', fontSize: '14px', borderRadius: '4px', padding: '12px 24px', textDecoration: 'none' }
const hr = { borderColor: '#e5e7eb', margin: '30px 0' }
const footer = { fontSize: '12px', color: '#999999', margin: '0 0 8px' }
