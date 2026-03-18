import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import SampleReportViewer from "@/components/SampleReportViewer";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";

const SampleReport = () => {
  return (
    <Layout>
      <section className="section-padding">
        <div className="container-page">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="font-mono text-xs text-gold uppercase tracking-widest mb-4"
            >
              Free Preview
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="text-3xl md:text-4xl font-bold text-foreground leading-[1.1] mb-4"
            >
              Curious what's inside?
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-lg text-muted-foreground leading-relaxed max-w-xl mx-auto"
            >
              Browse through a selection of pages from the Kenya 2026 Economic Outlook.
              See the depth of analysis before committing — no sign-up required.
            </motion.p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.5 }}
          >
            <SampleReportViewer />
          </motion.div>

          {/* CTA below viewer */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="max-w-xl mx-auto text-center mt-16"
          >
            <div className="flex items-center justify-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-gold" />
              <span className="font-mono text-xs text-gold uppercase tracking-widest">
                Ready for the full picture?
              </span>
            </div>
            <p className="text-muted-foreground mb-6">
              The full report contains 120+ pages — covering every sector, risk vector, and
              investment opportunity in Kenya's 2026 economy.
            </p>
            <Button variant="hero" size="lg" className="hover-sink" asChild>
              <Link to="/kenya-2026">
                Get the Full Report <ArrowRight className="ml-1 w-4 h-4" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
};

export default SampleReport;
