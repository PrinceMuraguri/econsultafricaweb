import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Heart, TrendingUp, Globe, Lightbulb } from "lucide-react";
import confetti from "canvas-confetti";

const ThankYou = () => {
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;

    // Fire confetti bursts
    const duration = 3000;
    const end = Date.now() + duration;
    const colors = ["#3660be", "#1a2744", "#f59e0b", "#10b981"];

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 },
        colors,
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 },
        colors,
      });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();

    // Big burst
    setTimeout(() => {
      confetti({
        particleCount: 100,
        spread: 100,
        origin: { y: 0.6 },
        colors,
      });
    }, 500);
  }, []);

  const benefits = [
    { icon: TrendingUp, text: "Make a better decision" },
    { icon: Globe, text: "See something others are missing" },
    { icon: Lightbulb, text: "Plan more confidently for the future" },
    { icon: Heart, text: "Understand the world a little better" },
  ];

  return (
    <Layout>
      {/* JSON-LD for Google Ads conversion tracking */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: "Thank You — Econsult Africa",
            description: "Purchase confirmation page for Econsult Africa intelligence products.",
          }),
        }}
      />

      <section className="section-padding min-h-[80vh] flex items-center bg-gradient-to-br from-background via-background to-primary/5">
        <div className="container-page">
          <div className="max-w-2xl mx-auto">
            {/* Logo */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="flex justify-center mb-8"
            >
              <img
                src="/images/econsult-logo.png"
                alt="Econsult Africa"
                className="h-12 sm:h-16"
              />
            </motion.div>

            {/* Main heading */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-center mb-8"
            >
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4 leading-tight">
                Thank You — You're Now Part of the{" "}
                <span className="text-primary">Econsult Africa Family</span>
              </h1>
            </motion.div>

            {/* Heartfelt message */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="space-y-5 mb-10"
            >
              <p className="text-lg text-muted-foreground leading-relaxed text-center">
                We truly appreciate it. Not just because you made a purchase, but because you
                believe — like we do — that <strong className="text-foreground">good decisions start with good information</strong>.
              </p>
              <p className="text-muted-foreground leading-relaxed text-center">
                You didn't just buy a document. You supported a small team of analysts,
                researchers, writers, and thinkers who spend a lot of time asking questions
                about Africa's economy, businesses, markets, and future.
              </p>
              <p className="text-center text-foreground font-semibold text-lg">
                So from all of us at Econsult Africa — thank you. 🙏
              </p>
            </motion.div>

            {/* Benefits */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="mb-10"
            >
              <p className="text-center text-muted-foreground mb-5">
                We hope this report helps you:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {benefits.map((b, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 + i * 0.1 }}
                    className="flex items-center gap-3 bg-card border border-border rounded-lg p-4"
                  >
                    <b.icon className="w-5 h-5 text-primary flex-shrink-0" />
                    <span className="text-foreground text-sm font-medium">{b.text}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Community message */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 1 }}
              className="bg-primary/5 border border-primary/20 rounded-xl p-6 sm:p-8 mb-10 text-center"
            >
              <p className="text-foreground leading-relaxed mb-3">
                <strong>You are not just a customer.</strong> You are part of the Econsult Africa
                community — a group of thinkers, builders, investors, leaders, and curious minds
                who care about understanding Africa better and building its future.
              </p>
              <p className="text-muted-foreground text-sm">
                We're always working on new reports, new insights, and new ideas, so this is not the
                last time you'll hear from us.
              </p>
              <p className="text-primary font-semibold mt-4">Welcome to the family.</p>
              <p className="text-muted-foreground text-sm mt-1 italic">— The Econsult Africa Team</p>
            </motion.div>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 1.2 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Button variant="hero" size="lg" className="hover-sink" asChild>
                <Link to="/intelligence-marketplace">
                  Explore More Reports <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </Button>
              <Button variant="hero-outline" size="lg" className="hover-sink" asChild>
                <Link to="/">
                  Visit Forecast Arena
                </Link>
              </Button>
            </motion.div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default ThankYou;
