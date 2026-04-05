# Forecast Arena — How It All Works
### A complete explainer for users, investors, and developers

---

## Table of Contents

1. [What Is Forecast Arena?](#1-what-is-forecast-arena)
2. [Step 1 — Voting (Free, No Money Required)](#2-step-1--voting-free-no-money-required)
3. [Step 2 — Committing Capital (Skin in the Game)](#3-step-2--committing-capital-skin-in-the-game)
4. [How Shares Are Calculated](#4-how-shares-are-calculated)
5. [The Crowd Consensus Price — What It Is and What It Isn't](#5-the-crowd-consensus-price--what-it-is-and-what-it-isnt)
6. [Step 3 — Resolution (Who Gets Paid?)](#6-step-3--resolution-who-gets-paid)
7. [The Scale Factor — Why You Might Get Less Than $1.00 Per Share](#7-the-scale-factor--why-you-might-get-less-than-100-per-share)
8. [Step 4 — Exiting Early (The "I Changed My Mind" Option)](#8-step-4--exiting-early-the-i-changed-my-mind-option)
9. [Platform Fees](#9-platform-fees)
10. [Complete Worked Example — End to End](#10-complete-worked-example--end-to-end)
11. [What Econsult Africa Never Does](#11-what-econsult-africa-never-does)
12. [For Developers — Backend Architecture](#12-for-developers--backend-architecture)

---

## 1. What Is Forecast Arena?

Forecast Arena is a **crowd-based sentiment and prediction platform** built for African economic and political questions. It answers one simple question:

> *"What does the collective wisdom of informed Africans say will happen?"*

It is **not a casino** and **not a stock exchange**. It is closer in spirit to a **structured opinion poll with financial skin-in-the-game** — think of it as a Bloomberg terminal for crowd sentiment, where participants can back their views with real money and be rewarded when they're right.

**Examples of questions on the platform:**
- *"Will Rwanda and the DRC restore full diplomatic relations by end of 2026?"*
- *"Will Kenya's pump price exceed KES 200 by Q3 2026?"*
- *"Will Nigeria's GDP growth exceed 4% in 2026?"*

Every question has a fixed close date and is resolved by the Econsult Africa editorial team using official, verifiable data sources.

---

## 2. Step 1 — Voting (Free, No Money Required)

Anyone — registered or not — can cast a vote on any open question. This is completely free.

**How it works:**
- You read the question and click your answer (e.g., "Yes" or "No")
- Your vote is recorded alongside everyone else's
- The platform immediately shows the live vote distribution

**Example:**
> *10 people have voted on "Will Rwanda and DRC restore relations?"*
> *3 said Yes, 7 said No.*
> *The platform shows: Yes 30% | No 70%*

**What this number means:** It reflects what a cross-section of people who chose to engage with this question believe. Nothing more, nothing less. It is a **sentiment signal**, not a financial price.

**Anonymous voting:** If you are not logged in, your vote is tied to a browser fingerprint (a unique hash of your device/browser). If you later log in, your vote is linked to your account. You can only vote once per question.

---

## 3. Step 2 — Committing Capital (Skin in the Game)

After voting, logged-in users can **back their view with real money**. This is optional but it's where the financial mechanics begin.

**The flow:**
1. After voting, you see a panel: *"Commit capital to your forecast"*
2. You choose how much to commit (e.g., $5.00)
3. You are redirected to **Paystack** (our payment processor) to pay
4. Once Paystack confirms the payment, the platform records your stake

**What you are doing economically:**
You are joining a **shared pool** with everyone else who staked on this question — on either side. Your money goes into this pool. At resolution, the pool is redistributed: stakers who were **correct** share the entire pool; stakers who were **wrong** lose their stake.

**Econsult Africa never puts any money into this pool.** It is entirely funded by participants.

---

## 4. How Shares Are Calculated

When you commit capital, you don't just get a "stake receipt." You receive **shares** — a precise number calculated at the moment you pay.

### The Formula:

```
shares = stake_amount ÷ entry_price
```

Where **entry_price** = the crowd consensus price at the exact moment your Paystack payment was confirmed.

### Why shares instead of just a stake amount?

Shares capture **when** you committed. If you committed early (when the question was uncertain), you get **more shares per dollar** than someone who committed late (when the outcome seemed obvious). This rewards early commitment and calibrated thinking.

### Example:

> **Question:** Will Kenya's pump price exceed KES 200?
>
> **Ali** commits $10 when the crowd is split 50/50. Entry price = $0.50.
> → Ali gets: $10 ÷ $0.50 = **20 shares**
>
> **Bongani** commits $10 later, when 80% of people think Yes. Entry price = $0.80.
> → Bongani gets: $10 ÷ $0.80 = **12.5 shares**
>
> At resolution (if Yes wins), each share pays $1.00 (subject to scale factor — see below).
> Ali receives: 20 × $1.00 = **$20.00** → profit of $10.00
> Bongani receives: 12.5 × $1.00 = **$12.50** → profit of $2.50

Ali is rewarded more because he committed when the outcome was less certain — his willingness to take a position early contributed more information to the crowd.

---

## 5. The Crowd Consensus Price — What It Is and What It Isn't

The **consensus price** is the live probability the crowd assigns to any given outcome.

### The Formula:

```
price = votes_for_option ÷ total_votes
```

Clamped between **0.05 (5%) and 0.95 (95%)** — meaning no outcome can ever be priced at 0% or 100% while the question is open. There is always some residual uncertainty.

### Example:

> 100 people voted on a question.
> 65 said "Yes", 35 said "No".
> Consensus price for Yes = 65/100 = **$0.65**
> Consensus price for No = 35/100 = **$0.35**

### What the price is NOT:

- It is **not a market price** set by supply and demand of capital
- It is **not a probability estimate from experts**
- It is **not guaranteed to match the real-world probability**

It is purely a reflection of the vote distribution — the wisdom of whichever crowd engaged with that question on that day. Free votes (from non-stakers) count equally with staked votes in determining the consensus price. This is intentional: more voices = better signal.

### Why clamp at 5% and 95%?

If a question goes to 100% consensus, anyone staking at that point would pay $1.00/share and receive $1.00/share at resolution — pure breakeven. The clamp preserves a meaningful spread and protects against degenerate edge cases.

---

## 6. Step 3 — Resolution (Who Gets Paid?)

When a question's close date passes, the Econsult Africa editorial team resolves it by selecting the correct outcome. This triggers the **settlement process**.

### What happens at settlement:

1. All staked votes are retrieved
2. Stakers on the **winning side** receive payouts
3. Stakers on the **losing side** receive nothing — their stake funds the winners
4. The platform takes a **3.5% fee** from all winner payouts

### Payout formula (before scale factor):

```
gross_payout = shares × $1.00
platform_fee = gross_payout × 3.5%
net_payout   = gross_payout - platform_fee
```

### Example:

> **Total pool:** $100 (stakers on Yes + No combined)
>
> **Ali** staked $10 on Yes at $0.50 → 20 shares
> **Bongani** staked $10 on Yes at $0.80 → 12.5 shares
> **Everyone else** staked $80 on No and lost.
>
> Ali's gross payout: 20 × $1.00 = $20.00
> Ali's net payout: $20.00 × (1 - 3.5%) = **$19.30**
>
> Bongani's gross payout: 12.5 × $1.00 = $12.50
> Bongani's net payout: $12.50 × (1 - 3.5%) = **$12.06**
>
> Total payouts: $19.30 + $12.06 = $31.36
> Available pool: $100 ✅ (more than enough — pool comfortably funds winners)

---

## 7. The Scale Factor — Why You Might Get Less Than $1.00 Per Share

There is one scenario where each share pays less than $1.00: when **almost everyone staked on the same side**.

If 95% of stakers bet "No" and No wins, the pool barely has any losing stakes to fund the winners. The math:

```
scale_factor = total_pool ÷ total_gross_payouts_owed

if scale_factor < 1.0 → each share pays (scale_factor × $1.00) instead of $1.00
if scale_factor ≥ 1.0 → each share pays $1.00 in full
```

### Example:

> **Total pool:** $20
> 2 stakers on Yes: Ali has 20 shares, Bongani has 12.5 shares → 32.5 shares total
> 1 staker on No: $1.00 staked on No (loses)
>
> Gross owed to Yes side: 32.5 × $1.00 = $32.50
> But pool only has: $20.00
> Scale factor: $20.00 ÷ $32.50 = **0.615**
>
> Ali receives: 20 × $0.615 = $12.30 (net ~$11.87 after fee)
> Bongani receives: 12.5 × $0.615 = $7.69 (net ~$7.42 after fee)

**The guarantee:** You can never receive more than the total pool. Econsult Africa never tops up payouts. The platform is self-funding.

**Practical implication:** If you commit capital on a heavily one-sided question, you may not profit — or you may only break even. The platform encourages early commitment to genuinely uncertain questions.

---

## 8. Step 4 — Exiting Early (The "I Changed My Mind" Option)

While a question is still open, stakers can **exit their position early**. This means:
- You give up your shares
- You receive your original committed capital back, minus the 3.5% fee
- You forfeit any upside you would have received at resolution

**This is a capital recovery mechanism, not a profit mechanism.**

### The formula:

```
exit_refund = original_stake × (1 - 3.5%)
```

Note: the exit payout is **always based on your original stake**, not the current consensus price. This is critical for platform solvency — the pool only ever contains what stakers put in. There is no mechanism to pay out more than the pool contains.

### Example:

> Ali originally committed $10.
> He changed his mind and wants to exit.
>
> Exit refund: $10 × 96.5% = **$9.65**
> Ali loses $0.35 (the platform's fee revenue for providing liquidity)
> Ali's shares are cancelled. He is out of the pool.

### What happens to Ali's $10 in the pool?

When Ali exits, his $10 is removed from the pool. The scale factor for remaining stakers adjusts accordingly. The 3.5% fee ($0.35) goes to Econsult Africa as service revenue.

### Why can't I profit from an early exit?

In a traditional secondary market (like a stock exchange), you could sell your position to another buyer at a higher price if the consensus moved in your favour. Forecast Arena does not currently have a secondary market — there is no buyer on the other side. The only counterparty for an early exit is the platform returning your own funds.

The "crowd consensus price" is displayed in the UI as a signal of how the question is trending, but it does not determine your exit payout. That price is only realised at resolution, funded by losing stakers.

---

## 9. Platform Fees

Econsult Africa charges a flat **3.5% fee** on:

| Transaction | Fee Applied To |
|---|---|
| Resolution payout (winner) | Gross payout before sending to wallet |
| Early exit | Original stake amount |

**Econsult Africa never charges fees on losing stakes.** If you staked and were wrong, you simply lose your stake — it goes to fund the winners. No additional deduction.

**Fee revenue examples:**
- Question settles, $1,000 total staked, $400 on winning side:
  - Platform fee: ~$14 (3.5% of ~$400 gross payouts)
- 10 users exit early from a $500 staked pool:
  - Platform fee: ~$17.50 (3.5% × $500)

These fees fund Econsult Africa's operations, editorial team, and data infrastructure.

---

## 10. Complete Worked Example — End to End

Let's walk through a complete lifecycle of one question.

---

**Question:** *"Will Nigeria's inflation rate drop below 20% by December 2026?"*

**Open date:** January 1, 2026 | **Close date:** December 31, 2026

---

### Phase 1: Voting (January–March)

| User | Vote | Free? |
|---|---|---|
| Amara | Yes | ✅ |
| Kwame | No | ✅ |
| Fatima | No | ✅ |
| David | Yes | ✅ |
| Nia | No | ✅ |

After 5 votes: Yes = 2, No = 3. Consensus price for Yes = **$0.40**, No = **$0.60**

---

### Phase 2: Staking (April–June)

| User | Bet | Stake | Entry Price | Shares |
|---|---|---|---|---|
| Amara | Yes | $20 | $0.40 | 50.0 shares |
| Kwame | No | $30 | $0.60 | 50.0 shares |
| Fatima | No | $15 | $0.65* | 23.1 shares |
| Nia | No | $10 | $0.70* | 14.3 shares |

*Price drifted as more people voted No over time

**Total pool: $75**
Yes pool: $20 | No pool: $55

---

### Phase 3: Early Exit (September)

David committed $8 on Yes at $0.40 entry price (20 shares), but changes his mind in September.

Exit refund: $8 × 96.5% = **$7.72** (credited to his wallet)
His 20 shares are cancelled.

**Revised pool: $67** (Yes pool: $12, No pool: $55)

---

### Phase 4: Resolution (December 31, 2026)

The editorial team confirms: Nigeria's inflation dropped to 18%. **Yes wins.**

The sole Yes winner is Amara with 50 shares.

**Settlement calculation:**
```
Total pool = $67
Total gross owed to Yes side: 50 × $1.00 = $50.00
Scale factor: $67 ÷ $50 = 1.34 → capped at 1.0 (pool exceeds gross)

Amara's gross payout: 50 × $1.00 = $50.00
Platform fee (3.5%): $1.75
Amara's net payout: $48.25
```

**Summary:**
- Amara staked $20 → receives **$48.25** → profit of **$28.25** ✅
- Kwame staked $30 on No → receives **$0** → loses $30 ❌
- Fatima staked $15 on No → receives **$0** → loses $15 ❌
- Nia staked $10 on No → receives **$0** → loses $10 ❌
- David exited early → received $7.72 → small loss of $0.28 ❌ (but preserved most of capital)
- **Econsult Africa earns: $1.75 (platform fee) + $0.28 (David's exit fee) = $2.03** ✅

---

## 11. What Econsult Africa Never Does

This section is important for understanding why Forecast Arena is not gambling or a betting house.

| What We Never Do | Why It Matters |
|---|---|
| We never contribute capital to any pool | Zero platform exposure. The platform cannot "lose money" on any question |
| We never set prices or odds | All prices are determined purely by participant vote distribution |
| We never guarantee any payout amount | Payouts depend entirely on pool composition and scale factor |
| We never take positions on outcomes | The editorial team resolves markets based on public data, with no financial interest in any outcome |
| We never hold user funds speculatively | All committed capital sits in Econsult's Paystack account, ring-fenced per question |

**What we ARE:** A structured sentiment aggregation platform that creates financial accountability for predictions. Think of us as the infrastructure layer — we ask the questions, collect the signal, and distribute the rewards. The crowd does the rest.

---

## 12. For Developers — Backend Architecture

This section is for programmers who want to understand how the platform is built.

---

### Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + TypeScript + Vite + Tailwind CSS |
| Component library | shadcn/ui + Radix UI |
| Animations | Framer Motion |
| State management | React Query (TanStack Query v5) |
| Realtime | Supabase Realtime (Postgres CDC) |
| Backend | Supabase (Postgres + Edge Functions) |
| Auth | Supabase Auth (JWT-based) |
| Payments | Paystack (webhook-driven) |
| Hosting | Lovable (frontend) + Supabase (backend) |
| Repo | GitHub (PrinceMuraguri/econsultafricaweb) |

---

### Database Schema (Key Tables)

```sql
-- The questions
polls (
  id uuid PRIMARY KEY,
  title text,
  slug text UNIQUE,
  category text,
  status text,           -- 'active' | 'closed' | 'settled'
  close_at timestamptz,
  outcome text,          -- set at settlement
  winning_option_id uuid,
  settled_at timestamptz,
  context text,          -- economic background
  resolution_criteria text
)

-- The answer options for each question (usually Yes/No)
poll_options (
  id uuid PRIMARY KEY,
  poll_id uuid REFERENCES polls,
  label text,
  total_votes_count int  -- incremented by RPC on each vote
)

-- Every vote cast (free AND staked)
votes (
  id uuid PRIMARY KEY,
  poll_id uuid,
  option_id uuid,
  user_id uuid,          -- null for anonymous votes
  voter_fingerprint text,
  is_staked boolean,     -- true = paid via Paystack
  stake_amount numeric,  -- in USD
  entry_price numeric,   -- consensus price at time of stake
  created_at timestamptz
)

-- Share ledger — one row per user per poll per option
positions (
  id uuid PRIMARY KEY,
  user_id uuid,
  poll_id uuid,
  option_id uuid,
  shares numeric,        -- current share count
  avg_price numeric,     -- weighted average entry price
  total_cost numeric,    -- total USD committed (= stake_amount)
  created_at timestamptz,
  updated_at timestamptz
)

-- Each user's USD balance
wallets (
  id uuid PRIMARY KEY,
  user_id uuid UNIQUE,
  balance_usd numeric
)

-- Debit/credit history
wallet_transactions (
  id uuid PRIMARY KEY,
  user_id uuid,
  type text,             -- 'deposit' | 'sell_proceeds' | 'payout' | 'withdrawal'
  amount numeric,
  description text,
  reference text,
  created_at timestamptz
)

-- Settlement payout records (pending → paid via manual Paystack transfer)
payouts (
  id uuid PRIMARY KEY,
  voter_fingerprint text,
  poll_id uuid,
  amount numeric,
  status text,           -- 'pending' | 'paid'
  reference text
)
```

---

### Edge Functions (Supabase Deno Runtime)

#### `paystack-webhook`
**Trigger:** Paystack sends a POST request after every successful payment.

**Flow:**
```
1. Verify Paystack HMAC signature (x-paystack-signature header)
2. Parse metadata: { type, poll_id, option_id, entry_price, user_id }
3. If type === 'forecast_stake':
   a. Upsert votes table (is_staked=true, stake_amount, entry_price)
   b. Increment poll_options.total_votes_count via RPC
   c. Upsert positions table (shares = stake / entry_price)
   d. Send confirmation email
4. If type === 'wallet_deposit':
   a. Credit wallets.balance_usd
   b. Insert wallet_transactions record
```

**Why both votes AND positions?**
- `votes` is the settlement source of truth (settle-market reads from here)
- `positions` is the live share ledger (used by the frontend and sell-shares)
- They must stay in sync. When shares are sold, `positions` decreases AND `votes.stake_amount` decreases proportionally.

---

#### `sell-shares` (Early Exit)
**Trigger:** User clicks "Confirm exit" in the modal. Called via `supabase.functions.invoke`.

**Flow:**
```
1. Verify JWT (user must be authenticated)
2. Validate input: { poll_id, option_id, shares }
3. Check positions table — user must have enough shares
4. Check poll is still active (not closed or settled)
5. Calculate payout:
   gross = position.total_cost  ← original stake, NOT price × shares
   fee   = gross × 3.5%
   net   = gross - fee
6. Delete or reduce the positions record
7. Sync votes.stake_amount down proportionally
8. Insert into trades table (side='sell')
9. Credit wallets.balance_usd with net amount
10. Insert wallet_transactions record (type='sell_proceeds')
11. Return { success, net_proceeds, remaining_shares }
```

**Why gross = total_cost and not shares × current_price?**

The AMM consensus price is derived from vote proportions — it reflects sentiment, not available liquidity. The pool only ever contains what stakers paid in. If Alice staked $0.95 and the consensus moved to 95%, the pool does NOT contain $0.95 × (0.95/0.50) = $1.80 — it still only contains $0.95. Paying out $1.80 would require the platform to subsidise $0.85 per user, which is unsustainable. The stake-based exit ensures the pool is always solvent.

---

#### `settle-market`
**Trigger:** Admin POST with `{ poll_id, winning_option_id, admin_key }`.

**Flow:**
```
1. Verify admin_key
2. Fetch all is_staked=true votes for the poll
3. Separate into winners[] and losers[]
4. For each winner:
   shares = stake_amount / entry_price
   gross  = shares × $1.00
5. Sum all gross payouts → totalGross
6. Calculate scaleFactor = min(1.0, totalPool / totalGross)
   (prevents payouts exceeding the pool)
7. For each winner:
   scaledGross = gross × scaleFactor
   fee         = scaledGross × 3.5%
   netPayout   = scaledGross - fee
8. Insert payout records (status='pending')
9. Update poll.status = 'settled'
10. Send winner/loser email notifications
11. Create in-app notifications
```

Payouts marked `pending` are processed manually via Paystack bulk transfer. This gives the editorial team a review step before any money moves.

---

### How Money Flows Through the System

```
User pays via Paystack
         │
         ▼
Paystack webhook fires
         │
         ├──► votes table (stake recorded)
         ├──► positions table (shares allocated)
         └──► [money sits in Econsult Paystack account]

         ... question runs ...

[Option A] User exits early
         │
         ├──► positions reduced/deleted
         ├──► votes.stake_amount reduced
         ├──► wallet_transactions: sell_proceeds
         └──► wallets.balance_usd += net_amount
              [user requests withdrawal → manual Paystack transfer]

[Option B] Question settles
         │
         ├──► payouts table: winner records inserted (status=pending)
         ├──► editorial team reviews
         └──► Paystack bulk transfer to winners
              [losing stakes stay in Econsult account as float]
```

---

### Realtime Updates

The frontend subscribes to Postgres Change Data Capture via Supabase Realtime:

```typescript
// Poll vote counts update live as people vote
supabase.channel(`poll-options-${pollId}`)
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'poll_options',
    filter: `poll_id=eq.${pollId}`
  }, handleUpdate)
  .subscribe()
```

This means vote percentages and consensus prices update in real-time across all connected clients without any polling or page refresh.

---

### Security Model

| Concern | How It's Handled |
|---|---|
| Payment verification | Paystack HMAC-SHA512 signature on every webhook |
| API authentication | Supabase JWT on all edge function calls |
| Position manipulation | sell-shares checks positions ownership before any write |
| Market settlement | Admin key + human review before payouts execute |
| Double-voting | Unique constraint on (poll_id, user_id) and (poll_id, voter_fingerprint) |
| Over-payout | Scale factor ensures totalPayouts ≤ totalPool always |

---

### Anonymous vs Authenticated Users

| Feature | Anonymous | Logged In |
|---|---|---|
| Vote | ✅ (fingerprint) | ✅ (user_id) |
| Commit capital | ❌ | ✅ |
| View positions | ❌ | ✅ |
| Exit early | ❌ | ✅ |
| Receive payouts | ✅ (fingerprint match) | ✅ (user_id) |
| Dashboard | ❌ | ✅ |

Anonymous users who stake (rare, edge case) are matched to their account at settlement via `voter_fingerprint → user_profiles` lookup.

---

*Document version: April 2026 | Econsult Africa Forecast Arena*
*For questions, contact the Econsult Africa team.*
