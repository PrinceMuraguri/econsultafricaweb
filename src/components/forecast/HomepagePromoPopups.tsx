import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { X, TrendingUp, Zap } from "lucide-react";
import { PRO_ENABLED } from "@/lib/features";

type PopupKey = "pro" | "agent";

const DISMISS_KEY = (k: PopupKey) => `homepage_promo_dismissed_${k}`;

const HomepagePromoPopups = () => {
  const [active, setActive] = useState<PopupKey | null>(null);
  const [shown, setShown] = useState<Record<PopupKey, boolean>>({
    pro: typeof window !== "undefined" && !!sessionStorage.getItem(DISMISS_KEY("pro")),
    agent: typeof window !== "undefined" && !!sessionStorage.getItem(DISMISS_KEY("agent")),
  });

  // Show Pro popup after 30s
  useEffect(() => {
    if (!PRO_ENABLED || shown.pro) return;
    const t = setTimeout(() => {
      setActive((cur) => cur ?? "pro");
      setShown((s) => ({ ...s, pro: true }));
    }, 30000);
    return () => clearTimeout(t);
  }, [shown.pro]);

  // Show Agent popup 30s after Pro is dismissed (or 60s on load if pro disabled)
  const [proDismissedAt, setProDismissedAt] = useState<number | null>(null);
  useEffect(() => {
    if (shown.agent) return;
    if (!PRO_ENABLED) {
      const t = setTimeout(() => {
        setActive((cur) => cur ?? "agent");
        setShown((s) => ({ ...s, agent: true }));
      }, 60000);
      return () => clearTimeout(t);
    }
    if (proDismissedAt) {
      const t = setTimeout(() => {
        setActive((cur) => cur ?? "agent");
        setShown((s) => ({ ...s, agent: true }));
      }, 30000);
      return () => clearTimeout(t);
    }
  }, [proDismissedAt, shown.agent]);

  const close = () => {
    if (active) {
      sessionStorage.setItem(DISMISS_KEY(active), "1");
      if (active === "pro") setProDismissedAt(Date.now());
    }
    setActive(null);
  };

  const config = active === "pro"
    ? {
        accent: "amber",
        icon: TrendingUp,
        eyebrow: "Try PRO (Demo Mode)",
        title: "Back your forecasts with capital",
        body: "You're on the Free version. Get $100 in virtual Arena Coins to stake on Pro markets and earn rewards when you're right.",
        cta: "Try It Now",
        href: "/forecast-arena-pro",
      }
    : active === "agent"
    ? {
        accent: "purple",
        icon: Zap,
        eyebrow: "For Builders",
        title: "Build an AI forecasting agent",
        body: "Register an AI agent that forecasts African economies. Get a verifiable track record and compete on our public leaderboard.",
        cta: "Try It Now",
        href: "/api-documentation",
      }
    : null;

  return (
    <AnimatePresence>
      {active && config && (
        <motion.div
          key={active}
          initial={{ opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 24, scale: 0.96 }}
          transition={{ duration: 0.25, ease: [0.2, 0, 0, 1] }}
          className="fixed bottom-4 left-4 z-50 w-[340px] max-w-[calc(100vw-2rem)] pointer-events-auto"
          role="dialog"
          aria-label={config.title}
        >
          <div className="relative bg-card border border-border rounded-lg shadow-2xl overflow-hidden">
            <div
              className={`h-1 w-full ${active === "pro" ? "bg-amber-500" : "bg-purple-500"}`}
            />
            <button
              onClick={close}
              aria-label="Close"
              className="absolute top-2 right-2 p-1 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="p-4 pr-8">
              <div className="flex items-center gap-2 mb-1">
                <config.icon
                  className={`w-4 h-4 ${active === "pro" ? "text-amber-500" : "text-purple-500"}`}
                />
                <span
                  className={`text-[10px] font-bold uppercase tracking-wide ${
                    active === "pro" ? "text-amber-600" : "text-purple-600"
                  }`}
                >
                  {config.eyebrow}
                </span>
              </div>
              <h3 className="text-sm font-bold text-foreground mb-1">{config.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed mb-3">{config.body}</p>
              <div className="flex items-center gap-2">
                <Link
                  to={config.href}
                  onClick={close}
                  className={`flex-1 text-center text-xs font-semibold px-3 py-2 rounded-md text-white transition-colors ${
                    active === "pro"
                      ? "bg-amber-500 hover:bg-amber-600"
                      : "bg-purple-500 hover:bg-purple-600"
                  }`}
                >
                  {config.cta}
                </Link>
                <button
                  onClick={close}
                  className="text-xs font-medium px-3 py-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  Maybe Later
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default HomepagePromoPopups;
