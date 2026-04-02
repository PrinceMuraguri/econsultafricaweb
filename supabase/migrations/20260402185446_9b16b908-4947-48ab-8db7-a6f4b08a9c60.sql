
CREATE OR REPLACE VIEW public.payout_winners WITH (security_invoker = true) AS
SELECT
  p.title   AS poll_title,
  p.slug    AS poll_slug,
  p.outcome,
  po.label  AS winning_option,
  v.voter_fingerprint,
  v.stake_amount,
  v.is_staked,
  v.created_at AS vote_date,
  COALESCE(vp.full_name, up.full_name)       AS full_name,
  COALESCE(vp.email, au.email)               AS email,
  COALESCE(vp.phone_number, up.phone)        AS phone_number,
  COALESCE(vp.country_code, '+254')          AS country_code,
  pay.status AS payout_status,
  pay.amount AS payout_amount
FROM votes v
  JOIN polls p ON p.id = v.poll_id
  JOIN poll_options po ON po.id = v.option_id
  LEFT JOIN voter_profiles vp ON vp.voter_fingerprint = v.voter_fingerprint
  LEFT JOIN user_profiles up ON up.user_id = v.user_id
  LEFT JOIN auth.users au ON au.id = v.user_id
  LEFT JOIN payouts pay ON pay.poll_id = v.poll_id AND pay.voter_fingerprint = v.voter_fingerprint
WHERE p.outcome IS NOT NULL
  AND po.label = p.outcome
  AND v.is_staked = true;
