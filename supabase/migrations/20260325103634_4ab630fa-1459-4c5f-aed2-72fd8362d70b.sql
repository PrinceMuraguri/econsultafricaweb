
CREATE TABLE public.trading_waitlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text NOT NULL,
  phone_number text NOT NULL,
  voter_fingerprint text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.trading_waitlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can join waitlist" ON public.trading_waitlist
  FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Anyone can read waitlist" ON public.trading_waitlist
  FOR SELECT TO public USING (true);
