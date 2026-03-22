
-- Create polls table
CREATE TABLE public.polls (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  context TEXT,
  category TEXT NOT NULL DEFAULT 'economics',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed', 'resolved')),
  outcome TEXT CHECK (outcome IN ('yes', 'no')),
  close_at TIMESTAMPTZ NOT NULL,
  resolve_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create poll_options table
CREATE TABLE public.poll_options (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  poll_id UUID NOT NULL REFERENCES public.polls(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  total_votes_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create votes table
CREATE TABLE public.votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  poll_id UUID NOT NULL REFERENCES public.polls(id) ON DELETE CASCADE,
  option_id UUID NOT NULL REFERENCES public.poll_options(id) ON DELETE CASCADE,
  voter_fingerprint TEXT NOT NULL,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(poll_id, voter_fingerprint)
);

-- Enable RLS
ALTER TABLE public.polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;

-- Public read access for polls and options
CREATE POLICY "Anyone can view polls" ON public.polls FOR SELECT USING (true);
CREATE POLICY "Anyone can view poll options" ON public.poll_options FOR SELECT USING (true);

-- Anyone can insert votes (anonymous voting)
CREATE POLICY "Anyone can vote" ON public.votes FOR INSERT WITH CHECK (true);
-- Users can read their own votes by fingerprint
CREATE POLICY "Anyone can check votes" ON public.votes FOR SELECT USING (true);

-- Enable realtime for polls and options
ALTER PUBLICATION supabase_realtime ADD TABLE public.poll_options;

-- Create function to increment vote count
CREATE OR REPLACE FUNCTION public.increment_vote_count(p_option_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.poll_options
  SET total_votes_count = total_votes_count + 1
  WHERE id = p_option_id;
END;
$$;
