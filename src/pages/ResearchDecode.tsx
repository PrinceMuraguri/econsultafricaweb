import { motion } from "framer-motion";
import Layout from "@/components/Layout";
import { ExternalLink } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.5, ease: [0.2, 0, 0, 1] as const } }),
};

const papers = [
  {
    title: "The Impact of Mobile Money on Financial Inclusion in Sub-Saharan Africa",
    source: "World Bank Economic Review",
    impact: 9,
    readTime: "4 min",
    summary: "This paper quantifies M-Pesa's impact on household savings and consumption smoothing. The Econsult Take: The data confirms mobile money as infrastructure, not fintech. For Kenya, the implication is that regulatory frameworks should treat mobile money platforms as essential services.",
  },
  {
    title: "Climate Variability and Agricultural Productivity in East Africa",
    source: "Journal of Development Economics",
    impact: 8,
    readTime: "5 min",
    summary: "A longitudinal study linking rainfall variability to maize yields across Kenya's counties. The Econsult Take: Climate-adjusted crop insurance will become a prerequisite for agricultural lending. Banks and insurers should prepare for regulatory mandates by 2027.",
  },
  {
    title: "Exchange Rate Pass-Through in Emerging Markets: Evidence from Kenya",
    source: "IMF Working Paper",
    impact: 7,
    readTime: "3 min",
    summary: "Examines how KES depreciation transmits to consumer prices. The Econsult Take: Pass-through is higher for fuel and food — which disproportionately affects low-income consumers. This creates political pressure that constrains CBK monetary policy options.",
  },
  {
    title: "Youth Employment Programs in Africa: A Systematic Review",
    source: "ILO Research Paper",
    impact: 8,
    readTime: "6 min",
    summary: "Evaluates the effectiveness of 47 youth employment programs across Africa. The Econsult Take: Skills training alone has limited impact. The most effective programs combine training with capital access and market linkages — a model Kenya's TVET reform should adopt.",
  },
];

const ResearchDecode = () => {
  return (
    <Layout>
      <section className="section-padding">
        <div className="container-page">
          <div className="max-w-3xl mb-16">
            <motion.p initial="hidden" animate="visible" variants={fadeUp} custom={0} className="font-mono text-xs text-gold uppercase tracking-widest mb-4">Research Decode</motion.p>
            <motion.h1 initial="hidden" animate="visible" variants={fadeUp} custom={1} className="text-4xl md:text-5xl font-bold text-foreground leading-[1.1] mb-6">
              The TL;DR for PhDs.
            </motion.h1>
            <motion.p initial="hidden" animate="visible" variants={fadeUp} custom={2} className="text-lg text-muted-foreground leading-relaxed">
              We distill the most relevant economics research papers into strategic summaries. Every paper includes the Econsult Take — our assessment of what it means for organizations in Kenya.
            </motion.p>
          </div>

          <div className="space-y-6">
            {papers.map((paper, i) => (
              <motion.div
                key={paper.title}
                initial="hidden" whileInView="visible" viewport={{ once: true }}
                variants={fadeUp} custom={i}
                className="bg-background rounded-lg border border-border p-8 card-shadow"
              >
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs text-muted-foreground">{paper.readTime}</span>
                    <span className="text-xs text-muted-foreground">·</span>
                    <span className="font-mono text-xs text-gold">Impact: {paper.impact}/10</span>
                  </div>
                  <ExternalLink className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                </div>
                <h2 className="font-display font-semibold text-xl text-foreground leading-snug mb-2">{paper.title}</h2>
                <p className="text-xs text-muted-foreground mb-4">Source: {paper.source}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{paper.summary}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default ResearchDecode;
