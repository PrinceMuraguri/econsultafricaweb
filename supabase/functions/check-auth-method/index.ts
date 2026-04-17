import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { email } = await req.json();

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return new Response(
        JSON.stringify({ error: "Invalid email", providers: [], exists: false }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Search for the user by email. Admin API supports filter by email.
    const { data, error } = await adminClient.auth.admin.listUsers({
      page: 1,
      perPage: 200,
    });

    if (error) {
      console.error("listUsers error:", error);
      // Fail-open: return both providers as available so user is not blocked
      return new Response(
        JSON.stringify({ providers: ["email", "google"], exists: false, fallback: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const matched = data.users.find(
      (u) => (u.email || "").toLowerCase() === normalizedEmail
    );

    if (!matched) {
      return new Response(
        JSON.stringify({ providers: [], exists: false }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const identities = matched.identities || [];
    const providers = Array.from(
      new Set(
        identities
          .map((i: any) => i.provider)
          .filter((p: string) => p === "email" || p === "google")
      )
    );

    // If no identities found but user exists, assume email
    if (providers.length === 0) {
      providers.push("email");
    }

    return new Response(
      JSON.stringify({ providers, exists: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("check-auth-method error:", err);
    return new Response(
      JSON.stringify({ providers: ["email", "google"], exists: false, fallback: true, error: err.message }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
