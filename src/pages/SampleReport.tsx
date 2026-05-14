import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import SampleReportViewer from "@/components/SampleReportViewer";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import {
  ArrowRight, Download, Clock, Lock, FileText, Sparkles,
  BookOpen, TrendingUp, ShieldCheck, ChevronRight
} from "lucide-react";

const LAUNCH_EXPIRY = new Date("2026-03-29T23:59:59+03:00"); // EAT

const useCountdown = (target: Date) => {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  const diff = Math.max(0, target.getTime() - now.getTime());
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  return { days, hours, minutes, seconds, expired: diff === 0 };
};

const SampleReport = () => {
  const countdown = useCountdown(LAUNCH_EXPIRY);
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      // Track the download
      await supabase.from("sample_downloads").insert({
        source_page: window.location.pathname,
        referrer: document.referrer || null,
        user_agent: navigator.userAgent,
      });
    } catch {
      // Non-blocking
    }
    // Trigger download
    const a = document.createElement("a");
    a.href = "/reports/Kenya_2026_Economic_Outlook_Teaser.pdf";
    a.download = "Kenya_2026_Economic_Outlook_Sample.pdf";
    a.click();
    setTimeout(() => setDownloading(false), 2000);
  };

  const fullReportFeatures = [
    { icon: TrendingUp, text: "120+ pages of deep economic analysis" },
    { icon: BookOpen, text: "Full risk & opportunity mapping (Chapter 8)" },
    { icon: ShieldCheck, text: "Sector-level investment frameworks" },
    { icon: FileText, text: "Proprietary data tables & projections" },
  ];

  return (
    <Layout>
      {/* Hero */}
      <section className="pt-16 pb-10 md:pt-24 md:pb-16">
        <div className="container-page">
          <div className="max-w-3xl mx-auto text-center">
            {/* Launch badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/10 border border-accent/20 mb-6"
            >
              <Sparkles className="w-3.5 h-3.5 text-accent" />
              <span className="font-mono text-[11px] text-accent font-semibold uppercase tracking-widest">
                Launch Week · Insider Access
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground leading-[1.08] mb-5"
            >
              Preview the thinking.{" "}
              <span className="text-primary">Then decide.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-lg text-muted-foreground leading-relaxed max-w-xl mx-auto mb-8"
            >
              Browse and download selected pages from the Kenya 2026 Economic Outlook —
              free during launch week. No sign-up. No strings.
            </motion.p>

            {/* Countdown */}
            {!countdown.expired && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="mb-10"
              >
                <p className="font-mono text-xs text-muted-foreground uppercase tracking-wider mb-3">
                  <Clock className="w-3.5 h-3.5 inline -mt-0.5 mr-1" />
                  Free sample available until Sunday, 29 March 2026
                </p>
                <div className="flex items-center justify-center gap-3">
                  {[
                    { value: countdown.days, label: "Days" },
                    { value: countdown.hours, label: "Hrs" },
                    { value: countdown.minutes, label: "Min" },
                    { value: countdown.seconds, label: "Sec" },
                  ].map((unit) => (
                    <div key={unit.label} className="text-center">
                      <div className="w-14 h-14 rounded-lg bg-card border border-border flex items-center justify-center card-shadow">
                        <span className="font-mono text-xl font-bold text-foreground">
                          {String(unit.value).padStart(2, "0")}
                        </span>
                      </div>
                      <span className="text-[10px] text-muted-foreground font-mono uppercase mt-1 block">
                        {unit.label}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </section>

      {/* PDF Viewer */}
      <section className="pb-16">
        <div className="container-page">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <SampleReportViewer />
          </motion.div>
        </div>
      </section>

      {/* Download + Conversion Section */}
      <section className="pb-20 md:pb-28">
        <div className="container-page">
          <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8 items-start">
            {/* Download Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="bg-card border border-border rounded-xl p-8 card-shadow-lg relative overflow-hidden"
            >
              {/* Subtle accent corner */}
              <div className="absolute top-0 right-0 w-24 h-24 bg-accent/5 rounded-bl-[80px]" />

              <div className="relative">
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="w-5 h-5 text-primary" />
                  <span className="font-mono text-[11px] text-primary uppercase tracking-widest font-semibold">
                    Sample Extract
                  </span>
                </div>

                <h3 className="font-display text-xl font-bold text-foreground mb-2">
                  Kenya 2026 Economic Outlook
                </h3>
                <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                  Selected pages covering macroeconomic context, sector snapshots, and
                  methodology — a preview of the analytical depth in the full report.
                </p>

                {countdown.expired ? (
                  <Button variant="hero" size="lg" className="w-full hover-sink" asChild>
                    <Link to="/kenya-2026">
                      Buy Full Report <ArrowRight className="ml-1 w-4 h-4" />
                    </Link>
                  </Button>
                ) : (
                  <Button
                    variant="hero"
                    size="lg"
                    className="w-full hover-sink"
                    onClick={handleDownload}
                    disabled={downloading}
                  >
                    {downloading ? (
                      "Downloading…"
                    ) : (
                      <>
                        <Download className="w-4 h-4 mr-1" />
                        Download Free Sample
                      </>
                    )}
                  </Button>
                )}

                {/* Disclaimer */}
                <div className="mt-5 pt-4 border-t border-border">
                  <div className="flex items-start gap-2">
                    <Lock className="w-3.5 h-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      Confidential sample. Not for public distribution or resale.
                      This extract is provided for evaluation purposes only during launch week.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Full Report Upsell */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-card border border-primary/15 rounded-xl p-8 card-shadow-lg"
            >
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-accent" />
                <span className="font-mono text-[11px] text-accent uppercase tracking-widest font-semibold">
                  The Full Picture
                </span>
              </div>

              <h3 className="font-display text-xl font-bold text-foreground mb-2">
                The sample is the appetiser.
              </h3>
              <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                The full report is where the real edge lives — 120+ pages of sector-level
                investment frameworks, risk mapping, and proprietary projections you won't
                find in any public brief.
              </p>

              <ul className="space-y-3 mb-6">
                {fullReportFeatures.map((feat) => (
                  <li key={feat.text} className="flex items-start gap-3">
                    <feat.icon className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-foreground">{feat.text}</span>
                  </li>
                ))}
              </ul>

              <Button variant="hero-outline" size="lg" className="w-full hover-sink" asChild>
                <Link to="/kenya-2026">
                  Get the Full Report <ChevronRight className="w-4 h-4 ml-1" />
                </Link>
              </Button>

              <p className="text-[11px] text-muted-foreground text-center mt-4">
                Instant delivery after purchase · Secure PDF download
              </p>
            </motion.div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default SampleReport;
