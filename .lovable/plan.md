

# Plan: Split Forecast Arena into Free + Pro (Capital Markets)

## Summary

Split the current Forecast Arena into two distinct systems sharing the same poll data: a **Free** sentiment-polling system (homepage `/`) and a **Pro** capital-weighted prediction market (`/forecast-arena-pro`). The core financial fix: Pro share prices derive from `total_stake_amount` (capital distribution), not `total_votes_count` (raw votes), making the prediction market financially sound.

---

## Implementation Phases

We will execute this in 8 batches, each deployable and testable independently.

### Batch 1: Create PollCardPro component + Pro pages + routing

**New files:**
- `src/components/forecast/PollCardPro.tsx` — Fork of current PollCard with:
  - All price calculations switched from `total_votes_count` to `total_stake_amount`
  - No free voting — clicking an option opens StakeModal (capital required)
  - `handleAuthSuccess` opens capital modal instead of casting free vote
  - All internal links use `/forecast-arena-pro/{slug}`
  - Consensus label shows "Market Price" instead of "consensus"
  - Displays `$X committed` per option
  - Real-time subscription includes `total_stake_amount` updates
- `src/pages/ForecastArenaPro.tsx` — Pro homepage with:
  - "Forecast Arena Pro" title with gold/amber Pro badge
  - Auth gate (sign-in CTA if not logged in)
  - Wallet balance display + WalletTopUpPrompt
  - Uses PollCardPro, same filters/search/trending as free
  - Link back to free arena
- `src/pages/ForecastPollDetailPro.tsx` — Pro detail page with:
  - PollCardPro, ListingsPanel, TradingPanel (all trading UI)
  - Charts, discussion tabs, context sections
  - Back link to `/forecast-arena-pro`

**Modified files:**
- `src/App.tsx` — Add 2 new routes
- `src/components/Navbar.tsx` — Add "Forecast Arena Pro" nav link with Pro badge
- `public/sitemap.xml` — Add Pro URL entry

### Batch 2: Strip capital features from free PollCard

**Modified: `src/components/forecast/PollCard.tsx`**
- Remove imports: StakeModal, ExitPositionModal, ListSharesModal, TradingWaitlistModal
- Remove state: stakeOpen, stakeOption, exitModalOpen, listOpen, savedListInfo, waitlistOpen, hasCommitted
- Remove queries: userStake, userPositions, userListings
- Remove: handleAllocate, "Commit Capital" nudge, "Your Position" panel, all trading modals
- Keep: handleVote (free voting), vote detection, real-time subscription, consensus from `total_votes_count`, auth prompts, BookmarkToggle, SharePopover

### Batch 3: Simplify free detail page + add cross-promotion

**Modified: `src/pages/ForecastPollDetail.tsx`**
- Remove ListingsPanel import and render
- Remove TradingPanel-related state/imports (if any remain)
- Add cross-promotion card: "Want to back your forecasts with real capital? Try Forecast Arena Pro"

**Modified: `src/pages/ForecastArena.tsx`**
- Remove WalletTopUpPrompt import
- Add Pro cross-promotion banner below hero section
- Add subtle "Free" label near page title

### Batch 4: Switch Pro-only frontend components to `total_stake_amount`

**Modified files:**
- `src/components/forecast/TradingPanel.tsx` — 5 price calculation locations: `totalVotes` → `totalStake` using `total_stake_amount`
- `src/components/forecast/StakeModal.tsx` — 3 locations: sharePrice, optionPct, display label → "market price"
- `src/components/forecast/OrderBookModal.tsx` — 3 locations: ammPrice calculation
- `src/components/forecast/PollDiscussionTabs.tsx` — Add `basePath` prop (default `/forecast-arena`), pass `/forecast-arena-pro` from Pro detail page

### Batch 5: Fix backend edge functions

