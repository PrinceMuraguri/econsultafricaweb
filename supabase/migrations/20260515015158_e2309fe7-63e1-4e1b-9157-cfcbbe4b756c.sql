
-- 1. Anonymized display handles on user_profiles
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS display_handle text;

-- Generator: 'user' + 4 random digits, retries on collision
CREATE OR REPLACE FUNCTION public.generate_display_handle()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  v_handle text;
  v_attempts int := 0;
BEGIN
  LOOP
    v_handle := 'user' || lpad((floor(random() * 9000) + 1000)::int::text, 4, '0');
    IF NOT EXISTS (SELECT 1 FROM public.user_profiles WHERE display_handle = v_handle) THEN
      RETURN v_handle;
    END IF;
    v_attempts := v_attempts + 1;
    IF v_attempts > 50 THEN
      -- Fall back to longer random handle to guarantee uniqueness
      RETURN 'user' || substr(md5(random()::text || clock_timestamp()::text), 1, 8);
    END IF;
  END LOOP;
END;
$$;

-- Backfill existing rows
UPDATE public.user_profiles
SET display_handle = public.generate_display_handle()
WHERE display_handle IS NULL;

-- Enforce non-null + uniqueness going forward
ALTER TABLE public.user_profiles
  ALTER COLUMN display_handle SET NOT NULL;

ALTER TABLE public.user_profiles
  ADD CONSTRAINT user_profiles_display_handle_unique UNIQUE (display_handle);

-- Trigger: auto-assign on insert if not provided
CREATE OR REPLACE FUNCTION public.assign_display_handle()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.display_handle IS NULL THEN
    NEW.display_handle := public.generate_display_handle();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_user_profiles_assign_handle ON public.user_profiles;
CREATE TRIGGER trg_user_profiles_assign_handle
BEFORE INSERT ON public.user_profiles
FOR EACH ROW
EXECUTE FUNCTION public.assign_display_handle();

-- 2. Reddit-style comment voting
CREATE TABLE IF NOT EXISTS public.comment_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id uuid NOT NULL REFERENCES public.poll_comments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  value smallint NOT NULL CHECK (value IN (-1, 1)),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (comment_id, user_id)
);

ALTER TABLE public.comment_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY comment_votes_public_read
  ON public.comment_votes FOR SELECT USING (true);

CREATE POLICY comment_votes_self_insert
  ON public.comment_votes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY comment_votes_self_update
  ON public.comment_votes FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY comment_votes_self_delete
  ON public.comment_votes FOR DELETE
  USING (auth.uid() = user_id);

-- Score columns on poll_comments
ALTER TABLE public.poll_comments
  ADD COLUMN IF NOT EXISTS upvotes int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS downvotes int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS score int NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_poll_comments_score ON public.poll_comments(poll_id, score DESC);
CREATE INDEX IF NOT EXISTS idx_comment_votes_comment ON public.comment_votes(comment_id);

-- Trigger to keep aggregates in sync
CREATE OR REPLACE FUNCTION public.recompute_comment_score()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_comment_id uuid;
BEGIN
  v_comment_id := COALESCE(NEW.comment_id, OLD.comment_id);

  UPDATE public.poll_comments pc
  SET
    upvotes   = COALESCE((SELECT count(*) FROM public.comment_votes WHERE comment_id = v_comment_id AND value =  1), 0),
    downvotes = COALESCE((SELECT count(*) FROM public.comment_votes WHERE comment_id = v_comment_id AND value = -1), 0),
    score     = COALESCE((SELECT sum(value)::int FROM public.comment_votes WHERE comment_id = v_comment_id), 0)
  WHERE pc.id = v_comment_id;

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_comment_votes_recompute ON public.comment_votes;
CREATE TRIGGER trg_comment_votes_recompute
AFTER INSERT OR UPDATE OR DELETE ON public.comment_votes
FOR EACH ROW
EXECUTE FUNCTION public.recompute_comment_score();

-- Enable realtime so vote counts update live
ALTER PUBLICATION supabase_realtime ADD TABLE public.comment_votes;
