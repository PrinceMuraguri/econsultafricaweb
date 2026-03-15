import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import SectorExplorer from "@/components/SectorExplorer";
import ReportPreview from "@/components/ReportPreview";
import { ArrowRight, BarChart3, FileText, Users, Briefcase, TrendingUp, Shield, Zap, Target } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: [0.2, 0, 0, 1] as const },
  }),
};

const products = [
  {
    number: "01",
    title: "Kenya 2026 Economic Outlook",
    description: "A comprehensive macro-to-micro analysis of Kenya's economic trajectory. 120+ pages of sector-by-sector intelligence.",
    icon: FileText,
    href: "/kenya-2026",
  },
  {
    number: "02",
    title: "Sector Insight Brief",
    description: "Targeted intelligence for a single sector. Current signals, risk vectors, and opportunity mapping.",
    icon: BarChart3,
    href: "/services",
  },
  {
    number: "03",
    title: "Executive Strategy Briefing",
    description: "A 90-minute session with our analysts. Custom analysis aligned to your strategic questions.",
    icon: Users,
    href: "/contact",
  },
  {
    number: "04",
    title: "Quarterly Intelligence Retainer",
    description: "Ongoing advisory. Quarterly reports, monthly signals, and direct analyst access.",
    icon: Briefcase,
    href: "/services",
  },
];

const steps = [
  { step: "01", title: "Define your scope", description: "Tell us your sector, geography, and strategic questions." },
  { step: "02", title: "We analyze the signals", description: "Our team synthesizes macro data, policy shifts, and market dynamics." },
  { step: "03", title: "Receive calibrated intelligence", description: "Get a report or briefing tailored to your decision-making needs." },
  { step: "04", title: "Act with precision", description: "Deploy capital, enter markets, or adjust strategy with confidence." },
];

const insights = [
  { title: "Kenya's Fiscal Consolidation: What It Means for Corporate Tax", date: "Mar 2026", read: "6 min", category: "Fiscal Policy" },
  { title: "Agriculture Sector Outlook: Climate Risk and Export Opportunity", date: "Feb 2026", read: "8 min", category: "Agriculture" },
  { title: "The KES Trajectory: Projections for H2 2026", date: "Feb 2026", read: "5 min", category: "Currency" },
];

