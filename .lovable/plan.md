

## Phase 1 — Pro Demo Mode SQL Migration (final, approved)

Two adjustments folded in:
1. Migration-email exposure query (Phase 2) uses `pl.settled_at IS NULL` only — no `status` filter.
2. `demo_orders_public` and `demo_listings_public` are **price-level aggregated depth views** (CLOB-standard, à la Polymarket/Kalshi). Plus explicit `REVOKE SELECT ... FROM anon, authenticated` on the underlying tables so the views are the sole public path.

### File

**Create:** `supabase/migrations/20260422_pro_demo_mode.sql`

### What the migration creates

**1. `platform_config`** — single-row toggle.
- `id int primary key check (id=1)`, `pro_mode text default 'demo' check in ('demo','live')`, `updated_at`.
- RLS: public SELECT; service_role UPDATE.
- Seed `(1, 'demo')`.

**2. `demo_wallets`** — 1:1 with `auth.users`.
- `id, user_id unique, balance numeric(15,2) default 100 check (>=0), created_at, updated_at`.
- RLS: user reads own; service_role writes.

**3. `demo_positions`** — mirrors `positions`.
- `(id, user_id, poll_id, option_id, shares numeric(15,4), avg_price numeric(10,4), cost_basis numeric(15,2), created_at, updated_at)` + unique `(user_id, poll_id, option_id)`.
- RLS: user reads own; service_role writes.

**4. `demo_orders`** — mirrors `orders`.
- `(id, user_id, poll_id, option_id, side check in ('buy','sell'), price numeric(10,4), shares numeric(15,4), filled_shares numeric(15,4) default 0, status check in ('open','partial','filled','cancelled','expired'), expires_at, created_at, updated_at)`.
- **RLS — locked down:**
  - `REVOKE SELECT ON demo_orders FROM anon, authenticated;`
  - Owner-only SELECT policy: `auth.uid() = user_id`.
  - Service role full access.
  - Public order-book reads go **only** through `demo_orders_public` view below.

**5. `demo_listings`** — mirrors `listings`.
- `(id, seller_id, buyer_id, poll_id, option_id, shares, price_per_share, total_ask, cost_basis, status check in ('active','sold','cancelled'), created_at, updated_at)`.
- **RLS — locked down:**
  - `REVOKE SELECT ON demo_listings FROM anon, authenticated;`
  - Owner-only SELECT: `auth.uid() in (seller_id, buyer_id)`.
  - Service role full access.
  - Public listings reads go **only** through `demo_listings_public` view.

**6. `demo_trades`** and **`demo_wallet_transactions`** — for activity feed and ledger.
- Standard shape; user reads own; service_role writes.

**7. Public CLOB views (the security boundary):**

```sql
-- Price-level depth, one row per (poll, option, side, price). No order IDs, no users.
create view public.demo_orders_public
with (security_invoker = false) as
select
  poll_id,
  option_id,
  side,
  price,
  sum(shares - filled_shares)::numeric(15,4) as total_shares_at_level,
  count(*)::int                              as order_count_at_level
from public.demo_orders
where status in ('open','partial')
  and shares - filled_shares > 0
group by poll_id, option_id, side, price;

grant select on public.demo_orders_public to anon, authenticated;
```

```sql
-- Listings aggregated to price level, one row per (poll, option, price).
create view public.demo_listings_public
with (security_invoker = false) as
select
  poll_id,
  option_id,
  price_per_share,
  sum(shares)::numeric(15,4) as total_shares_at_level,
  count(*)::int              as listing_count_at_level
from public.demo_listings
where status = 'active'
group by poll_id, option_id, price_per_share;

grant select on public.demo_listings_public to anon, authenticated;
```

This eliminates the partial-fill execution-gaming vector at the schema layer. Owners still see their own raw rows via the base-table policy.

**8. `user_profiles.has_acknowledged_demo boolean not null default false`** — column add for first-time onboarding modal.

**9. Trigger + backfill for `demo_wallets`:**
- Function `create_demo_wallet_for_new_profile()` (`security definer`, `search_path=public`) inserts a `demo_wallets` row on every `INSERT` into `user_profiles`, `ON CONFLICT DO NOTHING`.
- Trigger `after insert on user_profiles`.
- One-shot backfill: `INSERT INTO demo_wallets (user_id) SELECT user_id FROM user_profiles ON CONFLICT DO NOTHING;` — every existing user gets 100 AC.

**10. Atomic `SECURITY DEFINER` RPCs** mirroring the live ones, all writing to `demo_*`:
- `demo_stake_atomic(user, poll, option, amount, entry_price)`
- `demo_buy_shares_atomic`, `demo_sell_shares_atomic`
- `demo_create_listing_atomic`, `demo_buy_listing_atomic`, `demo_cancel_listing_atomic`
- `demo_place_order_atomic`, `demo_cancel_order_atomic`
- `demo_settle_market(poll_id, winning_option_id)` — credits winners' `demo_wallets`, no Paystack.

Each is a functional copy of its live counterpart with table names swapped. Live RPCs untouched.

### What is NOT in this migration

- No changes to `wallets`, `positions`, `orders`, `listings`, `trades`, `votes`, `polls`, `voter_profiles`.
- No Edge Function changes (Phase 2).
- No frontend changes (Phase 2).
- No email template (Phase 2).
- The Phase 2 migration-notification query (drafted, not executed here) will use `pl.settled_at IS NULL` for position exposure — confirmed.

### Acceptance for Phase 1

- Migration runs cleanly.
- `platform_config` has one row, `pro_mode='demo'`.
- Every existing `user_profiles` row has a matching `demo_wallets` row with `balance=100.00`.
- New signup auto-creates a demo wallet (verified by inspecting the trigger).
- `select * from demo_orders` as `anon` or `authenticated` returns **0 rows for non-owners** (RLS + revoke).
- `select * from demo_orders_public` as `anon` returns aggregated depth only — no `id`, no `user_id`, no `filled_shares`.
- Same for `demo_listings` / `demo_listings_public`.
- Zero rows changed in any live-money table.

After you approve and the migration runs, I'll produce Phase 2 in three reviewable batches: Edge Functions → frontend → email template + admin toggle + manual default-withdrawal function.

