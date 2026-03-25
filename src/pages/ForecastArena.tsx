import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import PollCard from "@/components/forecast/PollCard";
import { usePolls } from "@/hooks/use-polls";
import { BarChart3, TrendingUp, Zap, Globe, ArrowDown, DollarSign, MousePointerClick, Shield } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: [0.2, 0, 0, 1] as const }
  })
};

const ForecastArena = () => {
  const { data: polls, isLoading } = usePolls();

  return (
    <Layout>
      {/* Hero — The African Forecast Story */}
      <section className="section-padding bg-foreground overflow-hidden relative">
        {/* Subtle animated grid background */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: "linear-gradient(hsl(var(--accent)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--accent)) 1px, transparent 1px)",
            backgroundSize: "60px 60px"
          }} />
        </div>

        <div className="container-page relative z-10">
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
              Your Voice.{" "}
              <span className="text-accent">Africa's Future.</span>
            </motion.h1>

            <motion.p variants={fadeUp} custom={2}
              className="text-lg md:text-xl text-background/70 leading-relaxed mb-4 max-w-2xl">
              Africa is your business. Make your forecast count.
            </motion.p>

            <motion.p variants={fadeUp} custom={3}
              className="text-base text-background/50 leading-relaxed mb-8 max-w-2xl">
              Join forecasters shaping the narrative on Africa's economy.
              Vote on live economic questions and see how the market moves in real time.
              <span className="block mt-2 text-accent/80 font-medium">
                🚀 Share trading is coming soon — start voting now to build your track record.
              </span>
            </motion.p>

            {/* How it works — animated steps */}
            <motion.div variants={fadeUp} custom={4} className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
              {[
                { icon: MousePointerClick, step: "01", title: "Vote", desc: "Pick your position on a live economic question" },
                { icon: DollarSign, step: "02", title: "Buy Shares", desc: "Back your forecast — each share pays $1 if you're right" },
                { icon: TrendingUp, step: "03", title: "Earn", desc: "Get paid when the outcome is confirmed" },
              ].map((item, i) => (
                <motion.div
                  key={item.step}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 + i * 0.15 }}
                  className="bg-background/5 border border-background/10 rounded-lg p-4 group hover:bg-background/10 transition-colors"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
                      <item.icon className="w-4 h-4 text-accent" />
                    </div>
                    <span className="font-mono text-xs text-accent/60">{item.step}</span>
                  </div>
                  <p className="text-sm font-semibold text-background mb-1">{item.title}</p>
                  <p className="text-xs text-background/40">{item.desc}</p>
                </motion.div>
              ))}
            </motion.div>

            <motion.div variants={fadeUp} custom={5} className="flex flex-wrap gap-6 mb-6">
              {[
                { icon: Shield, label: "Secure payments via Paystack" },
                { icon: Zap, label: "Real-time probability" },
                { icon: Globe, label: "100% Africa-focused" },
              ].map((item) => (
                <span key={item.label} className="flex items-center gap-2 text-sm text-background/40">
                  <item.icon className="w-4 h-4 text-accent" />
                  {item.label}
                </span>
              ))}
            </motion.div>

            {/* Scroll prompt */}
            <motion.div
              variants={fadeUp} custom={6}
              className="flex items-center gap-2 text-background/30"
            >
              <motion.div animate={{ y: [0, 6, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
                <ArrowDown className="w-4 h-4" />
              </motion.div>
              <span className="text-xs font-mono uppercase tracking-wider">Scroll to start forecasting</span>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Disclaimer */}
      <div className="bg-muted/50 border-b border-border">
        <div className="container-page py-3">
          <p className="text-xs text-muted-foreground text-center">
            This is a forecasting platform for informational purposes. Not financial advice.
            All predictions reflect collective sentiment, not guaranteed outcomes. Platform fee: 3.5%.
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
              <p className="text-sm text-muted-foreground mt-1">Vote free or buy shares to back your conviction</p>
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

      {/* CTA — Reports */}
      <section className="section-padding bg-primary">
        <div className="container-page text-center">
          <motion.h2 initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}
            className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
            Want Deeper Economic Intelligence?
          </motion.h2>
          <motion.p initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={1}
            className="text-primary-foreground/70 mb-8 max-w-xl mx-auto">
            Go beyond predictions. Get the full analysis behind Africa's economic trajectory.
            Stay ahead with our latest reports.
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
