import { motion } from "framer-motion";

const fadeUp = {
  hidden: { opacity: 0, y: 16, filter: "blur(4px)" },
  visible: (i: number) => ({
    opacity: 1, y: 0, filter: "blur(0px)",
    transition: { delay: i * 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] as const }
  }),
};

const SocialProof = () => (
  <section className="py-12 border-y border-border">
    <div className="container-page text-center">
      <motion.p
        initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }}
        variants={fadeUp} custom={0}
        className="text-foreground font-display font-semibold text-lg md:text-xl mb-3"
      >
        Built for organizations making real decisions in African markets.
      </motion.p>
      <motion.p
        initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }}
        variants={fadeUp} custom={1}
        className="text-sm text-muted-foreground"
      >
        Trusted by teams across strategy, investment, and development.
      </motion.p>
    </div>
  </section>
);

export default SocialProof;
