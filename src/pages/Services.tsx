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
    icon: FileText, number: "01", title: "Country Economic Outlook Reports",
    description: "A comprehensive macro-to-micro analysis of a country's economic trajectory. Global, regional, and local dynamics unpacked through data, theory, and real-world insight.",
    deliverable: "120+ page PDF report with quarterly supplements",
    href: "/kenya-2026",
  },
  {
    icon: BarChart3, number: "02", title: "Organization-Specific Economic Briefs",
    description: "Tailored economic intelligence that translates a country's outlook into clear implications for your specific company. Delivered as a structured, decision-ready report for strategy, planning, and investment decisions.",
    deliverable: "Custom brief aligned to your organization's context",
    href: "/contact",
  },
  {
    icon: Users, number: "03", title: "Executive Strategy Briefings",
    description: "A 90-minute in-person or virtual session with your leadership team, where we present the insights and break down the implications for your business — ensuring clarity, alignment, and informed decision-making. Includes a dedicated Q&A session with our analysts, and is often delivered alongside our Organization-Specific Economic Briefs to ensure insights translate into real action.",
    deliverable: "Pre-read document + live briefing + follow-up memo",
    href: "/contact",
  },
  {
    icon: Briefcase, number: "04", title: "Quarterly Intelligence Retainer",
    description: "Continuous access to decision-grade economic insight. Quarterly deep-dives, real-time signals, and direct analyst access — so your team stays ahead of shifts, not reacting to them.",
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
              From Insight to Action
            </motion.h1>
            <motion.p initial="hidden" animate="visible" variants={fadeUp} custom={2} className="text-lg text-muted-foreground leading-relaxed">
              Intelligence products and advisory services calibrated for organizations navigating African economies.
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
