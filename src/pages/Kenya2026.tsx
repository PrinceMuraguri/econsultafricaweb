import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { ArrowRight, Check, FileText, BarChart3, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.5, ease: [0.2, 0, 0, 1] as const } }),
};

const benefits = [
  "120+ pages of sector-by-sector analysis",
  "GDP, inflation, and currency projections for 2026",
  "10 sectors mapped with opportunity and risk vectors",
  "Policy tracker: fiscal, regulatory, and trade",
  "Demographic and labor market dynamics",
  "Investment thesis and capital allocation framework",
  "Downloadable PDF with executive summary",
  "Quarterly update supplements included",
];

const Kenya2026 = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const { toast } = useToast();

  const handlePurchase = async () => {
    if (!email) {
      toast({ title: "Email required", description: "Please enter your email to proceed.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("paystack-checkout", {
        body: {
          email,
          callback_url: `${window.location.origin}/purchase-success`,
        },
      });
      if (error) throw error;
      if (data?.authorization_url) {
        window.location.href = data.authorization_url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (err: any) {
      toast({ title: "Checkout failed", description: err.message || "Something went wrong.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <section className="section-padding">
        <div className="container-page">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
            <div>
              <motion.p initial="hidden" animate="visible" variants={fadeUp} custom={0} className="font-mono text-xs text-gold uppercase tracking-widest mb-4">
                Flagship Report
              </motion.p>
              <motion.h1 initial="hidden" animate="visible" variants={fadeUp} custom={1} className="text-4xl md:text-5xl font-bold text-foreground leading-[1.1] mb-6">
                Kenya 2026<br />Economic Outlook
              </motion.h1>
              <motion.p initial="hidden" animate="visible" variants={fadeUp} custom={2} className="text-lg text-muted-foreground leading-relaxed mb-8 max-w-lg">
                The definitive macroeconomic intelligence report for organizations operating in Kenya. Projections, sector analysis, and strategic frameworks — calibrated for decision-makers.
              </motion.p>
              <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={3} className="space-y-4 mb-12">
                <input
                  type="email"
                  placeholder="Enter your email to purchase"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full max-w-md px-4 py-3 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button variant="hero" size="lg" className="hover-sink" onClick={handlePurchase} disabled={loading}>
                    {loading ? "Processing…" : "Purchase the Report"} <ArrowRight className="ml-1" />
                  </Button>
                  <Button variant="hero-outline" size="lg" className="hover-sink" asChild>
                    <Link to="/contact">Request a Sample</Link>
                  </Button>
                </div>
              </motion.div>

              <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={4}>
                <h3 className="font-display font-semibold text-foreground mb-4">What's inside</h3>
                <ul className="space-y-3">
                  {benefits.map((b) => (
                    <li key={b} className="flex items-start gap-3">
                      <Check className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">{b}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            </div>

            <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3, duration: 0.6 }}>
              <div className="bg-primary rounded-lg p-10 text-primary-foreground card-shadow-lg sticky top-24">
                <p className="font-mono text-xs opacity-60 mb-6">ECONSULT AFRICA · 2026</p>
                <h2 className="font-display font-bold text-3xl mb-6">Kenya 2026<br />Economic Outlook</h2>
                <div className="space-y-4 mb-8">
                  {[
                    { icon: FileText, label: "120+ page PDF report" },
                    { icon: BarChart3, label: "10 sector deep-dives" },
                    { icon: Shield, label: "Risk & opportunity mapping" },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-3">
                      <item.icon className="w-4 h-4 opacity-60" />
                      <span className="text-sm opacity-80">{item.label}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-primary-foreground/20 pt-6">
                  <p className="font-mono text-xs opacity-60 mb-1">Starting from</p>
                  <p className="font-display text-4xl font-bold mb-1">$495</p>
                  <p className="text-xs opacity-60 mb-6">Single organization license</p>
                  <Button variant="gold" size="lg" className="w-full hover-sink">
                    Purchase Now
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Kenya2026;
