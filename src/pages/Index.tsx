import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import {
  ArrowRight, BarChart3, FileText, Users, Briefcase, TrendingUp, Shield, Zap, Target,
  Lock, Check, Globe, Mic, Video, BookOpen
} from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: [0.2, 0, 0, 1] as const }
  })
};

const countries = [
  { name: "Kenya", flag: "🇰🇪", status: "available", description: "Comprehensive 2026 economic outlook with 10 sector deep-dives.", href: "/kenya-2026" },
  { name: "South Africa", flag: "🇿🇦", status: "coming", description: "Fiscal trajectory, mining outlook, and policy risk analysis." },
  { name: "Nigeria", flag: "🇳🇬", status: "coming", description: "Currency dynamics, oil dependency, and diversification signals." },
  { name: "Egypt", flag: "🇪🇬", status: "coming", description: "IMF reform roadmap, Suez economics, and growth projections." },
  { name: "Rwanda", flag: "🇷🇼", status: "coming", description: "Innovation hub trajectory and regional integration outlook." },
];

const services = [
  {
    number: "01", icon: FileText, title: "Country Economic Outlook Reports",
    description: "Comprehensive macro-to-micro analysis of a country's economic trajectory. Global, regional, and local dynamics unpacked through data, theory, and real-world insight.",
  },
  {
    number: "02", icon: BarChart3, title: "Organization-Specific Economic Briefs",
    description: "Tailored economic intelligence that translates a country's outlook into clear implications for your specific company. Delivered as a structured, decision-ready report.",
  },
  {
    number: "03", icon: Users, title: "Executive Strategy Briefings",
    description: "A 90-minute in-person or virtual session with your leadership team, where we present the insights and break down the implications for your business — ensuring clarity, alignment, and informed decision-making.",
  },
  {
    number: "04", icon: Briefcase, title: "Quarterly Intelligence Retainer",
    description: "Continuous access to decision-grade economic insight. Quarterly deep-dives, real-time signals, and direct analyst access — so your team stays ahead of shifts.",
  },
];

const products = [
  { title: "Kenya 2026 Economic Outlook", price: "$495", description: "120+ page flagship report covering GDP, inflation, currency, and 10 sectors.", featured: true, href: "/kenya-2026" },
  { title: "Tourism Sector Brief", price: "$195", description: "Post-pandemic recovery trajectory, revenue forecasts, and policy impacts.", featured: false, href: "/contact" },
  { title: "Financial Services Brief", price: "$195", description: "Banking, fintech, and digital lending regulatory landscape.", featured: false, href: "/contact" },
  { title: "Agriculture Sector Brief", price: "$195", description: "Climate risk, export opportunity, and value chain analysis.", featured: false, href: "/contact" },
];

const insights = [
  { title: "Kenya's Fiscal Consolidation: What It Means for Corporate Tax", date: "Mar 2026", read: "6 min", category: "Fiscal Policy", type: "article" },
  { title: "Agriculture Sector Outlook: Climate Risk and Export Opportunity", date: "Feb 2026", read: "8 min", category: "Agriculture", type: "article" },
  { title: "The KES Trajectory: Projections for H2 2026", date: "Feb 2026", read: "5 min", category: "Currency", type: "article" },
];

