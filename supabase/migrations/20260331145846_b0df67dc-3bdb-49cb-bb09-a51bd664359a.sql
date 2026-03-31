
-- 1. Comments on polls
CREATE TABLE poll_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  parent_id UUID REFERENCES poll_comments(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  is_holder BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_poll_comments_poll ON poll_comments(poll_id, created_at DESC);
ALTER TABLE poll_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read comments" ON poll_comments FOR SELECT USING (true);
CREATE POLICY "Auth users insert comments" ON poll_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own comments" ON poll_comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own comments" ON poll_comments FOR DELETE USING (auth.uid() = user_id);

-- Enable realtime for comments
ALTER PUBLICATION supabase_realtime ADD TABLE public.poll_comments;

-- 2. Probability snapshots for the history chart
CREATE TABLE poll_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  option_id UUID NOT NULL REFERENCES poll_options(id) ON DELETE CASCADE,
  vote_count INTEGER NOT NULL DEFAULT 0,
  probability NUMERIC(5,4) NOT NULL DEFAULT 0,
  snapshot_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_snapshots_lookup ON poll_snapshots(poll_id, snapshot_at DESC);
ALTER TABLE poll_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read snapshots" ON poll_snapshots FOR SELECT USING (true);
CREATE POLICY "Service role can insert snapshots" ON poll_snapshots FOR INSERT WITH CHECK (auth.role() = 'service_role'::text);

-- 3. Leaderboard view
CREATE OR REPLACE VIEW leaderboard_view AS
WITH vote_outcomes AS (
  SELECT v.voter_fingerprint, v.poll_id, v.option_id, v.is_staked, v.stake_amount,
    p.settled_at, p.winning_option_id, p.category,
    CASE WHEN p.settled_at IS NOT NULL AND p.winning_option_id = v.option_id THEN true
         WHEN p.settled_at IS NOT NULL AND p.winning_option_id != v.option_id THEN false
         ELSE NULL END AS is_win
  FROM votes v JOIN polls p ON p.id = v.poll_id
),
user_stats AS (
  SELECT up.user_id, up.username, up.full_name, up.country, up.occupation, up.created_at AS member_since,
    COUNT(DISTINCT vo.poll_id) AS total_positions,
    COUNT(DISTINCT vo.poll_id) FILTER (WHERE vo.settled_at IS NULL) AS active_positions,
    COUNT(*) FILTER (WHERE vo.is_win = true) AS wins,
    COUNT(*) FILTER (WHERE vo.is_win = false) AS losses,
    CASE WHEN COUNT(*) FILTER (WHERE vo.is_win IS NOT NULL) > 0
      THEN ROUND(COUNT(*) FILTER (WHERE vo.is_win = true)::NUMERIC / COUNT(*) FILTER (WHERE vo.is_win IS NOT NULL) * 100, 1)
      ELSE 0 END AS win_rate,
    COALESCE(SUM(vo.stake_amount) FILTER (WHERE vo.is_staked), 0) AS total_staked,
    COUNT(*) FILTER (WHERE vo.is_win IS NOT NULL) AS resolved_positions
  FROM user_profiles up
  LEFT JOIN vote_outcomes vo ON vo.voter_fingerprint = up.voter_fingerprint
  WHERE up.voter_fingerprint IS NOT NULL
  GROUP BY up.user_id, up.username, up.full_name, up.country, up.occupation, up.created_at
),
user_payouts AS (
  SELECT up.user_id, COALESCE(SUM(py.amount), 0) AS total_earnings
  FROM user_profiles up
  LEFT JOIN payouts py ON py.voter_fingerprint = up.voter_fingerprint
  GROUP BY up.user_id
)
SELECT us.*, COALESCE(upay.total_earnings, 0) AS total_earnings,
  ROUND(COALESCE(upay.total_earnings, 0) - us.total_staked, 2) AS pnl,
  ROW_NUMBER() OVER (ORDER BY
    CASE WHEN us.resolved_positions >= 3 THEN us.win_rate ELSE 0 END DESC,
    us.wins DESC, us.total_positions DESC
  ) AS rank
FROM user_stats us LEFT JOIN user_payouts upay ON upay.user_id = us.user_id
WHERE us.total_positions > 0 ORDER BY rank;

GRANT SELECT ON leaderboard_view TO anon, authenticated;
