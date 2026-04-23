-- =====================================================================
-- PHASE 1: Pro Demo Mode Schema
-- Parallel virtual-currency infrastructure. Live-money tables untouched.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. platform_config — single-row toggle
-- ---------------------------------------------------------------------
CREATE TABLE public.platform_config (
  id          int PRIMARY KEY CHECK (id = 1),
  pro_mode    text NOT NULL DEFAULT 'demo' CHECK (pro_mode IN ('demo','live')),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.platform_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "platform_config_public_read"
  ON public.platform_config FOR SELECT
  USING (true);

CREATE POLICY "platform_config_service_update"
  ON public.platform_config FOR UPDATE
  TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "platform_config_service_insert"
  ON public.platform_config FOR INSERT
  TO service_role
  WITH CHECK (true);

INSERT INTO public.platform_config (id, pro_mode) VALUES (1, 'demo');

-- ---------------------------------------------------------------------
-- 2. demo_wallets — 1:1 with users, default 100 AC
-- ---------------------------------------------------------------------
CREATE TABLE public.demo_wallets (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL UNIQUE,
  balance     numeric(15,2) NOT NULL DEFAULT 100.00 CHECK (balance >= 0),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.demo_wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "demo_wallets_owner_read"
  ON public.demo_wallets FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "demo_wallets_service_all"
  ON public.demo_wallets FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

-- ---------------------------------------------------------------------
-- 3. demo_positions
-- ---------------------------------------------------------------------
CREATE TABLE public.demo_positions (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL,
  poll_id      uuid NOT NULL,
  option_id    uuid NOT NULL,
  shares       numeric(15,4) NOT NULL DEFAULT 0,
  avg_price    numeric(10,4) NOT NULL DEFAULT 0,
  cost_basis   numeric(15,2) NOT NULL DEFAULT 0,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, poll_id, option_id)
);

CREATE INDEX idx_demo_positions_user ON public.demo_positions(user_id);
CREATE INDEX idx_demo_positions_poll ON public.demo_positions(poll_id);

ALTER TABLE public.demo_positions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "demo_positions_owner_read"
  ON public.demo_positions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "demo_positions_service_all"
  ON public.demo_positions FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

-- ---------------------------------------------------------------------
-- 4. demo_orders — locked down, owner-only base read
-- ---------------------------------------------------------------------
CREATE TABLE public.demo_orders (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL,
  poll_id         uuid NOT NULL,
  option_id       uuid NOT NULL,
  side            text NOT NULL CHECK (side IN ('buy','sell')),
  order_type      text NOT NULL DEFAULT 'limit' CHECK (order_type IN ('limit','market')),
  price           numeric(10,4) NOT NULL,
  shares          numeric(15,4) NOT NULL,
  filled_shares   numeric(15,4) NOT NULL DEFAULT 0,
  status          text NOT NULL DEFAULT 'open' CHECK (status IN ('open','partial','filled','cancelled','expired')),
  expires_at      timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_demo_orders_book   ON public.demo_orders(poll_id, option_id, side, price) WHERE status IN ('open','partial');
CREATE INDEX idx_demo_orders_user   ON public.demo_orders(user_id);

ALTER TABLE public.demo_orders ENABLE ROW LEVEL SECURITY;

-- Lock the base table so only owners (or service role) can ever see raw rows.
REVOKE SELECT ON public.demo_orders FROM anon, authenticated;

CREATE POLICY "demo_orders_owner_read"
  ON public.demo_orders FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "demo_orders_service_all"
  ON public.demo_orders FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

-- ---------------------------------------------------------------------
-- 5. demo_listings — locked down, owner-only base read
-- ---------------------------------------------------------------------
CREATE TABLE public.demo_listings (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id       uuid NOT NULL,
  buyer_id        uuid,
  poll_id         uuid NOT NULL,
  option_id       uuid NOT NULL,
  shares          numeric(15,4) NOT NULL,
  price_per_share numeric(10,4) NOT NULL,
  total_ask       numeric(15,2) NOT NULL,
  cost_basis      numeric(15,2) NOT NULL DEFAULT 0,
  status          text NOT NULL DEFAULT 'active' CHECK (status IN ('active','sold','cancelled')),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_demo_listings_book   ON public.demo_listings(poll_id, option_id, price_per_share) WHERE status = 'active';
CREATE INDEX idx_demo_listings_seller ON public.demo_listings(seller_id);

ALTER TABLE public.demo_listings ENABLE ROW LEVEL SECURITY;

REVOKE SELECT ON public.demo_listings FROM anon, authenticated;

CREATE POLICY "demo_listings_owner_read"
  ON public.demo_listings FOR SELECT
  TO authenticated
  USING (auth.uid() = seller_id OR auth.uid() = buyer_id);

CREATE POLICY "demo_listings_service_all"
  ON public.demo_listings FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

-- ---------------------------------------------------------------------
-- 6. demo_trades + demo_wallet_transactions
-- ---------------------------------------------------------------------
CREATE TABLE public.demo_trades (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL,
  poll_id       uuid NOT NULL,
  option_id     uuid NOT NULL,
  side          text NOT NULL CHECK (side IN ('buy','sell')),
  shares        numeric(15,4) NOT NULL,
  price         numeric(10,4) NOT NULL,
  total_amount  numeric(15,2) NOT NULL,
  fee           numeric(15,2) NOT NULL DEFAULT 0,
  reference     text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_demo_trades_user ON public.demo_trades(user_id);
CREATE INDEX idx_demo_trades_poll ON public.demo_trades(poll_id);

ALTER TABLE public.demo_trades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "demo_trades_owner_read"
  ON public.demo_trades FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "demo_trades_service_all"
  ON public.demo_trades FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

CREATE TABLE public.demo_wallet_transactions (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL,
  type         text NOT NULL,
  amount       numeric(15,2) NOT NULL,
  description  text,
  reference    text,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_demo_wallet_tx_user ON public.demo_wallet_transactions(user_id, created_at DESC);

ALTER TABLE public.demo_wallet_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "demo_wallet_tx_owner_read"
  ON public.demo_wallet_transactions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "demo_wallet_tx_service_all"
  ON public.demo_wallet_transactions FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

-- ---------------------------------------------------------------------
-- 7. Public CLOB views — price-level aggregated depth only
-- ---------------------------------------------------------------------
CREATE VIEW public.demo_orders_public
WITH (security_invoker = false) AS
SELECT
  poll_id,
  option_id,
  side,
  price,
  SUM(shares - filled_shares)::numeric(15,4) AS total_shares_at_level,
  COUNT(*)::int                              AS order_count_at_level
FROM public.demo_orders
WHERE status IN ('open','partial')
  AND (shares - filled_shares) > 0
GROUP BY poll_id, option_id, side, price;

GRANT SELECT ON public.demo_orders_public TO anon, authenticated;

CREATE VIEW public.demo_listings_public
WITH (security_invoker = false) AS
SELECT
  poll_id,
  option_id,
  price_per_share,
  SUM(shares)::numeric(15,4) AS total_shares_at_level,
  COUNT(*)::int              AS listing_count_at_level
FROM public.demo_listings
WHERE status = 'active'
GROUP BY poll_id, option_id, price_per_share;

GRANT SELECT ON public.demo_listings_public TO anon, authenticated;

-- ---------------------------------------------------------------------
-- 8. user_profiles.has_acknowledged_demo
-- ---------------------------------------------------------------------
ALTER TABLE public.user_profiles
  ADD COLUMN has_acknowledged_demo boolean NOT NULL DEFAULT false;

-- ---------------------------------------------------------------------
-- 9. Trigger + backfill: every user gets a demo wallet
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_demo_wallet_for_new_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.demo_wallets (user_id) VALUES (NEW.user_id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_create_demo_wallet_for_new_profile
  AFTER INSERT ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.create_demo_wallet_for_new_profile();

-- One-shot backfill for every existing user
INSERT INTO public.demo_wallets (user_id)
SELECT user_id FROM public.user_profiles
ON CONFLICT (user_id) DO NOTHING;

-- ---------------------------------------------------------------------
-- 10. Atomic SECURITY DEFINER RPCs (demo-only; live RPCs untouched)
-- ---------------------------------------------------------------------

-- demo_stake_atomic — virtual stake, deducts from demo_wallets, creates/updates demo_positions
CREATE OR REPLACE FUNCTION public.demo_stake_atomic(
  p_user_id     uuid,
  p_poll_id     uuid,
  p_option_id   uuid,
  p_amount      numeric,
  p_entry_price numeric
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_wallet      record;
  v_shares      numeric;
  v_ref         text;
BEGIN
  IF p_amount <= 0 THEN
    RETURN jsonb_build_object('error', 'Amount must be positive');
  END IF;
  IF p_entry_price <= 0 OR p_entry_price >= 1 THEN
    RETURN jsonb_build_object('error', 'Entry price must be between 0 and 1');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM polls
    WHERE id = p_poll_id AND status = 'active' AND close_at > now()
  ) THEN
    RETURN jsonb_build_object('error', 'Poll is closed');
  END IF;

  v_shares := round(p_amount / p_entry_price, 4);
  v_ref := 'demo_stake_' || extract(epoch from now())::bigint::text;

  UPDATE demo_wallets
  SET balance = balance - p_amount, updated_at = now()
  WHERE user_id = p_user_id AND balance >= p_amount
  RETURNING * INTO v_wallet;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Insufficient Arena Coins. This is demo mode; you cannot deposit more.');
  END IF;

  INSERT INTO demo_positions (user_id, poll_id, option_id, shares, avg_price, cost_basis)
  VALUES (p_user_id, p_poll_id, p_option_id, v_shares, p_entry_price, p_amount)
  ON CONFLICT (user_id, poll_id, option_id) DO UPDATE
    SET shares     = demo_positions.shares + EXCLUDED.shares,
        cost_basis = demo_positions.cost_basis + EXCLUDED.cost_basis,
        avg_price  = (demo_positions.cost_basis + EXCLUDED.cost_basis)
                     / NULLIF(demo_positions.shares + EXCLUDED.shares, 0),
        updated_at = now();

  INSERT INTO demo_wallet_transactions (user_id, type, amount, description, reference)
  VALUES (p_user_id, 'demo_stake', -p_amount,
          'Staked ' || p_amount || ' AC at ' || p_entry_price, v_ref);

  -- Mirror the live behaviour: keep the public chart alive
  UPDATE poll_options
  SET total_stake_amount = total_stake_amount + p_amount
  WHERE id = p_option_id;

  RETURN jsonb_build_object(
    'success',     true,
    'shares',      v_shares,
    'amount',      p_amount,
    'entry_price', p_entry_price,
    'balance',     v_wallet.balance
  );
END;
$$;

-- demo_buy_shares_atomic — AMM buy
CREATE OR REPLACE FUNCTION public.demo_buy_shares_atomic(
  p_user_id   uuid,
  p_poll_id   uuid,
  p_option_id uuid,
  p_shares    numeric,
  p_price     numeric
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total numeric;
  v_fee   numeric;
  v_gross numeric;
  v_wallet record;
  v_ref   text;
BEGIN
  IF p_shares <= 0 OR p_price <= 0 OR p_price >= 1 THEN
    RETURN jsonb_build_object('error', 'Invalid shares or price');
  END IF;

  v_gross := round(p_shares * p_price, 2);
  v_fee   := round(v_gross * 0.035, 2);
  v_total := v_gross + v_fee;
  v_ref := 'demo_buy_' || extract(epoch from now())::bigint::text;

  UPDATE demo_wallets
  SET balance = balance - v_total, updated_at = now()
  WHERE user_id = p_user_id AND balance >= v_total
  RETURNING * INTO v_wallet;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Insufficient Arena Coins.');
  END IF;

  INSERT INTO demo_positions (user_id, poll_id, option_id, shares, avg_price, cost_basis)
  VALUES (p_user_id, p_poll_id, p_option_id, p_shares, p_price, v_gross)
  ON CONFLICT (user_id, poll_id, option_id) DO UPDATE
    SET shares     = demo_positions.shares + EXCLUDED.shares,
        cost_basis = demo_positions.cost_basis + EXCLUDED.cost_basis,
        avg_price  = (demo_positions.cost_basis + EXCLUDED.cost_basis)
                     / NULLIF(demo_positions.shares + EXCLUDED.shares, 0),
        updated_at = now();

  INSERT INTO demo_trades (user_id, poll_id, option_id, side, shares, price, total_amount, fee, reference)
  VALUES (p_user_id, p_poll_id, p_option_id, 'buy', p_shares, p_price, v_gross, v_fee, v_ref);

  INSERT INTO demo_wallet_transactions (user_id, type, amount, description, reference)
  VALUES (p_user_id, 'demo_buy', -v_total,
          'Bought ' || p_shares || ' shares @ ' || p_price || ' AC', v_ref);

  RETURN jsonb_build_object('success', true, 'shares', p_shares, 'total', v_total, 'fee', v_fee, 'balance', v_wallet.balance);
END;
$$;

-- demo_sell_shares_atomic — AMM sell
CREATE OR REPLACE FUNCTION public.demo_sell_shares_atomic(
  p_user_id   uuid,
  p_poll_id   uuid,
  p_option_id uuid,
  p_shares    numeric,
  p_price     numeric
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_position record;
  v_gross numeric;
  v_fee numeric;
  v_net numeric;
  v_proportion numeric;
  v_cost_removed numeric;
  v_ref text;
BEGIN
  IF p_shares <= 0 OR p_price <= 0 OR p_price >= 1 THEN
    RETURN jsonb_build_object('error', 'Invalid shares or price');
  END IF;

  v_gross := round(p_shares * p_price, 2);
  v_fee   := round(v_gross * 0.035, 2);
  v_net   := v_gross - v_fee;
  v_ref   := 'demo_sell_' || extract(epoch from now())::bigint::text;

  SELECT * INTO v_position
  FROM demo_positions
  WHERE user_id = p_user_id AND poll_id = p_poll_id AND option_id = p_option_id
  FOR UPDATE;

  IF NOT FOUND OR v_position.shares < p_shares THEN
    RETURN jsonb_build_object('error', 'Insufficient shares');
  END IF;

  v_proportion   := p_shares / v_position.shares;
  v_cost_removed := round(v_position.cost_basis * v_proportion, 2);

  IF v_position.shares - p_shares <= 0 THEN
    DELETE FROM demo_positions WHERE id = v_position.id;
  ELSE
    UPDATE demo_positions
    SET shares     = v_position.shares - p_shares,
        cost_basis = v_position.cost_basis - v_cost_removed,
        updated_at = now()
    WHERE id = v_position.id;
  END IF;

  UPDATE demo_wallets
  SET balance = balance + v_net, updated_at = now()
  WHERE user_id = p_user_id;

  INSERT INTO demo_trades (user_id, poll_id, option_id, side, shares, price, total_amount, fee, reference)
  VALUES (p_user_id, p_poll_id, p_option_id, 'sell', p_shares, p_price, v_gross, v_fee, v_ref);

  INSERT INTO demo_wallet_transactions (user_id, type, amount, description, reference)
  VALUES (p_user_id, 'demo_sell', v_net,
          'Sold ' || p_shares || ' shares @ ' || p_price || ' AC', v_ref);

  RETURN jsonb_build_object('success', true, 'net', v_net, 'fee', v_fee);
END;
$$;

-- demo_create_listing_atomic
CREATE OR REPLACE FUNCTION public.demo_create_listing_atomic(
  p_seller_id      uuid,
  p_poll_id        uuid,
  p_option_id      uuid,
  p_shares         numeric,
  p_price_per_share numeric
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_position    record;
  v_total_ask   numeric;
  v_cost_basis  numeric;
  v_new_shares  numeric;
  v_new_total_cost numeric;
  v_listing_id  uuid;
BEGIN
  IF p_shares <= 0 THEN
    RETURN jsonb_build_object('error', 'Shares must be positive');
  END IF;
  IF p_price_per_share < 0.01 OR p_price_per_share >= 1.0 THEN
    RETURN jsonb_build_object('error', 'Price per share must be between 0.01 and 0.99 AC');
  END IF;

  v_total_ask := round(p_shares * p_price_per_share, 2);

  IF v_total_ask < 0.10 THEN
    RETURN jsonb_build_object('error', 'Minimum listing value is 0.10 AC');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM polls
    WHERE id = p_poll_id AND status = 'active' AND close_at > now()
  ) THEN
    RETURN jsonb_build_object('error', 'Poll is closed');
  END IF;

  SELECT * INTO v_position
  FROM demo_positions
  WHERE user_id = p_seller_id AND poll_id = p_poll_id AND option_id = p_option_id
  FOR UPDATE;

  IF NOT FOUND OR v_position.shares < p_shares THEN
    RETURN jsonb_build_object('error', 'Insufficient shares in your position');
  END IF;

  v_cost_basis     := round(v_position.cost_basis * (p_shares / v_position.shares), 2);
  v_new_shares     := round(v_position.shares - p_shares, 4);
  v_new_total_cost := round(v_position.cost_basis - v_cost_basis, 2);

  IF v_new_shares <= 0 THEN
    DELETE FROM demo_positions WHERE id = v_position.id;
  ELSE
    UPDATE demo_positions
    SET shares     = v_new_shares,
        cost_basis = v_new_total_cost,
        updated_at = now()
    WHERE id = v_position.id;
  END IF;

  INSERT INTO demo_listings (
    seller_id, poll_id, option_id, shares, price_per_share, total_ask, cost_basis, status
  )
  VALUES (
    p_seller_id, p_poll_id, p_option_id, p_shares, p_price_per_share, v_total_ask, v_cost_basis, 'active'
  )
  RETURNING id INTO v_listing_id;

  RETURN jsonb_build_object(
    'success', true, 'listing_id', v_listing_id,
    'shares', p_shares, 'price_per_share', p_price_per_share,
    'total_ask', v_total_ask, 'cost_basis', v_cost_basis
  );
END;
$$;

-- demo_buy_listing_atomic
CREATE OR REPLACE FUNCTION public.demo_buy_listing_atomic(
  p_buyer_id   uuid,
  p_listing_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_listing      record;
  v_buyer_wallet record;
  v_total_ask    numeric;
  v_fee          numeric;
  v_seller_net   numeric;
  v_total_paid   numeric;
  v_ref          text;
BEGIN
  SELECT * INTO v_listing
  FROM demo_listings
  WHERE id = p_listing_id AND status = 'active'
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Listing not found or already sold');
  END IF;

  IF v_listing.seller_id = p_buyer_id THEN
    RETURN jsonb_build_object('error', 'Cannot buy your own listing');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM polls
    WHERE id = v_listing.poll_id AND status = 'active' AND close_at > now()
  ) THEN
    RETURN jsonb_build_object('error', 'Poll is now closed');
  END IF;

  v_total_ask  := v_listing.total_ask;
  v_fee        := round(v_total_ask * 0.035, 2);
  v_total_paid := v_total_ask + v_fee;
  v_seller_net := v_total_ask;
  v_ref := 'demo_p2p_' || left(p_listing_id::text, 8) || '_' || extract(epoch from now())::bigint::text;

  UPDATE demo_wallets
  SET balance = balance - v_total_paid, updated_at = now()
  WHERE user_id = p_buyer_id AND balance >= v_total_paid
  RETURNING * INTO v_buyer_wallet;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Insufficient Arena Coins');
  END IF;

  UPDATE demo_wallets
  SET balance = balance + v_seller_net, updated_at = now()
  WHERE user_id = v_listing.seller_id;

  UPDATE demo_listings
  SET status = 'sold', buyer_id = p_buyer_id, updated_at = now()
  WHERE id = p_listing_id;

  INSERT INTO demo_positions (user_id, poll_id, option_id, shares, avg_price, cost_basis)
  VALUES (p_buyer_id, v_listing.poll_id, v_listing.option_id,
          v_listing.shares, v_listing.price_per_share, v_total_ask)
  ON CONFLICT (user_id, poll_id, option_id) DO UPDATE
    SET shares     = demo_positions.shares + EXCLUDED.shares,
        cost_basis = demo_positions.cost_basis + EXCLUDED.cost_basis,
        avg_price  = (demo_positions.cost_basis + EXCLUDED.cost_basis)
                     / NULLIF(demo_positions.shares + EXCLUDED.shares, 0),
        updated_at = now();

  INSERT INTO demo_wallet_transactions (user_id, type, amount, description, reference) VALUES
    (p_buyer_id,           'demo_p2p_buy',  -v_total_paid, 'Bought ' || v_listing.shares || ' shares (P2P)',  'buy_'  || v_ref),
    (v_listing.seller_id,  'demo_p2p_sell', v_seller_net,  'Sold '   || v_listing.shares || ' shares (P2P)',  'sell_' || v_ref);

  INSERT INTO demo_trades (user_id, poll_id, option_id, side, shares, price, total_amount, fee, reference) VALUES
    (p_buyer_id,          v_listing.poll_id, v_listing.option_id, 'buy',  v_listing.shares, v_listing.price_per_share, v_total_ask, v_fee, 'buy_'  || v_ref),
    (v_listing.seller_id, v_listing.poll_id, v_listing.option_id, 'sell', v_listing.shares, v_listing.price_per_share, v_total_ask, 0,     'sell_' || v_ref);

  RETURN jsonb_build_object(
    'success', true,
    'shares_acquired', v_listing.shares,
    'total_paid', v_total_paid,
    'fee', v_fee
  );
END;
$$;

-- demo_cancel_listing_atomic
CREATE OR REPLACE FUNCTION public.demo_cancel_listing_atomic(
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
  SELECT * INTO v_listing
  FROM demo_listings
  WHERE id = p_listing_id AND seller_id = p_seller_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Listing not found or does not belong to you');
  END IF;

  IF v_listing.status <> 'active' THEN
    RETURN jsonb_build_object('error', 'Listing is no longer active');
  END IF;

  UPDATE demo_listings
  SET status = 'cancelled', updated_at = now()
  WHERE id = p_listing_id;

  INSERT INTO demo_positions (user_id, poll_id, option_id, shares, avg_price, cost_basis)
  VALUES (
    p_seller_id, v_listing.poll_id, v_listing.option_id,
    v_listing.shares,
    CASE WHEN v_listing.shares > 0 THEN v_listing.cost_basis / v_listing.shares ELSE v_listing.price_per_share END,
    v_listing.cost_basis
  )
  ON CONFLICT (user_id, poll_id, option_id) DO UPDATE
    SET shares     = demo_positions.shares + EXCLUDED.shares,
        cost_basis = demo_positions.cost_basis + EXCLUDED.cost_basis,
        avg_price  = (demo_positions.cost_basis + EXCLUDED.cost_basis)
                     / NULLIF(demo_positions.shares + EXCLUDED.shares, 0),
        updated_at = now();

  RETURN jsonb_build_object('success', true, 'shares_returned', v_listing.shares, 'cost_restored', v_listing.cost_basis);
END;
$$;

-- demo_place_order_atomic — escrows cash for buy orders
CREATE OR REPLACE FUNCTION public.demo_place_order_atomic(
  p_user_id   uuid,
  p_poll_id   uuid,
  p_option_id uuid,
  p_side      text,
  p_price     numeric,
  p_shares    numeric
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total numeric;
  v_wallet record;
  v_position record;
  v_order_id uuid;
BEGIN
  IF p_side NOT IN ('buy','sell') THEN
    RETURN jsonb_build_object('error', 'Invalid side');
  END IF;
  IF p_shares <= 0 OR p_price <= 0 OR p_price >= 1 THEN
    RETURN jsonb_build_object('error', 'Invalid shares or price');
  END IF;

  IF p_side = 'buy' THEN
    v_total := round(p_shares * p_price, 2);
    UPDATE demo_wallets
    SET balance = balance - v_total, updated_at = now()
    WHERE user_id = p_user_id AND balance >= v_total
    RETURNING * INTO v_wallet;
    IF NOT FOUND THEN
      RETURN jsonb_build_object('error', 'Insufficient Arena Coins to escrow this order');
    END IF;
    INSERT INTO demo_wallet_transactions (user_id, type, amount, description)
    VALUES (p_user_id, 'demo_order_escrow', -v_total, 'Escrowed for buy order @ ' || p_price);
  ELSE
    SELECT * INTO v_position
    FROM demo_positions
    WHERE user_id = p_user_id AND poll_id = p_poll_id AND option_id = p_option_id
    FOR UPDATE;
    IF NOT FOUND OR v_position.shares < p_shares THEN
      RETURN jsonb_build_object('error', 'Insufficient shares to place sell order');
    END IF;
  END IF;

  INSERT INTO demo_orders (user_id, poll_id, option_id, side, price, shares)
  VALUES (p_user_id, p_poll_id, p_option_id, p_side, p_price, p_shares)
  RETURNING id INTO v_order_id;

  RETURN jsonb_build_object('success', true, 'order_id', v_order_id);
END;
$$;

-- demo_cancel_order_atomic — refunds escrow for buy orders
CREATE OR REPLACE FUNCTION public.demo_cancel_order_atomic(
  p_order_id uuid,
  p_user_id  uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order record;
  v_unfilled numeric;
  v_refund numeric;
BEGIN
  SELECT * INTO v_order
  FROM demo_orders
  WHERE id = p_order_id AND user_id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Order not found');
  END IF;

  IF v_order.status NOT IN ('open','partial') THEN
    RETURN jsonb_build_object('error', 'Order is not active');
  END IF;

  v_unfilled := v_order.shares - v_order.filled_shares;

  UPDATE demo_orders
  SET status = 'cancelled', updated_at = now()
  WHERE id = p_order_id;

  IF v_order.side = 'buy' AND v_unfilled > 0 THEN
    v_refund := round(v_unfilled * v_order.price, 2);
    UPDATE demo_wallets
    SET balance = balance + v_refund, updated_at = now()
    WHERE user_id = p_user_id;
    INSERT INTO demo_wallet_transactions (user_id, type, amount, description)
    VALUES (p_user_id, 'demo_order_refund', v_refund, 'Refund of cancelled buy order escrow');
  END IF;

  RETURN jsonb_build_object('success', true, 'refunded', COALESCE(v_refund, 0));
END;
$$;

-- demo_settle_market — credits winners' demo_wallets at 1.00 AC per share
CREATE OR REPLACE FUNCTION public.demo_settle_market(
  p_poll_id           uuid,
  p_winning_option_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_position record;
  v_payout numeric;
  v_winners int := 0;
  v_total_paid numeric := 0;
BEGIN
  FOR v_position IN
    SELECT * FROM demo_positions
    WHERE poll_id = p_poll_id AND option_id = p_winning_option_id AND shares > 0
  LOOP
    v_payout := round(v_position.shares * 1.00, 2);
    UPDATE demo_wallets
    SET balance = balance + v_payout, updated_at = now()
    WHERE user_id = v_position.user_id;

    INSERT INTO demo_wallet_transactions (user_id, type, amount, description, reference)
    VALUES (v_position.user_id, 'demo_settlement', v_payout,
            'Settlement payout: ' || v_position.shares || ' winning shares', 'demo_settle_' || p_poll_id::text);

    v_winners := v_winners + 1;
    v_total_paid := v_total_paid + v_payout;
  END LOOP;

  RETURN jsonb_build_object('success', true, 'winners', v_winners, 'total_paid', v_total_paid);
END;
$$;
