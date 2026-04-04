/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Img, Preview, Text, Hr,
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
          You've submitted a forecast on the Econsult Africa Forecast Arena. Here's a summary of your position:
        </Text>

        <table width="100%" cellPadding="0" cellSpacing="0" style={table}>
          <tbody>
            <tr>
              <td style={tdLabel}>Question</td>
              <td style={tdValue}>{pollTitle}</td>
            </tr>
            <tr>
              <td style={tdLabel}>Your forecast</td>
              <td style={tdValue}>{selectedOption}</td>
            </tr>
            <tr>
              <td style={tdLabel}>Resolution date</td>
              <td style={tdValue}>{resolutionDate}</td>
            </tr>
            {isStaked && capitalCommitted ? (
              <tr>
                <td style={tdLabel}>Capital committed</td>
                <td style={tdValue}>{capitalCommitted}</td>
              </tr>
            ) : null}
            {isStaked && expectedReturn ? (
              <tr>
                <td style={tdLabel}>Expected payout if correct</td>
                <td style={tdValueGreen}>{expectedReturn}</td>
              </tr>
            ) : null}
          </tbody>
        </table>

        {isStaked ? (
          <Text style={text}>
            Your capital is now committed. If <strong>{selectedOption}</strong> resolves correctly,
            you'll receive your payout automatically — credited to your wallet within minutes of settlement.
            A 3.5% platform fee applies on winnings.
          </Text>
        ) : (
          <Text style={text}>
            You can strengthen your position by committing capital. If <strong>{selectedOption}</strong> resolves correctly,
            you earn a payout proportional to your stake.
          </Text>
        )}

        <Text style={text}>
          You can also trade your position on the order book before resolution — buy more shares or sell if the market moves in your favour.
        </Text>

        <Button style={button} href={pollUrl || arenaUrl}>
          {pollUrl ? 'View Your Forecast' : 'Browse Active Forecasts'}
        </Button>

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
    pollTitle: "Will Kenya's inflation breach 5% in Q2 2026?",
    selectedOption: 'Yes',
    resolutionDate: 'June 30, 2026',
    capitalCommitted: '$5.00',
    expectedReturn: '~$9.66',
    pollUrl: 'https://econsult.africa/forecast-arena',
    userName: 'Jane',
    isStaked: true,
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Helvetica Neue', Arial, sans-serif" }
const container = { padding: '30px 25px' }
const logo = { margin: '0 0 24px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#1a2744', margin: '0 0 20px' }
const text = { fontSize: '14px', color: '#636b7a', lineHeight: '1.6', margin: '0 0 20px' }
const table = { borderCollapse: 'collapse' as const, backgroundColor: '#f8f9fc', borderRadius: '8px', marginBottom: '24px' }
const tdLabel = { fontSize: '12px', color: '#9ca3af', padding: '8px 16px 4px', textTransform: 'uppercase' as const, letterSpacing: '0.5px', width: '45%', verticalAlign: 'top' as const }
const tdValue = { fontSize: '14px', color: '#1a2744', fontWeight: 'bold' as const, padding: '8px 16px 4px', verticalAlign: 'top' as const }
const tdValueGreen = { fontSize: '14px', color: '#16a34a', fontWeight: 'bold' as const, padding: '8px 16px 4px', verticalAlign: 'top' as const }
const button = { backgroundColor: '#3660be', color: '#ffffff', fontSize: '14px', borderRadius: '4px', padding: '12px 24px', textDecoration: 'none' }
const hr = { borderColor: '#e5e7eb', margin: '30px 0' }
const footer = { fontSize: '12px', color: '#999999', margin: '0 0 8px' }
