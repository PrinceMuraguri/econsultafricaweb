import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { FileText, BarChart3, Users, Briefcase, ArrowRight } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.5, ease: [0.2, 0, 0, 1] as const } }),
};

const services = [
  {
    icon: FileText, number: "01", title: "Kenya 2026 Economic Outlook",
    description: "Our flagship annual report. A comprehensive macro-to-micro analysis covering GDP, inflation, currency, fiscal policy, and 10 sectors. Designed for C-suite decision-making.",
    deliverable: "120+ page PDF report with quarterly supplements",
    href: "/kenya-2026",
  },
  {
    icon: BarChart3, number: "02", title: "Sector Insight Brief",
    description: "Targeted intelligence for a single sector. Current signals, regulatory landscape, competitive dynamics, risk vectors, and opportunity mapping.",
    deliverable: "20–30 page sector brief with data appendix",
    href: "/contact",
  },
  {
    icon: Users, number: "03", title: "Executive Strategy Briefing",
    description: "A 90-minute session with our analysts. We prepare custom analysis aligned to your strategic questions — market entry, capital allocation, or risk assessment.",
    deliverable: "Pre-read document + live briefing + follow-up memo",
    href: "/contact",
  },
  {
    icon: Briefcase, number: "04", title: "Quarterly Intelligence Retainer",
    description: "Ongoing advisory for organizations requiring continuous economic intelligence. Quarterly reports, monthly signal updates, and direct analyst access.",
    deliverable: "Quarterly report + monthly updates + analyst hotline",
    href: "/contact",
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
              Intelligence products for strategic decision-makers.
            </motion.h1>
            <motion.p initial="hidden" animate="visible" variants={fadeUp} custom={2} className="text-lg text-muted-foreground leading-relaxed">
              From one-time reports to ongoing advisory retainers. Every product is calibrated for organizations navigating the Kenyan economic landscape.
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
                  </div>
                  <div className="flex items-end">
                    <Button variant="hero" className="hover-sink w-full md:w-auto" asChild>
                      <Link to={service.href}>Learn More <ArrowRight className="ml-1" /></Link>
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Services;
