

# Pro Forecast Arena Audit — Bugs Found

## Critical Bugs

### Bug 1: `sell-shares` never decrements `poll_options.total_stake_amount`
**Severity: Critical — breaks market pricing**

When a user buys shares, `buy-shares` calls `increment_stake_amount` to increase the option's `total_stake_amount`. But `sell-shares` does NOT decrement it. This means:
- After selling, the AMM price doesn't change
- Capital is removed from a user's position but the market pool still counts it
- Over time, market prices become increasingly inflated and detached from actual capital

The same bug exists in `create-listing` flow — `create_listing_atomic` updates `votes.stake_amount` but does NOT touch `poll_options.total_stake_amount`.

**Fix**: Create a `decrement_stake_amount` DB function and call it from `sell-shares`. Also verify `create_listing_atomic` and `cancel_listing_atomic` properly sync `total_stake_amount`.

### Bug 2: TradingPanel sell display doesn't match backend
**Severity: High — user sees wrong refund amount**

The `TradingPanel` "Adjust position" tab shows sell proceeds as `shares × currentPrice` (market value). But the `sell-shares` backend returns `position.total_cost × (shares / position.shares)` (proportional cost basis). These are different numbers.

Example: User bought 10 shares at $0.30 each ($3.00 total). Price is now $0.70. Frontend shows "Exit entire position — receive $6.44" (10 × $0.70 × 0.965). Backend actually returns $2.90 ($3.00 × 0.965). User expects $6.44 but gets $2.90.

**Fix**: Change TradingPanel sell calculations to use `position.total_cost * sellFraction` instead of `shares * currentPrice`.

## Medium Bugs

### Bug 3: `ExitPositionModal` doesn't invalidate wallet balance
The modal invalidates positions and transactions but never invalidates `["wallet-balance", user.id]`. After exiting a position, the wallet balance display stays stale until something else triggers a refresh.

**Fix**: Add `queryClient.invalidateQueries({ queryKey: ["wallet-balance"] })` to ExitPositionModal's success handler.

### Bug 4: `create_listing_atomic` and `cancel_listing_atomic` don't sync `total_stake_amount`
When shares are listed for sale, capital is removed from the position but `poll_options.total_stake_amount` is unchanged. When a listing is cancelled, same issue. When a listing is sold via `buy_listing_atomic`, the buyer gets shares but `total_stake_amount` isn't updated either. This compounds Bug 1.

**Fix**: Add `total_stake_amount` adjustments to all three atomic functions.

## Minor Issues

### Bug 5: Pro trending section displays vote count, not capital
`ForecastArenaPro.tsx` line 216 shows `t.total_votes` in the trending cards. For a capital-weighted market, this should show total capital committed or at minimum use different labeling.

**Fix**: Either query and display `total_stake_amount` in trending cards, or change the label to "forecasts" instead of showing the raw number as if it's a capital metric.

## Confirmed Working (No Issues)
- `PollDiscussionTabs` correctly uses `basePath` prop ✓
- `PollCardPro` correctly uses `total_stake_amount` for all prices ✓
- `StakeModal` correctly uses `total_stake_amount` ✓
- `buy-shares` edge function correctly uses `total_stake_amount` ✓
- `sell-shares` proportional refund logic is correct ✓
- `WalletTopUpPrompt` triggers on `/forecast-arena-pro` (starts with `/forecast-arena`) ✓
- Cross-system links (MyDashboard, UserProfile, StakeResult) all point to Pro ✓
- Email templates default to Pro URLs ✓
- `UserPollActivity` on Pro detail page shows all events (correct) ✓
- `ExitPositionModal` refund calculation matches backend for full exits ✓

---

## Implementation Plan

### Step 1: Create `decrement_stake_amount` DB function (migration)
```sql
CREATE OR REPLACE FUNCTION public.decrement_stake_amount(p_option_id uuid, p_amount numeric)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
BEGIN
  UPDATE public.poll_options
  SET total_stake_amount = GREATEST(0, total_stake_amount - p_amount)
  WHERE id = p_option_id;
END; $$;
```

### Step 2: Update `sell-shares` edge function
After updating position/deleting it, call `decrement_stake_amount` with the gross amount sold.

### Step 3: Update `create_listing_atomic`, `cancel_listing_atomic`, `buy_listing_atomic` DB functions (migration)
- `create_listing_atomic`: decrement `total_stake_amount` by `cost_basis`
- `cancel_listing_atomic`: increment `total_stake_amount` by `cost_basis`
- `buy_listing_atomic`: no change needed (capital stays in the market, just changes hands)

### Step 4: Fix TradingPanel sell display
Change `Adjust position` tab calculations from `shares * currentPrice` to use `position.total_cost * sellFraction` to match backend behavior.

### Step 5: Fix ExitPositionModal wallet invalidation
Add wallet-balance query invalidation to success handler.

### Step 6: Update Pro trending display
Change trending card metric label from showing raw vote count to something contextually appropriate.

---

**Total changes**: 1 migration (2 new/updated DB functions), 3 edge function deploys, 3 frontend file edits.

