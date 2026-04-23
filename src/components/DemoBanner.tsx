import { Link } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Persistent, non-dismissable banner shown on every Pro surface while
 * `pro_mode = 'demo'`. Catalyst Orange (#F4714D) at low opacity so it
 * unmistakably reads as "demo" without overpowering the page chrome.
 *
 * Mounted per-Pro-page (Free Forecast Arena, Marketplace, etc. must stay clean).
 */
const DemoBanner = () => {
  const { proMode } = useAuth();

  // Don't render in live or while loading (prevents flash on hard refresh).
  if (proMode !== "demo") return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="bg-[#F4714D]/10 border-b border-[#F4714D]/30 px-4 py-2"
    >
      <div className="container-page flex flex-wrap items-center justify-center gap-2 text-center">
        <AlertTriangle className="w-3.5 h-3.5 text-[#F4714D] shrink-0" />
        <p className="text-[11px] md:text-xs font-medium text-foreground">
          <span className="font-bold text-[#F4714D] uppercase tracking-wider mr-1.5">
            Demo mode
          </span>
          Practice with virtual Arena Coins. No real money.
          <Link
            to="/about-demo-mode"
            className="ml-2 underline text-[#F4714D] hover:text-[#F4714D]/80 font-semibold"
          >
            Learn why →
          </Link>
        </p>
      </div>
    </div>
  );
};

export default DemoBanner;
