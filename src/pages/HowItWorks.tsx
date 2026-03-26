import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { ArrowLeft, BarChart3, TrendingUp, Shield, AlertTriangle, Target, Users } from "lucide-react";
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
  { num: "02", title: "Submit your forecast", desc: "Take a position: Yes or No. Your choice reflects your view about what will happen." },
  { num: "03", title: "Contribute an allocation (coming soon)", desc: "Each unit represents your conviction. 1 unit = $1 distribution if your forecast is correct. Contribute as much as you're comfortable with." },
  { num: "04", title: "Watch consensus shift in real time", desc: "As more people submit forecasts, the consensus probability adjusts. Prices reflect collective intelligence." },
  { num: "05", title: "Accuracy-based distribution", desc: "When the event resolves, each correct forecast unit receives a $1 distribution. Your reward is the difference between what you contributed and what you receive." },
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
              <span className="text-accent">Into Intelligence</span>
            </motion.h1>
            <motion.p variants={fadeUp} custom={2}
              className="text-lg text-background/60 leading-relaxed max-w-2xl">
              Forecast Arena lets you submit your position on real-world economic events — and track how consensus evolves.
              Your forecast contributes to a real-time map of economic expectations across Africa.
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

      {/* Calculator */}
      <section className="section-padding bg-muted/30">
        <div className="container-page max-w-3xl">
          <p className="font-mono text-xs text-accent uppercase tracking-widest mb-2">See It In Action</p>
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-8">Forecast Calculator</h2>
          <ShareCalculator />
        </div>
      </section>

      {/* Consensus Explanation */}
      <section className="section-padding">
        <div className="container-page max-w-3xl">
          <div className="flex items-center gap-3 mb-6">
            <BarChart3 className="w-5 h-5 text-primary" />
            <h2 className="text-2xl font-bold text-foreground">How Consensus Pricing Works</h2>
          </div>
          <div className="bg-card border border-border rounded-lg p-6 space-y-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              Prices reflect the collective consensus probability. A price of <span className="font-mono font-semibold text-foreground">$0.70</span> means participants collectively estimate a <span className="font-semibold text-foreground">70% probability</span> the event will occur.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-primary/5 rounded-lg p-4 border border-primary/10">
                <p className="font-mono text-lg font-bold text-foreground">$0.30</p>
                <p className="text-xs text-muted-foreground">Lower consensus = higher uncertainty, higher potential accuracy reward</p>
              </div>
              <div className="bg-primary/5 rounded-lg p-4 border border-primary/10">
                <p className="font-mono text-lg font-bold text-foreground">$0.85</p>
                <p className="text-xs text-muted-foreground">Higher consensus = more confidence, lower potential accuracy reward</p>
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
            This is a real-time map of collective economic expectations — a sentiment indicator built by those closest to the data.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { icon: TrendingUp, label: "Sentiment Indicator", desc: "Understand how participants perceive upcoming events" },
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
                Distributions are accuracy-based and proportional
              </li>
            </ul>
          </div>

          <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-6">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-destructive" />
              <span className="text-sm font-semibold text-foreground">Disclaimer</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Forecasting involves uncertainty. Only participate with what you are comfortable allocating.
              Forecast Arena aggregates participant expectations on economic outcomes for research and insight purposes.
              It is not a trading, betting, or investment platform.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding bg-primary">
        <div className="container-page text-center">
          <h2 className="text-3xl font-bold text-primary-foreground mb-4">Ready to Submit Your Forecast?</h2>
          <p className="text-primary-foreground/70 mb-8 max-w-xl mx-auto">
            Browse active economic forecasts and contribute your view.
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
