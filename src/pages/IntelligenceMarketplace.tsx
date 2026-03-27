import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import ProductInterestModal from "@/components/ProductInterestModal";
import { ArrowRight, FileText, BarChart3, Users, Briefcase, Zap, Globe, Eye } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.5, ease: [0.2, 0, 0, 1] as const } }),
};

const IntelligenceMarketplace = () => {
  const [interestModal, setInterestModal] = useState<{ open: boolean; title: string }>({ open: false, title: "" });
  const openInterest = (title: string) => setInterestModal({ open: true, title });

  return (
    <Layout>
      {/* Hero */}
      <section className="section-padding">
        <div className="container-page">
          <div className="max-w-3xl mb-16">
            <motion.p initial="hidden" animate="visible" variants={fadeUp} custom={0}
              className="font-mono text-xs text-gold uppercase tracking-widest mb-4">Intelligence Marketplace</motion.p>
            <motion.h1 initial="hidden" animate="visible" variants={fadeUp} custom={1}
              className="text-4xl md:text-5xl font-bold text-foreground leading-[1.1] mb-6">
              Economic Intelligence. On Demand.
            </motion.h1>
            <motion.p initial="hidden" animate="visible" variants={fadeUp} custom={2}
              className="text-lg text-muted-foreground leading-relaxed">
              Intelligence products and advisory engagements calibrated for organizations navigating African economies. Every engagement answers one question: <span className="text-foreground font-medium">"What does this mean for us?"</span>
            </motion.p>
          </div>
        </div>
      </section>

      {/* Section 1: Reports */}
      <section className="section-padding bg-muted/50">
        <div className="container-page">
          <motion.p initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}
            className="font-mono text-xs text-gold uppercase tracking-widest mb-4">Reports</motion.p>
          <motion.h2 initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={1}
            className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Country & Sector Reports
          </motion.h2>
          <motion.p initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={2}
            className="text-muted-foreground mb-12 max-w-2xl">
            Comprehensive economic analysis — from flagship country outlooks to focused sector intelligence.
          </motion.p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Free Sample */}
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}
              className="rounded-lg border bg-background border-border card-shadow p-8 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-semibold px-2 py-0.5 rounded-pill bg-primary/10 text-primary">Lead Generation</span>
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-display font-bold text-xl mb-3 text-foreground">Sample Report Preview</h3>
              <p className="text-sm leading-relaxed mb-6 flex-1 text-muted-foreground">Selected pages from the Kenya 2026 Economic Outlook. Get a taste of what decision-grade economic intelligence looks like.</p>
              <div className="mb-6">
                <p className="font-display font-bold text-2xl text-foreground">Free</p>
              </div>
              <Button variant="ghost" size="sm" className="w-full text-muted-foreground hover:text-foreground" asChild>
                <Link to="/sample-report"><Eye className="w-4 h-4 mr-1" /> Browse Free Sample</Link>
              </Button>
            </motion.div>

            {/* Flagship */}
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={1}
              className="rounded-lg border p-8 flex flex-col bg-primary text-primary-foreground border-primary ring-2 ring-primary/20">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-semibold px-2 py-0.5 rounded-pill bg-gold text-gold-foreground">Flagship</span>
                <Globe className="w-5 h-5 opacity-60" />
              </div>
              <h3 className="font-display font-bold text-xl mb-3">Kenya 2026 Economic Outlook</h3>
              <p className="text-sm leading-relaxed mb-6 flex-1 opacity-80">120+ page flagship report. GDP, inflation, currency, fiscal policy, and 10 sector deep-dives. The definitive intelligence product for Kenya.</p>
              <div className="mb-6">
                <p className="font-display font-bold text-2xl">$495</p>
                <p className="text-xs mt-1 opacity-60">Single organization license</p>
              </div>
              <div className="flex flex-col gap-2">
                <Button variant="gold" size="sm" className="w-full hover-sink" asChild>
                  <Link to="/kenya-2026">Purchase Item <ArrowRight className="ml-1" /></Link>
                </Button>
                <Button variant="ghost" size="sm" className="w-full text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10" asChild>
                  <Link to="/sample-report"><Eye className="w-4 h-4 mr-1" /> Browse Free Sample</Link>
                </Button>
              </div>
            </motion.div>

            {/* Sector Reports */}
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={2}
              className="rounded-lg border bg-background border-border card-shadow p-8 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-semibold px-2 py-0.5 rounded-pill bg-primary/10 text-primary">Focused</span>
                <BarChart3 className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-display font-bold text-xl mb-3 text-foreground">Sector Insight Reports</h3>
              <p className="text-sm leading-relaxed mb-6 flex-1 text-muted-foreground">Shorter, sharper, sector-specific analysis. Tourism, financial services, agriculture, energy — with opportunity and risk mapping.</p>
              <div className="mb-6">
                <p className="font-display font-bold text-2xl text-foreground">$95 – $250</p>
                <p className="text-xs mt-1 text-muted-foreground">Per sector report</p>
              </div>
              <Button variant="hero-outline" size="sm" className="w-full hover-sink" onClick={() => openInterest("Sector Insight Reports")}>
                Register Interest <ArrowRight className="ml-1" />
              </Button>
            </motion.div>
          </div>

          {/* Sector detail grid */}
          <div className="mt-10">
            <h3 className="font-display font-semibold text-foreground mb-6">Upcoming Sector Reports</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { title: "Kenya Banking Sector Outlook", price: "$195", type: "Financial Services" },
                { title: "Africa Tourism Sector Brief", price: "$150", type: "Tourism" },
                { title: "Kenya Agriculture Outlook", price: "$195", type: "Agriculture" },
                { title: "Energy & Infrastructure Brief", price: "$195", type: "Energy" },
              ].map((report, i) => (
                <motion.div key={report.title} initial="hidden" whileInView="visible" viewport={{ once: true }}
                  variants={fadeUp} custom={i} whileHover={{ y: -4 }}
                  className="bg-background rounded-lg border border-border p-6 card-shadow">
                  <span className="inline-block text-xs font-medium bg-primary/10 text-primary px-2 py-1 rounded-pill mb-3">{report.type}</span>
                  <h3 className="font-display font-bold text-foreground mb-2">{report.title}</h3>
                  <p className="font-display font-bold text-xl text-primary mb-4">{report.price}</p>
                  <Button variant="hero-outline" size="sm" className="w-full hover-sink" onClick={() => openInterest(report.title)}>
                    Register Interest <ArrowRight className="ml-1" />
                  </Button>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: Tailored Intelligence */}
      <section className="section-padding">
        <div className="container-page">
          <motion.p initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}
            className="font-mono text-xs text-gold uppercase tracking-widest mb-4">Tailored Intelligence</motion.p>
          <motion.h2 initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={1}
            className="text-3xl md:text-4xl font-bold text-foreground mb-12">Organization-Specific Economic Briefs</motion.h2>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={2}
            className="bg-background rounded-lg border border-border p-8 md:p-10 card-shadow">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="md:col-span-3">
                <div className="flex items-center gap-4 mb-4">
                  <span className="font-mono text-2xl font-bold text-gold">01</span>
                  <Briefcase className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-display font-bold text-2xl text-foreground mb-4">Organization-Specific Economic Brief</h3>
                <p className="text-muted-foreground leading-relaxed mb-4">We translate the macroeconomic environment into insights tailored specifically to your organization, sector, and strategy. Delivered as a structured, decision-ready report for strategy, planning, and investment decisions.</p>
                <p className="text-sm text-muted-foreground"><span className="font-semibold text-foreground">Deliverable:</span> Custom brief aligned to your organization's context</p>
                <p className="text-sm text-muted-foreground mt-2"><span className="font-semibold text-foreground">Investment:</span> $1,000 – $5,000+</p>
              </div>
              <div className="flex items-end">
                <Button variant="hero" className="hover-sink w-full md:w-auto" asChild>
                  <Link to="/contact">Request a Brief <ArrowRight className="ml-1" /></Link>
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Section 3: Executive Engagements */}
      <section className="section-padding bg-muted/50">
        <div className="container-page">
          <motion.p initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}
            className="font-mono text-xs text-gold uppercase tracking-widest mb-4">Executive Engagements</motion.p>
          <motion.h2 initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={1}
            className="text-3xl md:text-4xl font-bold text-foreground mb-12">Strategy Briefings & Advisory</motion.h2>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={2}
            className="bg-background rounded-lg border border-border p-8 md:p-10 card-shadow">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="md:col-span-3">
                <div className="flex items-center gap-4 mb-4">
                  <span className="font-mono text-2xl font-bold text-gold">02</span>
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-display font-bold text-2xl text-foreground mb-4">Executive Strategy Briefings</h3>
                <p className="text-muted-foreground leading-relaxed mb-4">We present the insights directly to your leadership team, break them down, and answer your questions in real time. Virtual or in-person. Often delivered alongside our Organization-Specific Economic Briefs to ensure insights translate into real action.</p>
                <p className="text-sm text-muted-foreground"><span className="font-semibold text-foreground">Deliverable:</span> Pre-read document + live briefing + follow-up memo</p>
                <p className="text-sm text-muted-foreground mt-2"><span className="font-semibold text-foreground">Investment:</span> $1,500 – $10,000+</p>
              </div>
              <div className="flex items-end">
                <Button variant="hero" className="hover-sink w-full md:w-auto" asChild>
                  <Link to="/contact">Book a Briefing <ArrowRight className="ml-1" /></Link>
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Section 4: Ongoing Intelligence */}
      <section className="section-padding">
        <div className="container-page">
          <motion.p initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}
            className="font-mono text-xs text-gold uppercase tracking-widest mb-4">Ongoing Intelligence</motion.p>
          <motion.h2 initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={1}
            className="text-3xl md:text-4xl font-bold text-foreground mb-12">Intelligence Access Retainer</motion.h2>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={2}
            className="bg-background rounded-lg border border-border p-8 md:p-10 card-shadow">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="md:col-span-3">
                <div className="flex items-center gap-4 mb-4">
                  <span className="font-mono text-2xl font-bold text-gold">03</span>
                  <Zap className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-display font-bold text-2xl text-foreground mb-4">Intelligence Access Retainer</h3>
                <p className="text-muted-foreground leading-relaxed mb-4">Continuous access to decision-grade economic insight. Quarterly deep-dives, real-time signals, and direct analyst access — so your team stays ahead of shifts, not reacting to them.</p>
                <p className="text-sm text-muted-foreground"><span className="font-semibold text-foreground">Deliverable:</span> Quarterly report + monthly updates + analyst hotline</p>
                <p className="text-sm text-muted-foreground mt-2"><span className="font-semibold text-foreground">Investment:</span> $300 – $1,000/month</p>
              </div>
              <div className="flex items-end">
                <Button variant="hero" className="hover-sink w-full md:w-auto" asChild>
                  <Link to="/contact">Discuss Access <ArrowRight className="ml-1" /></Link>
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Quick Insight Briefs */}
      <section className="section-padding bg-muted/50">
        <div className="container-page">
          <motion.p initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}
            className="font-mono text-xs text-gold uppercase tracking-widest mb-4">Quick Insights</motion.p>
          <motion.h2 initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={1}
            className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Quick Insight Briefs
          </motion.h2>
          <motion.p initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={2}
            className="text-muted-foreground mb-12 max-w-2xl">
            Short, focused 5–10 page briefs on specific topics. Get clarity on a single question — fast.
          </motion.p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: "Kenya Inflation Watch Q2 2026", price: "$25", topic: "Inflation" },
              { title: "KES vs USD: H2 Projection Brief", price: "$35", topic: "Currency" },
              { title: "Tourism Sector Snapshot", price: "$15", topic: "Tourism" },
              { title: "Agriculture Export Risk Brief", price: "$25", topic: "Agriculture" },
            ].map((brief, i) => (
              <motion.div key={brief.title} initial="hidden" whileInView="visible" viewport={{ once: true }}
                variants={fadeUp} custom={i} whileHover={{ y: -4 }}
                className="bg-background rounded-lg border border-border p-6 card-shadow">
                <span className="inline-block text-xs font-medium bg-accent/10 text-accent px-2 py-1 rounded-pill mb-3">{brief.topic}</span>
                <h3 className="font-display font-bold text-foreground mb-2 text-sm">{brief.title}</h3>
                <p className="font-display font-bold text-xl text-primary mb-4">{brief.price}</p>
                <Button variant="hero-outline" size="sm" className="w-full hover-sink" onClick={() => openInterest(brief.title)}>
                  Register Interest <ArrowRight className="ml-1" />
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding bg-primary">
        <div className="container-page text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-6">
            Not sure where to start?
          </h2>
          <p className="text-lg text-primary-foreground/70 mb-8 max-w-xl mx-auto">
            Tell us what you're trying to decide, and we'll recommend the right intelligence product or engagement for your team.
          </p>
          <Button variant="gold" size="lg" className="hover-sink" asChild>
            <Link to="/contact">Get in Touch <ArrowRight className="ml-1" /></Link>
          </Button>
        </div>
      </section>

      <ProductInterestModal
        open={interestModal.open}
        onOpenChange={(open) => setInterestModal(prev => ({ ...prev, open }))}
        productTitle={interestModal.title}
      />
    </Layout>
  );
};

export default IntelligenceMarketplace;
