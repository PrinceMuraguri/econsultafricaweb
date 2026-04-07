

## P2P Trade End-to-End Bug Fixes

### Problems Identified

1. **Buyer's "Recent Activity" missing P2P trades** — The activity feed in `MyDashboard.tsx` only shows wallet transactions of type `deposit`, `withdrawal`, `payout`, and `payout_mpesa`. It ignores `share_purchase` and `share_sale` types created by the `buy_listing_atomic` RPC.

2. **Buyer's "My Forecast Positions" not updating** — The "My Forecast Positions" section reads from the `positions` table, and the realtime subscription does invalidate on `positions` changes. However, the query invalidation keys in `PollCard.tsx` after a buy use `["my-positions"]` without the user ID suffix, so they don't match the dashboard's `["my-positions", user.id]` key.

3. **Seller not notified** — The `buy_listing_atomic` RPC and the `buy-listing` edge function do not insert a row into the `notifications` table, so the seller has no idea their listing was bought.

4. **Seller's dashboard not updating in realtime** — The dashboard realtime channel does not subscribe to `listings` table changes. When a listing is sold, the seller's "My Active Listings" section stays stale until the next polling interval (30s).

5. **Mismatched query invalidation keys** — `PollCard.tsx` invalidates `["my-wallet-transactions"]` (no user ID) but the dashboard queries use `["my-wallet-transactions", user.id]`.

### Plan

#### 1. Fix activity feed to show P2P trades (MyDashboard.tsx)

In the `activityFeed` useMemo, add handlers for `share_purchase` and `share_sale` wallet transaction types:
- `share_purchase` → badge "Bought Shares", red amount (debit)
- `share_sale` → badge "Sold Shares", green amount (credit)

#### 2. Fix query key mismatches (PollCard.tsx)

In `handleInlineBuy`, update invalidation calls to include user ID:
- `["my-wallet-transactions"]` → `["my-wallet-transactions", user.id]`
- `["my-positions"]` → `["my-positions", user.id]`

Add additional invalidations:
- `["my-share-positions", user.id]` — so "My Forecast Positions" updates
- `["my-trades", user.id]` — so trade history updates
- `["my-active-listings", user.id]` — so seller's listings update

#### 3. Add seller notification (buy-listing edge function)

After the successful RPC call, insert a notification for the seller:
- Type: `listing_sold`
- Title: "Your listing was bought!"
- Body: "Someone purchased X shares for $Y.YY"
- Include `poll_id` and a link to the poll

#### 4. Add realtime subscription for listings (MyDashboard.tsx)

Add a `listings` table subscription to the existing realtime channel, filtering by `seller_id=eq.${user.id}`. On change, invalidate `["my-active-listings", user.id]`.

#### 5. Add listing_sold to notification kinds in activity feed (MyDashboard.tsx)

Add `listing_sold` to the `notifKinds` set and the `kindConfig` map so sold-listing notifications appear in the activity feed.

#### 6. Deploy updated edge function

Redeploy `buy-listing` after adding the seller notification.

### Technical Details

- **Files modified**: `src/components/forecast/PollCard.tsx`, `src/pages/MyDashboard.tsx`, `supabase/functions/buy-listing/index.ts`
- **Edge function redeployment**: `buy-listing`
- **No database schema changes needed** — all tables and RLS policies already support the required operations

