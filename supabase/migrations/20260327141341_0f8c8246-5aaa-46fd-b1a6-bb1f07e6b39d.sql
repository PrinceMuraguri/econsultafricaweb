CREATE TABLE public.inquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  inquiry_type text NOT NULL DEFAULT 'general',
  source text NOT NULL DEFAULT 'website',
  name text,
  email text NOT NULL,
  phone text,
  poll_id uuid REFERENCES public.polls(id),
  poll_title text,
  message text,
  status text NOT NULL DEFAULT 'new',
  metadata jsonb
);

ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert inquiries" ON public.inquiries FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Anyone can read inquiries" ON public.inquiries FOR SELECT TO public USING (true);