const Index = () => {
  return (
    <Layout>
      {/* Hero */}
      <section className="section-padding overflow-hidden">
        <div className="container-page">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 lg:gap-16 items-center">
            <div className="lg:col-span-3">
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="font-mono text-xs text-gold uppercase tracking-widest mb-6"
              >
                Economic Intelligence · Nairobi
              </motion.p>
              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.2, 0, 0, 1] as const }}
                className="text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.1] text-foreground mb-6"
              >
                Kenya's economy is changing fast.{" "}
                <span className="text-primary">We help your organization make sense of it.</span>
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.5 }}
                className="text-lg text-muted-foreground max-w-xl leading-relaxed mb-8"
              >
                Econsult Africa translates macroeconomic trends into tailored strategic insight for organizations operating in the East African corridor.
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25, duration: 0.5 }}
                className="flex flex-col sm:flex-row gap-4"
              >
                <Button variant="hero" size="lg" className="hover-sink" asChild>
                  <Link to="/kenya-2026">Buy the Kenya 2026 Outlook <ArrowRight className="ml-1" /></Link>
                </Button>
                <Button variant="hero-outline" size="lg" className="hover-sink" asChild>
                  <Link to="/contact">Book an Executive Briefing</Link>
                </Button>
              </motion.div>
            </div>
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.7, ease: [0.2, 0, 0, 1] as const }}
              className="lg:col-span-2"
            >
              <div className="relative">
                {/* Report mockup */}
                <div className="bg-primary rounded-lg p-8 text-primary-foreground card-shadow-lg" style={{ transform: "perspective(800px) rotateY(-8deg)" }}>
                  <p className="font-mono text-xs opacity-60 mb-2">ECONSULT AFRICA · REPORT NO. 2026-01</p>
                  <h3 className="font-display font-bold text-2xl mb-4">Kenya 2026<br />Economic Outlook</h3>
                  <div className="h-px bg-primary-foreground/20 mb-4" />
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="opacity-60">GDP Growth (Proj.)</span>
                      <span className="font-mono font-semibold">5.4% YoY</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="opacity-60">Inflation (Avg.)</span>
                      <span className="font-mono font-semibold">6.2%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="opacity-60">Key Sectors</span>
                      <span className="font-mono font-semibold">10 Analyzed</span>
                    </div>
                  </div>
                </div>

                {/* Floating chips */}
                <motion.div
                  animate={{ y: [0, -6, 0] }}
                  transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                  className="absolute -top-4 -right-4 bg-background card-shadow rounded-lg px-4 py-2 border border-border"
                >
                  <p className="font-mono text-xs text-gold font-semibold">+4.2% GDP</p>
                </motion.div>
                <motion.div
                  animate={{ y: [0, 6, 0] }}
                  transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut" }}
                  className="absolute -bottom-4 -left-4 bg-background card-shadow rounded-lg px-4 py-2 border border-border"
                >
                  <p className="font-mono text-xs text-primary font-semibold">KES Stable</p>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Problem */}
      <section className="section-padding bg-muted/50">
        <div className="container-page">
          <div className="max-w-3xl">
            <motion.p
              initial="hidden" whileInView="visible" viewport={{ once: true }}
              variants={fadeUp} custom={0}
              className="font-mono text-xs text-gold uppercase tracking-widest mb-4"
            >
              The Problem
            </motion.p>
            <motion.h2
              initial="hidden" whileInView="visible" viewport={{ once: true }}
              variants={fadeUp} custom={1}
              className="text-3xl md:text-4xl font-bold text-foreground mb-6"
            >
              Generic data is a liability.
            </motion.h2>
            <motion.p
              initial="hidden" whileInView="visible" viewport={{ once: true }}
              variants={fadeUp} custom={2}
              className="text-lg text-muted-foreground leading-relaxed max-w-2xl"
            >
              Most economic reports are built for global audiences. They aggregate, they generalize, and they arrive too late. Decision-makers in the Kenyan market need precision — specific signals calibrated to their sectors, timelines, and strategic questions.
            </motion.p>
          </div>
        </div>
      </section>

      {/* Solution */}
      <section className="section-padding">
        <div className="container-page">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <motion.p
                initial="hidden" whileInView="visible" viewport={{ once: true }}
                variants={fadeUp} custom={0}
                className="font-mono text-xs text-gold uppercase tracking-widest mb-4"
              >
                Our Approach
              </motion.p>
              <motion.h2
                initial="hidden" whileInView="visible" viewport={{ once: true }}
                variants={fadeUp} custom={1}
                className="text-3xl md:text-4xl font-bold text-foreground mb-6"
              >
                Intelligence calibrated for Kenya.
              </motion.h2>
              <motion.p
                initial="hidden" whileInView="visible" viewport={{ once: true }}
                variants={fadeUp} custom={2}
                className="text-lg text-muted-foreground leading-relaxed mb-8"
              >
                We combine macroeconomic analysis, sector-specific research, and policy tracking to deliver intelligence that maps directly to strategic decisions. No noise. No filler. Only the signals that matter.
              </motion.p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: TrendingUp, label: "Macro Analysis" },
                { icon: Target, label: "Sector Precision" },
                { icon: Shield, label: "Risk Mapping" },
                { icon: Zap, label: "Timely Delivery" },
              ].map((item, i) => (
                <motion.div
                  key={item.label}
                  initial="hidden" whileInView="visible" viewport={{ once: true }}
                  variants={fadeUp} custom={i}
                  className="bg-muted/50 rounded-lg p-6 border border-border"
                >
                  <item.icon className="w-5 h-5 text-primary mb-3" />
                  <p className="font-display font-semibold text-sm text-foreground">{item.label}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Products */}
      <section className="section-padding bg-muted/50">
        <div className="container-page">
          <motion.p
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={fadeUp} custom={0}
            className="font-mono text-xs text-gold uppercase tracking-widest mb-4"
          >
            Intelligence Products
          </motion.p>
          <motion.h2
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={fadeUp} custom={1}
            className="text-3xl md:text-4xl font-bold text-foreground mb-12"
          >
            The product ladder.
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {products.map((product, i) => (
              <motion.div
                key={product.number}
                initial="hidden" whileInView="visible" viewport={{ once: true }}
                variants={fadeUp} custom={i}
                whileHover={{ y: -4 }}
                transition={{ duration: 0.3 }}
              >
                <Link to={product.href} className="block bg-background rounded-lg border-t-2 border-t-primary border border-border p-8 h-full hover-sink card-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <span className="font-mono text-2xl font-bold text-gold">{product.number}</span>
                    <product.icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-display font-bold text-xl text-foreground mb-3">{product.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{product.description}</p>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Report Preview */}
      <section className="section-padding">
        <div className="container-page">
          <motion.p
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={fadeUp} custom={0}
            className="font-mono text-xs text-gold uppercase tracking-widest mb-4"
          >
            Preview
          </motion.p>
          <motion.h2
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={fadeUp} custom={1}
            className="text-3xl md:text-4xl font-bold text-foreground mb-12"
          >
            Inside the Kenya 2026 Outlook.
          </motion.h2>
          <ReportPreview />
        </div>
      </section>

      {/* Sector Explorer */}
      <section className="section-padding bg-muted/50">
        <div className="container-page">
          <motion.p
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={fadeUp} custom={0}
            className="font-mono text-xs text-gold uppercase tracking-widest mb-4"
          >
            Sectors
          </motion.p>
          <motion.h2
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={fadeUp} custom={1}
            className="text-3xl md:text-4xl font-bold text-foreground mb-12"
          >
            Explore the sectors we cover.
          </motion.h2>
          <SectorExplorer />
        </div>
      </section>

      {/* Credibility */}
      <section className="section-padding">
        <div className="container-page">
          <div className="max-w-3xl">
            <motion.p
              initial="hidden" whileInView="visible" viewport={{ once: true }}
              variants={fadeUp} custom={0}
              className="font-mono text-xs text-gold uppercase tracking-widest mb-4"
            >
              Why Econsult
            </motion.p>
            <motion.h2
              initial="hidden" whileInView="visible" viewport={{ once: true }}
              variants={fadeUp} custom={1}
              className="text-3xl md:text-4xl font-bold text-foreground mb-6"
            >
              Trusted by decision-makers across East Africa.
            </motion.h2>
            <motion.p
              initial="hidden" whileInView="visible" viewport={{ once: true }}
              variants={fadeUp} custom={2}
              className="text-lg text-muted-foreground leading-relaxed mb-8"
            >
              Our clients include country directors, CFOs, investors, and NGO leadership teams who rely on Econsult Africa for the economic clarity that generic reports cannot provide. We earn trust through precision, not volume.
            </motion.p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
            {[
              { metric: "120+", label: "Pages of analysis per Outlook" },
              { metric: "10", label: "Sectors analyzed" },
              { metric: "2026", label: "Projections calibrated to" },
            ].map((item, i) => (
              <motion.div
                key={item.label}
                initial="hidden" whileInView="visible" viewport={{ once: true }}
                variants={fadeUp} custom={i}
                className="text-center p-8 bg-muted/50 rounded-lg border border-border"
              >
                <p className="font-mono text-4xl font-bold text-primary mb-2">{item.metric}</p>
                <p className="text-sm text-muted-foreground">{item.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Insights Preview */}
      <section className="section-padding bg-muted/50">
        <div className="container-page">
          <div className="flex items-end justify-between mb-12">
            <div>
              <motion.p
                initial="hidden" whileInView="visible" viewport={{ once: true }}
                variants={fadeUp} custom={0}
                className="font-mono text-xs text-gold uppercase tracking-widest mb-4"
              >
                Latest Insights
              </motion.p>
              <motion.h2
                initial="hidden" whileInView="visible" viewport={{ once: true }}
                variants={fadeUp} custom={1}
                className="text-3xl md:text-4xl font-bold text-foreground"
              >
                Recent intelligence.
              </motion.h2>
            </div>
            <Link to="/insights" className="hidden md:inline-flex text-sm font-medium text-primary hover:text-primary/80 transition-colors">
              View all <ArrowRight className="ml-1 w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {insights.map((post, i) => (
              <motion.article
                key={post.title}
                initial="hidden" whileInView="visible" viewport={{ once: true }}
                variants={fadeUp} custom={i}
                whileHover={{ y: -4 }}
                className="bg-background rounded-lg border border-border p-6 card-shadow hover-sink cursor-pointer"
              >
                <div className="flex items-center gap-3 mb-4">
                  <span className="font-mono text-xs text-gold">{post.date}</span>
                  <span className="text-xs text-muted-foreground">· {post.read} read</span>
                </div>
                <span className="inline-block text-xs font-medium bg-primary/10 text-primary px-2 py-1 rounded-pill mb-3">{post.category}</span>
                <h3 className="font-display font-semibold text-foreground leading-snug">{post.title}</h3>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="section-padding">
        <div className="container-page">
          <motion.p
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={fadeUp} custom={0}
            className="font-mono text-xs text-gold uppercase tracking-widest mb-4"
          >
            Process
          </motion.p>
          <motion.h2
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={fadeUp} custom={1}
            className="text-3xl md:text-4xl font-bold text-foreground mb-12"
          >
            How it works.
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {steps.map((step, i) => (
              <motion.div
                key={step.step}
                initial="hidden" whileInView="visible" viewport={{ once: true }}
                variants={fadeUp} custom={i}
                className="relative"
              >
                <span className="font-mono text-5xl font-bold text-muted/80">{step.step}</span>
                <h3 className="font-display font-semibold text-foreground mt-4 mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="section-padding bg-primary">
        <div className="container-page text-center">
          <motion.h2
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={fadeUp} custom={0}
            className="text-3xl md:text-4xl font-bold text-primary-foreground mb-6"
          >
            Ready for precision in a volatile market?
          </motion.h2>
          <motion.p
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={fadeUp} custom={1}
            className="text-lg text-primary-foreground/70 mb-8 max-w-xl mx-auto"
          >
            Get the Kenya 2026 Economic Outlook or speak directly with our analysts.
          </motion.p>
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={fadeUp} custom={2}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Button variant="gold" size="lg" className="hover-sink" asChild>
              <Link to="/kenya-2026">Buy the 2026 Outlook</Link>
            </Button>
            <Button size="lg" className="hover-sink bg-primary-foreground text-primary hover:bg-primary-foreground/90 font-display font-semibold" asChild>
              <Link to="/contact">Book a Briefing</Link>
            </Button>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
};

export default Index;
