CREATE TABLE public.platform_config_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  changed_at timestamptz NOT NULL DEFAULT now(),
  previous_mode text NOT NULL,
  new_mode text NOT NULL,
  actor_email text,
  actor_user_id uuid
);

ALTER TABLE public.platform_config_audit ENABLE ROW LEVEL SECURITY;

-- Defensive explicit insert policy (service_role bypasses RLS, but be explicit)
CREATE POLICY "audit_insert_service"
  ON public.platform_config_audit FOR INSERT
  TO service_role WITH CHECK (true);

-- Mode is already public-readable via platform_config; toggle history is low-sensitivity.
CREATE POLICY "audit_read_authenticated"
  ON public.platform_config_audit FOR SELECT
  TO authenticated USING (true);

CREATE INDEX idx_platform_config_audit_changed_at
  ON public.platform_config_audit (changed_at DESC);