DROP VIEW IF EXISTS public.leaderboard_view;
CREATE VIEW public.leaderboard_view AS
WITH vote_outcomes AS (
  SELECT COALESCE(v.user_id, up_fp.user_id) AS resolved_user_id,
    v.poll_id, v.option_id, v.is_staked, v.stake_amount,
    p.settled_at, p.winning_option_id,
    CASE
      WHEN p.settled_at IS NOT NULL AND p.winning_option_id = v.option_id THEN true
      WHEN p.settled_at IS NOT NULL AND p.winning_option_id <> v.option_id THEN false
      ELSE NULL::boolean
    END AS is_win
  FROM votes v
    JOIN polls p ON p.id = v.poll_id
    LEFT JOIN user_profiles up_fp ON up_fp.voter_fingerprint = v.voter_fingerprint
), user_stats AS (
  SELECT up.user_id, up.username, up.display_handle, up.country, up.occupation,
    up.created_at AS member_since,
    count(DISTINCT vo.poll_id) AS total_positions,
    count(DISTINCT vo.poll_id) FILTER (WHERE vo.settled_at IS NULL) AS active_positions,
    count(*) FILTER (WHERE vo.is_win = true) AS wins,
    count(*) FILTER (WHERE vo.is_win = false) AS losses,
    CASE
      WHEN count(*) FILTER (WHERE vo.is_win IS NOT NULL) > 0
        THEN round(count(*) FILTER (WHERE vo.is_win = true)::numeric / count(*) FILTER (WHERE vo.is_win IS NOT NULL)::numeric * 100::numeric, 1)
      ELSE 0::numeric
    END AS win_rate,
    COALESCE(sum(vo.stake_amount) FILTER (WHERE vo.is_staked), 0::numeric) AS total_staked,
    count(*) FILTER (WHERE vo.is_win IS NOT NULL) AS resolved_positions
  FROM user_profiles up
    LEFT JOIN vote_outcomes vo ON vo.resolved_user_id = up.user_id
  GROUP BY up.user_id, up.username, up.display_handle, up.country, up.occupation, up.created_at
), user_payouts AS (
  SELECT vo.resolved_user_id AS user_id,
    COALESCE(sum(py.amount), 0::numeric) AS total_earnings
  FROM vote_outcomes vo
    LEFT JOIN payouts py ON py.poll_id = vo.poll_id
      AND py.voter_fingerprint IN (SELECT votes.voter_fingerprint FROM votes WHERE votes.user_id = vo.resolved_user_id AND votes.poll_id = vo.poll_id)
  GROUP BY vo.resolved_user_id
)
SELECT us.user_id, us.username, us.display_handle, us.country, us.occupation, us.member_since,
  us.total_positions, us.active_positions, us.wins, us.losses, us.win_rate,
  us.total_staked, us.resolved_positions,
  COALESCE(upay.total_earnings, 0::numeric) AS total_earnings,
  round(COALESCE(upay.total_earnings, 0::numeric) - us.total_staked, 2) AS pnl,
  row_number() OVER (ORDER BY (CASE WHEN us.resolved_positions >= 3 THEN us.win_rate ELSE 0::numeric END) DESC, us.wins DESC, us.total_positions DESC) AS rank
FROM user_stats us
  LEFT JOIN user_payouts upay ON upay.user_id = us.user_id
WHERE us.total_positions > 0
ORDER BY rank;