import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PLATFORM_FEE = 0.035;

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

    // Get the listing
    const { data: listing } = await supabase
      .from("listings")
      .select("*")
      .eq("id", listing_id)
      .eq("status", "active")
      .single();

    if (!listing) {
      return new Response(JSON.stringify({ error: "Listing not found or already sold" }), { status: 404, headers: corsHeaders });
    }
    if (listing.seller_id === user.id) {
      return new Response(JSON.stringify({ error: "You cannot buy your own listing" }), { status: 400, headers: corsHeaders });
    }

    // Check poll is still active
    const { data: poll } = await supabase.from("polls").select("status, close_at").eq("id", listing.poll_id).single();
    if (!poll || poll.status !== "active" || new Date(poll.close_at) < new Date()) {
      return new Response(JSON.stringify({ error: "Poll is closed" }), { status: 400, headers: corsHeaders });
    }

    // Check buyer wallet balance
    const { data: buyerWallet } = await supabase
      .from("wallets")
      .select("id, balance_usd")
      .eq("user_id", user.id)
      .single();

    if (!buyerWallet || Number(buyerWallet.balance_usd) < Number(listing.total_ask)) {
      return new Response(JSON.stringify({ error: `Insufficient wallet balance. Need $${Number(listing.total_ask).toFixed(2)}, have $${Number(buyerWallet?.balance_usd || 0).toFixed(2)}` }), { status: 400, headers: corsHeaders });
    }

    // ── ATOMIC SWAP ──
    // Step 1: Claim the listing (race condition protection — only succeeds if still active)
    const { data: claimed, error: claimErr } = await supabase
      .from("listings")
      .update({ status: "sold", buyer_id: user.id, updated_at: new Date().toISOString() })
      .eq("id", listing_id)
      .eq("status", "active")
      .select()
      .single();

    if (claimErr || !claimed) {
      return new Response(JSON.stringify({ error: "This listing was just purchased by someone else" }), { status: 409, headers: corsHeaders });
    }

    const totalAsk = Number(listing.total_ask);
    const feeAmount = parseFloat((totalAsk * PLATFORM_FEE).toFixed(2));
    const sellerNet = parseFloat((totalAsk - feeAmount).toFixed(2));
    const ref = `p2p_${listing_id.slice(0, 8)}_${Date.now()}`;

    // Step 2: Debit buyer wallet
    await supabase.from("wallets").update({
      balance_usd: Number(buyerWallet.balance_usd) - totalAsk,
      updated_at: new Date().toISOString(),
    }).eq("id", buyerWallet.id);

    // Step 3: Credit seller wallet
    const { data: sellerWallet } = await supabase
      .from("wallets").select("id, balance_usd").eq("user_id", listing.seller_id).single();

    if (sellerWallet) {
      await supabase.from("wallets").update({
        balance_usd: Number(sellerWallet.balance_usd) + sellerNet,
        updated_at: new Date().toISOString(),
      }).eq("id", sellerWallet.id);
    }

    // Step 4: Add shares to buyer's position
    const { data: buyerPos } = await supabase
      .from("positions")
      .select("id, shares, total_cost")
      .eq("user_id", user.id)
      .eq("poll_id", listing.poll_id)
      .eq("option_id", listing.option_id)
      .maybeSingle();

    const listingShares = Number(listing.shares);
    const listingPrice = Number(listing.price_per_share);

    if (buyerPos) {
      const newShares = parseFloat((Number(buyerPos.shares) + listingShares).toFixed(4));
      const newCost = parseFloat((Number(buyerPos.total_cost) + totalAsk).toFixed(2));
      await supabase.from("positions").update({
        shares: newShares,
        avg_price: parseFloat((newCost / newShares).toFixed(4)),
        total_cost: newCost,
        updated_at: new Date().toISOString(),
      }).eq("id", buyerPos.id);
    } else {
      await supabase.from("positions").insert({
        user_id: user.id,
        poll_id: listing.poll_id,
        option_id: listing.option_id,
        shares: parseFloat(listingShares.toFixed(4)),
        avg_price: parseFloat(listingPrice.toFixed(4)),
        total_cost: parseFloat(totalAsk.toFixed(2)),
      });
    }

    // Step 5: Wallet transactions for both
    await supabase.from("wallet_transactions").insert([
      {
        user_id: user.id,
        type: "share_purchase",
        amount: -totalAsk,
        description: `Bought ${listingShares.toFixed(4)} shares (secondary market)`,
        reference: `buy_${ref}`,
      },
      {
        user_id: listing.seller_id,
        type: "share_sale",
        amount: sellerNet,
        description: `Sold ${listingShares.toFixed(4)} shares (secondary market)`,
        reference: `sell_${ref}`,
      },
    ]);

    // Step 6: Trade records
    await supabase.from("trades").insert([
      {
        user_id: user.id,
        poll_id: listing.poll_id,
        option_id: listing.option_id,
        side: "buy",
        shares: listingShares,
        price: listingPrice,
        total_amount: totalAsk,
        fee: 0,
        reference: `buy_${ref}`,
      },
      {
        user_id: listing.seller_id,
        poll_id: listing.poll_id,
        option_id: listing.option_id,
        side: "sell",
        shares: listingShares,
        price: listingPrice,
        total_amount: totalAsk,
        fee: feeAmount,
        reference: `sell_${ref}`,
      },
    ]);

    return new Response(JSON.stringify({
      success: true,
      shares_acquired: listingShares,
      price_per_share: listingPrice,
      total_paid: totalAsk,
      seller_received: sellerNet,
      platform_fee: feeAmount,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (err) {
    console.error("buy-listing error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), { status: 500, headers: corsHeaders });
  }
});
