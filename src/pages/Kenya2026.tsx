import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { ArrowRight, Check, FileText, BarChart3, Shield, Lock, Users, ShieldCheck, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.5, ease: [0.2, 0, 0, 1] as const } }),
};

const benefits = [
  "Clear macroeconomic direction for 2026",
  "GDP, inflation, and currency projections",
  "10 sectors mapped with opportunity and risk vectors",
  "Policy tracker: fiscal, regulatory, and trade",
  "Demographic and labor market dynamics",
  "Investment thesis and capital allocation framework",
  "Downloadable 120+ page PDF with executive summary",
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
      toast({ title: "Checkout failed", description: err.message || "Something went wrong. Please try again.", variant: "destructive" });
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
              <motion.p initial="hidden" animate="visible" variants={fadeUp} custom={2} className="text-lg text-muted-foreground leading-relaxed mb-4 max-w-lg">
                A comprehensive, decision-focused analysis of Kenya's economic trajectory in 2026.
              </motion.p>
              <motion.p initial="hidden" animate="visible" variants={fadeUp} custom={3} className="text-muted-foreground leading-relaxed mb-8 max-w-lg">
                This is not a generic outlook. It is designed for leadership teams, strategy units, investors, and operators who need to understand what the economy actually means for their decisions.
              </motion.p>

              <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={4} className="space-y-4 mb-10">
                <input
                  type="email"
                  placeholder="Enter your email to purchase"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full max-w-md px-4 py-3 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button variant="hero" size="lg" className="hover-sink" onClick={handlePurchase} disabled={loading}>
                    {loading ? "Processing…" : "Buy Full Report — $495"} <ArrowRight className="ml-1" />
                  </Button>
                  <Button variant="hero-outline" size="lg" className="hover-sink" asChild>
                    <Link to="/sample-report">Browse the Sample</Link>
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Secure checkout via Paystack. Instant digital delivery.
                </p>
              </motion.div>

              <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={5}>
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
                    { icon: Users, label: "Designed for decision-makers" },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-3">
                      <item.icon className="w-4 h-4 opacity-60" />
                      <span className="text-sm opacity-80">{item.label}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-primary-foreground/20 pt-6">
                  <p className="font-mono text-xs opacity-60 mb-1">Investment</p>
                  <p className="font-display text-4xl font-bold mb-1">$495</p>
                  <p className="text-xs opacity-60 mb-6">Single organization license</p>
                  <Button variant="gold" size="lg" className="w-full hover-sink" onClick={handlePurchase} disabled={loading}>
                    {loading ? "Processing…" : "Purchase Now"}
                  </Button>
                  <div className="flex items-center justify-center gap-2 mt-4">
                    <Lock className="w-3 h-3 opacity-40" />
                    <span className="text-xs opacity-40">Secure payment via Paystack</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Urgency/Social Proof */}
      <section className="py-12 bg-muted/50">
        <div className="container-page text-center">
          <p className="text-sm text-muted-foreground italic">
            Used during annual planning cycles and strategic reviews. 2026 planning is already happening.
          </p>
        </div>
      </section>
    </Layout>
  );
};

export default Kenya2026;
