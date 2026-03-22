import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { ArrowLeft, BarChart3, DollarSign, TrendingUp, Shield, AlertTriangle, Target, Users } from "lucide-react";
import ShareCalculator from "@/components/forecast/ShareCalculator";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.5 }
  })
};

const steps = [
  { num: "01", title: "Choose a question", desc: "Browse active forecasts on real economic events — interest rates, inflation, exchange rates, and more." },
  { num: "02", title: "Pick your position", desc: "Take a position: YES or NO. Your choice reflects your belief about what will happen." },
  { num: "03", title: "Buy shares in that outcome", desc: "Each share represents your conviction. 1 share = $1 payout if your prediction is correct. Buy as many as you want." },
  { num: "04", title: "Watch probability shift in real time", desc: "As more people take positions, the market probability adjusts. Share prices reflect collective intelligence." },
  { num: "05", title: "If you're right, you earn", desc: "When the event resolves, each correct share pays out $1. Your profit is the difference between what you paid and what you receive." },
];

const HowItWorks = () => {
  return (
    <Layout>
      {/* Hero */}
      <section className="section-padding bg-foreground">
        <div className="container-page max-w-3xl">
          <Link
            to="/forecast-arena"
            className="inline-flex items-center gap-2 text-sm text-background/50 hover:text-accent transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Forecast Arena
          </Link>

          <motion.div initial="hidden" animate="visible">
            <motion.div variants={fadeUp} custom={0} className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-accent" />
              </div>
              <span className="font-mono text-xs text-accent uppercase tracking-widest">
                How It Works
              </span>
            </motion.div>
            <motion.h1 variants={fadeUp} custom={1}
              className="text-4xl md:text-5xl font-bold text-background leading-[1.1] mb-6">
              Turn Your Insight{" "}
              <span className="text-accent">Into Outcomes</span>
            </motion.h1>
            <motion.p variants={fadeUp} custom={2}
              className="text-lg text-background/60 leading-relaxed max-w-2xl">
              Forecast Arena lets you take a position on real-world economic events — and back it with a stake.
              Similar to platforms like Polymarket, you buy shares in outcomes you believe will happen.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* Steps */}
      <section className="section-padding">
        <div className="container-page max-w-3xl">
          <p className="font-mono text-xs text-accent uppercase tracking-widest mb-8">Step by Step</p>
          <div className="space-y-8">
            {steps.map((step, i) => (
              <motion.div
                key={step.num}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i}
                className="flex gap-6"
              >
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="font-mono text-sm font-bold text-primary">{step.num}</span>
                </div>
                <div>
                  <h3 className="font-display font-bold text-foreground text-lg mb-1">{step.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Example Calculator */}
      <section className="section-padding bg-muted/30">
        <div className="container-page max-w-3xl">
          <p className="font-mono text-xs text-accent uppercase tracking-widest mb-2">See It In Action</p>
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-8">Share Calculator</h2>
          <ShareCalculator />
        </div>
      </section>

      {/* Pricing Explanation */}
      <section className="section-padding">
        <div className="container-page max-w-3xl">
          <div className="flex items-center gap-3 mb-6">
            <DollarSign className="w-5 h-5 text-primary" />
            <h2 className="text-2xl font-bold text-foreground">How Share Pricing Works</h2>
          </div>
          <div className="bg-card border border-border rounded-lg p-6 space-y-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              Share prices reflect the market's collective probability estimate. A share priced at <span className="font-mono font-semibold text-foreground">$0.70</span> means the market believes there is a <span className="font-semibold text-foreground">70% chance</span> the event will happen.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-primary/5 rounded-lg p-4 border border-primary/10">
                <p className="font-mono text-lg font-bold text-foreground">$0.30</p>
                <p className="text-xs text-muted-foreground">Lower price = higher risk, higher potential return</p>
              </div>
              <div className="bg-primary/5 rounded-lg p-4 border border-primary/10">
                <p className="font-mono text-lg font-bold text-foreground">$0.85</p>
                <p className="text-xs text-muted-foreground">Higher price = lower risk, lower potential return</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why This Matters */}
      <section className="section-padding bg-muted/30">
        <div className="container-page max-w-3xl">
          <div className="flex items-center gap-3 mb-6">
            <Target className="w-5 h-5 text-primary" />
            <h2 className="text-2xl font-bold text-foreground">Why This Matters</h2>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed mb-6">
            This is not just a wager — it's a real-time reflection of collective economic expectations.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { icon: TrendingUp, label: "Market Sentiment", desc: "Understand how markets perceive upcoming events" },
              { icon: Users, label: "Collective Intelligence", desc: "Aggregate insights from diverse perspectives" },
              { icon: BarChart3, label: "Policy Expectations", desc: "Track expectations on monetary & fiscal policy" },
            ].map((item) => (
              <div key={item.label} className="bg-card border border-border rounded-lg p-5">
                <item.icon className="w-5 h-5 text-accent mb-3" />
                <h3 className="font-semibold text-foreground text-sm mb-1">{item.label}</h3>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust & Disclaimer */}
      <section className="section-padding">
        <div className="container-page max-w-3xl space-y-8">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-5 h-5 text-primary" />
              <h2 className="text-2xl font-bold text-foreground">Trust & Transparency</h2>
            </div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-accent mt-0.5">✓</span>
                Outcomes are based on verified public data (CBK, KNBS, EPRA, etc.)
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent mt-0.5">✓</span>
                Results are objectively resolved — no discretion
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent mt-0.5">✓</span>
                Payouts are automated and proportional to shares held
              </li>
            </ul>
          </div>

          <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-6">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-destructive" />
              <span className="text-sm font-semibold text-foreground">Risk Disclaimer</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Forecasting involves uncertainty. Only stake what you are comfortable losing.
              This is a forecasting tool — not financial advice. Past outcomes do not guarantee future results.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding bg-primary">
        <div className="container-page text-center">
          <h2 className="text-3xl font-bold text-primary-foreground mb-4">Ready to Take a Position?</h2>
          <p className="text-primary-foreground/70 mb-8 max-w-xl mx-auto">
            Browse active economic forecasts and put your insight to the test.
          </p>
          <Link
            to="/forecast-arena"
            className="inline-flex items-center justify-center rounded-md bg-accent text-accent-foreground px-6 py-3 font-display font-semibold shadow-md hover:bg-accent/90 transition-colors"
          >
            Explore Forecast Arena
          </Link>
        </div>
      </section>
    </Layout>
  );
};

export default HowItWorks;
