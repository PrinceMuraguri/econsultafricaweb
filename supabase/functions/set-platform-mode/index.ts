import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Mirrors src/pages/AdminDashboard.tsx ADMIN_EMAILS allowlist.
// Source of truth lives in code, not a DB table — keep these in sync.
const ADMIN_EMAILS = ["princemuraguri@gmail.com"];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // 1. Verify JWT and identify caller via the user-scoped client
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const token = authHeader.replace("Bearer ", "");
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser(token);
    if (userErr || !userData?.user?.email) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const callerEmail = userData.user.email;
    const callerUserId = userData.user.id;

    // 2. Admin allowlist check (server-side, mirrors the frontend gate)
    if (!ADMIN_EMAILS.includes(callerEmail)) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 3. Validate body
    const body = await req.json().catch(() => ({}));
    const mode = body?.mode;
    if (mode !== "live" && mode !== "demo") {
      return new Response(JSON.stringify({ error: "mode must be 'live' or 'demo'" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 4. Service-role client for the actual mutation (bypasses RLS as required)
    const admin = createClient(supabaseUrl, serviceKey);

    const { data: prevRow, error: prevErr } = await admin
      .from("platform_config")
      .select("pro_mode")
      .eq("id", 1)
      .maybeSingle();
    if (prevErr) {
      return new Response(JSON.stringify({ error: "Failed to read current mode" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const previousMode = (prevRow as any)?.pro_mode ?? "demo";

    if (previousMode === mode) {
      return new Response(JSON.stringify({ ok: true, mode, unchanged: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { error: updateErr } = await admin
      .from("platform_config")
      .update({ pro_mode: mode, updated_at: new Date().toISOString() })
      .eq("id", 1);
    if (updateErr) {
      return new Response(JSON.stringify({ error: updateErr.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 5. Audit row — actor identity from the verified JWT, never from client input
    await admin.from("platform_config_audit").insert({
      previous_mode: previousMode,
      new_mode: mode,
      actor_email: callerEmail,
      actor_user_id: callerUserId,
    });

    return new Response(
      JSON.stringify({ ok: true, mode, previous_mode: previousMode }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (e) {
    console.error("set-platform-mode error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
