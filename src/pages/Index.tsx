import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import AfricaMapSection from "@/components/AfricaMapSection";
import {
  ArrowRight, BarChart3, FileText, Users, Briefcase, TrendingUp, Shield,
  Check, Globe, Mic, Video, BookOpen, Target, Zap, AlertTriangle,
  Lightbulb, ArrowDown } from
"lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: [0.2, 0, 0, 1] as const }
  })
};




const services = [
{
  number: "01", icon: FileText, title: "Country Economic Outlook Reports",
  description: "Comprehensive macro-to-micro analysis of a country's economic trajectory. Global, regional, and local dynamics unpacked through data, theory, and real-world insight."
},
{
  number: "02", icon: BarChart3, title: "Organization-Specific Economic Briefs",
  description: "We translate the macroeconomic environment into insights tailored specifically to your organization, sector, and strategy. Delivered as a structured, decision-ready report."
},
{
  number: "03", icon: Users, title: "Executive Strategy Briefings",
  description: "We present the insights directly to your leadership team, break them down, and answer your questions in real time. Virtual or in-person."
},
{
  number: "04", icon: Briefcase, title: "Quarterly Intelligence Retainer",
  description: "Continuous access to decision-grade economic insight. Quarterly deep-dives, real-time signals, and direct analyst access."
}];


const insights = [
{ title: "Kenya's Fiscal Consolidation: What It Means for Corporate Tax", date: "Mar 2026", read: "6 min", category: "Fiscal Policy" },
{ title: "Agriculture Sector Outlook: Climate Risk and Export Opportunity", date: "Feb 2026", read: "8 min", category: "Agriculture" },
{ title: "The KES Trajectory: Projections for H2 2026", date: "Feb 2026", read: "5 min", category: "Currency" }];


const team = [
{ name: "Prince Muraguri", role: "Founder & CEO", initials: "PM", bio: "An economic intelligence strategist with experience in data-driven research, policy analysis, and applied economics across Africa. Known for translating complex economic ideas into clear, actionable insight." },
{ name: "Moses Macharia", role: "Senior Analyst", initials: "MM", bio: "Macroeconomic researcher specializing in East African fiscal policy, trade dynamics, and sector-level economic modelling." },
{ name: "Noel Lutwama", role: "Strategy Consultant", initials: "NL", bio: "Cross-border strategy advisor with experience across 12 African economies. Translates macroeconomic intelligence into actionable business frameworks." }];


