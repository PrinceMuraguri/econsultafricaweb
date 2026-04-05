-- ============================================================
-- P2P Marketplace — Safety & Atomicity Migration
-- Run this in Supabase SQL Editor before deploying edge functions
-- ============================================================

-- 1. Clean up any duplicate positions rows before adding constraint
DELETE FROM positions a
USING positions b
WHERE a.id > b.id
  AND a.user_id  = b.user_id
  AND a.poll_id  = b.poll_id
  AND a.option_id = b.option_id;

-- 2. Unique constraint on positions (required for ON CONFLICT upserts)
ALTER TABLE positions
  ADD CONSTRAINT IF NOT EXISTS positions_user_poll_option_unique
  UNIQUE (user_id, poll_id, option_id);

-- 3. Add cost_basis column to listings
--    Stores the exact cost deducted from the seller's position at listing time
--    (proportional to original stake, NOT price × shares — fixes cancel restoration bug)
ALTER TABLE listings ADD COLUMN IF NOT EXISTS cost_basis numeric NOT NULL DEFAULT 0;

-- 4. Add user_id to payouts (secondary buyers have no voter_fingerprint)
ALTER TABLE payouts ADD COLUMN IF NOT EXISTS user_id uuid;

-- 5. Allow new wallet_transactions types for P2P trades
--    (drop old check constraint if it exists, add updated one)
ALTER TABLE wallet_transactions DROP CONSTRAINT IF EXISTS wallet_transactions_type_check;
ALTER TABLE wallet_transactions
  ADD CONSTRAINT wallet_transactions_type_check
  CHECK (type IN (
    'deposit','withdrawal','sell_proceeds','payout',
    'refund','share_purchase','share_sale'
  ));

