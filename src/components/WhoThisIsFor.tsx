import { motion } from "framer-motion";
import { Users, Target, TrendingUp, Globe, Home, Heart } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 16, filter: "blur(4px)" },
  visible: (i: number) => ({
    opacity: 1, y: 0, filter: "blur(0px)",
    transition: { delay: i * 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] as const }
  }),
};

const segments = [
  {
    icon: Heart,
    title: "YOU",
    benefit: "If you believe understanding the economy helps you make better decisions — for yourself, your family, your business, your organization, or your country, this is for you.",
  },
  {
    icon: Users,
    title: "CEOs & Leadership Teams",
    benefit: "Making strategic decisions requires understanding where the economy is headed, not just where the business is today. This is for leaders who want clarity on inflation, interest rates, consumer demand, and the broader economic environment shaping their decisions.",
  },
  {
    icon: Target,
    title: "Strategy & Planning Teams",
    benefit: "Good strategy is built on good assumptions about the future. This is for teams responsible for planning, forecasting, and positioning their organizations in a changing economic environment, using data and trends instead of guesswork.",
  },
  {
    icon: TrendingUp,
    title: "Investors & Operators",
    benefit: "Investment decisions are ultimately economic decisions. This is for investors and operators who want to evaluate opportunities, risks, sectors, and markets with a deeper understanding of the economic forces driving performance.",
  },
  {
    icon: Globe,
    title: "Development Organizations",
    benefit: "Programs and policies work best when they are grounded in economic reality. This is for development organizations, NGOs, and policy teams that want to design programs informed by data, markets, and how people actually live and make decisions.",
  },
  {
    icon: Home,
    title: "Households & Individuals",
    benefit: "The economy is not abstract — it affects jobs, prices, salaries, businesses, and opportunities. This is for individuals and households who want to better understand the forces shaping their financial lives and future opportunities.",
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
          Economic intelligence designed for everyone who needs more than headlines.
        </motion.p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
