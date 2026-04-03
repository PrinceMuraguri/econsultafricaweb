
-- Order book table for hybrid AMM + CLOB trading
CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  poll_id UUID NOT NULL REFERENCES public.polls(id),
  option_id UUID NOT NULL REFERENCES public.poll_options(id),
  side TEXT NOT NULL CHECK (side IN ('buy', 'sell')),
  order_type TEXT NOT NULL DEFAULT 'limit' CHECK (order_type IN ('limit', 'market')),
  price NUMERIC NOT NULL CHECK (price > 0 AND price < 1),
  shares NUMERIC NOT NULL CHECK (shares > 0),
  filled_shares NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'partial', 'filled', 'cancelled')),
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indexes for fast order matching
CREATE INDEX idx_orders_poll_option_side_status ON public.orders (poll_id, option_id, side, status, price);
CREATE INDEX idx_orders_user_id ON public.orders (user_id);
CREATE INDEX idx_orders_status ON public.orders (status);

-- Enable RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Anyone can see open orders (public order book)
CREATE POLICY "Anyone can view open orders"
  ON public.orders FOR SELECT
  USING (status IN ('open', 'partial') OR user_id = auth.uid());

-- Authenticated users can place orders
CREATE POLICY "Users can place orders"
  ON public.orders FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can cancel their own orders
CREATE POLICY "Users can cancel own orders"
  ON public.orders FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Service role full access for matching engine
CREATE POLICY "Service role manages orders"
  ON public.orders FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Enable realtime for order book updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
