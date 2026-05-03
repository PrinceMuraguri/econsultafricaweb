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

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "No auth" }), { status: 401, headers: corsHeaders });

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
    if (authErr || !user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

    const { order_id } = await req.json();
    if (!order_id) return new Response(JSON.stringify({ error: "order_id required" }), { status: 400, headers: corsHeaders });

    const proMode = await getProMode(supabase);

    if (proMode === "demo") {
      const { data: rpcData, error: rpcErr } = await supabase.rpc("demo_cancel_order_atomic", {
        p_order_id: order_id,
        p_user_id: user.id,
      });
      if (rpcErr) {
        return new Response(JSON.stringify({ error: rpcErr.message, demo: true }), { status: 500, headers: corsHeaders });
      }
      if (rpcData?.error) {
        return new Response(JSON.stringify({ error: rpcData.error, demo: true }), { status: 400, headers: corsHeaders });
      }
      return new Response(JSON.stringify({ demo: true, ...rpcData }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Get the order
    const { data: order } = await supabase
      .from("orders")
      .select("*")
      .eq("id", order_id)
      .eq("user_id", user.id)
      .in("status", ["open", "partial"])
      .single();

    if (!order) {
      return new Response(JSON.stringify({ error: "Order not found or already filled/cancelled" }), { status: 404, headers: corsHeaders });
    }

    // Cancel the order
    await supabase.from("orders").update({
      status: "cancelled",
      updated_at: new Date().toISOString(),
    }).eq("id", order_id);

    // If it was a buy order, refund the escrowed amount for unfilled shares
    const unfilledShares = Number(order.shares) - Number(order.filled_shares);
    if (order.side === "buy" && unfilledShares > 0) {
      const fee = 0.035;
      const refundAmount = parseFloat((unfilledShares * Number(order.price) * (1 + fee)).toFixed(2));

      const { data: wallet } = await supabase.from("wallets").select("id, balance_usd").eq("user_id", user.id).single();
      if (wallet) {
        await supabase.from("wallets").update({
          balance_usd: wallet.balance_usd + refundAmount,
          updated_at: new Date().toISOString(),
        }).eq("id", wallet.id);

        await supabase.from("wallet_transactions").insert({
          user_id: user.id, type: "order_refund",
          amount: refundAmount,
          description: `Refund for cancelled limit buy order (${unfilledShares} unfilled shares)`,
          reference: `refund_${order_id}`,
        });
      }
    }

    return new Response(JSON.stringify({
      success: true,
      cancelled_order_id: order_id,
      unfilled_shares: unfilledShares,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (err: any) {
    console.error("cancel-order error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), { status: 500, headers: corsHeaders });
  }
});
