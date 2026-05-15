CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_username text;
  v_full_name text;
  v_base_username text;
  v_attempts int := 0;
BEGIN
  -- Resolve full name from metadata (Lovable/email signup uses full_name; Google uses name)
  v_full_name := COALESCE(
    NULLIF(NEW.raw_user_meta_data->>'full_name', ''),
    NULLIF(NEW.raw_user_meta_data->>'name', ''),
    NULLIF(split_part(NEW.email, '@', 1), ''),
    'Member'
  );

  -- Resolve a unique username
  v_base_username := lower(COALESCE(
    NULLIF(NEW.raw_user_meta_data->>'username', ''),
    NULLIF(regexp_replace(split_part(NEW.email, '@', 1), '[^a-zA-Z0-9_]', '', 'g'), ''),
    'user'
  ));
  v_username := v_base_username;

  WHILE EXISTS (SELECT 1 FROM public.user_profiles WHERE username = v_username) LOOP
    v_attempts := v_attempts + 1;
    v_username := v_base_username || '_' || substr(md5(random()::text || NEW.id::text), 1, 4);
    IF v_attempts > 10 THEN
      v_username := v_base_username || '_' || substr(NEW.id::text, 1, 8);
      EXIT;
    END IF;
  END LOOP;

  INSERT INTO public.user_profiles (user_id, username, full_name, phone, country, voter_fingerprint)
  VALUES (
    NEW.id,
    v_username,
    v_full_name,
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'country', ''),
    COALESCE(NEW.raw_user_meta_data->>'voter_fingerprint', '')
  )
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Never block auth signup on profile errors
  RAISE WARNING 'handle_new_user failed for %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();