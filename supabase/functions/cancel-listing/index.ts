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
    if (!authHeader) return new Response(JSON.stringify({ error: "No auth" }), { status: 401, headers: corsHeaders });

    const { data: { user }, error: authErr } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    if (authErr || !user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

    const { listing_id } = await req.json();
    if (!listing_id) return new Response(JSON.stringify({ error: "listing_id required" }), { status: 400, headers: corsHeaders });

    // Get and validate the listing
    const { data: listing } = await supabase
      .from("listings")
      .select("*")
      .eq("id", listing_id)
      .eq("seller_id", user.id)
      .eq("status", "active")
      .single();

    if (!listing) {
      return new Response(JSON.stringify({ error: "Listing not found or already completed" }), { status: 404, headers: corsHeaders });
    }

    // Cancel the listing
    await supabase.from("listings").update({
      status: "cancelled",
      updated_at: new Date().toISOString(),
    }).eq("id", listing_id);

    // Return shares to seller's position
    const listingShares = Number(listing.shares);
    const listingPrice = Number(listing.price_per_share);
    const returnedCost = parseFloat((listingShares * listingPrice).toFixed(2));

    const { data: position } = await supabase
      .from("positions")
      .select("id, shares, total_cost")
      .eq("user_id", user.id)
      .eq("poll_id", listing.poll_id)
      .eq("option_id", listing.option_id)
      .maybeSingle();

    if (position) {
      const newShares = parseFloat((Number(position.shares) + listingShares).toFixed(4));
      const newCost = parseFloat((Number(position.total_cost) + returnedCost).toFixed(2));
      await supabase.from("positions").update({
        shares: newShares,
        avg_price: parseFloat((newCost / newShares).toFixed(4)),
        total_cost: newCost,
        updated_at: new Date().toISOString(),
      }).eq("id", position.id);
    } else {
      await supabase.from("positions").insert({
        user_id: user.id,
        poll_id: listing.poll_id,
        option_id: listing.option_id,
        shares: parseFloat(listingShares.toFixed(4)),
        avg_price: parseFloat(listingPrice.toFixed(4)),
        total_cost: returnedCost,
      });
    }

    // Restore votes.stake_amount
    const { data: vote } = await supabase
      .from("votes")
      .select("stake_amount")
      .eq("poll_id", listing.poll_id)
      .eq("option_id", listing.option_id)
      .eq("user_id", user.id)
      .maybeSingle();

    const currentStake = Number(vote?.stake_amount || 0);
    await supabase.from("votes")
      .update({ stake_amount: parseFloat((currentStake + returnedCost).toFixed(2)), is_staked: true })
      .eq("poll_id", listing.poll_id)
      .eq("option_id", listing.option_id)
      .eq("user_id", user.id);

    return new Response(JSON.stringify({ success: true, shares_returned: listingShares }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("cancel-listing error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), { status: 500, headers: corsHeaders });
  }
});
