

## Phase 2 — Batch 1: Edge Function Routing for Demo/Live

Both adjustments accepted:
- **`paystack-webhook`**: Pro-reference events in demo mode log via `console.error("[PRO_REFERENCE_IN_DEMO_MODE]", ...)` with the full event payload (reference, user_id, amount, metadata, event_type, full event object) so logs are greppable. HTTP response stays `200`.
- **`_shared/` correction noted**. The project does use `_shared/` (e.g. settle-market imports email templates). For this batch I'm keeping the prelude inline-duplicated to avoid mid-batch refactor risk; **all 13 copies will be byte-identical** for grep auditability. Centralizing into `_shared/pro-mode.ts` is queued as a follow-up at the end of Batch 3.

---

### The byte-identical prelude (12 lines, in every Pro function)

Placed immediately after `const supabase = createClient(...)` and before any business logic:

```ts
// Pro mode dispatch: fail-closed to demo
const { data: __cfg, error: __cfgErr } = await supabase
  .from("platform_config")
  .select("pro_mode")
  .eq("id", 1)
  .maybeSingle();
const proMode: "demo" | "live" =
  !__cfgErr && __cfg?.pro_mode === "live" ? "live" : "demo";
```

Single grep target: `Pro mode dispatch: fail-closed to demo`. If we ever see drift, one line catches all 13 files.

---

### Per-function changes

**1. `stake-checkout/index.ts`** — Dual-mode rewrite.
- After validation, branch on `proMode`.
- **Demo branch**: skip Paystack, skip transactions table, skip FX. Call `supabase.rpc("demo_stake_atomic", { p_user_id: user_id, p_poll_id, p_option_id, p_amount: amount, p_entry_price: entry_price ?? 0.5 })`. Requires `user_id` in body (frontend already sends it for logged-in users). If missing, return 400 `"Demo mode requires authenticated user"`. Return synthetic `{ demo: true, success: true, ...rpc.data }` so the frontend recognizes "no redirect needed".
- **Live branch**: existing Paystack flow unchanged.

**2. `verify-stake/index.ts`** — Demo no-op.
- After parsing `{ reference }`, branch on `proMode`.
- **Demo**: return `{ demo: true, skipped: true, message: "Verification not required in demo mode" }` with `200`.
- **Live**: existing flow unchanged.

**3. `paystack-webhook/index.ts`** — Selective demo no-op (Pro refs only).
- Inside the `charge.success` handler, **after parsing the event** but before processing, classify the reference:
  - `wallet_deposit` metadata type OR reference starts with `stake_` → Pro reference.
  - Inside `transfer.*` handlers, references starting with `withdraw_` or `payout_` → Pro reference.
  - Marketplace references (no `stake_`/`withdraw_`/`payout_` prefix, no `wallet_deposit` metadata) → never blocked.
- For Pro references in demo mode:
  ```ts
  console.error("[PRO_REFERENCE_IN_DEMO_MODE]", JSON.stringify({
    event_type: event.event,
    reference: event.data?.reference,
    user_id: event.data?.metadata?.user_id ?? null,
    amount: event.data?.amount ?? null,
    metadata: event.data?.metadata ?? null,
    full_event: event,
  }));
  return new Response(JSON.stringify({ received: true, demo_mode_skipped: true }), {
    status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
  ```
- Marketplace references continue normally regardless of `pro_mode`.

**4. `withdraw/index.ts`** — Demo returns 503.
- After auth + body parse, branch on `proMode`.
- **Demo**: return `{ error: "Withdrawals are disabled in demo mode. Arena Coins have no cash value.", demo: true }` with `503`. No table writes, no Paystack calls.
- **Live**: existing flow unchanged.

**5. `run-payouts/index.ts`** — Demo returns 503.
- After admin_key check + body parse, branch on `proMode`.
- **Demo**: return `{ error: "Payouts are disabled in demo mode", demo: true }` with `503`.
- **Live**: existing wallet/M-Pesa payout flow unchanged.

**6. `place-order/index.ts`** — Dual-mode.
- After auth + input validation, branch on `proMode`.
- **Demo**: call `supabase.rpc("demo_place_order_atomic", { p_user_id: user.id, p_poll_id, p_option_id, p_side: side, p_price: price ?? 0.5, p_shares: shares })`. Return `{ demo: true, ...rpc.data }`. (No matching engine in demo — orders rest until manually cancelled or filled by counter-orders. Phase 2 batch 2 frontend can show this clearly.)
- **Live**: existing CLOB matching engine unchanged.

**7. `buy-shares/index.ts`** — Dual-mode.
- After auth + validation + AMM price calc, branch on `proMode`.
- **Demo**: call `supabase.rpc("demo_buy_shares_atomic", { p_user_id: user.id, p_poll_id, p_option_id, p_shares: shares, p_price: currentPrice })`. Skip wallet/positions/trades/votes/email — RPC handles wallet, positions, trades, ledger. Return `{ demo: true, ...rpc.data }`.
- **Live**: existing flow unchanged.

**8. `sell-shares/index.ts`** — Dual-mode.
- After auth + validation + AMM price calc, branch on `proMode`.
- **Demo**: call `supabase.rpc("demo_sell_shares_atomic", { p_user_id: user.id, p_poll_id, p_option_id, p_shares: shares, p_price: currentPrice })`. Return `{ demo: true, ...rpc.data }`.
- **Live**: existing flow unchanged.

