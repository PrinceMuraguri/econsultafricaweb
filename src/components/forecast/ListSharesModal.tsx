import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Tag, CheckCircle, Loader2, AlertTriangle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import CurrencyAmount from "@/components/CurrencyAmount";
import { formatCurrency, currencyLabel } from "@/lib/currency";

interface ListSharesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  poll: { id: string; title: string };
  optionId: string;
  optionLabel: string;
  availableShares: number;
  suggestedPrice: number; // current consensus price
}

const MIN_PRICE = 0.01;
const MAX_PRICE = 0.99;

export default function ListSharesModal({
  open,
  onOpenChange,
  poll,
  optionId,
  optionLabel,
  availableShares,
  suggestedPrice,
}: ListSharesModalProps) {
  const [step, setStep] = useState<"form" | "success">("form");
  const [shares, setShares] = useState(availableShares.toFixed(4));
  const [pricePerShare, setPricePerShare] = useState(suggestedPrice.toFixed(2));
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { proMode } = useAuth();

  const sharesNum = parseFloat(shares) || 0;
  const priceNum = parseFloat(pricePerShare) || 0;
  const totalAsk = sharesNum * priceNum;
  const isAboveConsensus = priceNum > suggestedPrice * 1.05;
  const isBelowConsensus = priceNum < suggestedPrice * 0.95;
  const isValid = sharesNum > 0 && sharesNum <= availableShares && priceNum >= MIN_PRICE && priceNum <= MAX_PRICE;

  const handleSubmit = async () => {
    if (!isValid) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-listing", {
        body: { poll_id: poll.id, option_id: optionId, shares: sharesNum, price_per_share: priceNum },
      });
      if (error || data?.error) throw new Error(data?.error || error?.message);

      queryClient.invalidateQueries({ queryKey: ["listings", poll.id] });
      queryClient.invalidateQueries({ queryKey: ["positions-card", poll.id] });
      queryClient.invalidateQueries({ queryKey: ["user-stake", poll.id] });
      queryClient.invalidateQueries({ queryKey: ["user-listings", poll.id] });
      setStep("success");
    } catch (err: any) {
      toast({ title: "Failed to list shares", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep("form");
    setShares(availableShares.toFixed(4));
    setPricePerShare(suggestedPrice.toFixed(2));
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-sm">
        {step === "form" ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-primary" />
                List shares for sale
              </DialogTitle>
              <DialogDescription>
                Set your price and list your shares. Any platform user can buy them from you directly.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 pt-1">
              {/* Position context */}
              <div className="bg-muted/40 border border-border rounded-lg p-3 space-y-1">
                <p className="text-xs font-semibold text-foreground">{poll.title}</p>
                <p className="text-[10px] text-muted-foreground">
                  Your forecast: <span className="font-semibold text-foreground">{optionLabel}</span>
                </p>
                <p className="text-[10px] text-muted-foreground">
                  Available shares: <span className="font-mono font-semibold text-foreground">{availableShares.toFixed(4)}</span>
                </p>
                <p className="text-[10px] text-muted-foreground">
                  Crowd consensus price: <CurrencyAmount amount={suggestedPrice} mode={proMode} className="text-foreground" />
                </p>
              </div>

              {/* Shares input */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-foreground">Shares to list</label>
                <Input
                  type="number"
                  value={shares}
                  onChange={(e) => setShares(e.target.value)}
                  min={0.0001}
                  max={availableShares}
                  step={0.0001}
                  className="text-sm font-mono"
                />
                <button
                  onClick={() => setShares(availableShares.toFixed(4))}
                  className="text-[10px] text-primary hover:text-accent transition-colors"
                >
                  List all shares
                </button>
              </div>

              {/* Price per share input */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-foreground">Your asking price (per share)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">{currencyLabel(proMode)}</span>
                  <Input
                    type="number"
                    value={pricePerShare}
                    onChange={(e) => setPricePerShare(e.target.value)}
                    min={MIN_PRICE}
                    max={MAX_PRICE}
                    step={0.01}
                    className="pl-6 text-sm font-mono"
                  />
                </div>
                <div className="flex gap-2">
                  {[0.25, 0.50, 0.75, suggestedPrice].map((p) => (
                    <button
                      key={p}
                      onClick={() => setPricePerShare(p.toFixed(2))}
                      className={`text-[9px] px-1.5 py-0.5 rounded border transition-colors ${
                        Math.abs(priceNum - p) < 0.005
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-border text-muted-foreground hover:border-primary"
                      }`}
                    >
                      {p === suggestedPrice ? "Consensus" : `$${p.toFixed(2)}`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price signal */}
              {isAboveConsensus && (
                <div className="flex items-start gap-1.5 bg-amber-500/5 border border-amber-500/20 rounded-md p-2">
                  <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-amber-700">
                    Your price is above the crowd consensus. Buyers may prefer the Paystack route at a lower price.
                  </p>
                </div>
              )}
              {isBelowConsensus && (
                <div className="flex items-start gap-1.5 bg-green-500/5 border border-green-500/20 rounded-md p-2">
                  <p className="text-[10px] text-green-700">
                    Below consensus price — likely to sell quickly.
                  </p>
                </div>
              )}

              {/* Summary */}
              {isValid && (
                <div className="bg-muted/30 border border-border rounded-lg p-2.5 space-y-1">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-muted-foreground">{sharesNum.toFixed(4)} shares × ${priceNum.toFixed(2)}</span>
                    <span className="font-mono text-foreground">${totalAsk.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-[10px]">
                    <span className="text-muted-foreground">Platform fee (3.5%)</span>
                    <span className="font-mono text-red-500">−${(totalAsk * 0.035).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs font-bold border-t border-border pt-1">
                    <span>You receive if sold</span>
                    <span className="font-mono text-green-600">${(totalAsk * 0.965).toFixed(2)}</span>
                  </div>
                </div>
              )}

              <p className="text-[9px] text-muted-foreground">
                Shares are held in escrow while listed. You can cancel anytime before someone buys.
              </p>

              <Button
                className="w-full text-xs font-bold"
                disabled={!isValid || loading}
                onClick={handleSubmit}
              >
                {loading ? (
                  <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />Listing…</>
                ) : (
                  `List ${sharesNum.toFixed(4)} shares at $${priceNum.toFixed(2)}/share`
                )}
              </Button>
              <Button variant="outline" className="w-full text-xs" onClick={handleClose} disabled={loading}>
                Cancel
              </Button>
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                Listing live
              </DialogTitle>
              <DialogDescription>
                Your shares are now visible to all users on this poll.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 pt-1">
              <div className="bg-green-500/5 border border-green-500/20 rounded-lg p-3 text-center space-y-1">
                <p className="text-sm font-bold text-foreground">{sharesNum.toFixed(4)} shares listed</p>
                <p className="text-[10px] text-muted-foreground">at ${priceNum.toFixed(2)}/share = ${totalAsk.toFixed(2)} total ask</p>
                <p className="text-[10px] text-muted-foreground">You receive <span className="font-semibold text-green-600">${(totalAsk * 0.965).toFixed(2)}</span> when sold</p>
              </div>
              <p className="text-[10px] text-muted-foreground text-center">
                You can cancel this listing anytime from the poll page.
              </p>
              <Button className="w-full text-xs" onClick={handleClose}>Done</Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
