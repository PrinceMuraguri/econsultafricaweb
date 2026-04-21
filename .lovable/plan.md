

## Admin Dashboard — Improve Identity & Activity Visibility

Add user identity (name + email) to admin tables, expose Poll/Option IDs as clickable links, and make the Trading tab actually show all activity (currently shows only 1 trade because it ignores stakes/listings/orders).

### Why the Trading tab looks "empty"

The DB currently has **1** record in the `trades` table — and that's the only thing `AdminTradingTab` reads. All the staking activity (votes with `is_staked=true`, wallet transactions, P2P listings) is stored in **other** tables. So the tab is technically working but is showing an incomplete picture. We'll broaden it to cover the full trading ecosystem.

### Changes

**1. `src/pages/AdminDashboard.tsx` — Staked Entries tab (~line 690-716)**

Extend the `entries` query select to join the user's profile and fingerprint mapping:
- Fetch `user_profiles` (full_name, username, country) and `auth user email` keyed by `user_id`, with a `voter_profiles` fallback for legacy anon stakes (matched by `voter_fingerprint`).
- Implementation: keep the votes query as-is, but run two follow-up batched lookups (one over distinct `user_id`s → `user_profiles`, one over distinct `voter_fingerprint`s → `voter_profiles` for email/full_name). Merge into each row.

Update the table to show new columns:
| Date | Name | Email | Poll | Option | Stake | Reference |

- **Name** = `user_profiles.full_name` ?? `voter_profiles.full_name` ?? "Anonymous"
- **Email** = `voter_profiles.email` ?? "—" (auth email is not exposed to client; we use the legacy `voter_profiles.email` which is always captured at vote time)
- **Poll** column: shows the poll title (looked up from already-loaded `polls`) and is a clickable link to `/forecast-arena-pro/{slug}` (opens in new tab). Falls back to short ID if title missing.
- **Option** column: shows option label (looked up from `polls.poll_options`), with the short ID below in muted mono.

**2. `src/pages/AdminDashboard.tsx` — All Transactions tab (~line 960-1046)**

Same identity enrichment for both sub-tables:

*All Votes* table — add `Name` and `Email` columns after Date; make Poll ID a clickable link to the poll detail page.

*Payment Transactions* table — add `Name` and `Email` columns after Date (resolved via `voter_fingerprint` → `voter_profiles`).

The poll-link helper will be a small inline component `PollLink({ pollId })` that:
- looks up the poll in the already-loaded `polls` array
- renders `<a href="/forecast-arena-pro/{slug}" target="_blank" class="text-primary hover:underline font-mono">{title || shortId}</a>`
- falls back to `/forecast-arena/{slug}` if the poll is in a `free` category, else Pro route

**3. `src/components/admin/AdminTradingTab.tsx` — Make it the real "Trading Activity" view**

Today: only reads `trades` (1 row exists) and `positions`. Replace with a unified activity feed showing the full trading ecosystem.

New sections (top to bottom):

a. **Stat strip** (6 cards instead of 4):
   - Buy Volume, Sell Volume, Platform Fees, Open Shares, **Active Listings**, **Open Orders**

b. **Live Activity Feed** (new, top of tab) — merged chronological stream of last 100 events from:
   - `trades` (AMM + P2P fills)
   - `votes` where `is_staked=true` (initial stake commitments)
   - `listings` (created/sold/cancelled)
   - `orders` (placed/filled/cancelled)

   Each row shows: timestamp, event type badge (color-coded: stake=orange, buy=green, sell=red, list=amber, order=blue), Name + Email of the user, poll link, option, shares, price, $ amount.

c. **Existing trades table** kept below the feed for raw inspection, with added Name/Email/Poll-link columns.

d. **Realtime subscriptions** (the `AdminDashboard.tsx` global channel already subscribes to `votes`, `trades`, `wallet_transactions`, `positions`). We add a new query key `["admin-trading-activity"]` and wire it into the existing realtime invalidation block so the feed updates live without polling. Also keep `refetchInterval: 15000` as a safety net.

### Technical Details

- **Identity resolution helper** (placed in `AdminDashboard.tsx`, passed to children that need it):
  ```ts
  function useIdentityResolver(userIds: string[], fingerprints: string[]) {
    // batched fetch user_profiles by user_id  → Map<user_id, {full_name, username}>
    // batched fetch voter_profiles by fingerprint → Map<fp, {full_name, email, phone}>
    // returns resolveBy(user_id?, fingerprint?) → { name, email }
  }
  ```
- Auth emails (`auth.users.email`) are **not** queryable from the client. We rely on `voter_profiles.email` which is captured at every stake transaction (already populated in the DB). This is the same approach the existing `payouts` tab uses.
- Pro vs Free poll route: detect by checking if the poll has any record in `votes` with `is_staked=true` OR by `category` field — simpler: always link to `/forecast-arena-pro/{slug}` (admin context — the Pro page handles both modes via a fallback redirect).
- For the AdminTradingTab activity feed, fetch the 4 sources in parallel via `useQueries`, merge client-side, sort by `created_at desc`, slice to 100.

### Files changed
- `src/pages/AdminDashboard.tsx` — Staked Entries table, All Transactions tables, new identity resolver hook
- `src/components/admin/AdminTradingTab.tsx` — full rewrite: stats strip, live activity feed, enriched trades table

No DB migrations required. All data already exists; this is purely a presentation + query layer change.

