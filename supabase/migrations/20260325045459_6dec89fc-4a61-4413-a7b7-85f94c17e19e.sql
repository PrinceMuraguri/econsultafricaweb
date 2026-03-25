
CREATE TABLE public.sample_downloads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  downloaded_at timestamptz NOT NULL DEFAULT now(),
  source_page text NOT NULL DEFAULT '/sample-report',
  user_agent text,
  ip_hint text,
  fingerprint text,
  referrer text
);

ALTER TABLE public.sample_downloads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert downloads" ON public.sample_downloads
  FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Admin can read downloads" ON public.sample_downloads
  FOR SELECT TO public USING (true);
