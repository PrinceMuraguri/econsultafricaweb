import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import ProductInterestModal from "@/components/ProductInterestModal";
import { ArrowRight, FileText, BarChart3, Users, Briefcase, Zap, Globe, Eye, Lock, Filter } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.5, ease: [0.2, 0, 0, 1] as const } }),
};

const COUNTRY_FILTERS = ["Kenya", "South Africa", "Nigeria", "Rwanda", "Ethiopia"];

const SECTOR_BRIEFS = [
  { title: "Banking & Financial Services", file: "Kenya_2026_Banking_Financial_Services_Brief.pdf", country: "Kenya" },
  { title: "Agriculture & Food Security", file: "Kenya_2026_Agriculture_Food_Security_Brief.pdf", country: "Kenya" },
  { title: "Energy & Infrastructure", file: "Kenya_2026_Energy_Infrastructure_Brief.pdf", country: "Kenya" },
  { title: "Manufacturing & Industry", file: "Kenya_2026_Manufacturing_Industry_Brief.pdf", country: "Kenya" },
  { title: "Digital Economy", file: "Kenya_2026_Technology_Digital_Economy_Brief.pdf", country: "Kenya" },
  { title: "Tourism & Hospitality", file: "Kenya_2026_Tourism_Hospitality_Brief.pdf", country: "Kenya" },
  { title: "Real Estate & Construction", file: "Kenya_2026_Real_Estate_Construction_Brief.pdf", country: "Kenya" },
  { title: "Retail & Consumer", file: "Kenya_2026_Retail_Consumer_Brief.pdf", country: "Kenya" },
];

const AUDIENCE_NOTES = [
  { title: "Development Partner Brief", description: "Macro-fiscal analysis calibrated for development finance institutions, donors, and multilateral partners operating in the region." },
  { title: "Corporate Strategy Brief", description: "Economic context and outlook structured for C-suite teams, corporate planners, and strategy consultants." },
  { title: "Exporter/Importer Trade Brief", description: "Currency, tariff, logistics, and demand-side intelligence for cross-border trade operators." },
  { title: "Startup & SME Environment Scan", description: "Regulatory environment, consumer trends, and funding landscape analysis for founders and growth-stage businesses." },
];

const COUNTRY_REPORTS = [
  { country: "Kenya", title: "Kenya 2026 Economic Outlook", price: "$495", available: true, flag: "🇰🇪" },
  { country: "South Africa", title: "South Africa 2026 Economic Outlook", price: "$495", available: false, flag: "🇿🇦" },
  { country: "Nigeria", title: "Nigeria 2026 Economic Outlook", price: "$495", available: false, flag: "🇳🇬" },
  { country: "Rwanda", title: "Rwanda 2026 Economic Outlook", price: "$495", available: false, flag: "🇷🇼" },
  { country: "Ethiopia", title: "Ethiopia 2026 Economic Outlook", price: "$495", available: false, flag: "🇪🇹" },
];

