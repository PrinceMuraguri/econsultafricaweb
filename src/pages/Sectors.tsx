import { motion } from "framer-motion";
import Layout from "@/components/Layout";
import SectorExplorer from "@/components/SectorExplorer";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.5, ease: [0.2, 0, 0, 1] as const } }),
};

const Sectors = () => {
  return (
    <Layout>
      <section className="section-padding">
        <div className="container-page">
          <div className="max-w-3xl mb-16">
            <motion.p initial="hidden" animate="visible" variants={fadeUp} custom={0} className="font-mono text-xs text-gold uppercase tracking-widest mb-4">Sector Intelligence</motion.p>
            <motion.h1 initial="hidden" animate="visible" variants={fadeUp} custom={1} className="text-4xl md:text-5xl font-bold text-foreground leading-[1.1] mb-6">
              Ten sectors. One economy. Precision signals for each.
            </motion.h1>
            <motion.p initial="hidden" animate="visible" variants={fadeUp} custom={2} className="text-lg text-muted-foreground leading-relaxed">
              We track the sectors that define Kenya's economic trajectory. Click any sector to see the current signal and outlook assessment.
            </motion.p>
          </div>
          <SectorExplorer />
        </div>
      </section>
    </Layout>
  );
};

export default Sectors;
