import { motion } from "framer-motion";
import princeMuraguriImg from "@/assets/prince-muraguri.png";
import paoloImg from "@/assets/paolo-avitabile.jfif";
import pedroImg from "@/assets/pedro-zorzano.jfif";
import mosesImg from "@/assets/moses-macharia.jpeg";
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
    bio: "Prince Muraguri is the Founder and Chief Economist of Econsult Africa. His career spans research, policy, and data analysis at leading institutions including CEGA (UC Berkeley), J-PAL Africa, and the Pharo Foundation, where he contributed to large-scale research programs, monitoring systems, and policy-relevant analysis across the continent.\n\nHe specializes in translating complex macroeconomic trends into clear, decision-focused intelligence for leaders navigating dynamic and uncertain environments. His approach combines rigorous analytical foundations with practical interpretation, helping organizations move from data to strategy with confidence.\n\nPrince holds a Master's degree in Economics and Finance from the Universidad de Navarra in Spain; a MicroMasters in Data, Economics, and Development Policy from the Massachusetts Institute of Technology (MIT); and a Bachelor's degree in Financial Economics from Strathmore University in Nairobi.",
    featured: true,
  },
  {
    name: "Moses Macharia", role: "Senior Analyst", initials: "MM",
    bio: "Moses brings rigorous analytical capability to Econsult Africa's research output, specializing in fiscal policy, trade dynamics, and sector-level economic modelling across East African markets.",
    featured: false,
    img: mosesImg,
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
                <img src={princeMuraguriImg} alt="Prince Muraguri" className="w-28 h-28 rounded-full object-cover mb-4" />
              </div>
              <div className="md:col-span-3">
                <p className="font-mono text-xs text-gold uppercase tracking-widest mb-2">Founder & CEO</p>
                <h3 className="font-display font-bold text-2xl text-foreground mb-4">Prince Muraguri</h3>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                  Prince Muraguri is an economic intelligence strategist with experience across research, policy, and data analysis in African markets. His work has spanned leading institutions including CEGA (UC Berkeley), J-PAL Africa, and the Pharo Foundation, where he has contributed to large-scale research programs, monitoring systems, and policy-relevant analysis.{"\n\n"}He specializes in translating complex macroeconomic trends into clear, decision-focused insight for organizations operating in dynamic and uncertain environments. His approach combines rigorous analysis with practical interpretation, helping leaders move from data to strategy with confidence.
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
                {member.img ? (
                  <img src={member.img} alt={member.name} className="w-20 h-20 rounded-full object-cover mb-6" />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                    <span className="font-display font-bold text-2xl text-primary">{member.initials}</span>
                  </div>
                )}
                <h3 className="font-display font-bold text-lg text-foreground mb-1">{member.name}</h3>
                <p className="text-sm text-accent font-medium mb-4">{member.role}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{member.bio}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Advisory Board */}
      <section className="section-padding">
        <div className="container-page">
          <motion.p initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}
            className="font-mono text-xs text-gold uppercase tracking-widest mb-4">Advisory Board</motion.p>
          <motion.h2 initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={1}
            className="text-3xl md:text-4xl font-bold text-foreground mb-12">Strategic Advisors</motion.h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              {
                name: "Paolo Avitabile",
                role: "Advisory Board Member",
                img: paoloImg,
                bio: "Paolo Avitabile is a Senior Business Controller at Nestlé Italy with deep expertise in corporate finance, business controlling, and strategic operations. He has held roles spanning financial controlling, logistics, and the Health Science and Infant Nutrition division. His work at Nestlé included corporate sales strategy, circular economy initiatives, and cross-functional project delivery across European markets. Paolo holds a degree from the Universidad de Navarra, and a postgraduate master's degree in business. He brings to Econsult Africa's Advisory Board a practitioner's lens on multinational corporate strategy, financial analysis, and the operational dynamics of global consumer markets.",
              },
              {
                name: "Pedro Luis Zorzano Lázaro",
                role: "Advisory Board Member",
                img: pedroImg,
                bio: "Pedro Luis Zorzano Lázaro is a consultant at Nfq Advisory, Solutions & Outsourcing, a Madrid-based firm specializing in financial services consulting across banking, insurance, capital markets, and risk management. He holds a degree in Telecommunications Engineering and a Master's in Economics and Finance from the Universidad de Navarra. Pedro brings a distinctive cross-disciplinary profile that bridges technology, finance, and macroeconomic analysis — particularly valuable as the firm deepens its work at the intersection of global macro trends, trade architecture, and African economic strategy.",
              },
            ].map((advisor, i) => (
              <motion.div
                key={advisor.name}
                initial="hidden" whileInView="visible" viewport={{ once: true }}
                variants={fadeUp} custom={i + 2}
                className="bg-background rounded-lg border border-border p-8 card-shadow"
              >
                <img src={advisor.img} alt={advisor.name} className="w-20 h-20 rounded-full object-cover mb-6" />
                <h3 className="font-display font-bold text-lg text-foreground mb-1">{advisor.name}</h3>
                <p className="text-sm text-accent font-medium mb-4">{advisor.role}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{advisor.bio}</p>
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
