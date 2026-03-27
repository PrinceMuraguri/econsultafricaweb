import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { getFingerprint } from "@/lib/fingerprint";
import { useToast } from "@/hooks/use-toast";
import { Shield, TrendingUp, HelpCircle, Minus, Plus } from "lucide-react";
import type { Poll, PollOption } from "@/hooks/use-polls";
import { Link } from "react-router-dom";

interface StakeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  poll: Poll;
  selectedOption: PollOption | null;
}

const StakeModal = ({ open, onOpenChange, poll, selectedOption }: StakeModalProps) => {
  const { toast } = useToast();

  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [countryCode, setCountryCode] = useState("+254");
  const [shares, setShares] = useState(10);
  const [loading, setLoading] = useState(false);

  // Re-read profile from localStorage every time the modal opens
  useEffect(() => {
    if (open) {
      try {
        const raw = localStorage.getItem("forecast_participant");
        if (raw) {
          const profile = JSON.parse(raw);
          setEmail(profile.email || "");
          setFullName(profile.fullName || "");
          setPhoneNumber(profile.phone || "");
          setCountryCode(profile.countryCode || "+254");
        }
      } catch { /* ignore */ }
    }
  }, [open]);

  const totalVotes = poll.poll_options.reduce((s, o) => s + o.total_votes_count, 0);

  const sharePrice = useMemo(() => {
    if (!selectedOption || totalVotes === 0) return 0.50;
    const pct = selectedOption.total_votes_count / totalVotes;
    return Math.max(0.05, Math.min(0.95, Math.round(pct * 100) / 100));
  }, [selectedOption, totalVotes]);

  const totalCost = parseFloat((shares * sharePrice).toFixed(2));
  const platformFee = parseFloat((totalCost * 0.035).toFixed(2));
  const potentialPayout = shares;
  const potentialProfit = parseFloat((potentialPayout - totalCost).toFixed(2));

  const handleStake = async () => {
    if (!selectedOption || !email || !fullName || !phoneNumber || shares < 1) {
      toast({ title: "Missing info", description: "Please fill in all fields.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const fp = await getFingerprint();

      await supabase
        .from("voter_profiles")
        .upsert({
          voter_fingerprint: fp,
          email,
          full_name: fullName,
          phone_number: phoneNumber,
          country_code: countryCode,
          updated_at: new Date().toISOString(),
        }, { onConflict: "voter_fingerprint" });

      const callbackUrl = `${window.location.origin}/forecast-arena/stake-result?reference={reference}`;

      const { data, error } = await supabase.functions.invoke("stake-checkout", {
        body: {
          email,
          amount: totalCost,
          poll_id: poll.id,
          option_id: selectedOption.id,
          voter_fingerprint: fp,
          callback_url: callbackUrl,
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

  const optionPct = selectedOption && totalVotes > 0
    ? Math.round((selectedOption.total_votes_count / totalVotes) * 100)
    : 50;

  return (
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
              <span className="ml-2">({optionPct}% consensus)</span>
            </p>
          </div>

          {/* Consensus price */}
          <div className="flex items-center justify-between bg-primary/5 rounded-lg px-4 py-3 border border-primary/10">
            <div>
              <p className="text-xs text-muted-foreground">Consensus Price</p>
              <p className="font-mono text-xl font-bold text-foreground">${sharePrice.toFixed(2)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Consensus Probability</p>
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

          {/* Single CTA button */}
          <Button
            onClick={handleStake}
            disabled={loading || !email || !fullName || !phoneNumber || shares < 1}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-display font-semibold"
            size="lg"
          >
            {loading
              ? "Redirecting to payment..."
              : `Commit $${totalCost.toFixed(2)} — Pay via M-PESA or Card`}
          </Button>

          {/* Trust + How it works */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Shield className="w-3 h-3" />Secure checkout via Paystack</span>
            <Link to="/forecast-arena/how-it-works" className="flex items-center gap-1 text-primary hover:text-accent transition-colors" onClick={() => onOpenChange(false)}>
              <HelpCircle className="w-3 h-3" />How it works
            </Link>
          </div>

          <p className="text-[10px] text-muted-foreground text-center leading-tight">
            By participating, you agree to the{" "}
            <a href="/documents/terms-of-use.pdf" target="_blank" rel="noopener noreferrer" className="text-primary underline hover:text-accent">Terms of Use</a>.
            Forecasting involves uncertainty. Only participate with what you are comfortable allocating. Platform fees of 3.5% applies.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StakeModal;
