import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.5, ease: [0.2, 0, 0, 1] as const } }),
};

const About = () => {
  return (
    <Layout>
      <section className="section-padding">
        <div className="container-page">
          <div className="max-w-3xl">
            <motion.p initial="hidden" animate="visible" variants={fadeUp} custom={0} className="font-mono text-xs text-gold uppercase tracking-widest mb-4">About</motion.p>
            <motion.h1 initial="hidden" animate="visible" variants={fadeUp} custom={1} className="text-4xl md:text-5xl font-bold text-foreground leading-[1.1] mb-6">
              Precision intelligence for a complex economy.
            </motion.h1>
            <motion.p initial="hidden" animate="visible" variants={fadeUp} custom={2} className="text-lg text-muted-foreground leading-relaxed mb-8">
              Econsult Africa is a Kenya-focused economic intelligence studio. We exist because the organizations shaping East Africa's future deserve better than generic data and recycled headlines.
            </motion.p>
          </div>
        </div>
      </section>

      <section className="pb-20 md:pb-28">
        <div className="container-page">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
              <h2 className="font-display font-bold text-2xl text-foreground mb-6">Our Mission</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                We translate macroeconomic signals into strategic clarity. Our work bridges the gap between academic research, government data, and the decisions that country directors, CFOs, and investors make every quarter.
              </p>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Kenya's economy is dynamic, complex, and full of opportunity — but only for those who understand the signals beneath the headlines. That's what we provide.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                We are not a news service. We are not a consulting firm in the traditional sense. We are an intelligence studio — combining rigorous analysis with clear, actionable delivery.
              </p>
            </motion.div>

            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={1}>
              <div className="bg-muted/50 rounded-lg border border-border p-8 card-shadow">
                <p className="font-mono text-xs text-gold uppercase tracking-widest mb-4">Founder</p>
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                  <span className="font-display font-bold text-2xl text-primary">PM</span>
                </div>
                <h3 className="font-display font-bold text-xl text-foreground mb-2">Prince Muraguri</h3>
                <p className="text-sm text-muted-foreground mb-4">Founder & Lead Analyst</p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Prince founded Econsult Africa to bring institutional-grade economic intelligence to organizations navigating Kenya's market. With experience spanning macroeconomic analysis, strategy consulting, and the intersection of policy and business, he leads the firm's research agenda and advisory practice.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

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
