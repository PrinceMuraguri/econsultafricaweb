import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { Minus, Plus, Wallet, TrendingUp, TrendingDown, Loader2, Shield, AlertTriangle } from "lucide-react";
import type { Poll, PollOption } from "@/hooks/use-polls";
import RegistrationModal from "@/components/auth/RegistrationModal";
import LoginModal from "@/components/auth/LoginModal";

interface TradingPanelProps {
  poll: Poll;
}

const TradingPanel = ({ poll }: TradingPanelProps) => {
  const { user, wallet, refreshWallet } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [shares, setShares] = useState(10);
  const [loading, setLoading] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);

  const totalVotes = poll.poll_options.reduce((s, o) => s + o.total_votes_count, 0);
  const isClosed = poll.status !== "active" || new Date(poll.close_at) < new Date();

  // Set first option as default
  useEffect(() => {
    if (!selectedOptionId && poll.poll_options.length > 0) {
      const yesOpt = poll.poll_options.find(o => o.label.toLowerCase() === "yes");
      setSelectedOptionId(yesOpt?.id || poll.poll_options[0].id);
    }
  }, [poll.poll_options, selectedOptionId]);

  // Fetch user positions for this poll
  const { data: positions = [] } = useQuery({
    queryKey: ["positions", poll.id, user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from("positions")
        .select("*")
        .eq("user_id", user.id)
        .eq("poll_id", poll.id);
      return data || [];
    },
    enabled: !!user,
    refetchInterval: 15000,
  });

  const selectedOption = poll.poll_options.find(o => o.id === selectedOptionId);
  const currentPrice = useMemo(() => {
    if (!selectedOption || totalVotes === 0) return 0.50;
    return Math.max(0.05, Math.min(0.95, selectedOption.total_votes_count / totalVotes));
  }, [selectedOption, totalVotes]);

  const currentPosition = positions.find(p => p.option_id === selectedOptionId);
  const maxSellShares = currentPosition ? Number(currentPosition.shares) : 0;

  const fee = 0.035;
  const totalCost = parseFloat((shares * currentPrice).toFixed(2));
  const feeAmount = parseFloat((totalCost * fee).toFixed(2));
  const totalDebit = parseFloat((totalCost + feeAmount).toFixed(2));
  const potentialPayout = shares; // Each share resolves at $1
  const potentialProfit = parseFloat((potentialPayout - totalDebit).toFixed(2));

  // Sell calculations
  const sellGross = parseFloat((shares * currentPrice).toFixed(2));
  const sellFee = parseFloat((sellGross * fee).toFixed(2));
  const sellNet = parseFloat((sellGross - sellFee).toFixed(2));

  const handleTrade = async () => {
    if (!user) { setRegisterOpen(true); return; }
    if (isClosed) return;
    if (side === "sell" && shares > maxSellShares) {
      toast({ title: "Insufficient shares", description: `You only have ${maxSellShares} shares.`, variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const fnName = side === "buy" ? "buy-shares" : "sell-shares";
      const { data, error } = await supabase.functions.invoke(fnName, {
        body: { poll_id: poll.id, option_id: selectedOptionId, shares },
      });

      if (error || !data?.success) {
        throw new Error(data?.error || "Trade failed");
      }

      toast({
        title: side === "buy" ? "🎯 Shares purchased!" : "💰 Shares sold!",
        description: side === "buy"
          ? `Bought ${shares} shares at $${currentPrice.toFixed(2)}`
          : `Sold ${shares} shares — $${data.net_proceeds?.toFixed(2)} credited to wallet`,
      });

      refreshWallet();
      queryClient.invalidateQueries({ queryKey: ["positions", poll.id] });
      queryClient.invalidateQueries({ queryKey: ["poll", poll.slug] });
    } catch (err: any) {
      toast({ title: "Trade Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const sortedOptions = [...poll.poll_options].sort((a, b) => {
    const rank = (l: string) => l === "yes" ? 0 : l === "no" ? 2 : 1;
    return rank(a.label.toLowerCase()) - rank(b.label.toLowerCase());
  });

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      {/* Buy/Sell tabs */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setSide("buy")}
          className={`flex-1 py-2.5 text-sm font-bold text-center transition-colors ${
            side === "buy" ? "bg-green-600 text-white" : "bg-muted/50 text-muted-foreground hover:text-foreground"
          }`}
        >
          Buy
        </button>
        <button
          onClick={() => setSide("sell")}
          className={`flex-1 py-2.5 text-sm font-bold text-center transition-colors ${
            side === "sell" ? "bg-red-500 text-white" : "bg-muted/50 text-muted-foreground hover:text-foreground"
          }`}
        >
          Sell
        </button>
      </div>

      <div className="p-4 space-y-3">
        {/* Outcome selector */}
        <div className="flex gap-2">
          {sortedOptions.map((opt) => {
            const isYes = opt.label.toLowerCase() === "yes";
            const isNo = opt.label.toLowerCase() === "no";
            const pct = totalVotes > 0 ? Math.round((opt.total_votes_count / totalVotes) * 100) : 50;
            const price = totalVotes > 0 ? Math.max(0.05, Math.min(0.95, opt.total_votes_count / totalVotes)) : 0.50;
            const isSelected = opt.id === selectedOptionId;

            return (
              <button
                key={opt.id}
                onClick={() => setSelectedOptionId(opt.id)}
                className={`flex-1 py-2.5 px-3 rounded-md text-sm font-bold transition-all border ${
                  isSelected
                    ? side === "buy"
                      ? "bg-green-600 text-white border-green-600"
                      : "bg-red-500 text-white border-red-500"
                    : "bg-muted/30 text-foreground border-border hover:border-muted-foreground/40"
                }`}
              >
                {opt.label} {(price * 100).toFixed(0)}¢
              </button>
            );
          })}
        </div>

        {/* Amount input */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-medium text-muted-foreground">Shares</span>
            {side === "sell" && maxSellShares > 0 && (
              <button
                onClick={() => setShares(maxSellShares)}
                className="text-[10px] text-primary hover:text-accent font-medium"
              >
                Max: {maxSellShares}
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShares(Math.max(1, shares - 5))} className="w-8 h-8 rounded border border-border bg-muted/30 flex items-center justify-center hover:bg-muted transition-colors">
              <Minus className="w-3 h-3" />
            </button>
            <Input
              type="number"
              value={shares}
              onChange={(e) => setShares(Math.max(1, Math.floor(Number(e.target.value))))}
              className="font-mono text-center text-lg font-bold flex-1 h-8"
              min={1}
            />
            <button onClick={() => setShares(shares + 5)} className="w-8 h-8 rounded border border-border bg-muted/30 flex items-center justify-center hover:bg-muted transition-colors">
              <Plus className="w-3 h-3" />
            </button>
          </div>
          <div className="flex gap-1.5 mt-2">
            {[5, 10, 25, 50, 100].map((n) => (
              <button key={n} onClick={() => setShares(n)}
                className={`flex-1 py-1 rounded text-[10px] font-mono font-bold transition-all border ${
                  shares === n ? "bg-primary text-primary-foreground border-primary" : "bg-muted/20 text-foreground border-border hover:border-primary/40"
                }`}>
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* Cost summary */}
        <div className="bg-muted/30 rounded-lg p-3 space-y-1.5 border border-border">
          {side === "buy" ? (
            <>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">{shares} × ${currentPrice.toFixed(2)}</span>
                <span className="font-mono font-semibold">${totalCost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span className="text-muted-foreground">Fee (3.5%)</span>
                <span className="font-mono text-muted-foreground">${feeAmount.toFixed(2)}</span>
              </div>
              <div className="border-t border-border pt-1.5 flex justify-between text-xs">
                <span className="text-muted-foreground font-medium">Total</span>
                <span className="font-mono font-bold">${totalDebit.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground flex items-center gap-1">
                  <TrendingUp className="w-3 h-3 text-green-600" /> If correct
                </span>
                <span className="font-mono font-bold text-green-600">${potentialPayout.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span className="text-muted-foreground">Potential profit</span>
                <span className={`font-mono font-bold ${potentialProfit > 0 ? "text-green-600" : "text-red-500"}`}>
                  {potentialProfit > 0 ? "+" : ""}${potentialProfit.toFixed(2)}
                </span>
              </div>
            </>
          ) : (
            <>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">{shares} × ${currentPrice.toFixed(2)}</span>
                <span className="font-mono font-semibold">${sellGross.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span className="text-muted-foreground">Fee (3.5%)</span>
                <span className="font-mono text-muted-foreground">-${sellFee.toFixed(2)}</span>
              </div>
              <div className="border-t border-border pt-1.5 flex justify-between text-xs">
                <span className="text-muted-foreground flex items-center gap-1">
                  <TrendingDown className="w-3 h-3 text-primary" /> You receive
                </span>
                <span className="font-mono font-bold text-primary">${sellNet.toFixed(2)}</span>
              </div>
            </>
          )}
        </div>

        {/* Wallet balance */}
        {user && (
          <div className="flex items-center justify-between text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1"><Wallet className="w-3 h-3" /> Balance</span>
            <span className="font-mono font-semibold">${(wallet?.balance_usd || 0).toFixed(2)}</span>
          </div>
        )}

        {/* Insufficient balance warning */}
        {user && side === "buy" && wallet && wallet.balance_usd < totalDebit && (
          <div className="flex items-center gap-1.5 text-[10px] text-amber-600 bg-amber-50 dark:bg-amber-500/10 rounded p-2 border border-amber-200 dark:border-amber-500/20">
            <AlertTriangle className="w-3 h-3 shrink-0" />
            <span>Insufficient balance. Top up your wallet to trade.</span>
          </div>
        )}

        {/* Trade button */}
        <Button
          onClick={handleTrade}
          disabled={loading || isClosed || (side === "sell" && shares > maxSellShares) || (side === "buy" && !!user && !!wallet && wallet.balance_usd < totalDebit)}
          className={`w-full font-bold text-sm ${
            side === "buy"
              ? "bg-green-600 hover:bg-green-700 text-white"
              : "bg-red-500 hover:bg-red-600 text-white"
          }`}
          size="lg"
        >
          {loading ? (
            <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Processing...</>
          ) : !user ? (
            "Sign in to Trade"
          ) : isClosed ? (
            "Market Closed"
          ) : side === "buy" ? (
            `Buy — $${totalDebit.toFixed(2)}`
          ) : (
            `Sell ${shares} shares — $${sellNet.toFixed(2)}`
          )}
        </Button>

        <div className="flex items-center justify-center text-[9px] text-muted-foreground gap-1">
          <Shield className="w-3 h-3" /> Wallet-based settlement · 3.5% fee
        </div>

        {/* Current positions */}
        {positions.length > 0 && (
          <div className="border-t border-border pt-3 mt-2">
            <p className="text-[10px] font-semibold text-foreground mb-2 uppercase tracking-wider">Your Positions</p>
            {positions.map((pos: any) => {
              const opt = poll.poll_options.find(o => o.id === pos.option_id);
              const mktPrice = totalVotes > 0 && opt
                ? Math.max(0.05, Math.min(0.95, opt.total_votes_count / totalVotes))
                : 0.50;
              const mktValue = pos.shares * mktPrice;
              const pnl = mktValue - pos.total_cost;
              return (
                <div key={pos.id} className="flex items-center justify-between text-xs py-1">
                  <div>
                    <span className="font-semibold">{opt?.label || "?"}</span>
                    <span className="text-muted-foreground ml-1.5">{Number(pos.shares)} shares</span>
                  </div>
                  <div className="text-right">
                    <span className={`font-mono font-bold ${pnl >= 0 ? "text-green-600" : "text-red-500"}`}>
                      {pnl >= 0 ? "+" : ""}${pnl.toFixed(2)}
                    </span>
                    <span className="text-[9px] text-muted-foreground ml-1">P&L</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <RegistrationModal open={registerOpen} onOpenChange={setRegisterOpen}
        onSwitchToLogin={() => { setRegisterOpen(false); setLoginOpen(true); }} />
      <LoginModal open={loginOpen} onOpenChange={setLoginOpen}
        onSwitchToRegister={() => { setLoginOpen(false); setRegisterOpen(true); }} />
    </div>
  );
};

export default TradingPanel;
