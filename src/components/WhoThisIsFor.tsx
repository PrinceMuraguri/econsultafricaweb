import { motion } from "framer-motion";
import { Users, Target, TrendingUp, Globe, Home } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 16, filter: "blur(4px)" },
  visible: (i: number) => ({
    opacity: 1, y: 0, filter: "blur(0px)",
    transition: { delay: i * 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] as const }
  }),
};

const segments = [
  {
    icon: Users,
    title: "CEOs & Leadership Teams",
    benefit: "Making strategic decisions with clarity on where the economy is headed.",
  },
  {
    icon: Target,
    title: "Strategy & Planning Teams",
    benefit: "Aligning business direction with macroeconomic reality.",
  },
  {
    icon: TrendingUp,
    title: "Investors & Operators",
    benefit: "Evaluating opportunities with data-driven economic context.",
  },
  {
    icon: Globe,
    title: "Development Organizations",
    benefit: "Understanding the economic landscape to design effective programs.",
  },
  {
    icon: Home,
    title: "Households & Individuals",
    benefit: "Understanding the forces shaping their financial lives — because they are the real economy.",
  },
];

const WhoThisIsFor = () => (
  <section className="section-padding">
    <div className="container-page">
      <div className="max-w-3xl mx-auto text-center mb-16">
        <motion.p
          initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }}
          variants={fadeUp} custom={0}
          className="font-mono text-xs text-gold uppercase tracking-widest mb-4"
        >
          Built For
        </motion.p>
        <motion.h2
          initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }}
          variants={fadeUp} custom={1}
          className="text-3xl md:text-4xl font-bold text-foreground mb-4"
        >
          Who This Is For
        </motion.h2>
        <motion.p
          initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }}
          variants={fadeUp} custom={2}
          className="text-muted-foreground leading-relaxed"
        >
          Economic intelligence designed for teams that need more than headlines.
        </motion.p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {segments.map((seg, i) => (
          <motion.div
            key={seg.title}
            initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }}
            variants={fadeUp} custom={i + 3}
            className="group bg-card rounded-lg border border-border p-8 card-shadow transition-shadow hover:shadow-lg"
          >
            <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center mb-5 transition-colors group-hover:bg-primary/15">
              <seg.icon className="w-5 h-5 text-primary" />
            </div>
            <h3 className="font-display font-bold text-foreground mb-2 text-sm">{seg.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{seg.benefit}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default WhoThisIsFor;
