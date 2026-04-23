import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import Layout from "@/components/Layout";
import { Coins, Shield, Sparkles, ArrowRight, AlertTriangle } from "lucide-react";

const AboutDemoMode = () => {
  return (
    <Layout>
      {/* Hero */}
      <section className="bg-foreground py-12 md:py-16">
        <div className="container-page max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 bg-[#F4714D]/15 border border-[#F4714D]/30 rounded-full px-3 py-1 mb-4">
              <AlertTriangle className="w-3.5 h-3.5 text-[#F4714D]" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#F4714D]">
                Demo mode is active
              </span>
            </div>
            <h1 className="font-display text-3xl md:text-5xl font-black text-background leading-tight mb-3">
              Forecast Arena Pro is in <span className="text-amber-400">Demo Mode.</span>
            </h1>
            <p className="text-base text-background/70 max-w-2xl">
              Practice with virtual Arena Coins (AC). No real money. No deposits. No withdrawals.
              The product runs as designed — only the currency is virtual.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Why */}
      <section className="py-10 md:py-14 bg-card">
        <div className="container-page max-w-3xl space-y-10">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-5 h-5 text-primary" />
              <h2 className="font-display text-xl md:text-2xl font-bold text-foreground">
                Why demo mode?
              </h2>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Forecast Arena Pro lets users back economic forecasts with capital. To operate that
              feature responsibly in Kenya, we are engaging the Capital Markets Authority (CMA)
              for regulatory clarity. Demo mode lets us refine the product, hold a real audience,
              and continue scoring forecast accuracy — without holding any user funds while that
              engagement is in progress.
            </p>
          </div>

          {/* What changes */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Coins className="w-5 h-5 text-amber-600" />
              <h2 className="font-display text-xl md:text-2xl font-bold text-foreground">
                What changes
              </h2>
            </div>
            <ul className="space-y-3 text-sm text-foreground">
              <li className="flex items-start gap-3 bg-muted/40 border border-border rounded-lg p-3">
                <Coins className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  <span className="font-semibold">Arena Coins (AC) replace USD.</span> Every Pro account
                  is seeded with 100 AC to practice with.
                </span>
              </li>
              <li className="flex items-start gap-3 bg-muted/40 border border-border rounded-lg p-3">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  <span className="font-semibold">No deposits, no withdrawals, no payouts.</span>
                  AC has no monetary value and cannot be exchanged for currency.
                </span>
              </li>
              <li className="flex items-start gap-3 bg-muted/40 border border-border rounded-lg p-3">
                <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  <span className="font-semibold">Everything else still works.</span> Forecasts,
                  leaderboard, AI Forecast Council, settlement notifications, P2P listings, position
                  history — all live and unchanged.
                </span>
              </li>
            </ul>
          </div>

          {/* What stays */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-primary" />
              <h2 className="font-display text-xl md:text-2xl font-bold text-foreground">
                What stays the same
              </h2>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed mb-3">
              Demo mode <span className="font-semibold text-foreground">only</span> affects Forecast
              Arena Pro. Two parts of the platform continue to operate normally with real money:
            </p>
            <ul className="space-y-2 text-sm text-foreground">
              <li className="flex items-start gap-2">
                <ArrowRight className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <Link to="/" className="underline text-primary hover:text-primary/80">
                  Free Forecast Arena
                </Link>{" "}
                — sentiment forecasting, no capital required.
              </li>
              <li className="flex items-start gap-2">
                <ArrowRight className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <Link to="/intelligence-marketplace" className="underline text-primary hover:text-primary/80">
                  Intelligence Marketplace
                </Link>{" "}
                — research reports and downloadable intelligence (paid in USD).
              </li>
            </ul>
          </div>

          {/* CTA */}
          <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-5 text-center space-y-3">
            <p className="text-sm font-semibold text-foreground">
              Ready to practice with Arena Coins?
            </p>
            <Link
              to="/forecast-arena-pro"
              className="inline-flex items-center gap-2 rounded-md bg-amber-600 hover:bg-amber-700 text-white px-5 py-2.5 text-sm font-display font-semibold transition-colors"
            >
              Back to Forecast Arena Pro <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default AboutDemoMode;
