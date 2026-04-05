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

    const { poll_id, option_id, shares, price_per_share } = await req.json();

    if (!poll_id || !option_id || !shares || !price_per_share) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400, headers: corsHeaders });
    }
    if (Number(shares) <= 0) {
      return new Response(JSON.stringify({ error: "Shares must be positive" }), { status: 400, headers: corsHeaders });
    }
    if (Number(price_per_share) < 0.01 || Number(price_per_share) >= 1.0) {
      return new Response(JSON.stringify({ error: "Price must be between $0.01 and $0.99 per share" }), { status: 400, headers: corsHeaders });
    }

    // Check poll is still active
    const { data: poll } = await supabase.from("polls").select("status, close_at").eq("id", poll_id).single();
    if (!poll || poll.status !== "active" || new Date(poll.close_at) < new Date()) {
      return new Response(JSON.stringify({ error: "Poll is closed — cannot list shares" }), { status: 400, headers: corsHeaders });
    }

    // Check seller has enough shares
    const { data: position } = await supabase
      .from("positions")
      .select("id, shares, total_cost")
      .eq("user_id", user.id)
      .eq("poll_id", poll_id)
      .eq("option_id", option_id)
      .single();

    if (!position || Number(position.shares) < Number(shares)) {
      return new Response(JSON.stringify({ error: "Insufficient shares in your position" }), { status: 400, headers: corsHeaders });
    }

    const sharesNum = parseFloat(Number(shares).toFixed(4));
    const priceNum = parseFloat(Number(price_per_share).toFixed(4));
    const totalAsk = parseFloat((sharesNum * priceNum).toFixed(2));

    // Deduct shares from position (held in escrow by the listing)
    const newShares = parseFloat((Number(position.shares) - sharesNum).toFixed(4));
    const newTotalCost = newShares > 0
      ? parseFloat((Number(position.total_cost) * (newShares / Number(position.shares))).toFixed(2))
      : 0;

    if (newShares <= 0) {
      await supabase.from("positions").delete().eq("id", position.id);
    } else {
      await supabase.from("positions").update({
        shares: newShares,
        total_cost: newTotalCost,
        updated_at: new Date().toISOString(),
      }).eq("id", position.id);
    }

    // Sync votes.stake_amount down
    await supabase.from("votes")
      .update({ stake_amount: newTotalCost, is_staked: newShares > 0 })
      .eq("poll_id", poll_id)
      .eq("option_id", option_id)
      .eq("user_id", user.id);

    // Create listing
    const { data: listing, error: listErr } = await supabase.from("listings").insert({
      seller_id: user.id,
      poll_id,
      option_id,
      shares: sharesNum,
      price_per_share: priceNum,
      total_ask: totalAsk,
      status: "active",
    }).select().single();

    if (listErr) throw listErr;

    return new Response(JSON.stringify({ success: true, listing }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("create-listing error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), { status: 500, headers: corsHeaders });
  }
});