-- ============================================================
-- RPC: buy_listing_atomic
-- Wraps the entire buy flow in a single Postgres transaction.
-- Any failure rolls back ALL changes — no partial state possible.
-- ============================================================
CREATE OR REPLACE FUNCTION buy_listing_atomic(
  p_listing_id uuid,
  p_buyer_id   uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_listing       record;
  v_buyer_wallet  record;
  v_seller_wallet record;
  v_total_ask     numeric;
  v_fee_amount    numeric;
  v_seller_net    numeric;
  v_ref           text;
BEGIN
  -- Lock the listing row — prevents two buyers claiming simultaneously
  SELECT * INTO v_listing
  FROM listings
  WHERE id = p_listing_id AND status = 'active'
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Listing not found or already sold');
  END IF;

  IF v_listing.seller_id = p_buyer_id THEN
    RETURN jsonb_build_object('error', 'Cannot buy your own listing');
  END IF;

  -- Confirm poll is still open
  IF NOT EXISTS (
    SELECT 1 FROM polls
    WHERE id = v_listing.poll_id
      AND status = 'active'
      AND close_at > now()
  ) THEN
    RETURN jsonb_build_object('error', 'This poll is now closed');
  END IF;

  v_total_ask  := v_listing.total_ask;
  v_fee_amount := round(v_total_ask * 0.035, 2);
  v_seller_net := round(v_total_ask - v_fee_amount, 2);
  v_ref := 'p2p_' || left(p_listing_id::text, 8) || '_' || extract(epoch from now())::bigint::text;

  -- Atomically debit buyer wallet — balance guard in WHERE clause prevents overdraft
  UPDATE wallets
  SET balance_usd = balance_usd - v_total_ask,
      updated_at  = now()
  WHERE user_id   = p_buyer_id
    AND balance_usd >= v_total_ask
  RETURNING * INTO v_buyer_wallet;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Insufficient wallet balance');
  END IF;

  -- Credit seller wallet — hard error if wallet is missing (prevents silent money loss)
  UPDATE wallets
  SET balance_usd = balance_usd + v_seller_net,
      updated_at  = now()
  WHERE user_id = v_listing.seller_id
  RETURNING * INTO v_seller_wallet;

  IF NOT FOUND THEN
    -- This rolls back the buyer debit too — no money lost
    RAISE EXCEPTION 'Seller wallet not found for user %. Trade aborted.', v_listing.seller_id;
  END IF;

  -- Mark listing sold
  UPDATE listings
  SET status     = 'sold',
      buyer_id   = p_buyer_id,
      updated_at = now()
  WHERE id = p_listing_id;

  -- Transfer shares to buyer position (upsert — handles existing position on same option)
  INSERT INTO positions (user_id, poll_id, option_id, shares, avg_price, total_cost)
  VALUES (
    p_buyer_id,
    v_listing.poll_id,
    v_listing.option_id,
    v_listing.shares,
    v_listing.price_per_share,
    v_total_ask
  )
  ON CONFLICT (user_id, poll_id, option_id) DO UPDATE
    SET shares     = positions.shares + EXCLUDED.shares,
        total_cost = positions.total_cost + EXCLUDED.total_cost,
        avg_price  = (positions.total_cost + EXCLUDED.total_cost)
                     / (positions.shares + EXCLUDED.shares),
        updated_at = now();

  -- Wallet transactions for both parties
  INSERT INTO wallet_transactions (user_id, type, amount, description, reference)
  VALUES
    (p_buyer_id,
     'share_purchase',
     -v_total_ask,
     'Bought ' || v_listing.shares || ' shares (P2P market)',
     'buy_' || v_ref),
    (v_listing.seller_id,
     'share_sale',
     v_seller_net,
     'Sold ' || v_listing.shares || ' shares (P2P market)',
     'sell_' || v_ref);

  -- Trade records for both parties
  INSERT INTO trades (user_id, poll_id, option_id, side, shares, price, total_amount, fee, reference)
  VALUES
    (p_buyer_id,
     v_listing.poll_id, v_listing.option_id,
     'buy', v_listing.shares, v_listing.price_per_share,
     v_total_ask, 0, 'buy_' || v_ref),
    (v_listing.seller_id,
     v_listing.poll_id, v_listing.option_id,
     'sell', v_listing.shares, v_listing.price_per_share,
     v_total_ask, v_fee_amount, 'sell_' || v_ref);

  RETURN jsonb_build_object(
    'success',         true,
    'shares_acquired', v_listing.shares,
    'price_per_share', v_listing.price_per_share,
    'total_paid',      v_total_ask,
    'seller_received', v_seller_net,
    'platform_fee',    v_fee_amount
  );
END;
$$;

-- ============================================================
-- RPC: create_listing_atomic
-- Deducts shares and creates listing in one transaction.
-- SELECT FOR UPDATE prevents concurrent sell-shares double-spend.
-- ============================================================
CREATE OR REPLACE FUNCTION create_listing_atomic(
  p_seller_id       uuid,
  p_poll_id         uuid,
  p_option_id       uuid,
  p_shares          numeric,
  p_price_per_share numeric
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_position      record;
  v_total_ask     numeric;
  v_cost_basis    numeric;
  v_new_shares    numeric;
  v_new_total_cost numeric;
  v_listing_id    uuid;
BEGIN
  -- Input validation
  IF p_shares <= 0 THEN
    RETURN jsonb_build_object('error', 'Shares must be positive');
  END IF;
  IF p_price_per_share < 0.01 OR p_price_per_share >= 1.0 THEN
    RETURN jsonb_build_object('error', 'Price per share must be between $0.01 and $0.99');
  END IF;

  v_total_ask := round(p_shares * p_price_per_share, 2);

  -- Minimum listing value guard (prevents dust/penny listings)
  IF v_total_ask < 0.10 THEN
    RETURN jsonb_build_object('error', 'Minimum listing value is $0.10');
  END IF;

  -- Confirm poll is active
  IF NOT EXISTS (
    SELECT 1 FROM polls
    WHERE id = p_poll_id AND status = 'active' AND close_at > now()
  ) THEN
    RETURN jsonb_build_object('error', 'Poll is closed');
  END IF;

  -- Lock the position row — prevents concurrent sell-shares or create-listing
  -- from spending the same shares simultaneously (TOCTOU fix)
  SELECT * INTO v_position
  FROM positions
  WHERE user_id   = p_seller_id
    AND poll_id   = p_poll_id
    AND option_id = p_option_id
  FOR UPDATE;

  IF NOT FOUND OR v_position.shares < p_shares THEN
    RETURN jsonb_build_object('error', 'Insufficient shares in your position');
  END IF;

  -- Cost basis = proportional slice of original stake (NOT listing price × shares)
  -- This ensures cancellation restores the exact amount that was deducted
  v_cost_basis     := round(v_position.total_cost * (p_shares / v_position.shares), 2);
  v_new_shares     := round(v_position.shares - p_shares, 4);
  v_new_total_cost := round(v_position.total_cost - v_cost_basis, 2);

  -- Deduct from position or delete if fully listed
  IF v_new_shares <= 0 THEN
    DELETE FROM positions WHERE id = v_position.id;
  ELSE
    UPDATE positions
    SET shares     = v_new_shares,
        total_cost = v_new_total_cost,
        updated_at = now()
    WHERE id = v_position.id;
  END IF;

  -- Sync votes.stake_amount (keeps settlement pool accurate)
  UPDATE votes
  SET stake_amount = v_new_total_cost,
      is_staked    = (v_new_shares > 0)
  WHERE poll_id   = p_poll_id
    AND option_id = p_option_id
    AND user_id   = p_seller_id;

  -- Insert listing with cost_basis stored for accurate cancellation restoration
  INSERT INTO listings (
    seller_id, poll_id, option_id,
    shares, price_per_share, total_ask, cost_basis, status
  )
  VALUES (
    p_seller_id, p_poll_id, p_option_id,
    p_shares, p_price_per_share, v_total_ask, v_cost_basis, 'active'
  )
  RETURNING id INTO v_listing_id;

  RETURN jsonb_build_object(
    'success',         true,
    'listing_id',      v_listing_id,
    'shares',          p_shares,
    'price_per_share', p_price_per_share,
    'total_ask',       v_total_ask,
    'cost_basis',      v_cost_basis
  );
END;
$$;

-- ============================================================
-- RPC: cancel_listing_atomic
-- Cancels listing and restores shares in one transaction.
-- FOR UPDATE prevents cancel racing against a concurrent buy.
-- Restores cost_basis (not listing price) — fixes A-7.
-- ============================================================
CREATE OR REPLACE FUNCTION cancel_listing_atomic(
  p_listing_id uuid,
  p_seller_id  uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_listing record;
BEGIN
  -- Lock the listing row — if a buyer is mid-purchase, this waits for them
  -- After the lock is acquired, re-check status to handle the race
  SELECT * INTO v_listing
  FROM listings
  WHERE id        = p_listing_id
    AND seller_id = p_seller_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Listing not found or does not belong to you');
  END IF;

  -- Check status AFTER acquiring the lock (buy may have completed while we waited)
  IF v_listing.status <> 'active' THEN
    RETURN jsonb_build_object('error', 'Listing is no longer active — it may have just been sold');
  END IF;

  -- Mark cancelled (status check above + FOR UPDATE makes this race-safe)
  UPDATE listings
  SET status     = 'cancelled',
      updated_at = now()
  WHERE id = p_listing_id;

  -- Restore shares to seller position using cost_basis (exact amount deducted at listing time)
  INSERT INTO positions (user_id, poll_id, option_id, shares, avg_price, total_cost)
  VALUES (
    p_seller_id,
    v_listing.poll_id,
    v_listing.option_id,
    v_listing.shares,
    CASE WHEN v_listing.shares > 0
         THEN v_listing.cost_basis / v_listing.shares
         ELSE v_listing.price_per_share END,
    v_listing.cost_basis
  )
  ON CONFLICT (user_id, poll_id, option_id) DO UPDATE
    SET shares     = positions.shares + EXCLUDED.shares,
        total_cost = positions.total_cost + EXCLUDED.total_cost,
        avg_price  = (positions.total_cost + EXCLUDED.total_cost)
                     / (positions.shares + EXCLUDED.shares),
        updated_at = now();

  -- Restore votes.stake_amount using cost_basis (not listing price)
  UPDATE votes
  SET stake_amount = COALESCE(stake_amount, 0) + v_listing.cost_basis,
      is_staked    = true
  WHERE poll_id   = v_listing.poll_id
    AND option_id = v_listing.option_id
    AND user_id   = p_seller_id;

  RETURN jsonb_build_object(
    'success',         true,
    'shares_returned', v_listing.shares,
    'cost_restored',   v_listing.cost_basis
  );
END;
$$;
