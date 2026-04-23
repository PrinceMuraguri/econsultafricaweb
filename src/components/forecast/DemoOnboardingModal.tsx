import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Coins, Lock, AlertTriangle } from "lucide-react";

const PRO_PATHS = ["/forecast-arena-pro", "/stake-result", "/my-dashboard"];

/**
 * Blocking, one-time onboarding dialog for Pro demo mode.
 * Mounted ONCE inside `<AuthProvider>` (in App.tsx) so it can fire on
 * any Pro surface without per-page duplication.
 *
 * Shown when:
 *   - proMode === "demo"
 *   - user is logged in
 *   - profile.has_acknowledged_demo === false
 *   - the current route is a Pro surface
 *
 * On confirm: writes user_profiles.has_acknowledged_demo = true and refreshes.
 * Cannot be dismissed without ticking the acknowledgement checkbox.
 */
const DemoOnboardingModal = () => {
  const { user, profile, proMode, refreshProfile } = useAuth();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);
  const [loading, setLoading] = useState(false);

  const onProSurface = PRO_PATHS.some((p) => location.pathname.startsWith(p));

  useEffect(() => {
    if (
      proMode === "demo" &&
      user &&
      profile &&
      profile.has_acknowledged_demo === false &&
      onProSurface
    ) {
      setOpen(true);
    } else {
      setOpen(false);
    }
  }, [proMode, user, profile, onProSurface]);

  const handleConfirm = async () => {
    if (!user || !acknowledged) return;
    setLoading(true);
    try {
      await supabase
        .from("user_profiles")
        .update({ has_acknowledged_demo: true })
        .eq("user_id", user.id);
      await refreshProfile();
      setOpen(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => { /* blocked: cannot close without confirming */ }}>
      <DialogContent
        className="sm:max-w-lg [&>button]:hidden"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="font-display text-xl flex items-center gap-2">
            <Coins className="w-5 h-5 text-[#F4714D]" />
            Welcome to Forecast Arena Pro — Demo Mode
          </DialogTitle>
          <DialogDescription>
            Pro is currently running in demo mode while we engage with regulators. Read this before you continue.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <ul className="space-y-2 text-sm text-foreground">
            <li className="flex items-start gap-2">
              <Coins className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                You'll receive <span className="font-semibold text-amber-700">100 Arena Coins (AC)</span> to practice with — virtual currency only.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <Lock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                <span className="font-semibold">No deposits, no withdrawals.</span> AC has no monetary value and cannot be cashed out.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                Forecasts, leaderboard rankings, AI scoring, and settlement notifications still work — but no real money changes hands.
              </span>
            </li>
          </ul>

          <div className="bg-[#F4714D]/5 border border-[#F4714D]/20 rounded-lg p-3">
            <label className="flex items-start gap-3 cursor-pointer">
              <Checkbox
                checked={acknowledged}
                onCheckedChange={(v) => setAcknowledged(v === true)}
                className="mt-0.5"
              />
              <span className="text-xs text-foreground leading-relaxed">
                I understand this is practice mode with virtual currency and I cannot withdraw any balance.
              </span>
            </label>
          </div>

          <Button
            onClick={handleConfirm}
            disabled={!acknowledged || loading}
            className="w-full font-display font-semibold"
            size="lg"
          >
            {loading ? "Saving..." : "Start practicing"}
          </Button>

          <p className="text-[10px] text-muted-foreground text-center">
            Want the full story?{" "}
            <a href="/about-demo-mode" target="_blank" className="underline text-[#F4714D] hover:text-[#F4714D]/80">
              Read about demo mode
            </a>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DemoOnboardingModal;
