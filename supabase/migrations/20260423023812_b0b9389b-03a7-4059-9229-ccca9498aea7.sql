-- Drop the flagged SECURITY DEFINER views and replace with SECURITY DEFINER
-- set-returning functions, which is the Supabase-recommended pattern for
-- exposing aggregated data from locked-down base tables.

DROP VIEW IF EXISTS public.demo_orders_public;
DROP VIEW IF EXISTS public.demo_listings_public;

-- Aggregated order book depth — price-level only, no user/order detail.
CREATE OR REPLACE FUNCTION public.demo_orders_depth(p_poll_id uuid)
RETURNS TABLE (
  poll_id                uuid,
  option_id              uuid,
  side                   text,
  price                  numeric,
  total_shares_at_level  numeric,
  order_count_at_level   int
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    o.poll_id,
    o.option_id,
    o.side,
    o.price,
    SUM(o.shares - o.filled_shares)::numeric(15,4) AS total_shares_at_level,
    COUNT(*)::int                                  AS order_count_at_level
  FROM public.demo_orders o
  WHERE o.poll_id = p_poll_id
    AND o.status IN ('open','partial')
    AND (o.shares - o.filled_shares) > 0
  GROUP BY o.poll_id, o.option_id, o.side, o.price;
$$;

GRANT EXECUTE ON FUNCTION public.demo_orders_depth(uuid) TO anon, authenticated;

-- Aggregated listings depth — price-level only.
CREATE OR REPLACE FUNCTION public.demo_listings_depth(p_poll_id uuid)
RETURNS TABLE (
  poll_id                uuid,
  option_id              uuid,
  price_per_share        numeric,
  total_shares_at_level  numeric,
  listing_count_at_level int
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    l.poll_id,
    l.option_id,
    l.price_per_share,
    SUM(l.shares)::numeric(15,4) AS total_shares_at_level,
    COUNT(*)::int                AS listing_count_at_level
  FROM public.demo_listings l
  WHERE l.poll_id = p_poll_id
    AND l.status = 'active'
  GROUP BY l.poll_id, l.option_id, l.price_per_share;
$$;

GRANT EXECUTE ON FUNCTION public.demo_listings_depth(uuid) TO anon, authenticated;
