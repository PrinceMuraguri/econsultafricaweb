-- ============================================================
-- Platform Fees Table — Revenue Tracking
-- Tracks every fee charged across all transaction types
-- ============================================================

CREATE TABLE IF NOT EXISTS platform_fees (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  source text NOT NULL CHECK (source IN (
    'buy_shares',         -- AMM buy (buy-shares edge function)
    'sell_shares',        -- AMM sell (sell-shares edge function)
    'settlement',         -- Winner payout deduction (settle-market edge function)
    'order_fill_buyer',   -- Order book match - buyer side (place-order edge function)
    'order_fill_seller',  -- Order book match - seller side (place-order edge function)
    'p2p_listing'         -- P2P marketplace listing sale (buy_listing_atomic RPC)
  )),
  amount numeric NOT NULL DEFAULT 0,
  poll_id uuid REFERENCES polls(id),
  option_id uuid REFERENCES poll_options(id),
  user_id uuid,
  reference text,
  created_at timestamptz DEFAULT now()
);

-- Indexes for dashboard queries
CREATE INDEX IF NOT EXISTS idx_platform_fees_created ON platform_fees(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_platform_fees_poll ON platform_fees(poll_id);
CREATE INDEX IF NOT EXISTS idx_platform_fees_source ON platform_fees(source);

-- Row Level Security: read-only for admins
ALTER TABLE platform_fees ENABLE ROW LEVEL SECURITY;

-- Allow service role (edge functions) to insert
-- No user-facing RLS policy needed — users never read this table directly

-- Allow the wallet_transactions type constraint to accept new types used by order system
-- (Idempotent — won't break if already updated)
ALTER TABLE wallet_transactions DROP CONSTRAINT IF EXISTS wallet_transactions_type_check;
ALTER TABLE wallet_transactions
  ADD CONSTRAINT wallet_transactions_type_check
  CHECK (type IN (
    'deposit','withdrawal','sell_proceeds','payout',
    'refund','share_purchase','share_sale',
    'buy_shares','order_escrow','order_refund',
    'payout_mpesa'
  ));

-- ============================================================
-- View: revenue_summary
-- Quick aggregate for admin dashboard KPI cards
-- ============================================================
CREATE OR REPLACE VIEW revenue_summary AS
SELECT
  COUNT(*)                                    AS total_fee_events,
  COALESCE(SUM(amount), 0)                    AS total_revenue,
  COALESCE(SUM(amount) FILTER (WHERE source = 'buy_shares'), 0)       AS revenue_buy_shares,
  COALESCE(SUM(amount) FILTER (WHERE source = 'sell_shares'), 0)      AS revenue_sell_shares,
  COALESCE(SUM(amount) FILTER (WHERE source = 'settlement'), 0)       AS revenue_settlement,
  COALESCE(SUM(amount) FILTER (WHERE source IN ('order_fill_buyer','order_fill_seller')), 0) AS revenue_order_fills,
  COALESCE(SUM(amount) FILTER (WHERE source = 'p2p_listing'), 0)      AS revenue_p2p,
  COALESCE(SUM(amount) FILTER (WHERE created_at >= date_trunc('month', now())), 0) AS revenue_this_month,
  COALESCE(SUM(amount) FILTER (WHERE created_at >= now() - interval '7 days'), 0)  AS revenue_last_7_days,
  COALESCE(SUM(amount) FILTER (WHERE created_at >= now() - interval '24 hours'), 0) AS revenue_last_24h
FROM platform_fees;

-- ============================================================
-- View: revenue_by_poll
-- Per-poll fee breakdown for admin drill-down
-- ============================================================
CREATE OR REPLACE VIEW revenue_by_poll AS
SELECT
  pf.poll_id,
  p.title AS poll_title,
  p.status AS poll_status,
  COUNT(*)              AS fee_events,
  SUM(pf.amount)        AS total_fees,
  SUM(pf.amount) FILTER (WHERE pf.source = 'buy_shares')       AS fees_buy,
  SUM(pf.amount) FILTER (WHERE pf.source = 'sell_shares')      AS fees_sell,
  SUM(pf.amount) FILTER (WHERE pf.source = 'settlement')       AS fees_settlement,
  SUM(pf.amount) FILTER (WHERE pf.source IN ('order_fill_buyer','order_fill_seller')) AS fees_orders,
  SUM(pf.amount) FILTER (WHERE pf.source = 'p2p_listing')      AS fees_p2p,
  MIN(pf.created_at)    AS first_fee_at,
  MAX(pf.created_at)    AS last_fee_at
FROM platform_fees pf
JOIN polls p ON p.id = pf.poll_id
GROUP BY pf.poll_id, p.title, p.status
ORDER BY total_fees DESC;

-- ============================================================
-- View: money_reconciliation
-- Conservation of money check: Money In = Money Held + Money Out + Fees
-- ============================================================
CREATE OR REPLACE VIEW money_reconciliation AS
SELECT
  -- Money In: total deposits
  (SELECT COALESCE(SUM(amount), 0) FROM wallet_transactions WHERE type = 'deposit') AS total_deposits,

  -- Money Held: current wallet balances
  (SELECT COALESCE(SUM(balance_usd), 0) FROM wallets) AS total_wallet_balances,

  -- Money Out: withdrawals + M-Pesa payouts
  (SELECT COALESCE(SUM(ABS(amount)), 0) FROM wallet_transactions WHERE type IN ('withdrawal', 'payout_mpesa')) AS total_withdrawals,

  -- Platform Fees collected
  (SELECT COALESCE(SUM(amount), 0) FROM platform_fees) AS total_platform_fees,

  -- The discrepancy (should be 0 if everything balances)
  (SELECT COALESCE(SUM(amount), 0) FROM wallet_transactions WHERE type = 'deposit')
  - (SELECT COALESCE(SUM(balance_usd), 0) FROM wallets)
  - (SELECT COALESCE(SUM(ABS(amount)), 0) FROM wallet_transactions WHERE type IN ('withdrawal', 'payout_mpesa'))
  - (SELECT COALESCE(SUM(amount), 0) FROM platform_fees)
  AS discrepancy;
