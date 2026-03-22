import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { supabase } from "@/integrations/supabase/client";
import { getFingerprint } from "@/lib/fingerprint";
import { useToast } from "@/hooks/use-toast";
import { DollarSign, Shield, Zap, TrendingUp } from "lucide-react";
import type { Poll, PollOption } from "@/hooks/use-polls";

interface StakeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  poll: Poll;
  selectedOption: PollOption | null;
}

const PRESET_AMOUNTS = [5, 10, 25, 50, 100];

const StakeModal = ({ open, onOpenChange, poll, selectedOption }: StakeModalProps) => {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [amount, setAmount] = useState(10);
  const [loading, setLoading] = useState(false);

  const handleStake = async () => {
    if (!selectedOption || !email || amount < 1) {
      toast({ title: "Missing info", description: "Please enter your email and stake amount.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const fp = await getFingerprint();
      const callbackUrl = `${window.location.origin}/forecast-arena/stake-result?reference={reference}`;

      const { data, error } = await supabase.functions.invoke("stake-checkout", {
        body: {
          email,
          amount,
          poll_id: poll.id,
          option_id: selectedOption.id,
          voter_fingerprint: fp,
          callback_url: callbackUrl,
        },
      });

      if (error || !data?.authorization_url) {
        throw new Error(data?.error || "Failed to initialize payment");
      }

      // Redirect to Paystack
      window.location.href = data.authorization_url;
    } catch (err: any) {
      toast({ title: "Payment Error", description: err.message || "Could not initiate payment.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const totalVotes = poll.poll_options.reduce((s, o) => s + o.total_votes_count, 0);
  const optionPct = selectedOption && totalVotes > 0
    ? Math.round((selectedOption.total_votes_count / totalVotes) * 100)
    : 50;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-lg">Back Your Prediction</DialogTitle>
          <DialogDescription>
            Stake on your forecast. If you're right, you share the pool.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          {/* Poll context */}
          <div className="bg-muted/50 rounded-lg p-4 border border-border">
            <p className="text-sm font-medium text-foreground mb-1">{poll.title}</p>
            <p className="text-xs text-muted-foreground">
              Your position: <span className="font-semibold text-accent">{selectedOption?.label}</span>
              <span className="ml-2 text-muted-foreground">({optionPct}% consensus)</span>
            </p>
          </div>

          {/* Amount selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Stake Amount (USD)</Label>
            <div className="flex gap-2 flex-wrap">
              {PRESET_AMOUNTS.map((preset) => (
                <button
                  key={preset}
                  onClick={() => setAmount(preset)}
                  className={`px-3 py-1.5 rounded-md text-sm font-mono font-medium transition-all border ${
                    amount === preset
                      ? "bg-accent text-accent-foreground border-accent"
                      : "bg-card text-foreground border-border hover:border-primary/40"
                  }`}
                >
                  ${preset}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <Slider
                value={[amount]}
                onValueChange={(v) => setAmount(v[0])}
                min={1}
                max={500}
                step={1}
                className="flex-1"
              />
              <div className="relative w-24">
                <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(Math.max(1, Number(e.target.value)))}
                  className="pl-7 font-mono text-sm"
                  min={1}
                />
              </div>
            </div>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Email (for payment receipt)</Label>
            <Input
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {/* Potential return */}
          <div className="bg-primary/5 rounded-lg p-3 border border-primary/10">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-primary" />
              <span className="text-xs font-semibold text-foreground">Potential Return</span>
            </div>
            <p className="text-xs text-muted-foreground">
              If your prediction is correct, your share of the pool is proportional to your stake. 
              Higher stakes = larger share of winnings.
            </p>
          </div>

          {/* CTA */}
          <Button
            onClick={handleStake}
            disabled={loading || !email || amount < 1}
            className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-display font-semibold"
            size="lg"
          >
            {loading ? "Processing..." : `Back Your Prediction — $${amount}`}
          </Button>

          {/* Trust signals */}
          <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Shield className="w-3 h-3" />
              Secure via Paystack
            </span>
            <span className="flex items-center gap-1">
              <Zap className="w-3 h-3" />
              Instant confirmation
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StakeModal;
