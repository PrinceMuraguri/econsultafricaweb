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

    const { poll_id, option_id, side, price, shares, order_type } = await req.json();

    if (!poll_id || !option_id || !side || !shares || shares <= 0) {
      return new Response(JSON.stringify({ error: "Invalid input" }), { status: 400, headers: corsHeaders });
    }
    if (!["buy", "sell"].includes(side)) {
      return new Response(JSON.stringify({ error: "Side must be 'buy' or 'sell'" }), { status: 400, headers: corsHeaders });
    }
    if (price !== undefined && (price <= 0 || price >= 1)) {
      return new Response(JSON.stringify({ error: "Price must be between 0 and 1" }), { status: 400, headers: corsHeaders });
    }

    // Check poll is active
    const { data: poll } = await supabase.from("polls").select("status, close_at").eq("id", poll_id).single();
    if (!poll || poll.status !== "active" || new Date(poll.close_at) < new Date()) {
      return new Response(JSON.stringify({ error: "Market is closed" }), { status: 400, headers: corsHeaders });
    }

    // Get AMM price as fallback
    const { data: options } = await supabase
      .from("poll_options")
      .select("id, total_stake_amount")
      .eq("poll_id", poll_id);

    const totalStake = (options || []).reduce((s, o) => s + Number(o.total_stake_amount || 0), 0);
    const thisOption = (options || []).find((o: any) => o.id === option_id);
    const ammPrice = totalStake > 0 && thisOption
      ? Math.max(0.05, Math.min(0.95, Number(thisOption.total_stake_amount || 0) / totalStake))
      : 0.50;

    const orderPrice = price || ammPrice;
    const isMarket = order_type === "market" || !price;
    const totalCost = parseFloat((shares * orderPrice).toFixed(2));
    const fee = 0.035;
    const feeAmount = parseFloat((totalCost * fee).toFixed(2));

    if (side === "buy") {
      // Check wallet balance
      const { data: wallet } = await supabase
        .from("wallets")
        .select("id, balance_usd")
        .eq("user_id", user.id)
        .single();

      const totalDebit = parseFloat((totalCost + feeAmount).toFixed(2));
      if (!wallet || wallet.balance_usd < totalDebit) {
        return new Response(JSON.stringify({
          error: "Insufficient balance",
          required: totalDebit,
          balance: wallet?.balance_usd || 0,
        }), { status: 400, headers: corsHeaders });
      }
    }

    if (side === "sell") {
      // Check position exists
      const { data: position } = await supabase
        .from("positions")
        .select("shares")
        .eq("user_id", user.id)
        .eq("poll_id", poll_id)
        .eq("option_id", option_id)
        .single();

      if (!position || Number(position.shares) < shares) {
        return new Response(JSON.stringify({ error: "Insufficient shares" }), { status: 400, headers: corsHeaders });
      }
    }

    // Try to match against existing orders first
    const matchSide = side === "buy" ? "sell" : "buy";
    const priceCondition = side === "buy" ? "lte" : "gte";

    const { data: matchingOrders } = await supabase
      .from("orders")
      .select("*")
      .eq("poll_id", poll_id)
      .eq("option_id", option_id)
      .eq("side", matchSide)
      .in("status", ["open", "partial"])
      .neq("user_id", user.id)
      .order("price", { ascending: side === "buy" }) // Best price first
      .order("created_at", { ascending: true }); // FIFO

    let remainingShares = shares;
    const fills: Array<{ matchOrderId: string; fillShares: number; fillPrice: number; counterpartyId: string }> = [];

    // Match against order book
    for (const order of (matchingOrders || [])) {
      if (remainingShares <= 0) break;

      // Price check: buy orders match at or below their price, sell at or above
      if (side === "buy" && Number(order.price) > orderPrice) continue;
      if (side === "sell" && Number(order.price) < orderPrice) continue;

      const availableShares = Number(order.shares) - Number(order.filled_shares);
      const fillShares = Math.min(remainingShares, availableShares);
      const fillPrice = Number(order.price); // Execute at the resting order's price

      fills.push({
        matchOrderId: order.id,
        fillShares,
        fillPrice,
        counterpartyId: order.user_id,
      });

      remainingShares -= fillShares;
    }

    // Execute matched fills
    for (const fill of fills) {
      const fillCost = parseFloat((fill.fillShares * fill.fillPrice).toFixed(2));
      const fillFee = parseFloat((fillCost * fee).toFixed(2));

      if (side === "buy") {
        // Debit buyer wallet
        const { data: buyerWallet } = await supabase.from("wallets").select("id, balance_usd").eq("user_id", user.id).single();
        if (buyerWallet) {
          await supabase.from("wallets").update({
            balance_usd: buyerWallet.balance_usd - (fillCost + fillFee),
            updated_at: new Date().toISOString(),
          }).eq("id", buyerWallet.id);
        }

        // Credit seller wallet
        const sellerFee = parseFloat((fillCost * fee).toFixed(2));
        const { data: sellerWallet } = await supabase.from("wallets").select("id, balance_usd").eq("user_id", fill.counterpartyId).single();
        if (sellerWallet) {
          await supabase.from("wallets").update({
            balance_usd: sellerWallet.balance_usd + (fillCost - sellerFee),
            updated_at: new Date().toISOString(),
          }).eq("id", sellerWallet.id);
        }

        // Update buyer position (add shares)
        const { data: existingPos } = await supabase.from("positions").select("*")
          .eq("user_id", user.id).eq("poll_id", poll_id).eq("option_id", option_id).maybeSingle();

        if (existingPos) {
          const newShares = Number(existingPos.shares) + fill.fillShares;
          await supabase.from("positions").update({
            shares: newShares,
            avg_price: parseFloat(((Number(existingPos.total_cost) + fillCost) / newShares).toFixed(4)),
            total_cost: Number(existingPos.total_cost) + fillCost,
            updated_at: new Date().toISOString(),
          }).eq("id", existingPos.id);
        } else {
          await supabase.from("positions").insert({
            user_id: user.id, poll_id, option_id,
            shares: fill.fillShares, avg_price: fill.fillPrice, total_cost: fillCost,
          });
        }

        // Update seller position (remove shares)
        const { data: sellerPos } = await supabase.from("positions").select("*")
          .eq("user_id", fill.counterpartyId).eq("poll_id", poll_id).eq("option_id", option_id).single();

        if (sellerPos) {
          const newShares = Number(sellerPos.shares) - fill.fillShares;
          if (newShares <= 0) {
            await supabase.from("positions").delete().eq("id", sellerPos.id);
          } else {
            await supabase.from("positions").update({
              shares: newShares,
              total_cost: parseFloat((Number(sellerPos.total_cost) * (newShares / Number(sellerPos.shares))).toFixed(2)),
              updated_at: new Date().toISOString(),
            }).eq("id", sellerPos.id);
          }
        }
      } else {
        // side === "sell" — mirror logic
        const sellerFee = parseFloat((fillCost * fee).toFixed(2));
        const { data: sellerWallet } = await supabase.from("wallets").select("id, balance_usd").eq("user_id", user.id).single();
        if (sellerWallet) {
          await supabase.from("wallets").update({
            balance_usd: sellerWallet.balance_usd + (fillCost - sellerFee),
            updated_at: new Date().toISOString(),
          }).eq("id", sellerWallet.id);
        }

        const buyerFee = parseFloat((fillCost * fee).toFixed(2));
        const { data: buyerWallet } = await supabase.from("wallets").select("id, balance_usd").eq("user_id", fill.counterpartyId).single();
        if (buyerWallet) {
          await supabase.from("wallets").update({
            balance_usd: buyerWallet.balance_usd - (fillCost + buyerFee),
            updated_at: new Date().toISOString(),
          }).eq("id", buyerWallet.id);
        }

        // Update seller position
        const { data: sellerPos } = await supabase.from("positions").select("*")
          .eq("user_id", user.id).eq("poll_id", poll_id).eq("option_id", option_id).single();
        if (sellerPos) {
          const newShares = Number(sellerPos.shares) - fill.fillShares;
          if (newShares <= 0) {
            await supabase.from("positions").delete().eq("id", sellerPos.id);
          } else {
            await supabase.from("positions").update({
              shares: newShares,
              total_cost: parseFloat((Number(sellerPos.total_cost) * (newShares / Number(sellerPos.shares))).toFixed(2)),
              updated_at: new Date().toISOString(),
            }).eq("id", sellerPos.id);
          }
        }

        // Update buyer position
        const { data: buyerPos } = await supabase.from("positions").select("*")
          .eq("user_id", fill.counterpartyId).eq("poll_id", poll_id).eq("option_id", option_id).maybeSingle();
        if (buyerPos) {
          const newShares = Number(buyerPos.shares) + fill.fillShares;
          await supabase.from("positions").update({
            shares: newShares,
            avg_price: parseFloat(((Number(buyerPos.total_cost) + fillCost) / newShares).toFixed(4)),
            total_cost: Number(buyerPos.total_cost) + fillCost,
            updated_at: new Date().toISOString(),
          }).eq("id", buyerPos.id);
        } else {
          await supabase.from("positions").insert({
            user_id: fill.counterpartyId, poll_id, option_id,
            shares: fill.fillShares, avg_price: fill.fillPrice, total_cost: fillCost,
          });
        }
      }

      // Record trades for both parties
      const tradeRef = `clob_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      await supabase.from("trades").insert([
        {
          user_id: user.id, poll_id, option_id, side,
          shares: fill.fillShares, price: fill.fillPrice,
          total_amount: fillCost, fee: parseFloat((fillCost * fee).toFixed(2)),
          reference: tradeRef,
        },
        {
          user_id: fill.counterpartyId, poll_id, option_id, side: matchSide,
          shares: fill.fillShares, price: fill.fillPrice,
          total_amount: fillCost, fee: parseFloat((fillCost * fee).toFixed(2)),
          reference: tradeRef + "_match",
        },
      ]);

      // Update matched order status
      const matchOrder = (matchingOrders || []).find(o => o.id === fill.matchOrderId);
      if (matchOrder) {
        const newFilled = Number(matchOrder.filled_shares) + fill.fillShares;
        const newStatus = newFilled >= Number(matchOrder.shares) ? "filled" : "partial";
        await supabase.from("orders").update({
          filled_shares: newFilled,
          status: newStatus,
          updated_at: new Date().toISOString(),
        }).eq("id", fill.matchOrderId);
      }

      // Wallet transaction records
      await supabase.from("wallet_transactions").insert({
        user_id: user.id,
        type: side === "buy" ? "buy_shares" : "sell_proceeds",
        amount: side === "buy" ? -(fillCost + parseFloat((fillCost * fee).toFixed(2))) : (fillCost - parseFloat((fillCost * fee).toFixed(2))),
        description: `${side === "buy" ? "Bought" : "Sold"} ${fill.fillShares} shares (order matched)`,
        reference: tradeRef,
      });
    }

    // If remaining shares and it's a limit order, place on the book
    let placedOrderId = null;
    if (remainingShares > 0 && !isMarket) {
      const { data: newOrder } = await supabase.from("orders").insert({
        user_id: user.id,
        poll_id,
        option_id,
        side,
        order_type: "limit",
        price: orderPrice,
        shares: remainingShares,
        filled_shares: 0,
        status: "open",
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      }).select("id").single();

      placedOrderId = newOrder?.id;

      // For limit buy orders, escrow the funds
      if (side === "buy") {
        const escrowAmount = parseFloat((remainingShares * orderPrice * (1 + fee)).toFixed(2));
        const { data: wallet } = await supabase.from("wallets").select("id, balance_usd").eq("user_id", user.id).single();
        if (wallet) {
          await supabase.from("wallets").update({
            balance_usd: wallet.balance_usd - escrowAmount,
            updated_at: new Date().toISOString(),
          }).eq("id", wallet.id);

          await supabase.from("wallet_transactions").insert({
            user_id: user.id, type: "order_escrow",
            amount: -escrowAmount,
            description: `Escrowed for limit buy order (${remainingShares} shares at $${orderPrice.toFixed(2)})`,
            reference: `escrow_${placedOrderId}`,
          });
        }
      }
    } else if (remainingShares > 0 && isMarket) {
      // Market order with remaining shares: execute at AMM price (existing buy/sell-shares logic)
      if (side === "buy") {
        const { data, error } = await supabase.functions.invoke("buy-shares", {
          body: { poll_id, option_id, shares: remainingShares },
          headers: { Authorization: `Bearer ${token}` },
        });
        // Silently handle — AMM fallback
      } else {
        const { data, error } = await supabase.functions.invoke("sell-shares", {
          body: { poll_id, option_id, shares: remainingShares },
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    }

    const filledShares = shares - remainingShares;

    return new Response(JSON.stringify({
      success: true,
      order_id: placedOrderId,
      filled_shares: filledShares,
      remaining_shares: remainingShares,
      fills: fills.map(f => ({
        shares: f.fillShares,
        price: f.fillPrice,
        counterparty: f.counterpartyId.slice(0, 8) + "...",
      })),
      amm_price: ammPrice,
      status: filledShares === shares ? "filled" : remainingShares > 0 && !isMarket ? "open" : "filled",
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (err: any) {
    console.error("place-order error:", err);
    return new Response(JSON.stringify({ error: "Internal error", details: err.message }), { status: 500, headers: corsHeaders });
  }
});
