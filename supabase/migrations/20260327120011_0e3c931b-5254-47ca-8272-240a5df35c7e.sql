ALTER TABLE public.polls ADD COLUMN IF NOT EXISTS resolution_criteria text;
ALTER TABLE public.polls ADD COLUMN IF NOT EXISTS expert_insight text;
ALTER TABLE public.polls ADD COLUMN IF NOT EXISTS index_number integer;
ALTER TABLE public.polls ADD COLUMN IF NOT EXISTS question_type text DEFAULT 'yes_no';
ALTER TABLE public.polls ADD COLUMN IF NOT EXISTS country text;