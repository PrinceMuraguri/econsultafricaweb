
-- 1. Create decrement_stake_amount function
CREATE OR REPLACE FUNCTION public.decrement_stake_amount(p_option_id uuid, p_amount numeric)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  UPDATE public.poll_options
  SET total_stake_amount = GREATEST(0, total_stake_amount - p_amount)
  WHERE id = p_option_id;
END;
$$;

-- 2. Update create_listing_atomic to decrement total_stake_amount
CREATE OR REPLACE FUNCTION public.create_listing_atomic(p_seller_id uuid, p_poll_id uuid, p_option_id uuid, p_shares numeric, p_price_per_share numeric)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_position      record;
  v_total_ask     numeric;
  v_cost_basis    numeric;
  v_new_shares    numeric;
  v_new_total_cost numeric;
  v_listing_id    uuid;
BEGIN
  IF p_shares <= 0 THEN
    RETURN jsonb_build_object('error', 'Shares must be positive');
  END IF;
  IF p_price_per_share < 0.01 OR p_price_per_share >= 1.0 THEN
    RETURN jsonb_build_object('error', 'Price per share must be between $0.01 and $0.99');
  END IF;

  v_total_ask := round(p_shares * p_price_per_share, 2);

  IF v_total_ask < 0.10 THEN
    RETURN jsonb_build_object('error', 'Minimum listing value is $0.10');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM polls
    WHERE id = p_poll_id AND status = 'active' AND close_at > now()
  ) THEN
    RETURN jsonb_build_object('error', 'Poll is closed');
  END IF;

  SELECT * INTO v_position
  FROM positions
  WHERE user_id   = p_seller_id
    AND poll_id   = p_poll_id
    AND option_id = p_option_id
  FOR UPDATE;

  IF NOT FOUND OR v_position.shares < p_shares THEN
    RETURN jsonb_build_object('error', 'Insufficient shares in your position');
  END IF;

  v_cost_basis     := round(v_position.total_cost * (p_shares / v_position.shares), 2);
  v_new_shares     := round(v_position.shares - p_shares, 4);
  v_new_total_cost := round(v_position.total_cost - v_cost_basis, 2);

  IF v_new_shares <= 0 THEN
    DELETE FROM positions WHERE id = v_position.id;
  ELSE
    UPDATE positions
    SET shares     = v_new_shares,
        total_cost = v_new_total_cost,
        updated_at = now()
    WHERE id = v_position.id;
  END IF;

  UPDATE votes
  SET stake_amount = v_new_total_cost,
      is_staked    = (v_new_shares > 0)
  WHERE poll_id   = p_poll_id
    AND option_id = p_option_id
    AND user_id   = p_seller_id;

  -- Decrement total_stake_amount on the poll option (capital leaving the market)
  UPDATE poll_options
  SET total_stake_amount = GREATEST(0, total_stake_amount - v_cost_basis)
  WHERE id = p_option_id;

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
$function$;

-- 3. Update cancel_listing_atomic to increment total_stake_amount
CREATE OR REPLACE FUNCTION public.cancel_listing_atomic(p_listing_id uuid, p_seller_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_listing record;
BEGIN
  SELECT * INTO v_listing
  FROM listings
  WHERE id        = p_listing_id
    AND seller_id = p_seller_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Listing not found or does not belong to you');
  END IF;

  IF v_listing.status <> 'active' THEN
    RETURN jsonb_build_object('error', 'Listing is no longer active — it may have just been sold');
  END IF;

  UPDATE listings
  SET status     = 'cancelled',
      updated_at = now()
  WHERE id = p_listing_id;

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

  UPDATE votes
  SET stake_amount = COALESCE(stake_amount, 0) + v_listing.cost_basis,
      is_staked    = true
  WHERE poll_id   = v_listing.poll_id
    AND option_id = v_listing.option_id
    AND user_id   = p_seller_id;

  -- Increment total_stake_amount on the poll option (capital returning to market)
  UPDATE poll_options
  SET total_stake_amount = total_stake_amount + v_listing.cost_basis
  WHERE id = v_listing.option_id;

  RETURN jsonb_build_object(
    'success',         true,
    'shares_returned', v_listing.shares,
    'cost_restored',   v_listing.cost_basis
  );
END;
$function$;
