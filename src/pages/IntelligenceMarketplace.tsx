import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import ProductInterestModal from "@/components/ProductInterestModal";
import { useCart } from "@/contexts/CartContext";
import { COUNTRY_REPORTS, SECTOR_BRIEFS, AUDIENCE_NOTES, MarketplaceProduct } from "@/data/marketplace-products";
import { ArrowRight, Filter, Lock, ShoppingCart, BookOpen, Eye, Briefcase, Users, Zap } from "lucide-react";
import { trackFunnelEvent } from "@/lib/sales-funnel";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.5, ease: [0.2, 0, 0, 1] as const } }),
};

const COUNTRY_FILTERS = ["Kenya", "South Africa", "Nigeria", "Rwanda", "Ethiopia"];

function ProductCard({ product, onNotify }: { product: MarketplaceProduct; onNotify: (t: string) => void }) {
  const { addItem } = useCart();

  return (
    <motion.div whileHover={{ y: -4 }} className="group bg-background rounded-xl border border-border overflow-hidden card-shadow flex flex-col">
      <Link to={product.available ? `/product/${product.slug}` : "#"} onClick={e => { if (!product.available) e.preventDefault(); }}
        className="block relative bg-muted/30 p-3 sm:p-4">
        <div className="relative mx-auto" style={{ maxWidth: 180 }}>
          {/* Book spine effect */}
          <div className="absolute left-0 top-1 bottom-1 w-1.5 bg-foreground/10 rounded-l" />
          <div className="relative shadow-lg rounded-sm overflow-hidden border border-border/50">
            {product.cover ? (
              <img src={product.cover} alt={product.title} className="w-full aspect-[3/4] object-contain bg-white" />
            ) : (
              <div className="w-full aspect-[3/4] bg-gradient-to-br from-primary/10 to-accent/10 flex flex-col items-center justify-center gap-2">
                {product.flag ? <span className="text-4xl">{product.flag}</span> : <BookOpen className="w-10 h-10 text-muted-foreground/50" />}
              </div>
            )}
          </div>
          {/* Book shadow */}
          <div className="absolute -bottom-1 left-1 right-1 h-2 bg-foreground/5 rounded-b blur-sm" />
        </div>
        {!product.available && (
          <span className="absolute top-2 right-2 inline-flex items-center gap-1 text-[10px] font-semibold text-amber-600 bg-amber-100 dark:bg-amber-500/10 dark:text-amber-400 px-2 py-0.5 rounded-full">
            <Lock className="w-3 h-3" /> Coming Soon
          </span>
        )}
      </Link>

      <div className="p-4 flex flex-col flex-1">
        <span className="text-[10px] font-mono uppercase tracking-widest text-accent mb-1">
          {product.type === "country_report" ? "Country Report" : product.type === "sector_brief" ? "Sector Brief" : "Audience Note"}
        </span>
        <Link to={product.available ? `/product/${product.slug}` : "#"} onClick={e => { if (!product.available) e.preventDefault(); }}>
          <h3 className="font-display font-bold text-sm text-foreground mb-1 group-hover:text-primary transition-colors line-clamp-2">{product.title}</h3>
        </Link>
        <p className="text-xs text-muted-foreground line-clamp-2 mb-3 flex-1">{product.description?.slice(0, 100)}...</p>
        <p className="font-display font-bold text-xl text-primary mb-3">${product.price}</p>

        {product.available ? (
          <div className="space-y-1.5">
            <Button size="sm" className="w-full text-xs h-8" asChild>
              <Link to={`/product/${product.slug}`}>View Details <ArrowRight className="ml-1 w-3 h-3" /></Link>
            </Button>
            {product.file && (
              <Button variant="ghost" size="sm" className="w-full text-xs h-7 text-muted-foreground" asChild>
                <Link to={product.type === "country_report" ? `/sector-brief-preview/${encodeURIComponent(product.file)}` : `/sector-brief-preview/${encodeURIComponent(product.file)}`}>
                  <Eye className="w-3 h-3 mr-1" /> Browse Free Sample
                </Link>
              </Button>
            )}
            <Button variant="outline" size="sm" className="w-full text-xs h-8" onClick={() => { addItem({ id: product.id, title: product.title, price: product.price, type: product.type, file: product.file, country: product.country }); trackFunnelEvent("add_to_cart", { productId: product.id, productTitle: product.title, productType: product.type }); }}>
              <ShoppingCart className="w-3 h-3 mr-1" /> Add to Cart
            </Button>
          </div>
        ) : (
          <Button variant="outline" size="sm" className="w-full text-xs h-8" onClick={() => onNotify(product.title)}>
            Notify Me <ArrowRight className="ml-1 w-3 h-3" />
          </Button>
        )}
      </div>
    </motion.div>
  );
}

