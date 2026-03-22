
-- Add stake columns to votes
ALTER TABLE public.votes ADD COLUMN IF NOT EXISTS is_staked boolean NOT NULL DEFAULT false;
ALTER TABLE public.votes ADD COLUMN IF NOT EXISTS stake_amount numeric DEFAULT NULL;
ALTER TABLE public.votes ADD COLUMN IF NOT EXISTS payment_reference text DEFAULT NULL;

-- Add total_stake_amount to poll_options
ALTER TABLE public.poll_options ADD COLUMN IF NOT EXISTS total_stake_amount numeric NOT NULL DEFAULT 0;

-- Create transactions table
CREATE TABLE public.transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  voter_fingerprint text NOT NULL,
  poll_id uuid REFERENCES public.polls(id) ON DELETE CASCADE NOT NULL,
  option_id uuid REFERENCES public.poll_options(id) ON DELETE CASCADE NOT NULL,
  amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  channel text NOT NULL DEFAULT 'paystack',
  status text NOT NULL DEFAULT 'pending',
  reference text UNIQUE NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view transactions" ON public.transactions FOR SELECT TO public USING (true);
CREATE POLICY "Anyone can insert transactions" ON public.transactions FOR INSERT TO public WITH CHECK (true);

-- Create payouts table
CREATE TABLE public.payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id uuid REFERENCES public.polls(id) ON DELETE CASCADE NOT NULL,
  voter_fingerprint text NOT NULL,
  amount numeric NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  reference text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view their payouts" ON public.payouts FOR SELECT TO public USING (true);

-- Function to increment stake amount
CREATE OR REPLACE FUNCTION public.increment_stake_amount(p_option_id uuid, p_amount numeric)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  UPDATE public.poll_options
  SET total_stake_amount = total_stake_amount + p_amount
  WHERE id = p_option_id;
END;
$$;
