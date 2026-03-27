import { motion } from "framer-motion";

import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import AfricaMapSection from "@/components/AfricaMapSection";
import WhoThisIsFor from "@/components/WhoThisIsFor";
import EmailCapture from "@/components/EmailCapture";
import SocialProof from "@/components/SocialProof";
import StickyCTA from "@/components/StickyCTA";
import ForecastWidget from "@/components/forecast/ForecastWidget";
import { articles } from "@/data/articles";
import princeMuraguriImg from "@/assets/prince-muraguri.png";
import mosesImg from "@/assets/moses-macharia.jpeg";
import paoloImg from "@/assets/paolo-avitabile.jfif";
import pedroImg from "@/assets/pedro-zorzano.jfif";
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


const insights = articles
  .filter((a) => a.contentType === "Articles")
  .slice(0, 3);


const team = [
{ name: "Prince Muraguri", role: "Founder & CEO", initials: "PM", img: princeMuraguriImg, bio: "Founder and Chief Economist of Econsult Africa. Career spans research, policy, and data analysis at CEGA (UC Berkeley), J-PAL Africa, and the Pharo Foundation. Specializes in translating complex macroeconomic trends into decision-focused intelligence." },
{ name: "Moses Macharia", role: "Senior Analyst", initials: "MM", img: mosesImg, bio: "Rigorous analytical capability specializing in fiscal policy, trade dynamics, and sector-level economic modelling across East African markets." },
];

const advisors = [
{ name: "Paolo Avitabile", role: "Advisory Board", img: paoloImg, bio: "Senior Business Controller at Nestlé Italy. Expertise in corporate finance, strategy, and multinational operations across European markets." },
{ name: "Pedro L. Zorzano", role: "Advisory Board", img: pedroImg, bio: "Consultant at Nfq Advisory (Madrid). Bridges technology, finance, and macroeconomic analysis across financial services consulting." },
];



