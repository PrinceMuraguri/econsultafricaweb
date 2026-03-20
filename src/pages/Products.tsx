import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { ArrowRight, FileText, BarChart3, Users, Briefcase, Zap, Globe } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.5, ease: [0.2, 0, 0, 1] as const } }),
};

const tiers = [
  {
    tier: "Free",
    badge: "Lead Generation",
    icon: FileText,
    title: "Sample Report Preview",
    description: "Selected pages from the Kenya 2026 Economic Outlook. Get a taste of what decision-grade economic intelligence looks like.",
    price: "Free",
    cta: "Browse the Sample",
    href: "/sample-report",
    featured: false,
  },
  {
    tier: "Core",
    badge: "Flagship",
    icon: Globe,
    title: "Kenya 2026 Economic Outlook",
    description: "120+ page flagship report. GDP, inflation, currency, fiscal policy, and 10 sector deep-dives. The definitive intelligence product for Kenya.",
    price: "$495",
    priceNote: "Single organization license",
    cta: "Buy Report",
    href: "/kenya-2026",
    featured: true,
  },
  {
    tier: "Sector",
    badge: "Focused",
    icon: BarChart3,
    title: "Sector Insight Reports",
    description: "Shorter, sharper, sector-specific analysis. Tourism, financial services, agriculture, energy — with opportunity and risk mapping.",
    price: "$95 – $250",
    priceNote: "Per sector report",
    cta: "Inquire",
    href: "/contact",
    featured: false,
  },
  {
    tier: "Custom",
    badge: "Tailored",
    icon: Briefcase,
    title: "Organization-Specific Economic Brief",
    description: "We translate the macroeconomic environment into insights tailored specifically to your organization, sector, and strategy.",
    price: "$1,000 – $5,000+",
    priceNote: "Scope-dependent",
    cta: "Request a Brief",
    href: "/contact",
    featured: false,
  },
  {
    tier: "Executive",
    badge: "Advisory",
    icon: Users,
    title: "Executive Strategy Briefings",
    description: "We present the insights directly to your leadership team, break them down, and answer your questions in real time. Virtual or in-person.",
    price: "$1,500 – $10,000+",
    priceNote: "Session-based pricing",
    cta: "Book a Briefing",
    href: "/contact",
    featured: false,
  },
  {
    tier: "Retainer",
    badge: "Ongoing",
    icon: Zap,
    title: "Intelligence Access Retainer",
    description: "Ongoing insights, priority updates, and direct advisory access. Stay ahead of economic shifts — not reacting to them.",
    price: "$300 – $1,000/mo",
    priceNote: "Monthly or annual",
    cta: "Discuss Access",
    href: "/contact",
    featured: false,
  },
];

const quickInsights = [
  { title: "Kenya Inflation Watch Q2 2026", price: "$25", topic: "Inflation" },
  { title: "KES vs USD: H2 Projection Brief", price: "$35", topic: "Currency" },
  { title: "Tourism Sector Snapshot", price: "$15", topic: "Tourism" },
  { title: "Agriculture Export Risk Brief", price: "$25", topic: "Agriculture" },
];

const sectorReports = [
  { title: "Kenya Banking Sector Outlook", price: "$195", type: "Financial Services" },
  { title: "Africa Tourism Sector Brief", price: "$150", type: "Tourism" },
  { title: "Kenya Agriculture Outlook", price: "$195", type: "Agriculture" },
  { title: "Energy & Infrastructure Brief", price: "$195", type: "Energy" },
];

