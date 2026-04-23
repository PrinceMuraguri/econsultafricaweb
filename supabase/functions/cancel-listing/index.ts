import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No auth header" }), { status: 401, headers: corsHeaders });
    }
    const { data: { user }, error: authErr } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const { listing_id } = await req.json();
    if (!listing_id) {
      return new Response(JSON.stringify({ error: "listing_id is required" }), { status: 400, headers: corsHeaders });
    }

    // Pro mode dispatch: fail-closed to demo
    const { data: __cfg, error: __cfgErr } = await supabase
      .from("platform_config")
      .select("pro_mode")
      .eq("id", 1)
      .maybeSingle();
    const proMode: "demo" | "live" =
      !__cfgErr && __cfg?.pro_mode === "live" ? "live" : "demo";

    const rpcName = proMode === "demo" ? "demo_cancel_listing_atomic" : "cancel_listing_atomic";

    // Delegate to Postgres RPC.
    // The RPC uses SELECT FOR UPDATE on the listing row — if a buyer has already
    // locked the same row, this waits. After acquiring the lock it re-checks status,
    // so a cancel arriving just after a buy completes gets a clean "no longer active" error.
    // Shares are restored using cost_basis (the exact amount deducted at listing time),
    // not listing price × shares, which fixes the incorrect cost restoration bug.
    const { data, error } = await supabase.rpc(rpcName, {
      p_listing_id: listing_id,
      p_seller_id:  user.id,
    });

    if (error) {
      console.error("cancel_listing_atomic RPC error:", error.message);
      return new Response(
        JSON.stringify({ error: error.message || "Cancellation failed" }),
        { status: 500, headers: corsHeaders }
      );
    }

    if (data?.error) {
      const status = data.error.includes("not found") ? 404 : 422;
      return new Response(JSON.stringify({ error: data.error }), { status, headers: corsHeaders });
    }

    return new Response(
      JSON.stringify(data),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("cancel-listing unhandled error:", (err as Error).message);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: corsHeaders }
    );
  }
});