const Index = () => {
  return (
    <Layout>
      {/* Hero */}
      <section className="section-padding overflow-hidden">
        <div className="container-page">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 lg:gap-16 items-center">
            <div className="lg:col-span-3">
              <motion.p
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="font-mono text-xs text-gold uppercase tracking-widest mb-6">
                
                Economic Intelligence · Africa
              </motion.p>
              <motion.h1
                initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.2, 0, 0, 1] as const }}
                className="text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.1] text-foreground mb-6">
                
                Africa's Economies.{" "}
                <span className="text-primary">Explained for Real Decisions.</span>
              </motion.h1>
              <motion.div
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.5 }}
                className="space-y-4 mb-8 max-w-xl">
                
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Most organizations receive economic updates.
                  <br />
                  <span className="font-medium text-foreground">Very few get insight they can actually use.</span>
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Econsult Africa translates macroeconomic trends across Africa into clear, decision-focused intelligence for businesses, investors, and strategy teams.
                </p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25, duration: 0.5 }}
                className="flex flex-col sm:flex-row gap-4 mb-6">
                
                <Button variant="hero" size="lg" className="hover-sink" asChild>
                  <Link to="/kenya-2026">Get Kenya 2026 Outlook <ArrowRight className="ml-1" /></Link>
                </Button>
                <Button variant="hero-outline" size="lg" className="hover-sink" asChild>
                  <a href="#africa-coverage">Explore Africa Coverage</a>
                </Button>
              </motion.div>
              <motion.p
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="text-sm text-muted-foreground italic">
                
                2026 planning is already happening. Are you working with the right economic picture?
              </motion.p>
            </div>
            <motion.div
              initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.7, ease: [0.2, 0, 0, 1] as const }}
              className="lg:col-span-2">
              
              <div className="relative">
                <div className="bg-primary rounded-lg p-8 text-primary-foreground card-shadow-lg" style={{ transform: "perspective(800px) rotateY(-8deg)" }}>
                  <p className="font-mono text-xs opacity-60 mb-2">ECONSULT AFRICA · 2026</p>
                  <h3 className="font-display font-bold text-2xl mb-4">Kenya 2026<br />Economic Outlook</h3>
                  <div className="h-px bg-primary-foreground/20 mb-4" />
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm"><span className="opacity-60">GDP Growth (Proj.)</span><span className="font-mono font-semibold">5.2%</span></div>
                    <div className="flex justify-between text-sm"><span className="opacity-60">Inflation (Avg.)</span><span className="font-mono font-semibold">4.3%</span></div>
                    <div className="flex justify-between text-sm"><span className="opacity-60">Key Sectors</span><span className="font-mono font-semibold">10 Analyzed</span></div>
                  </div>
                </div>
                <motion.div animate={{ y: [0, -6, 0] }} transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                className="absolute -top-4 -right-4 bg-background card-shadow rounded-lg px-4 py-2 border border-border">
                  <p className="font-mono text-xs text-gold font-semibold">+5.2% GDP</p>
                </motion.div>
                <motion.div animate={{ y: [0, 6, 0] }} transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut" }}
                className="absolute -bottom-4 -left-4 bg-background card-shadow rounded-lg px-4 py-2 border border-border">
                  <p className="font-mono text-xs text-primary font-semibold">Pan-African</p>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="section-padding bg-foreground">
        <div className="container-page">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <motion.p initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}
              className="font-mono text-xs text-gold uppercase tracking-widest mb-4">The Gap</motion.p>
              <motion.h2 initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={1}
              className="text-3xl md:text-4xl font-bold text-background mb-6">The Problem with Most Economic Insights

              </motion.h2>
              <motion.p initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={2}
              className="text-lg text-background/70 leading-relaxed mb-6">
                Most economic reports tell you <span className="text-background font-medium">what is happening</span>.
                <br />
                They rarely tell you <span className="text-gold font-medium">what it means for you</span>.
              </motion.p>
              <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={3}
              className="space-y-3 mb-8">
                <p className="text-background/50 text-sm">You get:</p>
                {["Broad generic summaries", "High level country commentary", "Data without direction"].map((item) =>
                <div key={item} className="flex items-center gap-3">
                    <AlertTriangle className="w-4 h-4 text-gold/60 flex-shrink-0" />
                    <span className="text-background/60 text-sm">{item}</span>
                  </div>
                )}
              </motion.div>
            </div>
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={2}>
              <div className="bg-background/5 border border-background/10 rounded-lg p-8">
                <p className="text-background/50 text-sm mb-4">And yet, your decisions require clarity:</p>
                <div className="space-y-4">
                  {[
                  "Should we expand into this market?",
                  "Should we invest now — or wait?",
                  "What does this policy shift mean for our sector?"].
                  map((q) =>
                  <div key={q} className="flex items-start gap-3">
                      <Target className="w-4 h-4 text-gold mt-1 flex-shrink-0" />
                      <span className="text-background/80 font-medium">{q}</span>
                    </div>
                  )}
                </div>
                <div className="mt-8 pt-6 border-t border-background/10">
                  <p className="text-gold font-display font-semibold text-lg">
                    That gap is where Econsult Africa operates.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="section-padding">
        <div className="container-page">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <motion.p initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}
            className="font-mono text-xs text-gold uppercase tracking-widest mb-4">Our Approach</motion.p>
            <motion.h2 initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={1}
            className="text-3xl md:text-4xl font-bold text-foreground mb-6">
              From Economic Noise to Strategic Clarity
            </motion.h2>
            <motion.p initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={2}
            className="text-lg text-muted-foreground leading-relaxed mb-4">
              We don't just analyze economies. <span className="text-foreground font-medium">We translate them.</span>
            </motion.p>
            <motion.p initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={3}
            className="text-muted-foreground leading-relaxed">
              Every insight is built around one question:
            </motion.p>
            <motion.p initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={4}
            className="text-xl text-primary font-display font-bold mt-4">
              "So what does this mean for your organization?"
            </motion.p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
            { icon: BarChart3, title: "Macroeconomic Analysis", description: "Deep country-level economic research — GDP, inflation, currency, fiscal policy — grounded in data and real-world context." },
            { icon: Lightbulb, title: "Sector-Level Interpretation", description: "We go beyond the macro. Every sector gets mapped with specific opportunity and risk vectors relevant to operators." },
            { icon: Zap, title: "Business Implications", description: "The 'so what' layer. We translate economic signals into practical insight your team can act on." }].
            map((item, i) =>
            <motion.div key={item.title} initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={fadeUp} custom={i}
            className="text-center p-8">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <item.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-display font-bold text-foreground mb-3">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
              </motion.div>
            )}
          </div>
          <motion.p initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}
          className="text-center text-muted-foreground mt-8">
            So you can move from <span className="font-medium text-foreground">information</span> → <span className="font-medium text-primary">decision</span>.
          </motion.p>
        </div>
      </section>

      {/* Africa Coverage — Premium Map Section */}
      <AfricaMapSection />

      {/* Flagship Product */}
      <section className="section-padding">
        <div className="container-page">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <motion.p initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}
              className="font-mono text-xs text-gold uppercase tracking-widest mb-4">Flagship Report</motion.p>
              <motion.h2 initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={1}
              className="text-3xl md:text-4xl font-bold text-foreground mb-6">Kenya 2026 Economic Outlook</motion.h2>
              <motion.p initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={2}
              className="text-lg text-muted-foreground leading-relaxed mb-4">
                A comprehensive, decision-focused analysis of Kenya's economic trajectory in 2026.
              </motion.p>
              <motion.p initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={3}
              className="text-muted-foreground leading-relaxed mb-4">
                This is not a generic outlook. It is designed for:
              </motion.p>
              <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={4}
              className="space-y-2 mb-6">
                {["Leadership teams making strategic decisions", "Strategy & planning units preparing for 2026", "Investors and operators evaluating Kenya"].map((item) =>
                <div key={item} className="flex items-center gap-3">
                    <Check className="w-4 h-4 text-accent flex-shrink-0" />
                    <span className="text-sm text-muted-foreground">{item}</span>
                  </div>
                )}
              </motion.div>
              <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={5}
              className="space-y-2 mb-8">
                <p className="text-sm font-semibold text-foreground">What you get:</p>
                {[
                "Clear macroeconomic direction for 2026",
                "10 sector-level deep-dives with implications",
                "Practical insight for decision-making",
                "Quarterly update supplements included"].
                map((b) =>
                <div key={b} className="flex items-start gap-3">
                    <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-muted-foreground">{b}</span>
                  </div>
                )}
              </motion.div>
              <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={6}
              className="flex flex-col sm:flex-row gap-4 mb-4">
                <Button variant="hero" size="lg" className="hover-sink" asChild>
                  <Link to="/kenya-2026">Buy Full Report — $495 <ArrowRight className="ml-1" /></Link>
                </Button>
                <Button variant="hero-outline" size="lg" className="hover-sink" asChild>
                  <Link to="/sample-report">Download Sample</Link>
                </Button>
              </motion.div>
              <motion.p initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={7}
              className="text-xs text-muted-foreground italic">
                Used during annual planning cycles and strategic reviews.
              </motion.p>
            </div>
            <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.6 }}>
              <div className="bg-primary rounded-lg p-10 text-primary-foreground card-shadow-lg">
                <p className="font-mono text-xs opacity-60 mb-6">ECONSULT AFRICA · 2026</p>
                <h3 className="font-display font-bold text-3xl mb-6">Kenya 2026<br />Economic Outlook</h3>
                <div className="space-y-4 mb-8">
                  {[
                  { icon: FileText, label: "120+ page PDF report" },
                  { icon: BarChart3, label: "10 sector deep-dives" },
                  { icon: Shield, label: "Risk & opportunity mapping" }].
                  map((item) =>
                  <div key={item.label} className="flex items-center gap-3">
                      <item.icon className="w-4 h-4 opacity-60" />
                      <span className="text-sm opacity-80">{item.label}</span>
                    </div>
                  )}
                </div>
                <div className="border-t border-primary-foreground/20 pt-6">
                  <p className="font-display text-4xl font-bold">$495</p>
                  <p className="text-xs opacity-60 mt-1">Single organization license</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="section-padding bg-muted/50">
        <div className="container-page">
          <motion.p initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}
          className="font-mono text-xs text-gold uppercase tracking-widest mb-4">Services</motion.p>
          <motion.h2 initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={1}
          className="text-3xl md:text-4xl font-bold text-foreground mb-12">From Insight to Action</motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {services.map((service, i) =>
            <motion.div
              key={service.number}
              initial="hidden" whileInView="visible" viewport={{ once: true }}
              variants={fadeUp} custom={i}
              className="bg-background rounded-lg border-t-2 border-t-primary border border-border p-8 card-shadow">
              
                <div className="flex items-start justify-between mb-4">
                  <span className="font-mono text-2xl font-bold text-gold">{service.number}</span>
                  <service.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-display font-bold text-xl text-foreground mb-3">{service.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{service.description}</p>
              </motion.div>
            )}
          </div>
        </div>
      </section>

      {/* Insights */}
      <section className="section-padding">
        <div className="container-page">
          <div className="flex items-end justify-between mb-12">
            <div>
              <motion.p initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}
              className="font-mono text-xs text-gold uppercase tracking-widest mb-4">Insights</motion.p>
              <motion.h2 initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={1}
              className="text-3xl md:text-4xl font-bold text-foreground">Insights from The Economic Whisperer</motion.h2>
            </div>
            <Link to="/insights" className="hidden md:inline-flex text-sm font-medium text-primary hover:text-accent transition-colors">
              View all <ArrowRight className="ml-1 w-4 h-4" />
            </Link>
          </div>
          <motion.p initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={2}
          className="text-muted-foreground mb-8 max-w-2xl">
            Ideas, analysis, and perspectives on African economies — beyond the headlines.
          </motion.p>

          <div className="flex gap-4 mb-8 flex-wrap">
            {[
            { icon: BookOpen, label: "Articles" },
            { icon: Mic, label: "Podcasts" },
            { icon: Video, label: "Videos" },
            { icon: BarChart3, label: "Research" }].
            map((tab) =>
            <div key={tab.label}
            className="flex items-center gap-2 px-4 py-2 rounded-pill border border-border bg-background text-sm font-medium text-muted-foreground hover:text-primary hover:border-primary/30 transition-colors cursor-pointer">
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {insights.map((post, i) =>
            <motion.article
              key={post.title}
              initial="hidden" whileInView="visible" viewport={{ once: true }}
              variants={fadeUp} custom={i}
              whileHover={{ y: -4 }}
              className="bg-background rounded-lg border border-border p-6 card-shadow hover-sink cursor-pointer">
              
                <div className="flex items-center gap-3 mb-4">
                  <span className="font-mono text-xs text-gold">{post.date}</span>
                  <span className="text-xs text-muted-foreground">· {post.read} read</span>
                </div>
                <span className="inline-block text-xs font-medium bg-primary/10 text-primary px-2 py-1 rounded-pill mb-3">{post.category}</span>
                <h3 className="font-display font-semibold text-foreground leading-snug">{post.title}</h3>
              </motion.article>
            )}
          </div>
        </div>
      </section>

      {/* Founder */}
      <section className="section-padding bg-muted/50">
        <div className="container-page">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
              <p className="font-mono text-xs text-gold uppercase tracking-widest mb-4">Meet The Founder</p>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-2">Prince Muraguri</h2>
              <p className="text-accent font-medium mb-6">Founder, Econsult Africa</p>
              <p className="text-muted-foreground leading-relaxed mb-4">
                An economic intelligence strategist with experience in data-driven research, policy analysis, and applied economics across Africa.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Known for translating complex economic ideas into clear, actionable insight — Prince founded Econsult Africa to close the gap between macroeconomic data and the decisions that actually matter.
              </p>
            </motion.div>
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={1}>
              <div className="grid grid-cols-2 gap-6">
                {team.filter((m) => m.name !== "Prince Muraguri").map((member) =>
                <div key={member.name} className="bg-background rounded-lg border border-border p-6 card-shadow">
                    <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                      <span className="font-display font-bold text-lg text-primary">{member.initials}</span>
                    </div>
                    <h3 className="font-display font-bold text-foreground mb-1">{member.name}</h3>
                    <p className="text-xs text-accent font-medium mb-3">{member.role}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{member.bio}</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="section-padding bg-primary">
        <div className="container-page text-center">
          <motion.h2
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}
            className="text-3xl md:text-4xl font-bold text-primary-foreground mb-6">
            
            Better Decisions Start with Better Economic Insight
          </motion.h2>
          <motion.p
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={1}
            className="text-lg text-primary-foreground/70 mb-4 max-w-2xl mx-auto">
            
            If your organization operates in Africa, understanding the economic landscape is not optional.
          </motion.p>
          <motion.p
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={2}
            className="text-xl font-display font-semibold text-primary-foreground mb-8">
            
            It is strategic.
          </motion.p>
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={3}
            className="flex flex-col sm:flex-row gap-4 justify-center">
            
            <Button variant="gold" size="lg" className="hover-sink" asChild>
              <Link to="/kenya-2026">Buy Kenya Report</Link>
            </Button>
            <Button size="lg" className="hover-sink bg-primary-foreground text-primary hover:bg-primary-foreground/90 font-display font-semibold" asChild>
              <Link to="/contact">Book a Consultation</Link>
            </Button>
          </motion.div>
        </div>
      </section>
    </Layout>);

};

export default Index;