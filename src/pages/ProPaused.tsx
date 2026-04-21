import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Shield, ArrowRight } from "lucide-react";

/**
 * Pro flag: landing page shown on /forecast-arena-pro* routes when
 * PRO_ENABLED is false. Do not repurpose for other content.
 */
const ProPaused = () => (
  <Layout>
    <section className="container-page max-w-2xl py-16 md:py-24">
      <div className="flex flex-col items-center text-center space-y-6">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-amber-700 bg-amber-100 border border-amber-200 px-3 py-1 rounded-full">
          <Shield className="w-3.5 h-3.5" /> Temporarily paused
        </span>

        <h1 className="text-3xl md:text-4xl font-display font-black text-foreground leading-tight">
          Forecast Arena Pro is paused
        </h1>

        <p className="text-base text-muted-foreground leading-relaxed max-w-xl">
          We're upgrading the staked-trading tier. While Pro is offline, the Free Forecast Arena remains fully open — every poll, the AI Forecast Council, and the leaderboard.
        </p>

        <p className="text-sm text-muted-foreground leading-relaxed max-w-xl">
          Any balance in your Pro wallet is safe and will be restored when Pro returns.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <Button asChild size="lg">
            <Link to="/" className="inline-flex items-center gap-1.5">
              Go to Forecast Arena <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
          <Link to="/contact" className="text-sm font-medium text-primary hover:text-accent transition-colors">
            Questions? Get in touch
          </Link>
        </div>
      </div>
    </section>
  </Layout>
);

export default ProPaused;
