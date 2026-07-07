
DO $$
DECLARE
  p1 uuid := gen_random_uuid();
  p2 uuid := gen_random_uuid();
  p3 uuid := gen_random_uuid();
BEGIN
  INSERT INTO public.polls (id, title, slug, description, category, status, close_at, metadata)
  VALUES
    (p1, 'Who will win this Quarter-final World Cup match?', 'wc26-qf-france-vs-morocco',
     'France vs Morocco', 'Football', 'active', '2026-07-09 20:00:00+00',
     '{"stage":"Quarter-final","tournament":"World Cup 2026","home_team":"France","away_team":"Morocco","home_iso":"fr","away_iso":"ma"}'::jsonb),
    (p2, 'Who will win this Quarter-final World Cup match?', 'wc26-qf-spain-vs-belgium',
     'Spain vs Belgium', 'Football', 'active', '2026-07-10 19:00:00+00',
     '{"stage":"Quarter-final","tournament":"World Cup 2026","home_team":"Spain","away_team":"Belgium","home_iso":"es","away_iso":"be"}'::jsonb),
    (p3, 'Who will win this Quarter-final World Cup match?', 'wc26-qf-norway-vs-england',
     'Norway vs England', 'Football', 'active', '2026-07-11 21:00:00+00',
     '{"stage":"Quarter-final","tournament":"World Cup 2026","home_team":"Norway","away_team":"England","home_iso":"no","away_iso":"gb-eng"}'::jsonb);

  INSERT INTO public.poll_options (poll_id, label, image_url, total_votes_count) VALUES
    (p1, 'France',  'https://flagcdn.com/w80/fr.png',    478),
    (p1, 'Morocco', 'https://flagcdn.com/w80/ma.png',    212),
    (p2, 'Spain',   'https://flagcdn.com/w80/es.png',    521),
    (p2, 'Belgium', 'https://flagcdn.com/w80/be.png',    287),
    (p3, 'Norway',  'https://flagcdn.com/w80/no.png',    198),
    (p3, 'England', 'https://flagcdn.com/w80/gb-eng.png',446);
END $$;