const IntelligenceMarketplace = () => {
  const [interestModal, setInterestModal] = useState<{ open: boolean; title: string }>({ open: false, title: "" });
  const [sectorCountry, setSectorCountry] = useState("Kenya");
  const [audienceCountry, setAudienceCountry] = useState("Kenya");
  const [purchaseLoading, setPurchaseLoading] = useState<string | null>(null);
  const openInterest = (title: string) => setInterestModal({ open: true, title });

  const handlePurchaseBrief = async (brief: typeof SECTOR_BRIEFS[0]) => {
    setPurchaseLoading(brief.file);
    try {
      const { supabase } = await import("@/integrations/supabase/client");
      const callbackUrl = `${window.location.origin}/purchase-success?product=${encodeURIComponent(brief.title)}&type=sector_brief`;
      const { data, error } = await supabase.functions.invoke("paystack-checkout", {
        body: {
          email: "", // Paystack will collect email
          amount: 95,
          callback_url: callbackUrl,
          metadata: { type: "sector_brief", product: `${brief.country} ${brief.title}`, file: brief.file },
        },
      });
      if (error || !data?.authorization_url) throw new Error(data?.error || "Failed to start payment");
      window.location.href = data.authorization_url;
    } catch (err: any) {
      const { useToast } = await import("@/hooks/use-toast");
      alert(err.message || "Payment error. Please try again.");
      setPurchaseLoading(null);
    }
  };

  const filteredBriefs = SECTOR_BRIEFS.filter(b => b.country === sectorCountry);
  const hasSectorContent = sectorCountry === "Kenya";
  const hasAudienceContent = false; // All audience notes coming soon for now

  return (
    <Layout>
      {/* Hero */}
      <section className="pt-8 pb-4 md:pt-12 md:pb-6 px-4 md:px-8">
        <div className="container-page">
          <div className="max-w-3xl mb-6 md:mb-8">
            <motion.p initial="hidden" animate="visible" variants={fadeUp} custom={0}
              className="font-mono text-xs text-gold uppercase tracking-widest mb-2">Intelligence Marketplace</motion.p>
            <motion.h1 initial="hidden" animate="visible" variants={fadeUp} custom={1}
              className="text-2xl md:text-4xl font-bold text-foreground leading-[1.1] mb-3">
              Economic Intelligence. On Demand.
            </motion.h1>
            <motion.p initial="hidden" animate="visible" variants={fadeUp} custom={2}
              className="text-sm md:text-base text-muted-foreground leading-relaxed">
              Intelligence products calibrated for organizations navigating African economies.
            </motion.p>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* SECTION 1: COUNTRY REPORTS */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <section className="section-padding bg-muted/50">
        <div className="container-page">
          <motion.p initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}
            className="font-mono text-xs text-gold uppercase tracking-widest mb-4">Country Reports</motion.p>
          <motion.h2 initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={1}
            className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Flagship Country Outlooks
          </motion.h2>
          <motion.p initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={2}
            className="text-muted-foreground mb-12 max-w-2xl">
            120+ page comprehensive economic analysis covering GDP, inflation, currency, fiscal policy, and sector deep-dives.
          </motion.p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {COUNTRY_REPORTS.map((report, i) => (
              <motion.div key={report.country} initial="hidden" whileInView="visible" viewport={{ once: true }}
                variants={fadeUp} custom={i} whileHover={{ y: -4 }}
                className={`rounded-lg border p-6 flex flex-col card-shadow ${
                  report.available
                    ? "bg-primary text-primary-foreground border-primary ring-2 ring-primary/20"
                    : "bg-background border-border"
                }`}>
                <span className="text-3xl mb-3">{report.flag}</span>
                {!report.available && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-600 bg-amber-100 dark:bg-amber-500/10 dark:text-amber-400 px-2 py-0.5 rounded-full mb-2 w-fit">
                    <Lock className="w-3 h-3" /> Coming Soon
                  </span>
                )}
                <h3 className="font-display font-bold text-lg mb-2">{report.title}</h3>
                <p className={`font-display font-bold text-2xl mb-1 ${report.available ? "" : "text-foreground"}`}>{report.price}</p>
                <p className={`text-xs mb-4 ${report.available ? "opacity-60" : "text-muted-foreground"}`}>Single organization license</p>
                <div className="mt-auto space-y-2">
                  {report.available ? (
                    <>
                      <Button variant="gold" size="sm" className="w-full hover-sink" asChild>
                        <Link to="/kenya-2026">Purchase Report <ArrowRight className="ml-1 w-3 h-3" /></Link>
                      </Button>
                      <Button variant="ghost" size="sm" className="w-full text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10" asChild>
                        <Link to="/sample-report"><Eye className="w-4 h-4 mr-1" /> Browse Sample</Link>
                      </Button>
                    </>
                  ) : (
                    <Button variant="hero-outline" size="sm" className="w-full hover-sink" onClick={() => openInterest(report.title)}>
                      Notify Me <ArrowRight className="ml-1 w-3 h-3" />
                    </Button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* SECTION 2: SECTOR BRIEFS */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <section className="section-padding">
        <div className="container-page">
          <motion.p initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}
            className="font-mono text-xs text-gold uppercase tracking-widest mb-4">Sector Briefs</motion.p>
          <motion.h2 initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={1}
            className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Sector Intelligence Briefs
          </motion.h2>
          <motion.p initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={2}
            className="text-muted-foreground mb-8 max-w-2xl">
            Focused, decision-ready analysis for specific sectors. Each brief maps opportunities, risks, and strategic implications — so you act with clarity, not guesswork.
          </motion.p>

          {/* Country filter */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <Filter className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Country</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {COUNTRY_FILTERS.map(c => (
                <Button key={c} variant={sectorCountry === c ? "default" : "outline"} size="sm" onClick={() => setSectorCountry(c)} className="text-xs h-7">
                  {c}
                </Button>
              ))}
            </div>
          </div>

          {hasSectorContent ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredBriefs.map((brief, i) => (
                <motion.div key={brief.title} initial="hidden" whileInView="visible" viewport={{ once: true }}
                  variants={fadeUp} custom={i} whileHover={{ y: -4 }}
                  className="bg-background rounded-lg border border-border p-6 card-shadow flex flex-col">
                  <span className="inline-block text-xs font-medium bg-primary/10 text-primary px-2 py-1 rounded-full mb-3">{brief.country}</span>
                  <h3 className="font-display font-bold text-foreground mb-2">{brief.title}</h3>
                  <p className="text-xs text-muted-foreground mb-4 flex-1">
                    In-depth analysis of {brief.title.toLowerCase()} in {brief.country} — trends, risks, opportunities, and strategic recommendations for decision-makers.
                  </p>
                  <p className="font-display font-bold text-2xl text-primary mb-4">$95</p>
                  <div className="space-y-2">
                    <Button variant="hero" size="sm" className="w-full hover-sink" 
                      onClick={() => handlePurchaseBrief(brief)}
                      disabled={purchaseLoading === brief.file}>
                      {purchaseLoading === brief.file ? "Processing..." : "Purchase Brief"} <ArrowRight className="ml-1 w-3 h-3" />
                    </Button>
                    <Button variant="ghost" size="sm" className="w-full text-muted-foreground hover:text-foreground" asChild>
                      <Link to={`/sector-brief-preview/${encodeURIComponent(brief.file)}`}>
                        <Eye className="w-4 h-4 mr-1" /> Browse Sample
                      </Link>
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-muted/30 rounded-lg border border-dashed border-border">
              <Lock className="w-8 h-8 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-display font-bold text-lg text-foreground mb-2">Sector briefs for {sectorCountry} coming soon</h3>
              <p className="text-sm text-muted-foreground mb-4">Be the first to know when they're ready.</p>
              <Button variant="hero-outline" size="sm" onClick={() => openInterest(`${sectorCountry} Sector Briefs`)}>
                Notify Me When Available <ArrowRight className="ml-1 w-3 h-3" />
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* SECTION 3: AUDIENCE NOTES */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <section className="section-padding bg-muted/50">
        <div className="container-page">
          <motion.p initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}
            className="font-mono text-xs text-gold uppercase tracking-widest mb-4">Audience Notes</motion.p>
          <motion.h2 initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={1}
            className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Audience-Specific Intelligence
          </motion.h2>
          <motion.p initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={2}
            className="text-muted-foreground mb-8 max-w-2xl">
            Economic intelligence repackaged for your specific audience — whether you're a development partner, corporate strategist, trade operator, or founder.
          </motion.p>

          {/* Country filter */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <Filter className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Country</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {COUNTRY_FILTERS.map(c => (
                <Button key={c} variant={audienceCountry === c ? "default" : "outline"} size="sm" onClick={() => setAudienceCountry(c)} className="text-xs h-7">
                  {c}
                </Button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {AUDIENCE_NOTES.map((note, i) => (
              <motion.div key={note.title} initial="hidden" whileInView="visible" viewport={{ once: true }}
                variants={fadeUp} custom={i} whileHover={{ y: -4 }}
                className="bg-background rounded-lg border border-border p-6 card-shadow flex flex-col">
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-600 bg-amber-100 dark:bg-amber-500/10 dark:text-amber-400 px-2 py-0.5 rounded-full mb-3 w-fit">
                  <Lock className="w-3 h-3" /> Coming Soon
                </span>
                <span className="inline-block text-xs font-medium bg-accent/10 text-accent px-2 py-1 rounded-full mb-3 w-fit">{audienceCountry}</span>
                <h3 className="font-display font-bold text-foreground mb-2">{note.title}</h3>
                <p className="text-xs text-muted-foreground mb-4 flex-1">{note.description}</p>
                <p className="font-display font-bold text-2xl text-primary mb-4">$195</p>
                <Button variant="hero-outline" size="sm" className="w-full hover-sink" onClick={() => openInterest(`${audienceCountry} ${note.title}`)}>
                  Notify Me <ArrowRight className="ml-1 w-3 h-3" />
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* SECTION 4: Tailored Intelligence & Engagements */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <section className="section-padding">
        <div className="container-page">
          <motion.p initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}
            className="font-mono text-xs text-gold uppercase tracking-widest mb-4">Advisory & Engagements</motion.p>
          <motion.h2 initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={1}
            className="text-3xl md:text-4xl font-bold text-foreground mb-12">Custom Intelligence & Briefings</motion.h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { num: "01", icon: Briefcase, title: "Organization-Specific Economic Brief", desc: "We translate the macroeconomic environment into insights tailored to your organization, sector, and strategy.", deliverable: "Custom brief aligned to your organization's context", price: "$1,000 – $5,000+", cta: "Request a Brief" },
              { num: "02", icon: Users, title: "Executive Strategy Briefings", desc: "We present insights directly to your leadership team, break them down, and answer questions in real time.", deliverable: "Pre-read document + live briefing + follow-up memo", price: "$1,500 – $10,000+", cta: "Book a Briefing" },
              { num: "03", icon: Zap, title: "Intelligence Access Retainer", desc: "Continuous access to decision-grade economic insight. Quarterly deep-dives, real-time signals, and direct analyst access.", deliverable: "Quarterly report + monthly updates + analyst hotline", price: "$300 – $1,000/month", cta: "Discuss Access" },
            ].map((item, i) => (
              <motion.div key={item.num} initial="hidden" whileInView="visible" viewport={{ once: true }}
                variants={fadeUp} custom={i}
                className="bg-background rounded-lg border border-border p-8 card-shadow flex flex-col">
                <div className="flex items-center gap-4 mb-4">
                  <span className="font-mono text-2xl font-bold text-gold">{item.num}</span>
                  <item.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-display font-bold text-xl text-foreground mb-3">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4 flex-1">{item.desc}</p>
                <p className="text-xs text-muted-foreground mb-1"><span className="font-semibold text-foreground">Deliverable:</span> {item.deliverable}</p>
                <p className="text-xs text-muted-foreground mb-4"><span className="font-semibold text-foreground">Investment:</span> {item.price}</p>
                <Button variant="hero" className="hover-sink w-full" asChild>
                  <Link to="/contact">{item.cta} <ArrowRight className="ml-1 w-3 h-3" /></Link>
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding bg-primary">
        <div className="container-page text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-6">Not sure where to start?</h2>
          <p className="text-lg text-primary-foreground/70 mb-8 max-w-xl mx-auto">
            Tell us what you're trying to decide, and we'll recommend the right intelligence product for your team.
          </p>
          <Button variant="gold" size="lg" className="hover-sink" asChild>
            <Link to="/contact">Get in Touch <ArrowRight className="ml-1" /></Link>
          </Button>
        </div>
      </section>

      <ProductInterestModal
        open={interestModal.open}
        onOpenChange={(open) => setInterestModal(prev => ({ ...prev, open }))}
        productTitle={interestModal.title}
      />
    </Layout>
  );
};

export default IntelligenceMarketplace;
