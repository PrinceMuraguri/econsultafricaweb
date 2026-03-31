import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Wallet, ArrowRight, X } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

const WALLET_PROMPT_KEY = "wallet_topup_prompted";

const WalletTopUpPrompt = () => {
  const { user, wallet, profile } = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const displayName = profile?.full_name?.split(" ")[0] || user?.user_metadata?.full_name?.split(" ")[0] || "there";

  useEffect(() => {
    if (!user) return;
    
    const alreadyPrompted = sessionStorage.getItem(WALLET_PROMPT_KEY);
    if (alreadyPrompted) return;

    // Wait 45 seconds after login for smooth UX
    const timer = setTimeout(() => {
      if (wallet === null || (wallet && wallet.balance_usd === 0)) {
        setOpen(true);
        sessionStorage.setItem(WALLET_PROMPT_KEY, "true");
      }
    }, 45000);

    return () => clearTimeout(timer);
  }, [user, wallet]);

  const handleTopUp = () => {
    setOpen(false);
    navigate("/my-dashboard");
  };

  const handleSkip = () => {
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <Wallet className="w-5 h-5 text-primary" />
            Welcome back, {displayName}!
          </DialogTitle>
          <DialogDescription>
            Fund your wallet to back your forecasts with capital commitment and earn rewards when you're right.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="bg-muted/50 rounded-lg p-4 text-center space-y-2">
            <p className="text-2xl font-bold text-foreground">$0.00</p>
            <p className="text-xs text-muted-foreground">Current wallet balance</p>
          </div>

          <div className="space-y-2 text-xs text-muted-foreground">
            <div className="flex items-start gap-2">
              <span className="text-primary font-bold">1.</span>
              <span>Top up your wallet with as little as $1</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-primary font-bold">2.</span>
              <span>Commit capital to your forecast positions</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-primary font-bold">3.</span>
              <span>Earn rewards when your predictions are correct</span>
            </div>
          </div>

          <Button onClick={handleTopUp} className="w-full" size="lg">
            <Wallet className="w-4 h-4 mr-2" />
            Top Up Wallet
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>

          <button
            onClick={handleSkip}
            className="w-full text-xs text-muted-foreground hover:text-foreground text-center py-1 transition-colors"
          >
            I'll explore first — maybe later
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WalletTopUpPrompt;