const IntelligenceMarketplace = () => {
  const [interestModal, setInterestModal] = useState<{ open: boolean; title: string }>({ open: false, title: "" });
  const [sectorCountry, setSectorCountry] = useState("Kenya");
  const [audienceCountry, setAudienceCountry] = useState("Kenya");
  const { items, setIsOpen } = useCart();
  const openInterest = (title: string) => setInterestModal({ open: true, title });

  useEffect(() => {
    trackFunnelEvent("marketplace_view");
  }, []);

  const filteredBriefs = SECTOR_BRIEFS.filter(b => b.country === sectorCountry);
  const filteredAudience = AUDIENCE_NOTES.filter(b => b.country === audienceCountry);
  const hasSectorContent = sectorCountry === "Kenya";
  const hasAudienceContent = audienceCountry === "Kenya";

  return (
    <Layout>
      {/* Hero — compact */}
      <section className="pt-10 pb-3 md:pt-14 md:pb-4 px-4 md:px-8">
        <div className="container-page flex items-center justify-between">
          <div className="max-w-3xl">
            <p className="font-mono text-xs text-accent uppercase tracking-widest mb-2">Intelligence Marketplace</p>
            <h1 className="text-2xl md:text-4xl font-bold text-foreground leading-[1.1] mb-2">Economic Intelligence. On Demand.</h1>
            <p className="text-sm text-muted-foreground">We don't rely on instinct—we rely on evidence. Explore our intelligence marketplace for insights crafted for you, whether you're an individual, a founder, a business, an investor, or a decision-maker shaping what comes next.</p>
          </div>
          {items.length > 0 && (
            <Button variant="outline" className="relative" onClick={() => setIsOpen(true)}>
              <ShoppingCart className="w-4 h-4 mr-2" /> Cart
              <span className="absolute -top-2 -right-2 bg-accent text-accent-foreground text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">{items.length}</span>
            </Button>
          )}
        </div>
      </section>

      {/* COUNTRY REPORTS */}
      <section className="py-8 md:py-12 bg-muted/50">
        <div className="container-page">
          <p className="font-mono text-xs text-accent uppercase tracking-widest mb-2">Country Reports</p>
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Flagship Country Outlooks</h2>
          <p className="text-muted-foreground text-sm mb-8 max-w-2xl">120+ page comprehensive economic analysis covering GDP, inflation, currency, fiscal policy, and sector deep-dives.</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
            {COUNTRY_REPORTS.map((r, i) => (
              <motion.div key={r.id} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}>
                <ProductCard product={r} onNotify={openInterest} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTOR BRIEFS */}
      <section className="py-8 md:py-12">
        <div className="container-page">
          <p className="font-mono text-xs text-accent uppercase tracking-widest mb-2">Sector Briefs</p>
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Sector Intelligence Briefs</h2>
          <p className="text-muted-foreground text-sm mb-4 max-w-2xl">Focused, decision-ready analysis for specific sectors.</p>

          <div className="flex flex-wrap gap-1.5 mb-6">
            {COUNTRY_FILTERS.map(c => (
              <Button key={c} variant={sectorCountry === c ? "default" : "outline"} size="sm" onClick={() => setSectorCountry(c)} className="text-xs h-7 px-3">{c}</Button>
            ))}
          </div>

          {hasSectorContent ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {filteredBriefs.map((b, i) => (
                <motion.div key={b.id} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}>
                  <ProductCard product={b} onNotify={openInterest} />
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-muted/30 rounded-lg border border-dashed border-border">
              <Lock className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
              <h3 className="font-bold text-lg mb-2">Sector briefs for {sectorCountry} coming soon</h3>
              <Button variant="outline" size="sm" onClick={() => openInterest(`${sectorCountry} Sector Briefs`)}>Notify Me</Button>
            </div>
          )}
        </div>
      </section>

      {/* AUDIENCE NOTES */}
      <section className="py-8 md:py-12 bg-muted/50">
        <div className="container-page">
          <p className="font-mono text-xs text-accent uppercase tracking-widest mb-2">Audience Notes</p>
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Audience-Specific Intelligence</h2>
          <p className="text-muted-foreground text-sm mb-4 max-w-2xl">Economic intelligence repackaged for your specific audience.</p>

          <div className="flex flex-wrap gap-1.5 mb-6">
            {COUNTRY_FILTERS.map(c => (
              <Button key={c} variant={audienceCountry === c ? "default" : "outline"} size="sm" onClick={() => setAudienceCountry(c)} className="text-xs h-7 px-3">{c}</Button>
            ))}
          </div>

          {hasAudienceContent ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {filteredAudience.map((n, i) => (
                <motion.div key={n.id} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}>
                  <ProductCard product={n} onNotify={openInterest} />
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-muted/30 rounded-lg border border-dashed border-border">
              <Lock className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
              <h3 className="font-bold text-lg mb-2">Audience notes for {audienceCountry} coming soon</h3>
              <Button variant="outline" size="sm" onClick={() => openInterest(`${audienceCountry} Audience Notes`)}>Notify Me</Button>
            </div>
          )}
        </div>
      </section>

      {/* Advisory */}
      <section className="py-8 md:py-12">
        <div className="container-page">
          <p className="font-mono text-xs text-accent uppercase tracking-widest mb-2">Advisory & Engagements</p>
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-8">Custom Intelligence & Briefings</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { num: "01", icon: Briefcase, title: "Organization-Specific Economic Brief", desc: "We translate the macroeconomic environment into insights tailored to your organization.", price: "$1,000 – $5,000+", cta: "Request a Brief" },
              { num: "02", icon: Users, title: "Executive Strategy Briefings", desc: "We present insights directly to your leadership team and answer questions in real time.", price: "$1,500 – $10,000+", cta: "Book a Briefing" },
              { num: "03", icon: Zap, title: "Intelligence Access Retainer", desc: "Continuous access to decision-grade economic insight with quarterly deep-dives.", price: "$300 – $1,000/month", cta: "Discuss Access" },
            ].map((item, i) => (
              <motion.div key={item.num} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}
                className="bg-background rounded-lg border border-border p-6 card-shadow flex flex-col">
                <div className="flex items-center gap-3 mb-3">
                  <span className="font-mono text-xl font-bold text-accent">{item.num}</span>
                  <item.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-bold text-lg text-foreground mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground mb-3 flex-1">{item.desc}</p>
                <p className="text-xs text-muted-foreground mb-4"><span className="font-semibold text-foreground">Investment:</span> {item.price}</p>
                <Button className="w-full" asChild>
                  <Link to="/contact">{item.cta} <ArrowRight className="ml-1 w-3 h-3" /></Link>
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 bg-primary">
        <div className="container-page text-center">
          <h2 className="text-3xl font-bold text-primary-foreground mb-4">Not sure where to start?</h2>
          <p className="text-primary-foreground/70 mb-6 max-w-xl mx-auto">Tell us what you're trying to decide, and we'll recommend the right intelligence product.</p>
          <Button variant="gold" size="lg" asChild>
            <Link to="/contact">Get in Touch <ArrowRight className="ml-1" /></Link>
          </Button>
        </div>
      </section>

      <ProductInterestModal open={interestModal.open} onOpenChange={(open) => setInterestModal(prev => ({ ...prev, open }))} productTitle={interestModal.title} />
    </Layout>
  );
};

export default IntelligenceMarketplace;
