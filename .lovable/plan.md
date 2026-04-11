

# Migration Plan: Refund All Active Stakes & Reset for Pro Arena

## Current State Summary

All capital on the platform was committed under the old system (vote-based odds). With Pro Arena using capital-weighted odds, we need a clean slate.

### What exists today

| User | Active Stakes | Settled (already paid out) | Wallet Balance |
|------|--------------|---------------------------|----------------|
| **princemuraguri** | $5.05 (5 votes across 4 polls) | $2.90 (3 TEST polls — already settled) | $2.38 |
| **funkiefresh_ke** | $2.50 (1 vote, 1 poll) | — | $0.00 |
| **Anonymous user A** (no account) | $1.62 (2 votes, 2 polls) | — | N/A |
| **Anonymous user B** (no account) | $0.95 (1 vote, 1 poll) | — | N/A |

- **Total refundable (active polls only):** $10.12
- **Settled polls:** Already paid out — no action needed
- **Positions table:** Empty (no shares to unwind)
- **Listings table:** No active listings
- **poll_options.total_stake_amount:** Already 0 across all options

### The anonymous problem

Two fingerprints ($2.57 total) paid via Paystack with no user account, so there's no wallet to refund to. Options:
1. **Create wallets for them** — but they can't access them without an account
2. **Process Paystack refunds** — refund directly to their payment method
3. **Hold in escrow** — flag for manual resolution

I recommend **Option 3**: mark these votes as refunded in the database and flag the $2.57 for manual Paystack refund, since we can look up the original transactions by reference.

## Migration Steps

### Step 1: Refund registered users to wallets
For each staked vote on an **active** poll with a known `user_id` (or matching fingerprint):
- Credit the `stake_amount` back to their wallet
- Create a `wallet_transaction` record (type: `refund`, description: "Platform migration refund — legacy stake returned")

**princemuraguri:** +$5.05 → wallet becomes $7.43
**funkiefresh_ke:** +$2.50 → wallet becomes $2.50

### Step 2: Clear staking flags on all active-poll votes
- Set `is_staked = false`, `stake_amount = 0` on all votes for active polls
- This preserves the free sentiment votes while removing the capital attachment

### Step 3: Reset poll_options stake amounts
- Confirm `total_stake_amount = 0` on all options (already the case, but run a safety reset)

### Step 4: Handle anonymous stakes
- Insert records into an `admin_audit_log` documenting the $2.57 owed to anonymous users with their Paystack references for manual refund processing

### Step 5: Clean up positions/trades if any residual
- Delete any orphaned position or trade records tied to these legacy stakes (currently empty, but safety check)

## Accounting Verification

Before and after the migration, we verify:
```
Total wallet balances (before) + Total refunded = Total wallet balances (after)
($2.38) + ($5.05 + $2.50) = ($7.43 + $2.50) = $9.93 ✓

Anonymous stakes ($2.57) logged for manual Paystack refund
Grand total accounted: $10.12 + $2.90 (settled) = $13.02 (matches votes table) ✓
```

No money is created — every dollar refunded traces back to a specific staked vote.

## Technical Changes

1. **Database operations** (via insert tool):
   - UPDATE wallets for princemuraguri and funkiefresh_ke
   - INSERT wallet_transactions for audit trail
   - UPDATE votes to clear staking flags on active polls
   - INSERT admin_audit_log entries for anonymous refund tracking

2. **No code changes needed** — the Pro Arena already uses its own capital commitment flow, and the Free Arena already strips trading UI.

