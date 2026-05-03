import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { getProMode } from "../_shared/pro-mode.ts";

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

    const proMode = await getProMode(supabase);

    if (proMode === "demo") {
      // Compute current AMM price for demo execution
      const { data: optionsDemo } = await supabase
        .from("poll_options")
        .select("id, total_stake_amount")
        .eq("poll_id", poll_id);
      const totalStakeDemo = (optionsDemo || []).reduce((s, o) => s + Number(o.total_stake_amount || 0), 0);
      const thisOptionDemo = (optionsDemo || []).find(o => o.id === option_id);
      const currentPriceDemo = totalStakeDemo > 0 && thisOptionDemo
        ? Math.max(0.05, Math.min(0.95, Number(thisOptionDemo.total_stake_amount || 0) / totalStakeDemo))
        : 0.50;

      const { data: rpcData, error: rpcErr } = await supabase.rpc("demo_sell_shares_atomic", {
        p_user_id: user.id,
        p_poll_id: poll_id,
        p_option_id: option_id,
        p_shares: shares,
        p_price: currentPriceDemo,
      });
      if (rpcErr) {
        return new Response(JSON.stringify({ error: rpcErr.message, demo: true }), { status: 500, headers: corsHeaders });
      }
      if (rpcData?.error) {
        return new Response(JSON.stringify({ error: rpcData.error, demo: true }), { status: 400, headers: corsHeaders });
      }
      return new Response(JSON.stringify({ demo: true, ...rpcData }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
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
      .select("id, total_stake_amount")
      .eq("poll_id", poll_id);

    const totalStake = (options || []).reduce((s, o) => s + Number(o.total_stake_amount || 0), 0);
    const thisOption = (options || []).find(o => o.id === option_id);
    const currentPrice = totalStake > 0 && thisOption
      ? Math.max(0.05, Math.min(0.95, Number(thisOption.total_stake_amount || 0) / totalStake))
      : 0.50;

    const fee = 0.035;
    // Proportional refund: only refund the fraction of total_cost matching sold shares
    const sellFraction = shares / Number(position.shares);
    const grossAmount = parseFloat((Number(position.total_cost) * sellFraction).toFixed(2));
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

    // Decrement total_stake_amount on the poll option (capital leaving the market)
    await supabase.rpc("decrement_stake_amount", {
      p_option_id: option_id,
      p_amount: grossAmount,
    });

    // Record platform fee
    const sellRef = `sell_${poll_id.slice(0, 8)}_${Date.now()}`;
    await supabase.from("platform_fees").insert({
      source: "sell_shares",
      amount: feeAmount,
      poll_id,
      option_id,
      user_id: user.id,
      reference: sellRef,
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