const Products = () => {
  return (
    <Layout>
      {/* Hero */}
      <section className="section-padding">
        <div className="container-page">
          <div className="max-w-3xl mb-16">
            <motion.p initial="hidden" animate="visible" variants={fadeUp} custom={0}
              className="font-mono text-xs text-gold uppercase tracking-widest mb-4">Products</motion.p>
            <motion.h1 initial="hidden" animate="visible" variants={fadeUp} custom={1}
              className="text-4xl md:text-5xl font-bold text-foreground leading-[1.1] mb-6">
              Economic Intelligence. On Demand.
            </motion.h1>
            <motion.p initial="hidden" animate="visible" variants={fadeUp} custom={2}
              className="text-lg text-muted-foreground leading-relaxed">
              Explore our growing library of reports, insights, and strategic tools designed for decision-makers operating in Africa.
            </motion.p>
          </div>

          {/* Product Tiers */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tiers.map((tier, i) => (
              <motion.div
                key={tier.title}
                initial="hidden" whileInView="visible" viewport={{ once: true }}
                variants={fadeUp} custom={i}
                className={`rounded-lg border p-8 flex flex-col ${
                  tier.featured
                    ? "bg-primary text-primary-foreground border-primary ring-2 ring-primary/20"
                    : "bg-background border-border card-shadow"
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-pill ${
                    tier.featured
                      ? "bg-gold text-gold-foreground"
                      : "bg-primary/10 text-primary"
                  }`}>
                    {tier.badge}
                  </span>
                  <tier.icon className={`w-5 h-5 ${tier.featured ? "opacity-60" : "text-primary"}`} />
                </div>
                <h3 className={`font-display font-bold text-xl mb-3 ${tier.featured ? "" : "text-foreground"}`}>
                  {tier.title}
                </h3>
                <p className={`text-sm leading-relaxed mb-6 flex-1 ${
                  tier.featured ? "opacity-80" : "text-muted-foreground"
                }`}>
                  {tier.description}
                </p>
                <div className="mb-6">
                  <p className={`font-display font-bold text-2xl ${tier.featured ? "" : "text-foreground"}`}>
                    {tier.price}
                  </p>
                  {tier.priceNote && (
                    <p className={`text-xs mt-1 ${tier.featured ? "opacity-60" : "text-muted-foreground"}`}>
                      {tier.priceNote}
                    </p>
                  )}
                </div>
                <Button
                  variant={tier.featured ? "gold" : "hero-outline"}
                  size="sm"
                  className="w-full hover-sink"
                  asChild
                >
                  <Link to={tier.href}>
                    {tier.cta} <ArrowRight className="ml-1" />
                  </Link>
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Sector Reports Detail */}
      <section className="section-padding bg-muted/50">
        <div className="container-page">
          <motion.p initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}
            className="font-mono text-xs text-gold uppercase tracking-widest mb-4">Sector Reports</motion.p>
          <motion.h2 initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={1}
            className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Focused Sector Intelligence
          </motion.h2>
          <motion.p initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={2}
            className="text-muted-foreground mb-12 max-w-2xl">
            Shorter, sharper reports that zero in on a single sector — with the same decision-focused lens.
          </motion.p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {sectorReports.map((report, i) => (
              <motion.div
                key={report.title}
                initial="hidden" whileInView="visible" viewport={{ once: true }}
                variants={fadeUp} custom={i}
                whileHover={{ y: -4 }}
                className="bg-background rounded-lg border border-border p-6 card-shadow"
              >
                <span className="inline-block text-xs font-medium bg-primary/10 text-primary px-2 py-1 rounded-pill mb-3">{report.type}</span>
                <h3 className="font-display font-bold text-foreground mb-2">{report.title}</h3>
                <p className="font-display font-bold text-xl text-primary mb-4">{report.price}</p>
                <Button variant="hero-outline" size="sm" className="w-full hover-sink" asChild>
                  <Link to="/contact">Inquire <ArrowRight className="ml-1" /></Link>
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
            Not sure which product fits?
          </h2>
          <p className="text-lg text-primary-foreground/70 mb-8 max-w-xl mx-auto">
            Tell us what you're trying to decide, and we'll recommend the right intelligence product for your needs.
          </p>
          <Button variant="gold" size="lg" className="hover-sink" asChild>
            <Link to="/contact">Talk to Us <ArrowRight className="ml-1" /></Link>
          </Button>
        </div>
      </section>
    </Layout>
  );
};

export default Products;
