/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'

export interface TemplateEntry {
  component: React.ComponentType<any>
  subject: string | ((data: Record<string, any>) => string)
  to?: string
  displayName?: string
  previewData?: Record<string, any>
}

import { template as purchaseConfirmation } from './purchase-confirmation.tsx'
import { template as settlementWinner } from './settlement-winner.tsx'
import { template as settlementLoser } from './settlement-loser.tsx'
import { template as forecastVoteConfirmation } from './forecast-vote-confirmation.tsx'

export const TEMPLATES: Record<string, TemplateEntry> = {
  'purchase-confirmation': purchaseConfirmation,
  'settlement-winner': settlementWinner,
  'settlement-loser': settlementLoser,
  'forecast-vote-confirmation': forecastVoteConfirmation,
}
