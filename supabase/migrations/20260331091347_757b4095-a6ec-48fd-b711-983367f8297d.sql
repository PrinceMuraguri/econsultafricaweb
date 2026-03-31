
CREATE TABLE public.sales_funnel_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  product_id text,
  product_title text,
  product_type text,
  user_email text,
  user_fingerprint text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.sales_funnel_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert funnel events" ON public.sales_funnel_events FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Admin can read funnel events" ON public.sales_funnel_events FOR SELECT TO public USING (true);

CREATE INDEX idx_funnel_event_type ON public.sales_funnel_events(event_type);
CREATE INDEX idx_funnel_product_id ON public.sales_funnel_events(product_id);
CREATE INDEX idx_funnel_created_at ON public.sales_funnel_events(created_at DESC);
