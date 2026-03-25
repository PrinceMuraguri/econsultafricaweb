
-- Transfer recipients for Paystack payouts
CREATE TABLE public.transfer_recipients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  voter_fingerprint text NOT NULL,
  recipient_code text NOT NULL,
  recipient_type text NOT NULL DEFAULT 'mobile_money',
  name text NOT NULL,
  email text,
  phone text,
  bank_code text,
  account_number text,
  currency text NOT NULL DEFAULT 'KES',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(voter_fingerprint, recipient_type)
);

ALTER TABLE public.transfer_recipients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role only for transfer_recipients" ON public.transfer_recipients
  FOR ALL TO authenticated USING (false);

CREATE POLICY "Public read own recipients" ON public.transfer_recipients
  FOR SELECT TO public USING (true);

-- Payout transfers tracking
CREATE TABLE public.payout_transfers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payout_id uuid REFERENCES public.payouts(id) NOT NULL,
  voter_fingerprint text NOT NULL,
  recipient_code text NOT NULL,
  transfer_code text,
  amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'KES',
  status text NOT NULL DEFAULT 'pending',
  reason text,
  batch_id text,
  paystack_reference text,
  retries int NOT NULL DEFAULT 0,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.payout_transfers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read own transfers" ON public.payout_transfers
  FOR SELECT TO public USING (true);

-- Admin audit log
CREATE TABLE public.admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id text,
  details jsonb,
  performed_by text NOT NULL DEFAULT 'super_admin',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read audit log" ON public.admin_audit_log
  FOR SELECT TO public USING (true);

CREATE POLICY "Public insert audit log" ON public.admin_audit_log
  FOR INSERT TO public WITH CHECK (true);

-- Add settlement fields to polls
ALTER TABLE public.polls ADD COLUMN IF NOT EXISTS winning_option_id uuid REFERENCES public.poll_options(id);
ALTER TABLE public.polls ADD COLUMN IF NOT EXISTS settled_at timestamptz;
ALTER TABLE public.polls ADD COLUMN IF NOT EXISTS settled_by text;

-- Add settlement fields to payouts
ALTER TABLE public.payouts ADD COLUMN IF NOT EXISTS payout_method text DEFAULT 'mpesa';
ALTER TABLE public.payouts ADD COLUMN IF NOT EXISTS transfer_code text;
ALTER TABLE public.payouts ADD COLUMN IF NOT EXISTS settled_at timestamptz;

-- Enable realtime for payout_transfers
ALTER PUBLICATION supabase_realtime ADD TABLE public.payout_transfers;
