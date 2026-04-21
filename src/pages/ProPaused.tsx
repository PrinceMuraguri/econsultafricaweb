import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Shield, ArrowRight } from "lucide-react";

const ProPaused = () => (
  <Layout>
    <div className="container-page py-16 md:py-24">
      <div className="max-w-xl mx-auto text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-6">
          <Shield className="w-8 h-8 text-muted-foreground" />
        </div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Temporarily paused
        </p>
        <h1 className="text-3xl font-bold font-display text-foreground mb-4">
          Forecast Arena Pro is paused
        </h1>
        <p className="text-muted-foreground mb-8">
          We're upgrading the staked-trading tier. While Pro is offline, the Free Forecast Arena remains fully open — every poll, the AI Forecast Council, and the leaderboard.
        </p>
        <p className="text-sm text-muted-foreground mb-8">
          Any balance in your Pro wallet is safe and will be restored when Pro returns.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild>
            <Link to="/">
              Go to Forecast Arena <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/contact">Questions? Get in touch</Link>
          </Button>
        </div>
      </div>
    </div>
  </Layout>
);

export default ProPaused;