**Modified files:**
- `supabase/functions/buy-shares/index.ts` — Price calc: `total_stake_amount`. Email URL → Pro
- `supabase/functions/sell-shares/index.ts` — Price calc: `total_stake_amount`. **Critical bug fix**: partial sell refund is proportional (`grossAmount = total_cost * (shares / position.shares)`) instead of refunding entire `total_cost`
- `supabase/functions/place-order/index.ts` — AMM price calc: `total_stake_amount`
- `supabase/functions/settle-market/index.ts` — Notification/email links → `/forecast-arena-pro/`
- `supabase/functions/paystack-webhook/index.ts` — Email URL → Pro

### Batch 6: Update all cross-system links

**Frontend links to Pro (capital context):**
- `src/pages/MyDashboard.tsx` — Position/listing/activity links → `/forecast-arena-pro/{slug}`, add "Trade in Pro" button
- `src/pages/UserProfile.tsx` — Position/history links → `/forecast-arena-pro/{slug}`
- `src/pages/StakeResult.tsx` — "Back" links → `/forecast-arena-pro`

**Email template defaults:**
- `forecast-vote-confirmation.tsx` — Default arenaUrl → Pro
- `settlement-winner.tsx` — Preview pollUrl → Pro
- `settlement-loser.tsx` — Preview arenaUrl → Pro

**Keep as-is (free context):** ForecastArena.tsx trending links, free PollCard links, Watchlist links, ForecastPollDetail back links, existing App.tsx redirects

### Batch 7: UI polish and visual differentiation

- Pro page: Persistent amber/gold "Pro — Capital Markets" ribbon/banner
- Free page: Subtle "Free" label
- How It Works links: linked from Pro, simplified note on Free
- ForecastWidget: uses simplified free PollCard automatically, add "Try Pro" link
- MyDashboard: prominent "Trade in Forecast Arena Pro →" button

### Batch 8: Deploy edge functions and end-to-end testing

- Deploy all modified edge functions
- Test free voting flow (no capital UI visible)
- Test Pro capital commitment flow (no free voting possible)
- Test settlement (only capital-committed users affected)
- Test partial sell fix in sell-shares
- Verify cross-links navigate correctly

---

## Technical Details

### Price formula change (the core fix)
```
// Free: consensus = total_votes_count / sum(total_votes_count)
// Pro:  price     = total_stake_amount / sum(total_stake_amount)
//       Clamped to [0.05, 0.95]
```

### Critical bug fix in sell-shares
The current code refunds the ENTIRE `position.total_cost` regardless of shares sold. The fix makes it proportional:
```typescript
const sellFraction = shares / position.shares;
const grossAmount = parseFloat((position.total_cost * sellFraction).toFixed(2));
```

### Zero-stake bootstrapping
When no capital is committed on a Pro poll, price defaults to $0.50. UI shows "No capital committed yet — be the first."

### Cross-system vote interaction
A user can vote free, then later commit capital on Pro. The `buy-shares` function already handles this upgrade from `is_staked: false` to `true`. No migration needed.

### No database changes required
Both `total_votes_count` and `total_stake_amount` already exist in `poll_options`. All existing data works as-is.

---

## File inventory

| Action | Count | Files |
|--------|-------|-------|
| Create | 3 | PollCardPro.tsx, ForecastArenaPro.tsx, ForecastPollDetailPro.tsx |
| Modify (frontend) | 13 | PollCard.tsx, TradingPanel.tsx, StakeModal.tsx, OrderBookModal.tsx, PollDiscussionTabs.tsx, ForecastArena.tsx, ForecastPollDetail.tsx, MyDashboard.tsx, UserProfile.tsx, StakeResult.tsx, App.tsx, Navbar.tsx, sitemap.xml |
| Modify (backend) | 5 | buy-shares, sell-shares, place-order, settle-market, paystack-webhook |
| Modify (email) | 3 | forecast-vote-confirmation.tsx, settlement-winner.tsx, settlement-loser.tsx |

