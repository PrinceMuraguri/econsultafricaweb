import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { BookOpen, Mic, Video, BarChart3, Search, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BookOpen, Mic, Video, BarChart3, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.5, ease: [0.2, 0, 0, 1] as const } }),
};

const categories = [
  { key: "all", label: "All", icon: null },
  { key: "articles", label: "Articles", icon: BookOpen },
  { key: "podcasts", label: "Podcasts", icon: Mic },
  { key: "videos", label: "Videos", icon: Video },
  { key: "research", label: "Research & Papers", icon: BarChart3 },
];

const posts = [
  { title: "Kenya's Fiscal Consolidation: What It Means for Corporate Tax", date: "Mar 2026", read: "6 min", category: "Fiscal Policy", type: "articles", excerpt: "The 2025/26 budget framework signals a pivot toward revenue-led consolidation. We analyze the implications for corporate taxation and investment incentives." },
  { title: "Agriculture Sector Outlook: Climate Risk and Export Opportunity", date: "Feb 2026", read: "8 min", category: "Agriculture", type: "articles", excerpt: "Horticulture exports reached record levels in 2025. But climate volatility and logistics costs present a dual challenge for the sector in 2026." },
  { title: "The KES Trajectory: Projections for H2 2026", date: "Feb 2026", read: "5 min", category: "Currency", type: "articles", excerpt: "After relative stability in H1, our models project moderate depreciation pressure driven by global dollar strength and local fiscal dynamics." },
  { title: "Digital Lending Regulation: A New Framework Emerges", date: "Jan 2026", read: "7 min", category: "Financial Services", type: "articles", excerpt: "The Central Bank's new digital lending regulations create compliance costs but also market clarity for established fintechs." },
  { title: "Energy Transition in East Africa: Kenya's Geothermal Advantage", date: "Jan 2026", read: "9 min", category: "Energy", type: "research", excerpt: "Kenya's geothermal capacity expansion positions it as a regional leader in green energy — with implications for manufacturing competitiveness." },
  { title: "Youth Employment: Structural Challenges and Policy Responses", date: "Dec 2025", read: "6 min", category: "Labor Market", type: "research", excerpt: "With 14.8% youth unemployment, the government's TVET expansion and digital jobs initiative face scrutiny." },
  { title: "The Economic Whisperer: Episode 1 — GDP Behind the Headlines", date: "Mar 2026", read: "32 min", category: "Macro", type: "podcasts", excerpt: "Prince Muraguri breaks down what Kenya's GDP numbers actually mean for businesses on the ground." },
  { title: "Understanding Africa's Debt Landscape", date: "Feb 2026", read: "18 min", category: "Macro", type: "videos", excerpt: "A visual explainer on sovereign debt across major African economies and what it means for growth." },
];

const Insights = () => {
  const [activeCategory, setActiveCategory] = useState("all");
  const [search, setSearch] = useState("");

  const filtered = posts.filter((p) => {
    const matchesCategory = activeCategory === "all" || p.type === activeCategory;
    const matchesSearch = search === "" || p.title.toLowerCase().includes(search.toLowerCase()) || p.excerpt.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <Layout>
      <section className="section-padding">
        <div className="container-page">
          <div className="max-w-3xl mb-12">
            <motion.p initial="hidden" animate="visible" variants={fadeUp} custom={0} className="font-mono text-xs text-gold uppercase tracking-widest mb-4">Insights</motion.p>
            <motion.h1 initial="hidden" animate="visible" variants={fadeUp} custom={1} className="text-4xl md:text-5xl font-bold text-foreground leading-[1.1] mb-6">
              Insights from The Economic Whisperer
            </motion.h1>
            <motion.p initial="hidden" animate="visible" variants={fadeUp} custom={2} className="text-lg text-muted-foreground leading-relaxed">
              Ideas, analysis, and perspectives on African economies — beyond the headlines.
            </motion.p>
          </div>

          {/* Filters */}
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={3} className="flex flex-col sm:flex-row gap-4 mb-8">
            <div className="flex gap-2 flex-wrap">
              {categories.map((cat) => (
                <button
                  key={cat.key}
                  onClick={() => setActiveCategory(cat.key)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-pill text-sm font-medium transition-colors ${
                    activeCategory === cat.key
                      ? "bg-primary text-primary-foreground"
                      : "bg-background border border-border text-muted-foreground hover:text-primary hover:border-primary/30"
                  }`}
                >
                  {cat.icon && <cat.icon className="w-4 h-4" />}
                  {cat.label}
                </button>
              ))}
            </div>
            <div className="relative sm:ml-auto w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search insights..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filtered.map((post, i) => (
              <motion.article
                key={post.title}
                initial="hidden" whileInView="visible" viewport={{ once: true }}
                variants={fadeUp} custom={i}
                whileHover={{ y: -4 }}
                className="bg-background rounded-lg border border-border p-8 card-shadow hover-sink cursor-pointer"
              >
                <div className="flex items-center gap-3 mb-4">
                  <span className="font-mono text-xs text-gold">{post.date}</span>
                  <span className="text-xs text-muted-foreground">· {post.read} {post.type === "podcasts" || post.type === "videos" ? "" : "read"}</span>
                </div>
                <div className="flex gap-2 mb-3">
                  <span className="inline-block text-xs font-medium bg-primary/10 text-primary px-2 py-1 rounded-pill">{post.category}</span>
                  <span className="inline-block text-xs font-medium bg-accent/10 text-accent px-2 py-1 rounded-pill capitalize">{post.type === "articles" ? "Article" : post.type === "podcasts" ? "Podcast" : post.type === "videos" ? "Video" : "Research"}</span>
                </div>
                <h2 className="font-display font-semibold text-xl text-foreground leading-snug mb-3">{post.title}</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">{post.excerpt}</p>
              </motion.article>
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
