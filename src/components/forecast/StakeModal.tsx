import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { getFingerprint } from "@/lib/fingerprint";
import { useToast } from "@/hooks/use-toast";
import { Shield, TrendingUp, HelpCircle, Minus, Plus, Wallet } from "lucide-react";
import type { Poll, PollOption } from "@/hooks/use-polls";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import PhoneCollectionModal from "@/components/auth/PhoneCollectionModal";

interface StakeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  poll: Poll;
  selectedOption: PollOption | null;
}

const StakeModal = ({ open, onOpenChange, poll, selectedOption }: StakeModalProps) => {
  const { toast } = useToast();
  const { user, profile: authProfile } = useAuth();
  const queryClient = useQueryClient();
  const [phoneModalOpen, setPhoneModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<"wallet" | "paystack" | null>(null);

  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [countryCode, setCountryCode] = useState("+254");
  const [shares, setShares] = useState(10);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      if (user && authProfile) {
        setEmail(user.email || "");
        setFullName(authProfile.full_name || "");
        const rawPhone = authProfile.phone || "";
        setPhoneNumber(rawPhone.replace(/^\+\d{1,3}/, ""));
        setCountryCode("+254");
      } else {
        try {
          const raw = localStorage.getItem("forecast_participant");
          if (raw) {
            const p = JSON.parse(raw);
            setEmail(p.email || "");
            setFullName(p.fullName || "");
            setPhoneNumber(p.phone || "");
            setCountryCode(p.countryCode || "+254");
          }
        } catch { /* ignore */ }
      }
    }
  }, [open, user, authProfile]);

  const { data: wallet } = useQuery({
    queryKey: ["wallet-balance", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase.from("wallets").select("balance_usd").eq("user_id", user.id).single();
      return data;
    },
    enabled: !!user,
  });
  const walletBalance = Number(wallet?.balance_usd || 0);

  const totalStake = poll.poll_options.reduce((s, o) => s + (o.total_stake_amount || 0), 0);

  const sharePrice = useMemo(() => {
    if (!selectedOption || totalStake === 0) return 0.50;
    const pct = (selectedOption.total_stake_amount || 0) / totalStake;
    return Math.max(0.05, Math.min(0.95, Math.round(pct * 100) / 100));
  }, [selectedOption, totalStake]);

  const totalCost = parseFloat((shares * sharePrice).toFixed(2));
  const platformFee = parseFloat((totalCost * 0.035).toFixed(2));
  const potentialPayout = shares;
  const potentialProfit = parseFloat((potentialPayout - totalCost).toFixed(2));
  const totalDebit = parseFloat((totalCost + platformFee).toFixed(2));
  const hasEnoughInWallet = walletBalance >= totalDebit;

  const handleWalletPay = async () => {
    if (!selectedOption || shares < 1) return;
    if (!authProfile?.phone) {
      setPendingAction("wallet");
      setPhoneModalOpen(true);
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("buy-shares", {
        body: { poll_id: poll.id, option_id: selectedOption.id, shares },
      });
      if (error || data?.error) throw new Error(data?.error || error?.message);
      toast({ title: "Shares purchased! 🎉", description: `You bought ${shares} shares of "${selectedOption.label}" from your wallet.` });
      queryClient.invalidateQueries({ queryKey: ["wallet-balance", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["positions-card", poll.id] });
      queryClient.invalidateQueries({ queryKey: ["user-stake", poll.id] });
      queryClient.invalidateQueries({ queryKey: ["my-wallet-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["my-positions"] });
      onOpenChange(false);
    } catch (err: any) {
      toast({ title: "Purchase failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleStake = async () => {
    if (!selectedOption || !email || !fullName || !phoneNumber || shares < 1) {
      toast({ title: "Missing info", description: "Please fill in all fields.", variant: "destructive" });
      return;
    }
    if (user && !authProfile?.phone) {
      setPendingAction("paystack");
      setPhoneModalOpen(true);
      return;
    }

    setLoading(true);
    try {
      const fp = await getFingerprint();

      try {
        await supabase
          .from("voter_profiles")
          .insert({
            voter_fingerprint: fp,
            email,
            full_name: fullName,
            phone_number: phoneNumber,
            country_code: countryCode,
          });
      } catch {
        // Already exists — skip
      }

      const callbackUrl = `${window.location.origin}/stake-result`;

      const { data, error } = await supabase.functions.invoke("stake-checkout", {
        body: {
          email,
          amount: totalCost,
          poll_id: poll.id,
          option_id: selectedOption.id,
          voter_fingerprint: fp,
          callback_url: callbackUrl,
          user_id: user?.id || null,
          entry_price: sharePrice,
        },
      });

      if (error || !data?.authorization_url) {
        throw new Error(data?.error || "Failed to initialize payment");
      }

      window.location.href = data.authorization_url;
    } catch (err: any) {
      toast({ title: "Payment Error", description: err.message || "Could not initiate payment.", variant: "destructive" });
      setLoading(false);
    }
  };

  const optionPct = selectedOption && totalStake > 0
    ? Math.round(((selectedOption.total_stake_amount || 0) / totalStake) * 100)
    : 50;

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-lg">Commit Capital — Back Your Forecast</DialogTitle>
          <DialogDescription>
            Each unit resolves at $1 if your forecast is correct. Platform fees: 3.5%.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Poll context */}
          <div className="bg-muted/50 rounded-lg p-3 border border-border">
            <p className="text-sm font-medium text-foreground mb-1">{poll.title}</p>
            <p className="text-xs text-muted-foreground">
              Your position: <span className="font-semibold text-accent">{selectedOption?.label}</span>
              <span className="ml-2">({optionPct}% market price)</span>
            </p>
          </div>

          {/* Consensus price */}
          <div className="flex items-center justify-between bg-primary/5 rounded-lg px-4 py-3 border border-primary/10">
            <div>
              <p className="text-xs text-muted-foreground">Market Price</p>
              <p className="font-mono text-xl font-bold text-foreground">${sharePrice.toFixed(2)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Market Probability</p>
              <p className="font-mono text-xl font-bold text-primary">{Math.round(sharePrice * 100)}%</p>
            </div>
          </div>

          {/* Forecast units */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Forecast Units</Label>
            <div className="flex items-center gap-3">
              <button onClick={() => setShares(Math.max(1, shares - 5))} className="w-10 h-10 rounded-md border border-border bg-card flex items-center justify-center hover:bg-muted transition-colors">
                <Minus className="w-4 h-4" />
              </button>
              <Input type="number" value={shares} onChange={(e) => setShares(Math.max(1, Math.floor(Number(e.target.value))))} className="font-mono text-center text-lg font-semibold flex-1" min={1} />
              <button onClick={() => setShares(shares + 5)} className="w-10 h-10 rounded-md border border-border bg-card flex items-center justify-center hover:bg-muted transition-colors">
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="flex gap-2">
              {[5, 10, 25, 50, 100].map((n) => (
                <button key={n} onClick={() => setShares(n)}
                  className={`flex-1 py-1.5 rounded text-xs font-mono font-medium transition-all border ${shares === n ? "bg-accent text-accent-foreground border-accent" : "bg-card text-foreground border-border hover:border-primary/40"}`}>
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Allocation breakdown */}
          <div className="bg-muted/30 rounded-lg p-3 border border-border space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{shares} units × ${sharePrice.toFixed(2)}</span>
              <span className="font-mono font-semibold text-foreground">${totalCost.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Platform fees (3.5%)</span>
              <span className="font-mono text-muted-foreground">${platformFee.toFixed(2)}</span>
            </div>
            <div className="border-t border-border pt-2 flex justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-primary" />If correct, you receive
              </span>
              <span className="font-mono font-bold text-primary">${potentialPayout.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Potential accuracy reward</span>
              <span className={`font-mono font-bold ${potentialProfit > 0 ? "text-green-600" : "text-red-500"}`}>
                {potentialProfit > 0 ? "+" : ""}${potentialProfit.toFixed(2)}
              </span>
            </div>
          </div>

          {/* User details */}
          <div className="bg-muted/30 rounded-lg p-3 border border-border">
            <p className="text-xs font-semibold text-foreground mb-1">Your Details</p>
            <p className="text-[11px] text-muted-foreground">
              {fullName || "—"} · {email || "—"} · {countryCode}{phoneNumber || "—"}
            </p>
          </div>

          {/* Wallet pay option — logged-in users only */}
          {!!user && (
            <>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-foreground flex items-center gap-1">
                    <Wallet className="w-3.5 h-3.5" /> Pay from wallet
                  </p>
                  <p className="text-xs text-muted-foreground font-mono">
                    Balance: <span className="font-semibold text-foreground">${walletBalance.toFixed(2)}</span>
                  </p>
                </div>
                <Button
                  onClick={handleWalletPay}
                  disabled={!hasEnoughInWallet || loading || shares < 1}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-display font-semibold"
                  size="lg"
                >
                  {loading
                    ? "Processing..."
                    : <>
                        <Wallet className="w-4 h-4 mr-2" />
                        Pay ${totalDebit.toFixed(2)} from Wallet
                      </>
                  }
                </Button>
                {!hasEnoughInWallet && (
                  <p className="text-[10px] text-destructive text-center">
                    Insufficient balance — <Link to="/my-dashboard" className="underline hover:text-destructive/80" onClick={() => onOpenChange(false)}>add funds on your Dashboard</Link>
                  </p>
                )}
              </div>

              {/* Divider */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted-foreground">or</span>
                <div className="flex-1 h-px bg-border" />
              </div>
            </>
          )}

          {/* Paystack CTA button */}
          <Button
            onClick={handleStake}
            disabled={loading || !email || !fullName || !phoneNumber || shares < 1}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-display font-semibold"
            size="lg"
          >
            {loading
              ? "Redirecting to payment..."
              : `Commit $${totalCost.toFixed(2)} — Pay with Mobile Money or Card`}
          </Button>

          {/* Trust + How it works */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Shield className="w-3 h-3" />Secure checkout via Paystack</span>
            <Link to="/how-it-works" className="flex items-center gap-1 text-primary hover:text-accent transition-colors" onClick={() => onOpenChange(false)}>
              <HelpCircle className="w-3 h-3" />How it works
            </Link>
          </div>

          <p className="text-[10px] text-muted-foreground text-center leading-tight">
            By participating, you agree to the{" "}
            <a href="/terms-of-use" target="_blank" className="text-primary underline hover:text-accent">Terms of Use</a>.
            Forecasting involves uncertainty. Only participate with what you are comfortable allocating. Platform fees of 3.5% applies.
          </p>
        </div>
      </DialogContent>
    </Dialog>
    <PhoneCollectionModal
      open={phoneModalOpen}
      onOpenChange={(v) => { setPhoneModalOpen(v); if (!v) setPendingAction(null); }}
      onSuccess={() => {
        if (pendingAction === "wallet") handleWalletPay();
        else if (pendingAction === "paystack") handleStake();
        setPendingAction(null);
      }}
    />
    </>
  );
};

export default StakeModal;