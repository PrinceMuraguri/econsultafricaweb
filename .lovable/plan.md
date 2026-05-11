## Your two questions, answered first

**1. Did you ever ask for emails to be suppressed in Free / demo mode?**
No. Reviewing chat history, your only explicit instruction on settlement emails was: *"I dont want to settle a question and then no email gets sent."* The `if (proMode === 'demo') continue;` short-circuit was a defensive choice I made earlier on the assumption that demo = pretend money = don't email. That assumption was wrong for your model: Free Arena voters live entirely outside the demo/live wallet split — they never had "pretend money" to begin with — and even Pro demo participants deserve the closing-loop email. Removing the suppression entirely is the correct fix.

**2. Can you re-settle the petrol price poll so users get emails?**
Not directly via the existing `settle-market` function — line 60–65 hard-blocks any poll where `settled_at` is already set ("Poll already settled"). But we can do it cleanly with a one-time **resend** path that does NOT touch wallets, payouts, AI scoring, listings, or the poll status — it only re-fires the email branch for that specific poll using the existing winner/loser logic and the existing `idempotencyKey` scheme. Because the idempotency keys are deterministic (`settlement-winner-${poll_id}-${voterKey}`), a future accidental call would not double-send. Plan includes this as Part F.

---

## Plan

### Part A — Send settlement emails in ALL circumstances

In `supabase/functions/settle-market/index.ts`:

1. **Delete** the `if (proMode === 'demo') continue;` short-circuit at line 366. Emails fire for every voter in every mode.
2. Build a `demoPayoutMap: Map<userId, payoutAmount>` from `winnerPositions` (already fetched at line 126) when `proMode === 'demo'`. Payout = `shares × $1.00` (matches `demo_settle_market` exactly).
3. Inside the winner branch (line 373), resolve `payoutEntry` as:
   - live: existing `payoutRecords.find(...)` (net of 3.5% fee)
   - demo: `{ amount: demoPayoutMap.get(vote.user_id) ?? 0 }`
4. Pass an `isDemo: proMode === 'demo'` flag into the email `templateData` for both winner and loser branches so the templates can render the demo banner / suffix.
5. Free Arena voters (no stake, no position, `is_staked=false`) automatically flow through the existing `else if (isWinner)` / `else` branches — the unstaked email variants already exist in both templates. No new template work needed for Free.

### Part B — Update email templates to handle `isDemo`

**`supabase/functions/_shared/transactional-email-templates/settlement-winner.tsx`:**
- Add `isDemo?: boolean` to `SettlementWinnerProps`.
- When `isDemo`:
  - Add a one-line muted banner above the heading: *"This is a practice settlement — amounts shown are demo credits in your Arena Coin wallet, not real money."*
  - Subject suffix: append ` (demo)` to the existing subject (e.g. `🎯 Correct prediction (demo) — $5.00 credited to your demo wallet`).
  - For the staked variant: change "credited to your wallet" → "credited to your demo wallet".
  - Button label unchanged.
- When `isDemo` is false: identical to today.
- Update `previewData` to include both `isDemo: false` baseline.

**`supabase/functions/_shared/transactional-email-templates/settlement-loser.tsx`:** mirror the same banner + ` (demo)` subject suffix when `isDemo` is true.

### Part C — Fix the misleading "0 winners" toast

In `supabase/functions/settle-market/index.ts`:

1. Capture `demo_settle_market`'s return value into local `demoWinners` / `demoTotalPaid` (already returned in `demoSettleData` at line 209 — currently discarded).
2. In the response `summary` and the `admin_audit_log.details`:
   - `winners_with_payout` = `payoutRecords.length` (live) OR `demoWinners` (demo)
   - `total_payouts` / `total_net_payouts` = sum of `payoutRecords` (live) OR `demoTotalPaid` (demo)
   - Add top-level `mode: proMode` so the UI can label correctly.
3. Audit log gains the same fields.

### Part D — Surface the mode in the admin settlement toast

Locate the call site (likely `src/components/admin/PollManager.tsx` — confirm during implementation) and update the success toast:
- **Live:** `Settled — N winners paid out ($X total). Emails sent to N voters.`
- **Demo:** `Settled (demo) — N winners credited to demo wallets ($X demo). Emails sent to N voters.`

Read `mode`, `winners_with_payout`, `total_payouts`, and `emails_queued` from the response. Never show "0 winners" when winners actually exist.

### Part E — Deploy and verify end-to-end

1. Deploy `settle-market` (the only function with logic changes). Templates are bundled into `send-transactional-email`, so deploy that too.
2. Create a throwaway test poll, cast 2–3 demo votes (one staked Pro winner, one staked loser, one Free voter on the winning side), settle it via the admin UI in demo mode, then verify:
   - `email_send_log` shows 3 fresh `settlement-winner`/`settlement-loser` rows with `status='sent'` and ` (demo)` in the metadata subject.
   - Admin toast reads "Settled (demo) — N winners…", not "0 winners".
   - In-app `notifications` count matches voter count.
3. Paste the verification SQL output back to you.

### Part F — One-time resend for the petrol price poll (your second question)

Create a small **`resend-settlement-emails`** edge function (admin-key gated, `verify_jwt = false`, identical auth model to `settle-market`):

- Inputs: `poll_id`, `admin_key`.
- Refuses to run unless `polls.status = 'settled'` and `polls.winning_option_id` is set.
- Re-runs ONLY the email-dispatch portion of the settle path:
  - Re-derives `demoPayoutMap` from current `demo_positions` (or `payoutRecords` from past `payouts` table in live mode) so winner emails carry the correct $ amount.
  - Loops voters via the same `voterMap` dedup as `settle-market`.
  - Calls `send-transactional-email` with the SAME `idempotencyKey` (`settlement-winner-${poll_id}-${key}` / `settlement-loser-...`).
- Because the idempotency key is identical to what would have been sent originally, the email service will treat any future accidental call as a no-op duplicate. So this is safe to invoke multiple times.
- For the petrol poll specifically: the original settlement never sent emails (no rows in `email_send_log` for this poll), so the idempotency keys are unused → all 23 voters will receive their email exactly once.

I'll add a one-off **"Resend settlement emails"** button in `PlatformModeTab.tsx` (or wherever the admin settle button lives) that takes a poll slug/id and calls this function. After your one-time use on the petrol poll, the button stays available for any future "I forgot to deploy before settling" recovery.

### Out of scope

- Switching the platform to live mode.
- Changing how Free vs Pro winners are computed — existing logic is correct.
- Changing AI scoring (already runs and was correct for the petrol poll).
- Resending in-app notifications for the petrol poll — those 23 notifications were inserted correctly the first time and are already visible in users' bells.
