import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { FileText, BarChart3, Users, Briefcase, ArrowRight, Zap } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.5, ease: [0.2, 0, 0, 1] as const } }),
};

const services = [
  {
    icon: FileText, number: "01", title: "Country Economic Outlook Reports",
    description: "A comprehensive macro-to-micro analysis of a country's economic trajectory. Global, regional, and local dynamics unpacked through data, theory, and real-world insight.",
    deliverable: "120+ page PDF report with quarterly supplements",
    price: "From $495",
    href: "/kenya-2026",
    ctaLabel: "View Kenya Report",
  },
  {
    icon: BarChart3, number: "02", title: "Organization-Specific Economic Briefs",
    description: "We translate the macroeconomic environment into insights tailored specifically to your organization, sector, and strategy. Delivered as a structured, decision-ready report for strategy, planning, and investment decisions.",
    deliverable: "Custom brief aligned to your organization's context",
    price: "$1,000 – $5,000+",
    href: "/contact",
    ctaLabel: "Request a Brief",
  },
  {
    icon: Users, number: "03", title: "Executive Strategy Briefings",
    description: "We present the insights directly to your leadership team, break them down, and answer your questions in real time. Virtual or in-person. Often delivered alongside our Organization-Specific Economic Briefs to ensure insights translate into real action.",
    deliverable: "Pre-read document + live briefing + follow-up memo",
    price: "$1,500 – $10,000+",
    href: "/contact",
    ctaLabel: "Book a Briefing",
  },
  {
    icon: Zap, number: "04", title: "Intelligence Access Retainer",
    description: "Continuous access to decision-grade economic insight. Quarterly deep-dives, real-time signals, and direct analyst access — so your team stays ahead of shifts, not reacting to them.",
    deliverable: "Quarterly report + monthly updates + analyst hotline",
    price: "$300 – $1,000/month",
    href: "/contact",
    ctaLabel: "Discuss Access",
  },
];

const Services = () => {
  return (
    <Layout>
      <section className="section-padding">
        <div className="container-page">
          <div className="max-w-3xl mb-16">
            <motion.p initial="hidden" animate="visible" variants={fadeUp} custom={0} className="font-mono text-xs text-gold uppercase tracking-widest mb-4">Services</motion.p>
            <motion.h1 initial="hidden" animate="visible" variants={fadeUp} custom={1} className="text-4xl md:text-5xl font-bold text-foreground leading-[1.1] mb-6">
              From Insight to Action
            </motion.h1>
            <motion.p initial="hidden" animate="visible" variants={fadeUp} custom={2} className="text-lg text-muted-foreground leading-relaxed">
              Intelligence products and advisory services calibrated for organizations navigating African economies. Every engagement answers one question: <span className="text-foreground font-medium">"What does this mean for us?"</span>
            </motion.p>
          </div>

          <div className="space-y-8">
            {services.map((service, i) => (
              <motion.div
                key={service.number}
                initial="hidden" whileInView="visible" viewport={{ once: true }}
                variants={fadeUp} custom={i}
                className="bg-background rounded-lg border border-border p-8 md:p-10 card-shadow"
              >
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                  <div className="md:col-span-3">
                    <div className="flex items-center gap-4 mb-4">
                      <span className="font-mono text-2xl font-bold text-gold">{service.number}</span>
                      <service.icon className="w-5 h-5 text-primary" />
                    </div>
                    <h2 className="font-display font-bold text-2xl text-foreground mb-4">{service.title}</h2>
                    <p className="text-muted-foreground leading-relaxed mb-4">{service.description}</p>
                    <p className="text-sm text-muted-foreground"><span className="font-semibold text-foreground">Deliverable:</span> {service.deliverable}</p>
                    <p className="text-sm text-muted-foreground mt-2"><span className="font-semibold text-foreground">Investment:</span> {service.price}</p>
                  </div>
                  <div className="flex items-end">
                    <Button variant="hero" className="hover-sink w-full md:w-auto" asChild>
                      <Link to={service.href}>{service.ctaLabel} <ArrowRight className="ml-1" /></Link>
                    </Button>
                  </div>
                </div>
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
            Tell us what you're trying to decide, and we'll recommend the right engagement for your team.
          </p>
          <Button variant="gold" size="lg" className="hover-sink" asChild>
            <Link to="/contact">Get in Touch <ArrowRight className="ml-1" /></Link>
          </Button>
        </div>
      </section>
    </Layout>
  );
};

export default Services;
