import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { BookOpen, Search, ArrowRight, Calendar, Clock, ImageIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { articles } from "@/data/articles";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.5, ease: [0.2, 0, 0, 1] as const } }),
};

const allCategories = ["All", ...Array.from(new Set(articles.map((a) => a.category)))];

const Insights = () => {
  const [activeCategory, setActiveCategory] = useState("All");
  const [search, setSearch] = useState("");

  const filtered = articles
    .filter((a) => {
      const matchesCat = activeCategory === "All" || a.category === activeCategory;
      const matchesSearch = search === "" || a.title.toLowerCase().includes(search.toLowerCase()) || a.excerpt.toLowerCase().includes(search.toLowerCase());
      return matchesCat && matchesSearch;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <Layout>
      <section className="section-padding">
        <div className="container-page">
          <div className="max-w-3xl mb-12">
            <motion.p initial="hidden" animate="visible" variants={fadeUp} custom={0} className="font-mono text-xs text-accent uppercase tracking-widest mb-4">
              Insights
            </motion.p>
            <motion.h1 initial="hidden" animate="visible" variants={fadeUp} custom={1} className="text-4xl md:text-5xl font-bold text-foreground leading-[1.1] mb-6">
              Economic Intelligence from The Economic Whisperer
            </motion.h1>
            <motion.p initial="hidden" animate="visible" variants={fadeUp} custom={2} className="text-lg text-muted-foreground leading-relaxed">
              Sharp analysis on the forces shaping Kenya's economy — written for decision-makers, not academics.
            </motion.p>
          </div>

          {/* Filters */}
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={3} className="flex flex-col sm:flex-row gap-4 mb-8">
            <div className="flex gap-2 flex-wrap">
              {allCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-4 py-2 rounded-pill text-sm font-medium transition-colors ${
                    activeCategory === cat
                      ? "bg-primary text-primary-foreground"
                      : "bg-background border border-border text-muted-foreground hover:text-primary hover:border-primary/30"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
            <div className="relative sm:ml-auto w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search insights..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
            </div>
          </motion.div>

          {/* Featured Article */}
          {filtered.length > 0 && activeCategory === "All" && search === "" && (
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0} className="mb-10">
              <Link to={`/insights/${filtered[0].slug}`} className="block group">
                <div className="bg-card rounded-lg border border-border overflow-hidden card-shadow hover-sink">
                  <div className="grid md:grid-cols-2 gap-0">
                    <div className="aspect-[16/10] bg-muted/50 flex items-center justify-center">
                      <img src={filtered[0].heroImage || "/placeholder.svg"} alt={filtered[0].title} className="w-full h-full object-contain" />
                    </div>
                    <div className="p-8 flex flex-col justify-center">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="inline-block text-xs font-medium bg-accent/10 text-accent px-2 py-1 rounded-pill">
                          Latest
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(filtered[0].date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </span>
                      </div>
                      <h2 className="font-display font-bold text-2xl text-foreground leading-snug mb-2 group-hover:text-primary transition-colors">
                        {filtered[0].title}
                      </h2>
                      <p className="text-sm text-muted-foreground mb-1 font-medium">{filtered[0].subtitle}</p>
                      <p className="text-sm text-muted-foreground leading-relaxed mt-3 line-clamp-3">{filtered[0].excerpt}</p>
                      <span className="inline-flex items-center gap-1 text-sm font-medium text-primary mt-4">
                        Read article <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          )}

          {/* Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(activeCategory === "All" && search === "" ? filtered.slice(1) : filtered).map((article, i) => (
              <motion.div
                key={article.id}
                initial="hidden" whileInView="visible" viewport={{ once: true }}
                variants={fadeUp} custom={i}
              >
                <Link to={`/insights/${article.slug}`} className="block group h-full">
                  <div className="bg-card rounded-lg border border-border overflow-hidden card-shadow hover-sink h-full flex flex-col">
                    {/* Image placeholder */}
                    <div className="aspect-[16/9] bg-muted/50 flex items-center justify-center">
                      <img src={article.heroImage || "/placeholder.svg"} alt={article.title} className="w-full h-full object-contain" />
                    </div>
                    <div className="p-6 flex flex-col flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="inline-block text-xs font-medium bg-primary/10 text-primary px-2 py-1 rounded-pill">
                          {article.category}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          {new Date(article.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </span>
                      </div>
                      <h2 className="font-display font-semibold text-lg text-foreground leading-snug mb-1 group-hover:text-primary transition-colors">
                        {article.title}
                      </h2>
                      <p className="text-xs text-muted-foreground font-medium mb-3">{article.subtitle}</p>
                      <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3 flex-1">{article.excerpt}</p>
                      <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {article.readTime} read
                        </span>
                        <span className="text-xs font-medium text-primary group-hover:text-accent transition-colors">
                          Read →
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-16">
              <p className="text-muted-foreground">No insights found matching your criteria.</p>
            </div>
          )}

          {/* Conversion bridge */}
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}
            className="mt-16 bg-primary/5 border border-primary/10 rounded-lg p-8 text-center">
            <p className="font-display font-semibold text-foreground text-lg mb-2">Want deeper insight?</p>
            <p className="text-sm text-muted-foreground mb-6">These articles scratch the surface. Our full reports go 10× deeper — with sector-level analysis and actionable frameworks.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="hero" size="default" className="hover-sink" asChild>
                <Link to="/kenya-2026">Buy Kenya 2026 Outlook <ArrowRight className="ml-1" /></Link>
              </Button>
              <Button variant="hero-outline" size="default" className="hover-sink" asChild>
                <Link to="/products">View All Reports</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
};

export default Insights;
