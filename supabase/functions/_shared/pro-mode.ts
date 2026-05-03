import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

export type ProMode = "live" | "demo";

/**
 * Reads the platform's current Pro mode from `platform_config` (id=1).
 * Fail-closed: any error or non-'live' value resolves to 'demo'.
 *
 * Caller may pass any Supabase client that has SELECT on `platform_config`
 * — public RLS allows authenticated and anon reads, so the service-role
 * client and a user-JWT client both work.
 */
export async function getProMode(supabase: SupabaseClient): Promise<ProMode> {
  const { data, error } = await supabase
    .from("platform_config")
    .select("pro_mode")
    .eq("id", 1)
    .maybeSingle();
  return !error && (data as any)?.pro_mode === "live" ? "live" : "demo";
}
