
-- 1. Positions table: tracks share holdings per user/poll/option
CREATE TABLE public.positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  poll_id UUID NOT NULL REFERENCES public.polls(id) ON DELETE CASCADE,
  option_id UUID NOT NULL REFERENCES public.poll_options(id) ON DELETE CASCADE,
  shares NUMERIC NOT NULL DEFAULT 0,
  avg_price NUMERIC NOT NULL DEFAULT 0,
  total_cost NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, poll_id, option_id)
);

ALTER TABLE public.positions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own positions" ON public.positions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Service role manages positions" ON public.positions
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 2. Trades table: records every buy/sell trade
CREATE TABLE public.trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  poll_id UUID NOT NULL REFERENCES public.polls(id) ON DELETE CASCADE,
  option_id UUID NOT NULL REFERENCES public.poll_options(id) ON DELETE CASCADE,
  side TEXT NOT NULL CHECK (side IN ('buy', 'sell')),
  shares NUMERIC NOT NULL,
  price NUMERIC NOT NULL,
  total_amount NUMERIC NOT NULL,
  fee NUMERIC NOT NULL DEFAULT 0,
  reference TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own trades" ON public.trades
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Service role manages trades" ON public.trades
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 3. Add realtime for positions and trades
ALTER PUBLICATION supabase_realtime ADD TABLE public.positions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.trades;

-- 4. Index for fast lookups
CREATE INDEX idx_positions_user_poll ON public.positions(user_id, poll_id);
CREATE INDEX idx_trades_user_poll ON public.trades(user_id, poll_id);
CREATE INDEX idx_trades_poll_option ON public.trades(poll_id, option_id);
