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

    const { poll_id, option_id, shares, price_per_share } = await req.json();
    if (!poll_id || !option_id || !shares || !price_per_share) {
      return new Response(JSON.stringify({ error: "poll_id, option_id, shares, price_per_share are required" }), { status: 400, headers: corsHeaders });
    }

    // Pro mode dispatch: fail-closed to demo
    const { data: __cfg, error: __cfgErr } = await supabase
      .from("platform_config")
      .select("pro_mode")
      .eq("id", 1)
      .maybeSingle();
    const proMode: "demo" | "live" =
      !__cfgErr && __cfg?.pro_mode === "live" ? "live" : "demo";

    const rpcName = proMode === "demo" ? "demo_create_listing_atomic" : "create_listing_atomic";

    // Delegate to Postgres RPC.
    // The RPC uses SELECT FOR UPDATE on the positions row, preventing concurrent
    // sell-shares or create-listing calls from double-spending the same shares.
    // cost_basis is computed and stored inside the transaction for accurate cancellation.
    const { data, error } = await supabase.rpc(rpcName, {
      p_seller_id:       user.id,
      p_poll_id:         poll_id,
      p_option_id:       option_id,
      p_shares:          Number(shares),
      p_price_per_share: Number(price_per_share),
    });

    if (error) {
      console.error("create_listing_atomic RPC error:", error.message);
      return new Response(
        JSON.stringify({ error: error.message || "Listing creation failed" }),
        { status: 500, headers: corsHeaders }
      );
    }

    if (data?.error) {
      const status = data.error.includes("Insufficient") ? 400
                   : data.error.includes("closed")       ? 400
                   : data.error.includes("Minimum")      ? 400
                   : data.error.includes("Price")        ? 400
                   : 422;
      return new Response(JSON.stringify({ error: data.error }), { status, headers: corsHeaders });
    }

    return new Response(
      JSON.stringify(data),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("create-listing unhandled error:", (err as Error).message);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: corsHeaders }
    );
  }
});
