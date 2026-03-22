import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import PollCard from "@/components/forecast/PollCard";
import { usePolls } from "@/hooks/use-polls";
import { BarChart3, TrendingUp, Zap, Globe } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: [0.2, 0, 0, 1] as const }
  })
};

const categories = ["All", "Economics", "Markets", "Fiscal Policy", "Cost of Living", "Financial Sector", "Sovereign Finance", "Agriculture", "Macroeconomics", "Global"];

const ForecastArena = () => {
  const { data: polls, isLoading } = usePolls();

  return (
    <Layout>
      {/* Hero */}
      <section className="section-padding bg-foreground overflow-hidden">
        <div className="container-page">
          <motion.div initial="hidden" animate="visible" className="max-w-3xl">
            <motion.div variants={fadeUp} custom={0} className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-accent" />
              </div>
              <span className="font-mono text-xs text-accent uppercase tracking-widest">
                Forecast Arena
              </span>
            </motion.div>
            <motion.h1 variants={fadeUp} custom={1}
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-background leading-[1.1] mb-6">
              Where Africa's Future{" "}
              <span className="text-accent">Is Predicted in Real Time</span>
            </motion.h1>
            <motion.p variants={fadeUp} custom={2}
              className="text-lg text-background/60 leading-relaxed mb-8 max-w-2xl">
              Take a position on the economic questions shaping Africa's trajectory. 
              Each prediction is backed by real economic context — not speculation.
            </motion.p>
            <motion.div variants={fadeUp} custom={3} className="flex flex-wrap gap-6">
              {[
                { icon: TrendingUp, label: "Data-backed questions" },
                { icon: Zap, label: "Real-time probability" },
                { icon: Globe, label: "Africa-focused" },
              ].map((item) => (
                <span key={item.label} className="flex items-center gap-2 text-sm text-background/50">
                  <item.icon className="w-4 h-4 text-accent" />
                  {item.label}
                </span>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Disclaimer */}
      <div className="bg-muted/50 border-b border-border">
        <div className="container-page py-3">
          <p className="text-xs text-muted-foreground text-center">
            This is a forecasting tool for informational purposes only. Not financial advice. 
            All predictions reflect collective sentiment, not guaranteed outcomes.
          </p>
        </div>
      </div>

      {/* Active Polls */}
      <section className="section-padding">
        <div className="container-page">
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="font-mono text-xs text-accent uppercase tracking-widest mb-2">Active Forecasts</p>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">Take a Position</h2>
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-card rounded-lg border border-border p-6 animate-pulse h-64" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {polls?.map((poll, i) => (
                <motion.div key={poll.id} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}>
                  <PollCard poll={poll} />
                </motion.div>
              ))}
            </div>
          )}

          {polls && polls.length === 0 && (
            <div className="text-center py-16">
              <p className="text-muted-foreground">No active forecasts at the moment. Check back soon.</p>
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding bg-primary">
        <div className="container-page text-center">
          <motion.h2 initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}
            className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
            Want Deeper Economic Intelligence?
          </motion.h2>
          <motion.p initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={1}
            className="text-primary-foreground/70 mb-8 max-w-xl mx-auto">
            Go beyond predictions. Get the full analysis behind Africa's economic trajectory.
          </motion.p>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={2}
            className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/kenya-2026"
              className="inline-flex items-center justify-center rounded-md bg-accent text-accent-foreground px-6 py-3 font-display font-semibold shadow-md hover:bg-accent/90 transition-colors">
              Buy Kenya Report
            </Link>
            <Link to="/products"
              className="inline-flex items-center justify-center rounded-md border-2 border-primary-foreground/30 text-primary-foreground px-6 py-3 font-display font-semibold hover:bg-primary-foreground/10 transition-colors">
              View All Products
            </Link>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
};

export default ForecastArena;