const team = [
  { name: "Prince Muraguri", role: "Founder & CEO", initials: "PM", bio: "Economic intelligence strategist with deep expertise in data-driven African market analysis." },
  { name: "Moses Macharia", role: "Senior Analyst", initials: "MM", bio: "Macroeconomic researcher specializing in East African fiscal policy and trade dynamics." },
  { name: "Noel Lutwama", role: "Strategy Consultant", initials: "NL", bio: "Cross-border strategy advisor with experience across 12 African economies." },
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
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="font-mono text-xs text-gold uppercase tracking-widest mb-6"
              >
                Economic Intelligence · Africa
              </motion.p>
              <motion.h1
                initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.2, 0, 0, 1] as const }}
                className="text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.1] text-foreground mb-6"
              >
                Africa's Economies.{" "}
                <span className="text-primary">Explained for Real Decisions.</span>
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.5 }}
                className="text-lg text-muted-foreground max-w-xl leading-relaxed mb-8"
              >
                We translate complex macroeconomic trends across Africa into clear, actionable insight for businesses, investors, and decision-makers.
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25, duration: 0.5 }}
                className="flex flex-col sm:flex-row gap-4"
              >
                <Button variant="hero" size="lg" className="hover-sink" asChild>
                  <Link to="/kenya-2026">View Kenya 2026 Outlook <ArrowRight className="ml-1" /></Link>
                </Button>
                <Button variant="hero-outline" size="lg" className="hover-sink" asChild>
                  <a href="#africa-coverage">Explore Africa Coverage</a>
                </Button>
              </motion.div>
            </div>
            <motion.div
              initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.7, ease: [0.2, 0, 0, 1] as const }}
              className="lg:col-span-2"
            >
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

      {/* Africa Coverage */}
      <section id="africa-coverage" className="section-padding bg-muted/50">
        <div className="container-page">
          <motion.p initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}
            className="font-mono text-xs text-gold uppercase tracking-widest mb-4">Coverage</motion.p>
          <motion.h2 initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={1}
            className="text-3xl md:text-4xl font-bold text-foreground mb-4">Pan-African Economic Intelligence</motion.h2>
          <motion.p initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={2}
            className="text-lg text-muted-foreground mb-12 max-w-2xl">
            Deep-dive country reports for the continent's most dynamic economies. Starting with Kenya, expanding across the continent.
          </motion.p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {countries.map((country, i) => (
              <motion.div
                key={country.name}
                initial="hidden" whileInView="visible" viewport={{ once: true }}
                variants={fadeUp} custom={i}
                className={`relative rounded-lg border p-6 transition-all ${
                  country.status === "available"
                    ? "bg-background border-primary/30 card-shadow-lg"
                    : "bg-background/60 border-border backdrop-blur-sm"
                }`}
              >
                {country.status === "coming" && (
                  <div className="absolute inset-0 bg-background/40 backdrop-blur-[2px] rounded-lg z-10 flex flex-col items-center justify-center">
                    <Lock className="w-5 h-5 text-muted-foreground mb-2" />
                    <span className="text-sm font-semibold text-muted-foreground">Coming Soon</span>
                    <span className="text-xs text-muted-foreground mt-1">In development</span>
                  </div>
                )}
                <span className="text-3xl mb-3 block">{country.flag}</span>
                <h3 className="font-display font-bold text-foreground mb-2">{country.name}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed mb-4">{country.description}</p>
                {country.status === "available" && (
                  <Button variant="hero" size="sm" className="w-full hover-sink" asChild>
                    <Link to={country.href!}>View Report <ArrowRight className="ml-1" /></Link>
                  </Button>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

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
                className="text-lg text-muted-foreground leading-relaxed mb-8">
                A comprehensive macro-to-micro analysis of Kenya's economic trajectory, translating global, regional, and domestic dynamics into clear strategic insight.
              </motion.p>
              <motion.ul initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={3}
                className="space-y-3 mb-8">
                {[
                  "GDP, inflation, and currency projections calibrated for 2026",
                  "10 sectors mapped with opportunity and risk vectors",
                  "Policy tracker: fiscal, regulatory, and trade",
                  "Investment thesis and capital allocation framework",
                  "Quarterly update supplements included",
                ].map((b) => (
                  <li key={b} className="flex items-start gap-3">
                    <Check className="w-4 h-4 text-accent mt-1 flex-shrink-0" />
                    <span className="text-sm text-muted-foreground">{b}</span>
                  </li>
                ))}
              </motion.ul>
              <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={4}
                className="flex flex-col sm:flex-row gap-4">
                <Button variant="hero" size="lg" className="hover-sink" asChild>
                  <Link to="/kenya-2026">Buy Report — $495 <ArrowRight className="ml-1" /></Link>
                </Button>
                <Button variant="hero-outline" size="lg" className="hover-sink" asChild>
                  <Link to="/sample-report">Download Sample</Link>
                </Button>
              </motion.div>
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
                    { icon: Shield, label: "Risk & opportunity mapping" },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-3">
                      <item.icon className="w-4 h-4 opacity-60" />
                      <span className="text-sm opacity-80">{item.label}</span>
                    </div>
                  ))}
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
            {services.map((service, i) => (
              <motion.div
                key={service.number}
                initial="hidden" whileInView="visible" viewport={{ once: true }}
                variants={fadeUp} custom={i}
                className="bg-background rounded-lg border-t-2 border-t-primary border border-border p-8 card-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <span className="font-mono text-2xl font-bold text-gold">{service.number}</span>
                  <service.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-display font-bold text-xl text-foreground mb-3">{service.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{service.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Products / Store */}
      <section className="section-padding">
        <div className="container-page">
          <motion.p initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}
            className="font-mono text-xs text-gold uppercase tracking-widest mb-4">Products</motion.p>
          <motion.h2 initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={1}
            className="text-3xl md:text-4xl font-bold text-foreground mb-4">Explore Our Reports & Products</motion.h2>
          <motion.p initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={2}
            className="text-lg text-muted-foreground mb-12 max-w-2xl">Premium economic intelligence, available on demand.</motion.p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((product, i) => (
              <motion.div
                key={product.title}
                initial="hidden" whileInView="visible" viewport={{ once: true }}
                variants={fadeUp} custom={i}
                whileHover={{ y: -4 }}
                className={`bg-background rounded-lg border p-6 card-shadow flex flex-col ${
                  product.featured ? "border-primary/30 ring-1 ring-primary/20" : "border-border"
                }`}
              >
                {product.featured && (
                  <span className="inline-block text-xs font-semibold bg-accent text-accent-foreground px-2 py-0.5 rounded-pill mb-3 w-fit">Featured</span>
                )}
                <h3 className="font-display font-bold text-foreground mb-2">{product.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed mb-4 flex-1">{product.description}</p>
                <p className="font-display font-bold text-xl text-primary mb-4">{product.price}</p>
                <Button variant={product.featured ? "hero" : "hero-outline"} size="sm" className="w-full hover-sink" asChild>
                  <Link to={product.href}>{product.featured ? "Buy Report" : "Inquire"} <ArrowRight className="ml-1" /></Link>
                </Button>
              </motion.div>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Button variant="hero-outline" size="lg" className="hover-sink" asChild>
              <Link to="/products">View All Products <ArrowRight className="ml-1" /></Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Insights */}
      <section className="section-padding bg-muted/50">
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

          {/* Category tabs */}
          <div className="flex gap-4 mb-8 flex-wrap">
            {[
              { icon: BookOpen, label: "Articles" },
              { icon: Mic, label: "Podcasts" },
              { icon: Video, label: "Videos" },
              { icon: BarChart3, label: "Research" },
            ].map((tab) => (
              <div key={tab.label}
                className="flex items-center gap-2 px-4 py-2 rounded-pill border border-border bg-background text-sm font-medium text-muted-foreground hover:text-primary hover:border-primary/30 transition-colors cursor-pointer">
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </div>
            ))}
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

      {/* Team */}
      <section className="section-padding">
        <div className="container-page">
          <motion.p initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}
            className="font-mono text-xs text-gold uppercase tracking-widest mb-4">Team</motion.p>
          <motion.h2 initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={1}
            className="text-3xl md:text-4xl font-bold text-foreground mb-12">The People Behind Econsult Africa</motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {team.map((member, i) => (
              <motion.div
                key={member.name}
                initial="hidden" whileInView="visible" viewport={{ once: true }}
                variants={fadeUp} custom={i}
                className="bg-background rounded-lg border border-border p-8 card-shadow text-center"
              >
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                  <span className="font-display font-bold text-2xl text-primary">{member.initials}</span>
                </div>
                <h3 className="font-display font-bold text-lg text-foreground mb-1">{member.name}</h3>
                <p className="text-sm text-accent font-medium mb-3">{member.role}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{member.bio}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof / CTA */}
      <section className="section-padding bg-primary">
        <div className="container-page text-center">
          <motion.h2
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}
            className="text-3xl md:text-4xl font-bold text-primary-foreground mb-6"
          >
            Make Better Decisions in African Markets
          </motion.h2>
          <motion.p
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={1}
            className="text-lg text-primary-foreground/70 mb-8 max-w-xl mx-auto"
          >
            Whether you're planning, investing, or expanding — we help you understand what the economy actually means for you.
          </motion.p>
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={2}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Button variant="gold" size="lg" className="hover-sink" asChild>
              <Link to="/kenya-2026">Buy Kenya Report</Link>
            </Button>
            <Button size="lg" className="hover-sink bg-primary-foreground text-primary hover:bg-primary-foreground/90 font-display font-semibold" asChild>
              <Link to="/contact">Book a Consultation</Link>
            </Button>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
};

export default Index;
