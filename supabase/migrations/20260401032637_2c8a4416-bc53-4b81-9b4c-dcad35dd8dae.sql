
-- 1. Fix voter_profiles: restrict SELECT to own fingerprint only
DROP POLICY IF EXISTS "Anyone can view their own profile" ON public.voter_profiles;
CREATE POLICY "Voters can view own profile" ON public.voter_profiles
  FOR SELECT USING (true);

-- Fix voter_profiles: restrict UPDATE to own fingerprint
DROP POLICY IF EXISTS "Anyone can update their own profile" ON public.voter_profiles;
CREATE POLICY "Voters can update own profile" ON public.voter_profiles
  FOR UPDATE
  USING (voter_fingerprint = voter_fingerprint)
  WITH CHECK (voter_fingerprint = voter_fingerprint);

-- Actually we need a real ownership check. Since voter_profiles uses fingerprint-based upsert 
-- and the fingerprint is provided in the row, the best we can do without auth is restrict 
-- UPDATE to only allow modifying the row that matches the fingerprint being written.
-- But the real fix: remove the open UPDATE policy and rely on INSERT with ON CONFLICT.
-- Supabase upsert needs INSERT + UPDATE policies, but we can at least ensure 
-- the UPDATE only works when the fingerprint matches.

-- Drop the overly permissive policies and recreate properly
DROP POLICY IF EXISTS "Voters can view own profile" ON public.voter_profiles;
DROP POLICY IF EXISTS "Voters can update own profile" ON public.voter_profiles;

-- SELECT: keep readable (needed by edge functions with service role, and for upsert conflict check)
CREATE POLICY "Service role can read voter profiles" ON public.voter_profiles
  FOR SELECT TO service_role USING (true);

-- Anon/authenticated should not be able to read all voter profiles
CREATE POLICY "Anon can read voter profiles" ON public.voter_profiles
  FOR SELECT TO anon, authenticated USING (false);

-- INSERT: keep open for anonymous participant registration
DROP POLICY IF EXISTS "Anyone can insert their profile" ON public.voter_profiles;
CREATE POLICY "Anyone can insert their profile" ON public.voter_profiles
  FOR INSERT WITH CHECK (true);

-- UPDATE: remove blanket access, only service_role can update
DROP POLICY IF EXISTS "Anyone can update their own profile" ON public.voter_profiles;
CREATE POLICY "Service role can update voter profiles" ON public.voter_profiles
  FOR UPDATE TO service_role USING (true) WITH CHECK (true);

-- 2. Fix reports bucket: remove public read policy
DROP POLICY IF EXISTS "Allow public read on reports" ON storage.objects;
