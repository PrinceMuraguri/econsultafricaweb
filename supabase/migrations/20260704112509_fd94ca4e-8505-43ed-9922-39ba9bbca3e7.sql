ALTER TABLE public.poll_options ADD COLUMN IF NOT EXISTS image_url text;
ALTER TABLE public.polls ADD COLUMN IF NOT EXISTS metadata jsonb;