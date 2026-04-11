

# Plan: Split User Dashboard into Free Forecasts & Pro Trading Tabs

## Overview

Restructure `MyDashboard.tsx` from a single mixed view into two tabs: **Free Forecasts** (sentiment-only) and **Pro Trading** (all financial data). The file is already 1,444 lines, so we'll extract the tab content into separate components for maintainability.

## Architecture

```text
MyDashboard.tsx (shell: auth, queries, profile card, tab bar, modals)
├── FreeForecastsTab.tsx (free stats, free activity, active/resolved free forecasts, Pro upsell)
└── ProTradingTab.tsx (pro stats, quick actions, pro activity, positions, listings, resolved, wallet, trades, payouts, deposit/withdraw)
```

## Key Design Decisions

**Double-counting prevention** — the discriminator for Free vs Pro:
- **Free**: `is_staked === false` AND no `positions` record AND no `payment_reference`
- **Pro**: `is_staked === true` OR has `positions` record OR has `payment_reference`

This handles all 5 edge cases from the document (free-only, pro-only, upgraded, fully-exited, P2P buyer with no vote).

**Tab auto-selection**: Default to Pro if user has any capital activity; otherwise Free. URL param `?tab=pro|free` overrides.

**Link routing**: Free tab links → `/forecast-arena/{slug}`, Pro tab links → `/forecast-arena-pro/{slug}`.

## Changes

### 1. Modify `src/pages/MyDashboard.tsx`
- Add `dashboardMode` state (`"free" | "pro"`) with URL param and auto-detect logic
- Add `payment_reference` to the votes select query (line ~135)
- Add `payment_reference` to the `Position` interface
- Compute `freePositions` and `proPositions` via `useMemo` filters
- Compute split stats (free: 3 cards; pro: 5 cards)
- Compute split activity feeds
- Render tab bar below profile card
- Conditionally render `<FreeForecastsTab>` or `<ProTradingTab>`
- Move deposit/withdraw buttons and modals into Pro tab content
- Keep profile card + wallet balance visible on both tabs (wallet as CTA for Free users)

### 2. Create `src/components/dashboard/FreeForecastsTab.tsx`
- 3-card stats grid: Active Forecasts, Resolved, Accuracy
- Free activity feed (votes + comment replies only, no financial items)
- Active free forecasts with "Commit Capital →" CTA linking to Pro detail page
- Resolved free forecasts with correct/incorrect badges + upsell copy for correct predictions
- Pro upsell banner (shown if accuracy > 50% and 3+ resolved)

### 3. Create `src/components/dashboard/ProTradingTab.tsx`
- 5-card stats grid: Wallet, Active Positions, Capital Committed, Total Earnings, Accuracy
- Quick actions row: Add Funds, Withdraw, Browse Pro Markets
- Pro activity feed (stakes, deposits, withdrawals, payouts, P2P trades, settlement notifications)
- Active Pro positions (using `total_stake_amount` ratio for market price, not `total_votes_count`)
- My Active Listings (P2P marketplace)
- Share Positions (from positions table)
- Closed Pro positions with P&L
- Wallet Activity table
- Trade History table
- Payouts History table
- Section quick-nav links

### No backend changes needed
The split is purely frontend presentation. All existing queries, edge functions, and tables remain unchanged. The only query modification is adding `payment_reference` to the votes select.

## Technical Notes

- Pro market price calculation uses `total_stake_amount` ratio (capital-weighted), not `total_votes_count`
- The `my-positions` query currently uses `.select("*")` which already fetches `payment_reference` — but we need to propagate it through the Position interface and mapping
- Poll options data for stake-weighted pricing is already fetched in the existing query (line 172: `poll_options!poll_options_poll_id_fkey(*)`)
- Realtime subscriptions remain unchanged — both tabs read from the same invalidated queries

