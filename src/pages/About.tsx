import { motion } from "framer-motion";
import princeMuraguriImg from "@/assets/prince-muraguri.png";
import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.5, ease: [0.2, 0, 0, 1] as const } }),
};

const team = [
  {
    name: "Prince Muraguri", role: "Founder & CEO", initials: "PM",
    bio: "An economic intelligence strategist with deep expertise in data-driven research, policy analysis, and applied economics across Africa. Known for translating complex economic ideas into clear, actionable insight. Prince founded Econsult Africa to close the gap between macroeconomic data and the decisions that actually matter.",
    featured: true,
  },
  {
    name: "Moses Macharia", role: "Senior Analyst", initials: "MM",
    bio: "Moses brings rigorous analytical capability to Econsult Africa's research output, specializing in fiscal policy, trade dynamics, and sector-level economic modelling across East African markets.",
    featured: false,
  },
  {
    name: "Noel Lutwama", role: "Strategy Consultant", initials: "NL",
    bio: "Noel advises organizations on cross-border strategy and market entry across Africa. With experience spanning 12 economies, he translates macroeconomic intelligence into actionable business frameworks.",
    featured: false,
  },
];

const About = () => {
  return (
    <Layout>
      {/* Hero */}
      <section className="section-padding">
        <div className="container-page">
          <div className="max-w-3xl">
            <motion.p initial="hidden" animate="visible" variants={fadeUp} custom={0} className="font-mono text-xs text-gold uppercase tracking-widest mb-4">About</motion.p>
            <motion.h1 initial="hidden" animate="visible" variants={fadeUp} custom={1} className="text-4xl md:text-5xl font-bold text-foreground leading-[1.1] mb-6">
              We exist because African markets deserve better economic intelligence.
            </motion.h1>
            <motion.p initial="hidden" animate="visible" variants={fadeUp} custom={2} className="text-lg text-muted-foreground leading-relaxed">
              Econsult Africa is an Africa-focused economic intelligence firm. We translate macroeconomic signals into strategic clarity — so the organizations shaping the continent's future can make better decisions.
            </motion.p>
          </div>
        </div>
      </section>

      {/* Mission & Approach */}
      <section className="pb-20 md:pb-28">
        <div className="container-page">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
              <h2 className="font-display font-bold text-2xl text-foreground mb-6">The Problem We Solve</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Most economic reports tell you what is happening. They rarely tell you what it means for <span className="text-foreground font-medium">your</span> organization.
              </p>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Africa's economies are dynamic, complex, and full of opportunity — but only for those who understand the signals beneath the headlines.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                We are not a news service. We are not a consulting firm in the traditional sense. We are an intelligence firm — combining rigorous analysis with clear, actionable delivery.
              </p>
            </motion.div>

            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={1}
              className="bg-muted/50 rounded-lg border border-border p-8 card-shadow">
              <h3 className="font-display font-bold text-xl text-foreground mb-4">Our Approach</h3>
              <div className="space-y-4">
                {[
                  { num: "01", text: "We go deep on country-level economics — not surface-level overviews." },
                  { num: "02", text: "We translate macro signals into strategic implications for specific organizations." },
                  { num: "03", text: "We deliver on time, in formats designed for decision-makers." },
                  { num: "04", text: "We build long-term advisory relationships, not one-off transactions." },
                ].map((item) => (
                  <div key={item.num} className="flex gap-4">
                    <span className="font-mono text-sm font-bold text-gold">{item.num}</span>
                    <p className="text-sm text-muted-foreground leading-relaxed">{item.text}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="section-padding bg-muted/50">
        <div className="container-page">
          <motion.p initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}
            className="font-mono text-xs text-gold uppercase tracking-widest mb-4">Team</motion.p>
          <motion.h2 initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={1}
            className="text-3xl md:text-4xl font-bold text-foreground mb-12">The People Behind Econsult Africa</motion.h2>

          {/* Founder Feature */}
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={2}
            className="bg-background rounded-lg border border-border p-8 md:p-12 card-shadow mb-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 items-center">
              <div className="flex flex-col items-center md:items-start">
                <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <span className="font-display font-bold text-3xl text-primary">PM</span>
                </div>
              </div>
              <div className="md:col-span-3">
                <p className="font-mono text-xs text-gold uppercase tracking-widest mb-2">Founder & CEO</p>
                <h3 className="font-display font-bold text-2xl text-foreground mb-4">Prince Muraguri</h3>
                <p className="text-muted-foreground leading-relaxed">
                  An economic intelligence strategist with deep expertise in data-driven research, policy analysis, and applied economics across Africa. Known for translating complex economic ideas into clear, actionable insight. Prince founded Econsult Africa to close the gap between macroeconomic data and the decisions that actually matter.
                </p>
              </div>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {team.filter(m => !m.featured).map((member, i) => (
              <motion.div
                key={member.name}
                initial="hidden" whileInView="visible" viewport={{ once: true }}
                variants={fadeUp} custom={i + 3}
                className="bg-background rounded-lg border border-border p-8 card-shadow"
              >
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                  <span className="font-display font-bold text-2xl text-primary">{member.initials}</span>
                </div>
                <h3 className="font-display font-bold text-lg text-foreground mb-1">{member.name}</h3>
                <p className="text-sm text-accent font-medium mb-4">{member.role}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{member.bio}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding bg-primary">
        <div className="container-page text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-6">Work with us.</h2>
          <p className="text-lg text-primary-foreground/70 mb-8 max-w-xl mx-auto">
            Whether you need a single report or an ongoing advisory relationship, we're ready to calibrate our intelligence to your strategic questions.
          </p>
          <Button variant="gold" size="lg" className="hover-sink" asChild>
            <Link to="/contact">Get in Touch <ArrowRight className="ml-1" /></Link>
          </Button>
        </div>
      </section>
    </Layout>
  );
};

export default About;
