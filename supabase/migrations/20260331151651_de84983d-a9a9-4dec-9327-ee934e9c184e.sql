-- Fix: Allow authenticated users to read ALL user_profiles (needed for leaderboard, public profiles, comments)
DROP POLICY IF EXISTS "Users can read own profile" ON public.user_profiles;
CREATE POLICY "Authenticated can read all profiles" ON public.user_profiles
  FOR SELECT TO authenticated USING (true);