
-- 1. Notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  poll_id UUID REFERENCES polls(id) ON DELETE SET NULL,
  link TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_notif_user ON notifications(user_id, is_read, created_at DESC);
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users update own" ON notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "System inserts" ON notifications FOR INSERT WITH CHECK (true);

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- 2. Watchlist
CREATE TABLE user_watchlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  poll_id UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, poll_id)
);
CREATE INDEX idx_watchlist_user ON user_watchlist(user_id);
ALTER TABLE user_watchlist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own watchlist" ON user_watchlist
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 3. Auto-notify on comment reply
CREATE OR REPLACE FUNCTION notify_comment_reply() RETURNS TRIGGER AS $$
DECLARE
  parent_user_id UUID; commenter TEXT; ptitle TEXT; pslug TEXT;
BEGIN
  IF NEW.parent_id IS NULL THEN RETURN NEW; END IF;
  SELECT user_id INTO parent_user_id FROM poll_comments WHERE id = NEW.parent_id;
  IF parent_user_id = NEW.user_id THEN RETURN NEW; END IF;
  SELECT username INTO commenter FROM user_profiles WHERE user_id = NEW.user_id;
  SELECT title, slug INTO ptitle, pslug FROM polls WHERE id = NEW.poll_id;
  INSERT INTO notifications (user_id, type, title, body, poll_id, link)
  VALUES (parent_user_id, 'comment_reply',
    COALESCE(commenter,'Someone') || ' replied to your comment',
    LEFT(NEW.body, 200), NEW.poll_id, '/forecast-arena/' || pslug);
  RETURN NEW;
END; $$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trg_comment_reply AFTER INSERT ON poll_comments
  FOR EACH ROW EXECUTE FUNCTION notify_comment_reply();

-- 4. Full-text search index on polls
ALTER TABLE polls ADD COLUMN IF NOT EXISTS fts tsvector
  GENERATED ALWAYS AS (to_tsvector('english',
    coalesce(title,'') || ' ' || coalesce(description,'') || ' ' ||
    coalesce(context,'') || ' ' || coalesce(category,'') || ' ' || coalesce(country,'')
  )) STORED;
CREATE INDEX IF NOT EXISTS idx_polls_fts ON polls USING gin(fts);

-- 5. Trending score function
CREATE OR REPLACE FUNCTION get_trending_polls(limit_count INTEGER DEFAULT 6)
RETURNS TABLE (poll_id UUID, title TEXT, slug TEXT, category TEXT,
  total_votes INTEGER, recent_votes BIGINT, trending_score NUMERIC)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN QUERY
  SELECT p.id, p.title, p.slug, p.category,
    (SELECT COALESCE(SUM(po.total_votes_count),0)::INTEGER FROM poll_options po WHERE po.poll_id = p.id),
    COUNT(v.id) FILTER (WHERE v.created_at > now() - interval '24 hours'),
    (COUNT(v.id) FILTER (WHERE v.created_at > now() - interval '24 hours') * 2 +
     COUNT(v.id) FILTER (WHERE v.created_at > now() - interval '6 hours') * 5 +
     COALESCE(SUM(v.stake_amount) FILTER (WHERE v.created_at > now() - interval '24 hours' AND v.is_staked), 0) * 10
    )
  FROM polls p LEFT JOIN votes v ON v.poll_id = p.id
  WHERE p.status = 'active' AND p.close_at > now()
  GROUP BY p.id, p.title, p.slug, p.category
  ORDER BY 7 DESC LIMIT limit_count;
END; $$;
