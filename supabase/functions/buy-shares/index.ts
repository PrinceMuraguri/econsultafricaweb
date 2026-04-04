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

    // Check poll is active
    const { data: poll } = await supabase.from("polls").select("status, close_at").eq("id", poll_id).single();
    if (!poll || poll.status !== "active" || new Date(poll.close_at) < new Date()) {
      return new Response(JSON.stringify({ error: "Market is closed" }), { status: 400, headers: corsHeaders });
    }

    // Get current market price
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
    const totalCost = parseFloat((shares * currentPrice).toFixed(2));
    const feeAmount = parseFloat((totalCost * fee).toFixed(2));
    const totalDebit = parseFloat((totalCost + feeAmount).toFixed(2));

    // Check wallet balance
    const { data: wallet } = await supabase
      .from("wallets")
      .select("id, balance_usd")
      .eq("user_id", user.id)
      .single();

    if (!wallet || wallet.balance_usd < totalDebit) {
      return new Response(JSON.stringify({
        error: "Insufficient balance",
        required: totalDebit,
        balance: wallet?.balance_usd || 0,
      }), { status: 400, headers: corsHeaders });
    }

    // Debit wallet
    await supabase.from("wallets").update({
      balance_usd: wallet.balance_usd - totalDebit,
      updated_at: new Date().toISOString(),
    }).eq("id", wallet.id);

    // Record wallet transaction
    await supabase.from("wallet_transactions").insert({
      user_id: user.id,
      type: "buy_shares",
      amount: -totalDebit,
      description: `Bought ${shares} shares`,
      reference: `buy_${poll_id}_${Date.now()}`,
    });

    // Upsert position
    const { data: existingPos } = await supabase
      .from("positions")
      .select("*")
      .eq("user_id", user.id)
      .eq("poll_id", poll_id)
      .eq("option_id", option_id)
      .maybeSingle();

    if (existingPos) {
      const newShares = existingPos.shares + shares;
      const newCost = existingPos.total_cost + totalCost;
      await supabase.from("positions").update({
        shares: newShares,
        avg_price: parseFloat((newCost / newShares).toFixed(4)),
        total_cost: newCost,
        updated_at: new Date().toISOString(),
      }).eq("id", existingPos.id);
    } else {
      await supabase.from("positions").insert({
        user_id: user.id,
        poll_id,
        option_id,
        shares,
        avg_price: currentPrice,
        total_cost: totalCost,
      });
    }

    // Record trade
    await supabase.from("trades").insert({
      user_id: user.id,
      poll_id,
      option_id,
      side: "buy",
      shares,
      price: currentPrice,
      total_amount: totalCost,
      fee: feeAmount,
      reference: `buy_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    });

    // Check for existing vote — by user_id first (reliable), then fingerprint
    const { data: existingVoteByUser } = await supabase
      .from("votes")
      .select("id, voter_fingerprint")
      .eq("poll_id", poll_id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (existingVoteByUser) {
      // User already voted — update with stake info
      await supabase.from("votes").update({
        is_staked: true,
        stake_amount: totalCost,
        entry_price: currentPrice,
      }).eq("id", existingVoteByUser.id);
      await supabase.rpc("increment_stake_amount", { p_option_id: option_id, p_amount: totalCost });
    } else {
      // No vote by user_id — check by fingerprint (user may have voted anonymously)
      const { data: userProfile } = await supabase
        .from("user_profiles")
        .select("voter_fingerprint")
        .eq("user_id", user.id)
        .maybeSingle();
      const fp = userProfile?.voter_fingerprint || user.id;

      const { data: existingVoteByFp } = await supabase
        .from("votes")
        .select("id")
        .eq("poll_id", poll_id)
        .eq("voter_fingerprint", fp)
        .maybeSingle();

      if (existingVoteByFp) {
        await supabase.from("votes").update({
          is_staked: true,
          stake_amount: totalCost,
          user_id: user.id,
          entry_price: currentPrice,
        }).eq("id", existingVoteByFp.id);
        await supabase.rpc("increment_stake_amount", { p_option_id: option_id, p_amount: totalCost });
      } else {
        // No vote exists at all — create one with proper user_id and fingerprint
        await supabase.from("votes").insert({
          poll_id,
          option_id,
          voter_fingerprint: fp,
          user_id: user.id,
          is_staked: true,
          stake_amount: totalCost,
          entry_price: currentPrice,
        });
        await supabase.rpc("increment_vote_count", { p_option_id: option_id });
        await supabase.rpc("increment_stake_amount", { p_option_id: option_id, p_amount: totalCost });
      }
    }

    // Send vote confirmation email (fire-and-forget)
    try {
      const { data: pollData } = await supabase.from("polls").select("question, close_at").eq("id", poll_id).maybeSingle();
      const { data: optionData } = await supabase.from("poll_options").select("text").eq("id", option_id).maybeSingle();
      const { data: userProfile } = await supabase.from("user_profiles").select("full_name, username").eq("user_id", user.id).maybeSingle();
      const userEmail = user.email;
      if (userEmail) {
        const userName = userProfile?.full_name?.split(" ")[0] || userProfile?.username || undefined;
        const resDate = pollData?.close_at
          ? new Date(pollData.close_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
          : "TBD";
        const expectedReturn = `~$${(totalCost / currentPrice * 0.965).toFixed(2)}`;
        await fetch(`${supabaseUrl}/functions/v1/send-transactional-email`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${serviceKey}` },
          body: JSON.stringify({
            templateName: "forecast-vote-confirmation",
            recipientEmail: userEmail,
            templateData: {
              pollTitle: pollData?.question || "Forecast Question",
              selectedOption: optionData?.text || "Your choice",
              resolutionDate: resDate,
              capitalCommitted: `$${totalCost.toFixed(2)}`,
              expectedReturn,
              pollUrl: `${Deno.env.get("SITE_URL") || "https://econsult.africa"}/forecast-arena`,
              userName,
              isStaked: true,
            },
          }),
        }).catch(e => console.log("Vote confirmation email failed (non-blocking):", e.message));
      }
    } catch (emailErr) {
      console.log("Vote confirmation email error (non-blocking):", (emailErr as Error).message);
    }

    return new Response(JSON.stringify({
      success: true,
      shares_bought: shares,
      price: currentPrice,
      total_cost: totalCost,
      fee: feeAmount,
      total_debit: totalDebit,
      new_balance: wallet.balance_usd - totalDebit,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (err) {
    return new Response(JSON.stringify({ error: "Internal error" }), { status: 500, headers: corsHeaders });
  }
});
