
-- Allow authenticated users to read platform_fees (admin dashboard needs this)
CREATE POLICY "Authenticated users can read platform fees"
ON public.platform_fees
FOR SELECT
TO authenticated
USING (true);

-- Allow service_role to insert platform fees (edge functions use this)
CREATE POLICY "Service role can insert platform fees"
ON public.platform_fees
FOR INSERT
TO service_role
WITH CHECK (true);

-- Create security-definer functions for the aggregation views
-- so that platform-wide totals are visible regardless of per-row RLS on wallets/wallet_transactions

CREATE OR REPLACE FUNCTION public.get_revenue_summary()
RETURNS TABLE(
  total_fee_events bigint,
  total_revenue numeric,
  revenue_buy_shares numeric,
  revenue_sell_shares numeric,
  revenue_settlement numeric,
  revenue_order_fills numeric,
  revenue_p2p numeric,
  revenue_this_month numeric,
  revenue_last_7_days numeric,
  revenue_last_24h numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    count(*)::bigint AS total_fee_events,
    COALESCE(sum(amount), 0) AS total_revenue,
    COALESCE(sum(amount) FILTER (WHERE source = 'buy_shares'), 0) AS revenue_buy_shares,
    COALESCE(sum(amount) FILTER (WHERE source = 'sell_shares'), 0) AS revenue_sell_shares,
    COALESCE(sum(amount) FILTER (WHERE source = 'settlement'), 0) AS revenue_settlement,
    COALESCE(sum(amount) FILTER (WHERE source IN ('order_fill_buyer','order_fill_seller')), 0) AS revenue_order_fills,
    COALESCE(sum(amount) FILTER (WHERE source = 'p2p_listing'), 0) AS revenue_p2p,
    COALESCE(sum(amount) FILTER (WHERE created_at >= date_trunc('month', now())), 0) AS revenue_this_month,
    COALESCE(sum(amount) FILTER (WHERE created_at >= now() - interval '7 days'), 0) AS revenue_last_7_days,
    COALESCE(sum(amount) FILTER (WHERE created_at >= now() - interval '24 hours'), 0) AS revenue_last_24h
  FROM platform_fees;
$$;

CREATE OR REPLACE FUNCTION public.get_money_reconciliation()
RETURNS TABLE(
  total_deposits numeric,
  total_wallet_balances numeric,
  total_withdrawals numeric,
  total_platform_fees numeric,
  discrepancy numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    (SELECT COALESCE(sum(amount), 0) FROM wallet_transactions WHERE type = 'deposit') AS total_deposits,
    (SELECT COALESCE(sum(balance_usd), 0) FROM wallets) AS total_wallet_balances,
    (SELECT COALESCE(sum(abs(amount)), 0) FROM wallet_transactions WHERE type IN ('withdrawal', 'payout_mpesa')) AS total_withdrawals,
    (SELECT COALESCE(sum(amount), 0) FROM platform_fees) AS total_platform_fees,
    (
      (SELECT COALESCE(sum(amount), 0) FROM wallet_transactions WHERE type = 'deposit')
      - (SELECT COALESCE(sum(balance_usd), 0) FROM wallets)
      - (SELECT COALESCE(sum(abs(amount)), 0) FROM wallet_transactions WHERE type IN ('withdrawal', 'payout_mpesa'))
      - (SELECT COALESCE(sum(amount), 0) FROM platform_fees)
    ) AS discrepancy;
$$;
