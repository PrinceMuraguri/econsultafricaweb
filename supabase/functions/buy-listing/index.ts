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

    // Verify caller is authenticated
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

    const rpcName = proMode === "demo" ? "demo_buy_listing_atomic" : "buy_listing_atomic";

    // Delegate entirely to the Postgres RPC.
    // All six mutations (claim listing, debit buyer, credit seller, upsert position,
    // wallet transactions, trade records) execute inside ONE database transaction.
    // Any failure at any step automatically rolls back everything — no partial state.
    const { data, error } = await supabase.rpc(rpcName, {
      p_listing_id: listing_id,
      p_buyer_id:   user.id,
    });

    if (error) {
      console.error("buy_listing_atomic RPC error:", error.message);
      return new Response(
        JSON.stringify({ error: error.message || "Trade failed" }),
        { status: 500, headers: corsHeaders }
      );
    }

    // RPC returns jsonb — surface any business-logic error it raised
    if (data?.error) {
      const status = data.error.includes("Insufficient") ? 400
                   : data.error.includes("not found")    ? 404
                   : data.error.includes("own listing")  ? 400
                   : 422;
      return new Response(JSON.stringify({ error: data.error }), { status, headers: corsHeaders });
    }

    // Notify the seller that their listing was bought
    if (data?.success) {
      try {
        // Fetch listing details to get seller_id, poll_id, etc.
        const { data: listing } = await supabase
          .from("listings")
          .select("seller_id, poll_id, shares, total_ask")
          .eq("id", listing_id)
          .single();

        if (listing && listing.seller_id) {
          // Get poll slug for the notification link
          const { data: poll } = await supabase
            .from("polls")
            .select("slug")
            .eq("id", listing.poll_id)
            .single();

          await supabase.from("notifications").insert({
            user_id: listing.seller_id,
            type: "listing_sold",
            title: "Your listing was bought!",
            body: `Someone purchased ${Number(listing.shares).toFixed(4)} shares for $${Number(listing.total_ask).toFixed(2)}`,
            poll_id: listing.poll_id,
            link: poll?.slug ? `/forecast-arena/${poll.slug}` : null,
          });
        }
      } catch (notifErr) {
        // Non-critical — don't fail the trade if notification fails
        console.error("Failed to send seller notification:", (notifErr as Error).message);
      }
    }

    return new Response(
      JSON.stringify(data),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("buy-listing unhandled error:", (err as Error).message);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: corsHeaders }
    );
  }
});
