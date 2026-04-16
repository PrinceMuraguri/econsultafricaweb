import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { Minus, Plus, Wallet, TrendingUp, Loader2, Shield, AlertTriangle, HelpCircle, Info, Clock } from "lucide-react";
import type { Poll, PollOption } from "@/hooks/use-polls";
import RegistrationModal from "@/components/auth/RegistrationModal";
import LoginModal from "@/components/auth/LoginModal";
import PhoneCollectionModal from "@/components/auth/PhoneCollectionModal";


interface TradingPanelProps {
  poll: Poll;
  votedOptionId?: string | null;
  hasVoted?: boolean;
}

const TradingPanel = ({ poll, votedOptionId, hasVoted }: TradingPanelProps) => {
  const { user, wallet, refreshWallet, profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<"commit" | "adjust">("commit");
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [shares, setShares] = useState(10);
  const [loading, setLoading] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [phoneModalOpen, setPhoneModalOpen] = useState(false);
  const [pendingCommit, setPendingCommit] = useState(false);
  
  const [partialSellOpen, setPartialSellOpen] = useState(false);
  const [sellShares, setSellShares] = useState(1);

  const totalStake = poll.poll_options.reduce((s, o) => s + (o.total_stake_amount || 0), 0);
  const isClosed = poll.status !== "active" || new Date(poll.close_at) < new Date();

  // Set voted option as default
  useEffect(() => {
    if (votedOptionId) {
      setSelectedOptionId(votedOptionId);
    } else if (!selectedOptionId && poll.poll_options.length > 0) {
      const yesOpt = poll.poll_options.find(o => o.label.toLowerCase() === "yes");
      setSelectedOptionId(yesOpt?.id || poll.poll_options[0].id);
    }
  }, [poll.poll_options, selectedOptionId, votedOptionId]);

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
    if (!selectedOption || totalStake === 0) return 0.50;
    return Math.max(0.05, Math.min(0.95, (selectedOption.total_stake_amount || 0) / totalStake));
  }, [selectedOption, totalStake]);

  const currentPosition = positions.find(p => p.option_id === selectedOptionId);
  const hasShares = positions.length > 0 && positions.some(p => Number(p.shares) > 0);
  const maxSellShares = currentPosition ? Number(currentPosition.shares) : 0;

  const fee = 0.035;
  const totalCost = parseFloat((shares * currentPrice).toFixed(2));
  const feeAmount = parseFloat((totalCost * fee).toFixed(2));
  const totalDebit = parseFloat((totalCost + feeAmount).toFixed(2));
  const potentialPayout = shares;
  const potentialReturn = parseFloat((potentialPayout - totalDebit).toFixed(2));

  // Sell calculations — use proportional cost basis to match backend (sell-shares returns cost basis, not market value)
  const fullSellGross = currentPosition ? parseFloat(Number(currentPosition.total_cost).toFixed(2)) : 0;
  const fullSellFee = parseFloat((fullSellGross * fee).toFixed(2));
  const fullSellNet = parseFloat((fullSellGross - fullSellFee).toFixed(2));

  // Partial sell — proportional cost basis
  const partialSellFraction = currentPosition && Number(currentPosition.shares) > 0
    ? sellShares / Number(currentPosition.shares)
    : 0;
  const partialSellGross = currentPosition
    ? parseFloat((Number(currentPosition.total_cost) * partialSellFraction).toFixed(2))
    : 0;
  const partialSellFee = parseFloat((partialSellGross * fee).toFixed(2));
  const partialSellNet = parseFloat((partialSellGross - partialSellFee).toFixed(2));

  const doCommit = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("buy-shares", {
        body: { poll_id: poll.id, option_id: selectedOptionId, shares },
      });
      if (error || !data?.success) throw new Error(data?.error || "Could not commit capital");

      toast({
        title: "🎯 Capital committed!",
        description: `${shares} shares at $${currentPrice.toFixed(2)} per share. If your forecast is correct, you receive $${shares.toFixed(2)}.`,
      });

      refreshWallet();
      queryClient.invalidateQueries({ queryKey: ["positions", poll.id] });
      queryClient.invalidateQueries({ queryKey: ["poll", poll.slug] });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally { setLoading(false); }
  };

  const handleCommit = async () => {
    if (!user) { setRegisterOpen(true); return; }
    if (isClosed) return;

    // Check if phone is missing — needed for M-Pesa payouts
    if (!profile?.phone) {
      setPendingCommit(true);
      setPhoneModalOpen(true);
      return;
    }

    await doCommit();
  };

  const handleExit = async (exitShares: number) => {
    if (!user || isClosed) return;
    if (exitShares > maxSellShares) {
      toast({ title: "Insufficient shares", description: `You only have ${maxSellShares} shares.`, variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("sell-shares", {
        body: { poll_id: poll.id, option_id: selectedOptionId, shares: exitShares },
      });
      if (error || !data?.success) throw new Error(data?.error || "Could not exit position");

      toast({
        title: "✅ Position adjusted",
        description: `Released ${exitShares} shares — $${data.net_proceeds?.toFixed(2)} credited to your wallet.`,
      });

      refreshWallet();
      setPartialSellOpen(false);
      queryClient.invalidateQueries({ queryKey: ["positions", poll.id] });
      queryClient.invalidateQueries({ queryKey: ["poll", poll.slug] });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally { setLoading(false); }
  };

  const votedOption = poll.poll_options.find(o => o.id === votedOptionId);

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      {/* Tabs: Commit capital | Adjust position */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setTab("commit")}
          className={`flex-1 py-2.5 text-sm font-bold text-center transition-colors ${
            tab === "commit" ? "bg-primary text-primary-foreground" : "bg-muted/50 text-muted-foreground hover:text-foreground"
          }`}
        >
          Commit capital
        </button>
        {hasShares && (
          <button
            onClick={() => setTab("adjust")}
            className={`flex-1 py-2.5 text-sm font-bold text-center transition-colors ${
              tab === "adjust" ? "bg-muted text-foreground" : "bg-muted/50 text-muted-foreground hover:text-foreground"
            }`}
          >
            Adjust position
          </button>
        )}
      </div>

      <div className="p-4 space-y-3">
        {tab === "commit" ? (
          <>
            {/* Commit capital view */}
            <div>
              <p className="text-xs font-semibold text-foreground mb-1">
                Commit capital: {votedOption?.label || selectedOption?.label}
              </p>
              {votedOption && (
                <p className="text-[10px] text-muted-foreground leading-relaxed mb-2">
                  You're backing the view that this outcome will occur.
                </p>
              )}
              <div className="text-[10px] text-muted-foreground space-y-0.5 mb-3">
                <p>Current market price: {poll.poll_options.map(o => {
                  const pct = totalStake > 0 ? Math.round(((o.total_stake_amount || 0) / totalStake) * 100) : 50;
                  return `${pct}% ${o.label}`;
                }).join(" / ")}</p>
                <p>Market price: <span className="font-mono font-semibold text-foreground">${currentPrice.toFixed(2)}</span></p>
              </div>
            </div>

            {/* Outcome selector (if multiple options) */}
            {poll.poll_options.length > 2 && (
              <div className="flex gap-2 mb-2">
                {poll.poll_options.map((opt) => {
                  const price = totalStake > 0 ? Math.max(0.05, Math.min(0.95, (opt.total_stake_amount || 0) / totalStake)) : 0.50;
                  const isSelected = opt.id === selectedOptionId;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => setSelectedOptionId(opt.id)}
                      className={`flex-1 py-2 px-3 rounded-md text-sm font-bold transition-all border ${
                        isSelected ? "bg-primary text-primary-foreground border-primary" : "bg-muted/30 text-foreground border-border hover:border-muted-foreground/40"
                      }`}
                    >
                      {opt.label} ${price.toFixed(2)}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Share amount */}
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1.5">How many shares?</p>
              <div className="flex items-center gap-2">
                <button onClick={() => setShares(Math.max(1, shares - 1))} className="w-8 h-8 rounded border border-border bg-muted/30 flex items-center justify-center hover:bg-muted transition-colors">
                  <Minus className="w-3 h-3" />
                </button>
                <input
                  type="number"
                  value={shares}
                  onChange={(e) => setShares(Math.max(1, Math.floor(Number(e.target.value))))}
                  className="font-mono text-center text-lg font-bold flex-1 h-8 rounded border border-border bg-background px-2"
                  min={1}
                />
                <button onClick={() => setShares(shares + 1)} className="w-8 h-8 rounded border border-border bg-muted/30 flex items-center justify-center hover:bg-muted transition-colors">
                  <Plus className="w-3 h-3" />
                </button>
              </div>
              <div className="flex gap-1.5 mt-2">
                {[1, 5, 10, 25, 50, 100].map((n) => (
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
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">{shares} shares × ${currentPrice.toFixed(2)}</span>
                <span className="font-mono font-semibold">${totalCost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span className="text-muted-foreground">Platform fee (3.5%)</span>
                <span className="font-mono text-muted-foreground">${feeAmount.toFixed(2)}</span>
              </div>
              <div className="border-t border-border pt-1.5 flex justify-between text-xs">
                <span className="text-muted-foreground font-medium">Total commitment</span>
                <span className="font-mono font-bold">${totalDebit.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs mt-1">
                <span className="text-muted-foreground flex items-center gap-1">
                  <TrendingUp className="w-3 h-3 text-green-600" /> If your forecast is correct
                </span>
                <span className="font-mono font-bold text-green-600">${potentialPayout.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span className="text-muted-foreground">Your return</span>
                <span className={`font-mono font-bold ${potentialReturn > 0 ? "text-green-600" : "text-red-500"}`}>
                  {potentialReturn > 0 ? "+" : ""}${potentialReturn.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Wallet balance */}
            {user && (
              <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1"><Wallet className="w-3 h-3" /> Funds from your wallet</span>
                <span className="font-mono font-semibold">Balance: ${(wallet?.balance_usd || 0).toFixed(2)}</span>
              </div>
            )}

            {/* Insufficient balance warning */}
            {user && wallet && wallet.balance_usd < totalDebit && (
              <div className="flex items-center gap-1.5 text-[10px] text-amber-600 bg-amber-50 dark:bg-amber-500/10 rounded p-2 border border-amber-200 dark:border-amber-500/20">
                <AlertTriangle className="w-3 h-3 shrink-0" />
                <span>Insufficient balance. Top up your wallet to commit capital.</span>
              </div>
            )}

            {/* Commit button */}
            <Button
              onClick={handleCommit}
              disabled={loading || isClosed || (!!user && !!wallet && wallet.balance_usd < totalDebit)}
              className="w-full font-bold text-sm"
              size="lg"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Processing...</>
              ) : !user ? (
                "Sign in to participate"
              ) : isClosed ? (
                "Question closed"
              ) : (
                `Commit $${totalDebit.toFixed(2)} to my forecast`
              )}
            </Button>

            {/* Always-visible explainer */}
            <div className="bg-muted/20 border border-border rounded-lg p-3 space-y-1">
              <p className="text-[10px] font-semibold text-foreground flex items-center gap-1">
                <Info className="w-3 h-3 text-primary" /> How does this work?
              </p>
              <p className="text-[9px] text-muted-foreground leading-relaxed">
                When you commit capital, you receive shares at the current consensus price. If the outcome matches your forecast, each share pays $1.00. If not, shares expire worthless. You can exit your position anytime before the question resolves by releasing your shares to another user.
              </p>
            </div>

            <div className="flex items-center justify-center text-[9px] text-muted-foreground gap-1">
              <Shield className="w-3 h-3" /> Wallet-based settlement · 3.5% platform fee · This is optional
            </div>
          </>
        ) : (
          /* Adjust position tab */
          <>
            {positions.filter(p => Number(p.shares) > 0).map((pos: any) => {
              const opt = poll.poll_options.find(o => o.id === pos.option_id);
              const mktPrice = totalStake > 0 && opt
                ? Math.max(0.05, Math.min(0.95, (opt.total_stake_amount || 0) / totalStake))
                : 0.50;
              // Exit refund is based on cost basis (what user committed), not market value
              const exitGross = parseFloat(Number(pos.total_cost).toFixed(2));
              const exitFee = parseFloat((exitGross * fee).toFixed(2));
              const exitNet = parseFloat((exitGross - exitFee).toFixed(2));

              return (
                <div key={pos.id} className="space-y-3">
                  <div>
                    <p className="text-xs font-semibold text-foreground mb-1">Adjust your position</p>
                    <p className="text-[10px] text-muted-foreground">
                      You hold <span className="font-semibold text-foreground">{Number(pos.shares)} shares</span> in "{opt?.label}" on this question.
                    </p>
                  </div>

                  <div className="bg-muted/30 rounded-lg p-3 space-y-1 border border-border text-[10px] text-muted-foreground">
                    <div className="flex justify-between">
                      <span>Current share value</span>
                      <span className="font-mono font-semibold text-foreground">${mktPrice.toFixed(2)} each</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Market value</span>
                      <span className="font-mono font-semibold text-foreground">${(Number(pos.shares) * mktPrice).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>You originally committed</span>
                      <span className="font-mono font-semibold text-foreground">${Number(pos.total_cost).toFixed(2)}</span>
                    </div>
                  </div>

                  <p className="text-xs font-medium text-foreground">What would you like to do?</p>

                  {/* Exit entire position */}
                  <Button
                    variant="outline"
                    onClick={() => handleExit(Number(pos.shares))}
                    disabled={loading || isClosed}
                    className="w-full text-xs font-semibold"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Exit entire position — receive ${exitNet.toFixed(2)}
                  </Button>

                  {/* Release some shares */}
                  {Number(pos.shares) > 1 && (
                    <>
                      <Button
                        variant="ghost"
                        onClick={() => { setPartialSellOpen(!partialSellOpen); setSellShares(1); }}
                        className="w-full text-xs text-muted-foreground"
                      >
                        Release some shares ▾
                      </Button>
                      <AnimatePresence>
                        {partialSellOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden space-y-2"
                          >
                            <div className="flex items-center gap-2">
                              <button onClick={() => setSellShares(Math.max(1, sellShares - 1))} className="w-7 h-7 rounded border border-border bg-muted/30 flex items-center justify-center">
                                <Minus className="w-3 h-3" />
                              </button>
                              <input
                                type="number"
                                value={sellShares}
                                onChange={(e) => setSellShares(Math.max(1, Math.min(Number(pos.shares), Math.floor(Number(e.target.value)))))}
                                className="font-mono text-center text-sm font-bold flex-1 h-7 rounded border border-border bg-background px-2"
                                min={1}
                                max={Number(pos.shares)}
                              />
                              <button onClick={() => setSellShares(Math.min(Number(pos.shares), sellShares + 1))} className="w-7 h-7 rounded border border-border bg-muted/30 flex items-center justify-center">
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                            <Button
                              variant="outline"
                              onClick={() => handleExit(sellShares)}
                              disabled={loading || isClosed}
                              className="w-full text-xs"
                            >
                              Release {sellShares} shares — receive ${partialSellNet.toFixed(2)}
                            </Button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </>
                  )}

                  {/* Explainer */}
                  <div className="bg-muted/20 border border-border rounded-lg p-3 space-y-1.5">
                    <p className="text-[9px] text-muted-foreground leading-relaxed">
                      ℹ️ When you exit, your shares are released to another user at the current consensus price. The proceeds go to your wallet, which you can withdraw anytime.
                    </p>
                    <p className="text-[9px] text-foreground font-medium flex items-center gap-1">
                      <Clock className="w-3 h-3 text-primary" />
                      Or, hold your position until the question resolves. If your forecast is correct, each share pays $1.00.
                    </p>
                  </div>
                </div>
              );
            })}

            {positions.filter(p => Number(p.shares) > 0).length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-4">No shares to adjust.</p>
            )}
          </>
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
