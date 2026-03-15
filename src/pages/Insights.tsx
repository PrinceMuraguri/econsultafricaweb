import { motion } from "framer-motion";
import Layout from "@/components/Layout";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.5, ease: [0.2, 0, 0, 1] as const } }),
};

const posts = [
  { title: "Kenya's Fiscal Consolidation: What It Means for Corporate Tax", date: "Mar 2026", read: "6 min", category: "Fiscal Policy", excerpt: "The 2025/26 budget framework signals a pivot toward revenue-led consolidation. We analyze the implications for corporate taxation and investment incentives." },
  { title: "Agriculture Sector Outlook: Climate Risk and Export Opportunity", date: "Feb 2026", read: "8 min", category: "Agriculture", excerpt: "Horticulture exports reached record levels in 2025. But climate volatility and logistics costs present a dual challenge for the sector in 2026." },
  { title: "The KES Trajectory: Projections for H2 2026", date: "Feb 2026", read: "5 min", category: "Currency", excerpt: "After relative stability in H1, our models project moderate depreciation pressure driven by global dollar strength and local fiscal dynamics." },
  { title: "Digital Lending Regulation: A New Framework Emerges", date: "Jan 2026", read: "7 min", category: "Financial Services", excerpt: "The Central Bank's new digital lending regulations create compliance costs but also market clarity for established fintechs." },
  { title: "Energy Transition in East Africa: Kenya's Geothermal Advantage", date: "Jan 2026", read: "9 min", category: "Energy", excerpt: "Kenya's geothermal capacity expansion positions it as a regional leader in green energy — with implications for manufacturing competitiveness." },
  { title: "Youth Employment: Structural Challenges and Policy Responses", date: "Dec 2025", read: "6 min", category: "Labor Market", excerpt: "With 14.8% youth unemployment, the government's TVET expansion and digital jobs initiative face scrutiny. We assess the likely impact." },
];

const Insights = () => {
  return (
    <Layout>
      <section className="section-padding">
        <div className="container-page">
          <div className="max-w-3xl mb-16">
            <motion.p initial="hidden" animate="visible" variants={fadeUp} custom={0} className="font-mono text-xs text-gold uppercase tracking-widest mb-4">Insights</motion.p>
            <motion.h1 initial="hidden" animate="visible" variants={fadeUp} custom={1} className="text-4xl md:text-5xl font-bold text-foreground leading-[1.1] mb-6">
              Economic intelligence, deciphered.
            </motion.h1>
            <motion.p initial="hidden" animate="visible" variants={fadeUp} custom={2} className="text-lg text-muted-foreground leading-relaxed">
              Analysis and commentary on the macroeconomic signals shaping Kenya's business environment.
            </motion.p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {posts.map((post, i) => (
              <motion.article
                key={post.title}
                initial="hidden" whileInView="visible" viewport={{ once: true }}
                variants={fadeUp} custom={i}
                whileHover={{ y: -4 }}
                className="bg-background rounded-lg border border-border p-8 card-shadow hover-sink cursor-pointer"
              >
                <div className="flex items-center gap-3 mb-4">
                  <span className="font-mono text-xs text-gold">{post.date}</span>
                  <span className="text-xs text-muted-foreground">· {post.read} read</span>
                </div>
                <span className="inline-block text-xs font-medium bg-primary/10 text-primary px-2 py-1 rounded-pill mb-3">{post.category}</span>
                <h2 className="font-display font-semibold text-xl text-foreground leading-snug mb-3">{post.title}</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">{post.excerpt}</p>
              </motion.article>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Insights;
