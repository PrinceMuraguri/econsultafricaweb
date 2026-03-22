
CREATE TABLE public.voter_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  voter_fingerprint text NOT NULL,
  email text NOT NULL,
  full_name text NOT NULL,
  phone_number text NOT NULL,
  country_code text NOT NULL DEFAULT '+254',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(voter_fingerprint)
);

ALTER TABLE public.voter_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert their profile" ON public.voter_profiles
  FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Anyone can view their own profile" ON public.voter_profiles
  FOR SELECT TO public USING (true);

CREATE POLICY "Anyone can update their own profile" ON public.voter_profiles
  FOR UPDATE TO public USING (true) WITH CHECK (true);

CREATE OR REPLACE VIEW public.payout_winners AS
SELECT 
  p.title AS poll_title,
  p.slug AS poll_slug,
  p.outcome,
  po.label AS winning_option,
  v.voter_fingerprint,
  v.stake_amount,
  v.is_staked,
  v.created_at AS vote_date,
  vp.full_name,
  vp.email,
  vp.phone_number,
  vp.country_code,
  pay.status AS payout_status,
  pay.amount AS payout_amount
FROM votes v
JOIN polls p ON p.id = v.poll_id
JOIN poll_options po ON po.id = v.option_id
LEFT JOIN voter_profiles vp ON vp.voter_fingerprint = v.voter_fingerprint
LEFT JOIN payouts pay ON pay.poll_id = v.poll_id AND pay.voter_fingerprint = v.voter_fingerprint
WHERE p.outcome IS NOT NULL 
  AND po.label = p.outcome
  AND v.is_staked = true;