**9. `create-listing/index.ts`** — Dual-mode.
- **Demo**: call `supabase.rpc("demo_create_listing_atomic", { p_seller_id: user.id, p_poll_id, p_option_id, p_shares: Number(shares), p_price_per_share: Number(price_per_share) })`.
- **Live**: existing `create_listing_atomic` call unchanged.

**10. `buy-listing/index.ts`** — Dual-mode.
- **Demo**: call `supabase.rpc("demo_buy_listing_atomic", { p_buyer_id: user.id, p_listing_id })`. Notification block also runs in demo, reading `demo_listings` instead of `listings` for seller_id/poll_id/shares/total_ask, and uses the same `notifications` table (notifications are not currency).
- **Live**: existing `buy_listing_atomic` + `listings` notification path unchanged.

**11. `cancel-listing/index.ts`** — Dual-mode.
- **Demo**: call `supabase.rpc("demo_cancel_listing_atomic", { p_listing_id, p_seller_id: user.id })`.
- **Live**: existing `cancel_listing_atomic` call unchanged.

**12. `cancel-order/index.ts`** — Dual-mode.
- **Demo**: call `supabase.rpc("demo_cancel_order_atomic", { p_order_id: order_id, p_user_id: user.id })`.
- **Live**: existing inline order-cancel + wallet-refund logic unchanged.

**13. `settle-market/index.ts`** — Dual-mode with skips.
- After auth + poll validation + winning option check, branch on `proMode`.
- **Demo branch**:
  1. Skip live `cancel_listing_atomic` loop. Instead, mark all `demo_listings` for this poll with `status='active'` → `'cancelled'` directly.
  2. Skip live `payouts` table inserts and live `wallets`/`wallet_transactions` credits.
  3. Call `supabase.rpc("demo_settle_market", { p_poll_id: poll_id, p_winning_option_id: winning_option_id })` — credits demo wallets.
  4. Update `polls` row exactly as in live (status='settled', outcome, winning_option_id, settled_at, settled_by). This must run in both modes — Free tier and AI scoring depend on it.
  5. **Still call** `score_ai_predictions_for_poll` — Brier scoring is currency-agnostic.
  6. **Still insert** in-app `notifications` for ALL voters (winners and losers) — these are currency-agnostic engagement signals. The body text uses dollar amounts from `votes.stake_amount`; for demo we'll keep showing those values but **prepend "(demo)"** to position-related lines (e.g., `You staked $X.XX (demo)`). This is a deliberate, minimal change inside the existing notification builders.
  7. **Skip** `settlement-winner` and `settlement-loser` transactional emails entirely. They reference dollar payouts and are unsuitable for demo. (No silent attempt — just skip the `emailPromises` push.)
- **Live branch**: existing flow exactly as today.

---

### Validation tests (after deploy)

For each function in current state (`pro_mode='demo'`):

| Test | Expected |
|---|---|
| `stake-checkout` with valid body | `200`, `{ demo: true, success: true }`, `demo_wallets` debited, `demo_positions` upserted, no `transactions` row |
| `verify-stake` with any reference | `200`, `{ demo: true, skipped: true }` |
| `withdraw` with valid auth | `503`, `{ error: "...disabled in demo mode...", demo: true }` |
| `run-payouts` with admin_key | `503`, `{ error: "...disabled in demo mode", demo: true }` |
| `paystack-webhook` simulated `charge.success` with `stake_*` ref | `200`, console.error log with `[PRO_REFERENCE_IN_DEMO_MODE]` prefix, no DB writes to `wallets`/`votes`/`positions` |
| `paystack-webhook` simulated `charge.success` with marketplace ref (no Pro prefix, no `wallet_deposit` metadata) | Processes normally |
| `place-order` / `buy-shares` / `sell-shares` / `create-listing` / `buy-listing` / `cancel-listing` / `cancel-order` | Each returns `{ demo: true, ... }` from the corresponding `demo_*_atomic` RPC; no rows in live `wallets` / `positions` / `orders` / `listings` / `trades` |
| `settle-market` on a test poll | Polls row settled, AI scoring runs, in-app notifications inserted, **zero** writes to `payouts` / `wallets` / `wallet_transactions`, **zero** `settlement-*` emails, demo winners credited via `demo_settle_market` |

After live testing:
- Manually flip `platform_config.pro_mode='live'` via SQL, re-run `stake-checkout` smoke test, confirm Paystack initialization URL returned. Flip back to `'demo'`.
- Manually corrupt `platform_config` (set `pro_mode='typo'`) and confirm `stake-checkout` routes to demo (fail-closed verification). Restore.

---

### Files modified (13)

`stake-checkout/index.ts`, `verify-stake/index.ts`, `paystack-webhook/index.ts`, `withdraw/index.ts`, `run-payouts/index.ts`, `place-order/index.ts`, `buy-shares/index.ts`, `sell-shares/index.ts`, `create-listing/index.ts`, `buy-listing/index.ts`, `cancel-listing/index.ts`, `cancel-order/index.ts`, `settle-market/index.ts`.

Untouched: `paystack-checkout` (marketplace), `agent-api`, `auto-forecast`, `admin-polls`, `report-download`, all email functions, all `_shared/`.

After approval and successful deploy + smoke tests, Batch 2 (frontend: DemoBanner, DemoOnboardingModal, AboutDemoMode, AC currency formatting, AuthContext extension) follows.

