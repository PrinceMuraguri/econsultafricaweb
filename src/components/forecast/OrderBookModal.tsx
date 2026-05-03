import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Minus, Plus, Wallet, TrendingUp, TrendingDown, Loader2,
  ArrowUpDown, BookOpen, X, Info, AlertTriangle
} from "lucide-react";
import type { Poll } from "@/hooks/use-polls";
import DualCurrency from "@/components/DualCurrency";
import CurrencyAmount from "@/components/CurrencyAmount";
import { formatCurrency } from "@/lib/currency";

interface OrderBookModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  poll: Poll;
}

const OrderBookModal = ({ open, onOpenChange, poll }: OrderBookModalProps) => {
  const { user, wallet, refreshWallet, proMode } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [orderType, setOrderType] = useState<"market" | "limit">("market");
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [shares, setShares] = useState(5);
  const [limitPrice, setLimitPrice] = useState(0.50);
  const [loading, setLoading] = useState(false);

  const totalStake = poll.poll_options.reduce((s, o) => s + (o.total_stake_amount || 0), 0);
  const isClosed = poll.status !== "active" || new Date(poll.close_at) < new Date();

  // Default to Yes option
  useEffect(() => {
    if (!selectedOptionId && poll.poll_options.length > 0) {
      const yesOpt = poll.poll_options.find(o => o.label.toLowerCase() === "yes");
      setSelectedOptionId(yesOpt?.id || poll.poll_options[0].id);
    }
  }, [poll.poll_options, selectedOptionId]);

  // Fetch order book for this poll
  const { data: orderBook = [] } = useQuery({
    queryKey: ["orderbook", poll.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("orders")
        .select("*")
        .eq("poll_id", poll.id)
        .in("status", ["open", "partial"])
        .order("price", { ascending: false });
      return data || [];
    },
    enabled: open,
    refetchInterval: 5000,
  });

  // Fetch user positions
  const { data: positions = [] } = useQuery({
    queryKey: ["positions", poll.id, user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase.from("positions").select("*").eq("user_id", user.id).eq("poll_id", poll.id);
      return data || [];
    },
    enabled: !!user && open,
  });

  // Fetch user's open orders
  const { data: myOrders = [] } = useQuery({
    queryKey: ["my-orders", poll.id, user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from("orders")
        .select("*")
        .eq("poll_id", poll.id)
        .eq("user_id", user.id)
        .in("status", ["open", "partial"])
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!user && open,
  });

  const selectedOption = poll.poll_options.find(o => o.id === selectedOptionId);
  const ammPrice = useMemo(() => {
    if (!selectedOption || totalStake === 0) return 0.50;
    return Math.max(0.05, Math.min(0.95, (selectedOption.total_stake_amount || 0) / totalStake));
  }, [selectedOption, totalStake]);

  const effectivePrice = orderType === "market" ? ammPrice : limitPrice;
  const currentPosition = positions.find(p => p.option_id === selectedOptionId);
  const maxSellShares = currentPosition ? Number(currentPosition.shares) : 0;

  const fee = 0.035;
  const totalCost = parseFloat((shares * effectivePrice).toFixed(2));
  const feeAmount = parseFloat((totalCost * fee).toFixed(2));
  const totalDebit = parseFloat((totalCost + feeAmount).toFixed(2));
  const sellProceeds = parseFloat((totalCost - feeAmount).toFixed(2));

  // Group order book by price level
  const buyOrders = useMemo(() => {
    const filtered = orderBook.filter((o: any) => o.option_id === selectedOptionId && o.side === "buy");
    const grouped: Record<string, number> = {};
    filtered.forEach((o: any) => {
      const p = Number(o.price).toFixed(2);
      grouped[p] = (grouped[p] || 0) + (Number(o.shares) - Number(o.filled_shares));
    });
    return Object.entries(grouped).map(([price, shares]) => ({ price: Number(price), shares })).sort((a, b) => b.price - a.price);
  }, [orderBook, selectedOptionId]);

  const sellOrders = useMemo(() => {
    const filtered = orderBook.filter((o: any) => o.option_id === selectedOptionId && o.side === "sell");
    const grouped: Record<string, number> = {};
    filtered.forEach((o: any) => {
      const p = Number(o.price).toFixed(2);
      grouped[p] = (grouped[p] || 0) + (Number(o.shares) - Number(o.filled_shares));
    });
    return Object.entries(grouped).map(([price, shares]) => ({ price: Number(price), shares })).sort((a, b) => b.price - a.price);
  }, [orderBook, selectedOptionId]);

  const handlePlaceOrder = async () => {
    if (!user || isClosed) return;
    if (side === "sell" && shares > maxSellShares) {
      toast({ title: "Insufficient shares", description: `You only have ${maxSellShares} shares.`, variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("place-order", {
        body: {
          poll_id: poll.id,
          option_id: selectedOptionId,
          side,
          shares,
          price: orderType === "limit" ? limitPrice : undefined,
          order_type: orderType,
        },
      });

      if (error || !data?.success) throw new Error(data?.error || "Order failed");

      const filledMsg = data.filled_shares > 0
        ? `${data.filled_shares} shares filled immediately`
        : "";
      const pendingMsg = data.remaining_shares > 0 && orderType === "limit"
        ? `${data.remaining_shares} shares placed on order book`
        : "";

      toast({
        title: side === "buy" ? "🟢 Buy order placed" : "🔴 Sell order placed",
        description: [filledMsg, pendingMsg].filter(Boolean).join(". ") || "Order executed.",
      });

      refreshWallet();
      queryClient.invalidateQueries({ queryKey: ["positions", poll.id] });
      queryClient.invalidateQueries({ queryKey: ["orderbook", poll.id] });
      queryClient.invalidateQueries({ queryKey: ["my-orders", poll.id] });
    } catch (err: any) {
      toast({ title: "Order failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke("cancel-order", {
        body: { order_id: orderId },
      });
      if (error || !data?.success) throw new Error(data?.error || "Cancel failed");
      toast({ title: "Order cancelled" });
      refreshWallet();
      queryClient.invalidateQueries({ queryKey: ["my-orders", poll.id] });
      queryClient.invalidateQueries({ queryKey: ["orderbook", poll.id] });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="p-4 pb-2 border-b border-border">
          <DialogTitle className="text-base font-bold flex items-center gap-2">
            <ArrowUpDown className="w-4 h-4 text-primary" />
            Trade Shares
          </DialogTitle>
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{poll.title}</p>
        </DialogHeader>

        <div className="p-4 space-y-4">
          {/* Outcome selector */}
          <div className="flex gap-2">
            {poll.poll_options.map((opt) => {
              const price = totalStake > 0 ? Math.max(0.05, Math.min(0.95, (opt.total_stake_amount || 0) / totalStake)) : 0.50;
              const isYes = opt.label.toLowerCase() === "yes";
              const isSelected = opt.id === selectedOptionId;
              return (
                <button
                  key={opt.id}
                  onClick={() => { setSelectedOptionId(opt.id); setLimitPrice(parseFloat(price.toFixed(2))); }}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-bold transition-all border ${
                    isSelected
                      ? isYes ? "bg-green-500/10 text-green-600 border-green-500 ring-1 ring-green-500/30" : "bg-blue-500/10 text-blue-600 border-blue-500 ring-1 ring-blue-500/30"
                      : "bg-muted/30 text-muted-foreground border-border hover:border-muted-foreground/40"
                  }`}
                >
                  <span className="block">{opt.label}</span>
                  <span className="block text-lg font-mono">${price.toFixed(2)}</span>
                </button>
              );
            })}
          </div>

          {/* Buy / Sell tabs */}
          <div className="flex rounded-lg overflow-hidden border border-border">
            <button
              onClick={() => setSide("buy")}
              className={`flex-1 py-2 text-sm font-bold transition-colors ${
                side === "buy" ? "bg-green-600 text-white" : "bg-muted/30 text-muted-foreground hover:text-foreground"
              }`}
            >
              Buy
            </button>
            <button
              onClick={() => setSide("sell")}
              className={`flex-1 py-2 text-sm font-bold transition-colors ${
                side === "sell" ? "bg-red-500 text-white" : "bg-muted/30 text-muted-foreground hover:text-foreground"
              }`}
            >
              Sell
            </button>
          </div>

          {/* Order type toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => setOrderType("market")}
              className={`flex-1 py-1.5 rounded text-xs font-semibold transition-all border ${
                orderType === "market" ? "bg-primary text-primary-foreground border-primary" : "bg-muted/20 border-border text-muted-foreground"
              }`}
            >
              Market Order
            </button>
            <button
              onClick={() => setOrderType("limit")}
              className={`flex-1 py-1.5 rounded text-xs font-semibold transition-all border ${
                orderType === "limit" ? "bg-primary text-primary-foreground border-primary" : "bg-muted/20 border-border text-muted-foreground"
              }`}
            >
              Limit Order
            </button>
          </div>

          {/* Limit price input */}
          {orderType === "limit" && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Limit Price ($)</p>
              <div className="flex items-center gap-2">
                <button onClick={() => setLimitPrice(Math.max(0.01, parseFloat((limitPrice - 0.01).toFixed(2))))}
                  className="w-8 h-8 rounded border border-border bg-muted/30 flex items-center justify-center">
                  <Minus className="w-3 h-3" />
                </button>
                <input
                  type="number"
                  value={limitPrice.toFixed(2)}
                  onChange={(e) => setLimitPrice(Math.max(0.01, Math.min(0.99, Number(e.target.value))))}
                  className="font-mono text-center text-lg font-bold flex-1 h-8 rounded border border-border bg-background px-2"
                  min={0.01} max={0.99} step={0.01}
                />
                <span className="text-sm text-muted-foreground">$</span>
                <button onClick={() => setLimitPrice(Math.min(0.99, parseFloat((limitPrice + 0.01).toFixed(2))))}
                  className="w-8 h-8 rounded border border-border bg-muted/30 flex items-center justify-center">
                  <Plus className="w-3 h-3" />
                </button>
              </div>
              <p className="text-[9px] text-muted-foreground mt-0.5">AMM price: ${ammPrice.toFixed(2)}</p>
            </div>
          )}

          {/* Shares input */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">Shares</p>
            <div className="flex items-center gap-2">
              <button onClick={() => setShares(Math.max(1, shares - 1))}
                className="w-8 h-8 rounded border border-border bg-muted/30 flex items-center justify-center">
                <Minus className="w-3 h-3" />
              </button>
              <input
                type="number"
                value={shares}
                onChange={(e) => setShares(Math.max(1, Math.floor(Number(e.target.value))))}
                className="font-mono text-center text-lg font-bold flex-1 h-8 rounded border border-border bg-background px-2"
                min={1}
              />
              <button onClick={() => setShares(shares + 1)}
                className="w-8 h-8 rounded border border-border bg-muted/30 flex items-center justify-center">
                <Plus className="w-3 h-3" />
              </button>
            </div>
            <div className="flex gap-1.5 mt-1.5">
              {[1, 5, 10, 25, 50].map((n) => (
                <button key={n} onClick={() => setShares(n)}
                  className={`flex-1 py-1 rounded text-[10px] font-mono font-bold border ${
                    shares === n ? "bg-primary text-primary-foreground border-primary" : "bg-muted/20 border-border text-foreground"
                  }`}>
                  {n}
                </button>
              ))}
            </div>
            {side === "sell" && maxSellShares > 0 && (
              <p className="text-[9px] text-muted-foreground mt-0.5">You hold {maxSellShares} shares</p>
            )}
          </div>

          {/* Cost / proceeds breakdown */}
          <div className="bg-muted/30 rounded-lg p-3 space-y-1.5 border border-border">
            {side === "buy" ? (
              <>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">{shares} × ${effectivePrice.toFixed(2)}</span>
                  <CurrencyAmount amount={totalCost} mode={proMode} />
                </div>
                <div className="flex justify-between text-[10px]">
                  <span className="text-muted-foreground">Fee (3.5%)</span>
                  <CurrencyAmount amount={feeAmount} mode={proMode} className="text-muted-foreground" />
                </div>
                <div className="border-t border-border pt-1.5 flex justify-between text-xs font-medium">
                  <span>Total cost</span>
                  <CurrencyAmount amount={totalDebit} mode={proMode} />
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <TrendingUp className="w-3 h-3 text-green-600" /> If correct
                  </span>
                  <CurrencyAmount amount={shares} mode={proMode} className="text-green-600" />
                </div>
              </>
            ) : (
              <>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Sell {shares} × ${effectivePrice.toFixed(2)}</span>
                  <CurrencyAmount amount={totalCost} mode={proMode} />
                </div>
                <div className="flex justify-between text-[10px]">
                  <span className="text-muted-foreground">Fee (3.5%)</span>
                  <span>−<CurrencyAmount amount={feeAmount} mode={proMode} className="text-muted-foreground" /></span>
                </div>
                <div className="border-t border-border pt-1.5 flex justify-between text-xs font-medium">
                  <span>Net proceeds</span>
                  <CurrencyAmount amount={sellProceeds} mode={proMode} className="text-green-600" />
                </div>
              </>
            )}
          </div>

          {/* Wallet */}
          {user && (
            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1"><Wallet className="w-3 h-3" /> Wallet</span>
              <CurrencyAmount amount={Number(wallet?.balance_usd || 0)} mode={proMode} />
            </div>
          )}

          {side === "buy" && user && wallet && wallet.balance_usd < totalDebit && (
            <div className="flex items-center gap-1.5 text-[10px] text-amber-600 bg-amber-50 dark:bg-amber-500/10 rounded p-2 border border-amber-200 dark:border-amber-500/20">
              <AlertTriangle className="w-3 h-3 shrink-0" />
              <span>Insufficient balance. Top up your wallet first.</span>
            </div>
          )}

          {/* Place order button */}
          <Button
            onClick={handlePlaceOrder}
            disabled={loading || isClosed || !user || (side === "buy" && !!wallet && wallet.balance_usd < totalDebit) || (side === "sell" && shares > maxSellShares)}
            className={`w-full font-bold text-sm ${side === "buy" ? "bg-green-600 hover:bg-green-700" : "bg-red-500 hover:bg-red-600"} text-white`}
            size="lg"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            {side === "buy"
              ? orderType === "limit" ? `Place Buy Order — $${totalDebit.toFixed(2)}` : `Buy ${shares} shares — $${totalDebit.toFixed(2)}`
              : orderType === "limit" ? `Place Sell Order — ${shares} shares` : `Sell ${shares} shares`
            }
          </Button>

          {/* Order Book Display */}
          <div className="border border-border rounded-lg overflow-hidden">
            <div className="bg-muted/30 px-3 py-1.5 flex items-center gap-1.5 border-b border-border">
              <BookOpen className="w-3.5 h-3.5 text-primary" />
              <span className="text-[10px] font-semibold text-foreground uppercase tracking-wider">Order Book</span>
              <span className="text-[9px] text-muted-foreground ml-auto">{selectedOption?.label}</span>
            </div>

            <div className="divide-y divide-border max-h-40 overflow-y-auto">
              {/* Sell side (asks) — lowest at bottom */}
              {sellOrders.length > 0 ? sellOrders.map((level, i) => (
                <div key={`ask-${i}`} className="flex items-center justify-between px-3 py-1 text-[10px] relative">
                  <div className="absolute inset-0 bg-red-500/5" style={{ width: `${Math.min(100, level.shares * 5)}%` }} />
                  <span className="relative font-mono text-red-500">${level.price.toFixed(2)}</span>
                  <span className="relative font-mono text-muted-foreground">{level.shares.toFixed(0)}</span>
                </div>
              )) : (
                <div className="px-3 py-2 text-[10px] text-muted-foreground text-center">No sell orders</div>
              )}

              {/* Spread indicator */}
              <div className="bg-muted/50 px-3 py-1.5 text-center">
                <span className="text-xs font-mono font-bold text-foreground">${ammPrice.toFixed(2)}</span>
                <span className="text-[9px] text-muted-foreground ml-1">AMM price</span>
              </div>

              {/* Buy side (bids) — highest at top */}
              {buyOrders.length > 0 ? buyOrders.map((level, i) => (
                <div key={`bid-${i}`} className="flex items-center justify-between px-3 py-1 text-[10px] relative">
                  <div className="absolute inset-0 bg-green-500/5" style={{ width: `${Math.min(100, level.shares * 5)}%` }} />
                  <span className="relative font-mono text-green-600">${level.price.toFixed(2)}</span>
                  <span className="relative font-mono text-muted-foreground">{level.shares.toFixed(0)}</span>
                </div>
              )) : (
                <div className="px-3 py-2 text-[10px] text-muted-foreground text-center">No buy orders</div>
              )}
            </div>
          </div>

          {/* My Open Orders */}
          {myOrders.length > 0 && (
            <div className="border border-border rounded-lg overflow-hidden">
              <div className="bg-muted/30 px-3 py-1.5 border-b border-border">
                <span className="text-[10px] font-semibold text-foreground uppercase tracking-wider">Your Open Orders</span>
              </div>
              <div className="divide-y divide-border max-h-32 overflow-y-auto">
                {myOrders.map((order: any) => {
                  const opt = poll.poll_options.find(o => o.id === order.option_id);
                  return (
                    <div key={order.id} className="flex items-center justify-between px-3 py-1.5 text-[10px]">
                      <div>
                        <span className={`font-semibold ${order.side === "buy" ? "text-green-600" : "text-red-500"}`}>
                          {order.side.toUpperCase()}
                        </span>
                        <span className="text-muted-foreground ml-1">{opt?.label}</span>
                        <span className="font-mono text-muted-foreground ml-1">
                          {Number(order.shares) - Number(order.filled_shares)}/{Number(order.shares)} @ ${Number(order.price).toFixed(2)}
                        </span>
                      </div>
                      <button
                        onClick={() => handleCancelOrder(order.id)}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Explainer */}
          <div className="bg-muted/20 border border-border rounded-lg p-3">
            <p className="text-[9px] text-muted-foreground leading-relaxed flex items-start gap-1">
              <Info className="w-3 h-3 shrink-0 mt-0.5 text-primary" />
              <span>
                <strong>Market orders</strong> execute instantly at the current AMM price.
                <strong> Limit orders</strong> are placed on the order book and match when another user offers a compatible price.
                Unmatched limit orders can be cancelled anytime. A 3.5% fee applies to all trades.
              </span>
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OrderBookModal;
