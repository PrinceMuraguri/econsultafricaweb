import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Verify JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "No auth" }), { status: 401, headers: corsHeaders });

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
    if (authErr || !user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

    const { poll_id, option_id, shares } = await req.json();
    if (!poll_id || !option_id || !shares || shares <= 0) {
      return new Response(JSON.stringify({ error: "Invalid input" }), { status: 400, headers: corsHeaders });
    }

    // Check position exists
    const { data: position } = await supabase
      .from("positions")
      .select("*")
      .eq("user_id", user.id)
      .eq("poll_id", poll_id)
      .eq("option_id", option_id)
      .single();

    if (!position || position.shares < shares) {
      return new Response(JSON.stringify({ error: "Insufficient shares" }), { status: 400, headers: corsHeaders });
    }

    // Check poll is still active
    const { data: poll } = await supabase.from("polls").select("status, close_at").eq("id", poll_id).single();
    if (!poll || poll.status !== "active" || new Date(poll.close_at) < new Date()) {
      return new Response(JSON.stringify({ error: "Market is closed" }), { status: 400, headers: corsHeaders });
    }

    // Get current market price (AMM based on vote proportions)
    const { data: options } = await supabase
      .from("poll_options")
      .select("id, total_votes_count")
      .eq("poll_id", poll_id);

    const totalVotes = (options || []).reduce((s, o) => s + o.total_votes_count, 0);
    const thisOption = (options || []).find(o => o.id === option_id);
    const currentPrice = totalVotes > 0 && thisOption
      ? Math.max(0.05, Math.min(0.95, thisOption.total_votes_count / totalVotes))
      : 0.50;

    const fee = 0.035;
    const grossAmount = shares * currentPrice;
    const feeAmount = parseFloat((grossAmount * fee).toFixed(2));
    const netAmount = parseFloat((grossAmount - feeAmount).toFixed(2));

    // Update position
    const newShares = position.shares - shares;
    const newTotalCost = newShares > 0
      ? parseFloat((position.total_cost * (newShares / position.shares)).toFixed(2))
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

    // Keep votes.stake_amount in sync so settlement never double-pays sold shares
    await supabase
      .from("votes")
      .update({ stake_amount: newTotalCost, is_staked: newShares > 0 })
      .eq("poll_id", poll_id)
      .eq("option_id", option_id)
      .eq("user_id", user.id);

    // Record trade
    await supabase.from("trades").insert({
      user_id: user.id,
      poll_id,
      option_id,
      side: "sell",
      shares,
      price: currentPrice,
      total_amount: grossAmount,
      fee: feeAmount,
      reference: `sell_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    });

    // Credit wallet
    const { data: wallet } = await supabase
      .from("wallets")
      .select("id, balance_usd")
      .eq("user_id", user.id)
      .single();

    if (wallet) {
      await supabase.from("wallets").update({
        balance_usd: wallet.balance_usd + netAmount,
        updated_at: new Date().toISOString(),
      }).eq("id", wallet.id);

      await supabase.from("wallet_transactions").insert({
        user_id: user.id,
        type: "sell_proceeds",
        amount: netAmount,
        description: `Sold ${shares} shares`,
        reference: `sell_${poll_id}_${Date.now()}`,
      });
    }

    return new Response(JSON.stringify({
      success: true,
      shares_sold: shares,
      price: currentPrice,
      gross_amount: grossAmount,
      fee: feeAmount,
      net_proceeds: netAmount,
      remaining_shares: newShares > 0 ? newShares : 0,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (err) {
    return new Response(JSON.stringify({ error: "Internal error" }), { status: 500, headers: corsHeaders });
  }
});
