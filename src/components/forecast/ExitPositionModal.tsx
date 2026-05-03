import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle, CheckCircle, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import CurrencyAmount from "@/components/CurrencyAmount";
import { formatCurrency } from "@/lib/currency";

interface ExitPositionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  poll: { id: string; title: string };
  optionId: string;
  optionLabel: string;
  shares: number;
  stakeAmount: number;        // original committed capital — refund basis
  currentPrice: number;       // consensus price (display only)
  potentialPayoutIfCorrect: number;
}

const PLATFORM_FEE = 0.035;

export default function ExitPositionModal({
  open,
  onOpenChange,
  poll,
  optionId,
  optionLabel,
  shares,
  stakeAmount,
  currentPrice,
  potentialPayoutIfCorrect,
}: ExitPositionModalProps) {
  const [step, setStep] = useState<"confirm" | "success">("confirm");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { proMode } = useAuth();

  // Early exit returns original stake minus fee — never more than committed
  // Price appreciation is only realised at resolution, funded by losing stakers
  const gross = parseFloat(stakeAmount.toFixed(2));
  const fee = parseFloat((gross * PLATFORM_FEE).toFixed(2));
  const net = parseFloat((gross - fee).toFixed(2));

  const handleExit = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("sell-shares", {
        body: { poll_id: poll.id, option_id: optionId, shares },
      });
      if (error || data?.error) throw new Error(data?.error || error?.message || "Exit failed");

      // Invalidate all relevant queries so balances and positions refresh
      queryClient.invalidateQueries({ queryKey: ["user-stake", poll.id] });
      queryClient.invalidateQueries({ queryKey: ["user-positions", poll.id] });
      queryClient.invalidateQueries({ queryKey: ["my-positions"] });
      queryClient.invalidateQueries({ queryKey: ["my-share-positions"] });
      queryClient.invalidateQueries({ queryKey: ["my-wallet-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["wallet-balance"] });

      setStep("success");
    } catch (err: any) {
      toast({ title: "Exit failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep("confirm");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-sm">
        {step === "confirm" ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Exit your position early
              </DialogTitle>
              <DialogDescription>
                You receive your committed capital back, minus the 3.5% platform fee. Any upside is only realised at resolution.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 pt-1">
              {/* Position summary */}
              <div className="bg-muted/40 border border-border rounded-lg p-3 space-y-1.5">
                <p className="text-xs font-semibold text-foreground">{poll.title}</p>
                <p className="text-[10px] text-muted-foreground">
                  Your forecast: <span className="font-semibold text-foreground">{optionLabel}</span>
                </p>
                <p className="text-[10px] text-muted-foreground">
                  Shares held: <span className="font-mono font-semibold text-foreground">{shares.toFixed(4)}</span>
                </p>
              </div>

              {/* Payout breakdown */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px]">
                  <span className="text-muted-foreground">Your committed capital</span>
                  <CurrencyAmount amount={gross} mode={proMode} className="text-foreground" />
                </div>
                <div className="flex justify-between text-[10px]">
                  <span className="text-muted-foreground">Early exit fee (3.5%)</span>
                  <span>−<CurrencyAmount amount={fee} mode={proMode} className="text-red-500" /></span>
                </div>
                <div className="flex justify-between text-xs font-bold border-t border-border pt-1 mt-1">
                  <span className="text-foreground">You receive</span>
                  <CurrencyAmount amount={net} mode={proMode} className="text-green-600" />
                </div>
              </div>

              {/* Opportunity cost nudge */}
              <div className="bg-amber-500/5 border border-amber-500/20 rounded-md p-2.5">
                <p className="text-[10px] text-amber-700 leading-relaxed">
                  If your forecast is correct at resolution, you would receive{" "}
                  <span className="font-bold">{formatCurrency(potentialPayoutIfCorrect, proMode)}</span> instead of{" "}
                  <span className="font-bold">{formatCurrency(net, proMode)}</span>. Exiting early is final.
                </p>
              </div>

              <Button
                className="w-full bg-red-500 hover:bg-red-600 text-white font-bold text-xs"
                disabled={loading}
                onClick={handleExit}
              >
                {loading ? (
                  <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Processing…</>
                ) : (
                  `Confirm exit — receive ${formatCurrency(net, proMode)}`
                )}
              </Button>
              <Button variant="outline" className="w-full text-xs" onClick={handleClose} disabled={loading}>
                Keep my position
              </Button>
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                Position exited
              </DialogTitle>
              <DialogDescription>
                Your position has been closed and your wallet credited.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 pt-1">
              <div className="bg-green-500/5 border border-green-500/20 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold"><CurrencyAmount amount={net} mode={proMode} className="text-green-600" /></p>
                <p className="text-[10px] text-muted-foreground mt-1">credited to your wallet</p>
              </div>
              <Button className="w-full text-xs" onClick={handleClose}>Done</Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
