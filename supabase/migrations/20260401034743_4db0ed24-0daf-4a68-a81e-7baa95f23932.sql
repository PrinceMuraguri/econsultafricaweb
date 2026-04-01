-- 1. Fix admin_audit_log: restrict to service_role only
DROP POLICY IF EXISTS "Public read audit log" ON public.admin_audit_log;
DROP POLICY IF EXISTS "Public insert audit log" ON public.admin_audit_log;

CREATE POLICY "Service role can read audit log" ON public.admin_audit_log
  FOR SELECT TO service_role USING (true);

CREATE POLICY "Service role can insert audit log" ON public.admin_audit_log
  FOR INSERT TO service_role WITH CHECK (true);

-- 2. Fix notifications: restrict INSERT to service_role only
DROP POLICY IF EXISTS "System inserts" ON public.notifications;

CREATE POLICY "Service role inserts notifications" ON public.notifications
  FOR INSERT TO service_role WITH CHECK (true);

-- 3. Fix payout_winners view: set security_invoker to prevent bypassing RLS
ALTER VIEW public.payout_winners SET (security_invoker = true);