const Index = () => {
  return (
    <Layout>
      
      <StickyCTA />
      <ForecastWidget />

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
                className="space-y-4 mb-6 max-w-xl">
                
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Most organizations receive economic updates.
                  <br />
                  <span className="font-medium text-foreground">Very few get insight they can actually use.</span>
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Econsult Africa translates macroeconomic trends across Africa into clear, decision-focused intelligence for businesses, investors, and strategy teams.
                </p>
              </motion.div>

              {/* Who this is for line */}
              <motion.p
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="text-sm font-medium text-foreground mb-4">
                For leadership teams, investors, and strategy units operating in Africa.
              </motion.p>

              {/* Micro trust signals */}
              <motion.div
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.22, duration: 0.5 }}
                className="flex flex-wrap gap-x-6 gap-y-2 mb-6">
                <span className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Check className="w-3.5 h-3.5 text-primary" /> Used for strategic planning and decision-making
                </span>
                <span className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Check className="w-3.5 h-3.5 text-primary" /> Designed for real-world application, not academic theory
                </span>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25, duration: 0.5 }}
                className="flex flex-col sm:flex-row gap-4 mb-4">
                
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
                className="text-sm text-accent font-medium">
                2026 planning cycles are already underway.
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

      {/* Who This Is For */}
      <WhoThisIsFor />

      {/* Solution Section */}
      <section className="section-padding bg-muted/50">
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

      {/* Flagship Product — Strengthened */}
      <section className="section-padding">
        <div className="container-page">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <motion.p initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}
              className="font-mono text-xs text-gold uppercase tracking-widest mb-4">Flagship Report</motion.p>
              <motion.h2 initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={1}
              className="text-3xl md:text-4xl font-bold text-foreground mb-6">Kenya 2026 Economic Outlook</motion.h2>
              <motion.p initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={2}
              className="text-lg text-muted-foreground leading-relaxed mb-6">
                A comprehensive, decision-focused analysis of Kenya's economic trajectory in 2026.
              </motion.p>

              {/* Why this matters */}
              <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={3}
              className="bg-muted/50 rounded-lg border border-border p-6 mb-6">
                <p className="font-display font-semibold text-foreground mb-3">Why this matters</p>
                <div className="space-y-2">
                  {[
                    "Move beyond generic economic updates",
                    "Understand what trends mean for your business",
                    "Make decisions with confidence, not guesswork",
                  ].map((item) => (
                    <div key={item} className="flex items-center gap-3">
                      <Check className="w-4 h-4 text-accent flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">{item}</span>
                    </div>
                  ))}
                </div>
              </motion.div>

              <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={4}
              className="space-y-2 mb-6">
                <p className="text-sm font-semibold text-foreground">What you get:</p>
                {[
                "Clear macroeconomic direction for 2026",
                "GDP, inflation, and currency projections you can plan around",
                "10 sector deep-dives with opportunity and risk vectors",
                "Policy tracker covering fiscal, regulatory, and trade shifts",
                "Investment thesis and capital allocation framework",
                ].map((b) =>
                <div key={b} className="flex items-start gap-3">
                    <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-muted-foreground">{b}</span>
                  </div>
                )}
              </motion.div>
              <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={5}
              className="flex flex-col sm:flex-row gap-4 mb-4">
                <Button variant="hero" size="lg" className="hover-sink" asChild>
                  <Link to="/kenya-2026">Buy Full Report — $495 <ArrowRight className="ml-1" /></Link>
                </Button>
                <Button variant="hero-outline" size="lg" className="hover-sink" asChild>
                  <Link to="/sample-report">Download Sample</Link>
                </Button>
              </motion.div>
              <motion.p initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={6}
              className="text-xs text-muted-foreground italic">
                Used during annual planning cycles and strategic reviews. 2026 planning is already happening.
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

      {/* Forecast Arena Promo */}
      <section className="section-padding bg-foreground overflow-hidden relative">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: "linear-gradient(hsl(var(--accent)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--accent)) 1px, transparent 1px)",
            backgroundSize: "60px 60px"
          }} />
        </div>
        <div className="container-page relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }}>
              <motion.p variants={fadeUp} custom={0} className="font-mono text-xs text-accent uppercase tracking-widest mb-4">New — Forecast Arena</motion.p>
              <motion.h2 variants={fadeUp} custom={1} className="text-3xl md:text-4xl font-bold text-background leading-[1.1] mb-4">
                Your Voice. <span className="text-accent">Africa's Future.</span>
              </motion.h2>
              <motion.p variants={fadeUp} custom={2} className="text-background/60 leading-relaxed mb-6">
                Predict the economic outcomes shaping Africa. Buy shares in your forecast from as little as $0.01.
                Each correct share pays $1. Let your insight work for you.
              </motion.p>
              <motion.div variants={fadeUp} custom={3} className="flex flex-wrap gap-3 mb-8">
                {[
                  { icon: BarChart3, text: "Real-time probabilities" },
                  { icon: TrendingUp, text: "Earn when you're right" },
                  { icon: Globe, text: "Africa-focused questions" },
                ].map(item => (
                  <span key={item.text} className="flex items-center gap-1.5 text-xs text-background/40">
                    <item.icon className="w-3.5 h-3.5 text-accent" />
                    {item.text}
                  </span>
                ))}
              </motion.div>
              <motion.div variants={fadeUp} custom={4}>
                <Button variant="gold" size="lg" className="hover-sink" asChild>
                  <Link to="/forecast-arena">Enter the Arena <ArrowRight className="ml-1" /></Link>
                </Button>
              </motion.div>
            </motion.div>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="bg-background/5 border border-background/10 rounded-lg p-6 space-y-4">
              {["Will Kenya's CBK cut rates in July 2026?", "Will inflation stay below 6% in Q3?", "Will the KES strengthen past 125/USD?"].map((q, i) => (
                <div key={i} className="flex items-center justify-between bg-background/5 rounded-md px-4 py-3 border border-background/10">
                  <span className="text-sm text-background/80 font-medium">{q}</span>
                  <span className="font-mono text-xs text-accent font-bold">{["67%", "42%", "31%"][i]} Yes</span>
                </div>
              ))}
              <p className="text-center text-xs text-background/30 font-mono">Live market data →</p>
            </motion.div>
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
            <Link key={post.slug} to={`/insights/${post.slug}`} className="block">
            <motion.article
              key={post.title}
              initial="hidden" whileInView="visible" viewport={{ once: true }}
              variants={fadeUp} custom={i}
              whileHover={{ y: -4 }}
              className="bg-background rounded-lg border border-border p-6 card-shadow hover-sink cursor-pointer">
              
                <div className="flex items-center gap-3 mb-4">
                  <span className="font-mono text-xs text-gold">{post.date}</span>
                  <span className="text-xs text-muted-foreground">· {post.readTime} read</span>
                </div>
                <span className="inline-block text-xs font-medium bg-primary/10 text-primary px-2 py-1 rounded-pill mb-3">{post.category}</span>
                <h3 className="font-display font-semibold text-foreground leading-snug">{post.title}</h3>
              </motion.article>
            </Link>
            )}
          </div>

          {/* Conversion bridge */}
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}
          className="mt-12 bg-primary/5 border border-primary/10 rounded-lg p-8 text-center">
            <p className="font-display font-semibold text-foreground text-lg mb-2">Want deeper insight?</p>
            <p className="text-sm text-muted-foreground mb-6">Go beyond the headlines with our full reports and advisory products.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="hero" size="default" className="hover-sink" asChild>
                <Link to="/kenya-2026">Buy Kenya Outlook <ArrowRight className="ml-1" /></Link>
              </Button>
              <Button variant="hero-outline" size="default" className="hover-sink" asChild>
                <Link to="/products">View All Products</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Social Proof */}
      <SocialProof />

      {/* Email Capture */}
      <EmailCapture />

      {/* Founder & Team */}
      <section className="section-padding bg-muted/50">
        <div className="container-page">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-16">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
              <p className="font-mono text-xs text-gold uppercase tracking-widest mb-4">Meet The Founder</p>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-2">Prince Muraguri</h2>
              <p className="text-accent font-medium mb-6">Founder & Chief Economist, Econsult Africa</p>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Prince Muraguri is the Founder and Chief Economist of Econsult Africa. His career spans research, policy, and data analysis at leading institutions including CEGA (UC Berkeley), J-PAL Africa, and the Pharo Foundation.
              </p>
              <p className="text-muted-foreground leading-relaxed mb-4">
                He specializes in translating complex macroeconomic trends into clear, decision-focused intelligence for leaders navigating dynamic and uncertain environments.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Prince holds a Master's in Economics and Finance from the Universidad de Navarra, a MicroMasters from MIT, and a Bachelor's from Strathmore University.
              </p>
            </motion.div>
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={1}
              className="flex justify-center">
              <img src={princeMuraguriImg} alt="Prince Muraguri" className="w-64 h-64 rounded-full object-cover card-shadow-lg" />
            </motion.div>
          </div>

          {/* Team */}
          <div className="mb-16">
            <motion.p initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}
              className="font-mono text-xs text-gold uppercase tracking-widest mb-4">The Team</motion.p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {team.filter((m) => m.name !== "Prince Muraguri").map((member, i) =>
              <motion.div key={member.name} initial="hidden" whileInView="visible" viewport={{ once: true }}
                variants={fadeUp} custom={i}
                className="bg-background rounded-lg border border-border p-6 card-shadow flex gap-5 items-start">
                  {member.img ? (
                    <img src={member.img} alt={member.name} className="w-16 h-16 rounded-full object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="font-display font-bold text-lg text-primary">{member.initials}</span>
                    </div>
                  )}
                  <div>
                    <h3 className="font-display font-bold text-foreground mb-1">{member.name}</h3>
                    <p className="text-xs text-accent font-medium mb-2">{member.role}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{member.bio}</p>
                  </div>
                </motion.div>
              )}
            </div>
          </div>

          {/* Advisory Board */}
          <div>
            <motion.p initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}
              className="font-mono text-xs text-gold uppercase tracking-widest mb-4">Advisory Board</motion.p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {advisors.map((advisor, i) =>
              <motion.div key={advisor.name} initial="hidden" whileInView="visible" viewport={{ once: true }}
                variants={fadeUp} custom={i}
                className="bg-background rounded-lg border border-border p-6 card-shadow flex gap-5 items-start">
                  <img src={advisor.img} alt={advisor.name} className="w-16 h-16 rounded-full object-cover flex-shrink-0" />
                  <div>
                    <h3 className="font-display font-bold text-foreground mb-1">{advisor.name}</h3>
                    <p className="text-xs text-accent font-medium mb-2">{advisor.role}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{advisor.bio}</p>
                  </div>
                </motion.div>
              )}
            </div>
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
              <Link to="/kenya-2026">Buy Kenya Report <ArrowRight className="ml-1" /></Link>
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
