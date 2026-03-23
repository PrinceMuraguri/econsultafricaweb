import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { BookOpen, Search, ArrowRight, Calendar, Clock, Mic, Video, FileText, Newspaper } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { articles, ContentType } from "@/data/articles";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.5, ease: [0.2, 0, 0, 1] as const } })
};

const contentTypes: {label: ContentType;icon: React.ReactNode;}[] = [
{ label: "Articles", icon: <Newspaper className="w-4 h-4" /> },
{ label: "Podcasts", icon: <Mic className="w-4 h-4" /> },
{ label: "Videos", icon: <Video className="w-4 h-4" /> },
{ label: "Research", icon: <FileText className="w-4 h-4" /> }];


const Insights = () => {
  const [activeType, setActiveType] = useState<ContentType>("Articles");
  const [activeCategory, setActiveCategory] = useState("All");
  const [search, setSearch] = useState("");

  const itemsOfType = articles.filter((a) => a.contentType === activeType);
  const subcategories = ["All", ...Array.from(new Set(itemsOfType.map((a) => a.category)))];

  const filtered = itemsOfType.
  filter((a) => {
    const matchesCat = activeCategory === "All" || a.category === activeCategory;
    const matchesSearch = search === "" || a.title.toLowerCase().includes(search.toLowerCase()) || a.excerpt.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  }).
  sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleTypeChange = (type: ContentType) => {
    setActiveType(type);
    setActiveCategory("All");
    setSearch("");
  };

  return (
    <Layout>
      <section className="section-padding">
        <div className="container-page">
          <div className="max-w-3xl mb-12">
            <motion.p initial="hidden" animate="visible" variants={fadeUp} custom={0} className="font-mono text-xs text-accent uppercase tracking-widest mb-4">
              Insights
            </motion.p>
            <motion.h1 initial="hidden" animate="visible" variants={fadeUp} custom={1} className="text-4xl md:text-5xl font-bold text-foreground leading-[1.1] mb-6">
              Economic Intelligence by Econsult Africa<br />
              <span className="text-2xl md:text-3xl font-medium opacity-80">from The Economic Whisperer series</span>
            </motion.h1>
            <motion.p initial="hidden" animate="visible" variants={fadeUp} custom={2} className="text-lg text-muted-foreground leading-relaxed">
              Sharp analysis on the forces shaping Kenya's economy — written for decision-makers.
            </motion.p>
          </div>

          {/* Major Category Tabs */}
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={3} className="flex gap-1 mb-6 border-b border-border">
            {contentTypes.map((type) =>
            <button
              key={type.label}
              onClick={() => handleTypeChange(type.label)}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeType === type.label ?
              "border-primary text-primary" :
              "border-transparent text-muted-foreground hover:text-foreground hover:border-border"}`
              }>
              
                {type.icon}
                {type.label}
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
              activeType === type.label ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`
              }>
                  {articles.filter((a) => a.contentType === type.label).length}
                </span>
              </button>
            )}
          </motion.div>

          {/* Subcategory Filters + Search */}
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={4} className="flex flex-col sm:flex-row gap-4 mb-8">
            <div className="flex gap-2 flex-wrap">
              {subcategories.map((cat) =>
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-pill text-sm font-medium transition-colors ${
                activeCategory === cat ?
                "bg-primary text-primary-foreground" :
                "bg-background border border-border text-muted-foreground hover:text-primary hover:border-primary/30"}`
                }>
                
                  {cat}
                </button>
              )}
            </div>
            <div className="relative sm:ml-auto w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder={`Search ${activeType.toLowerCase()}...`} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
            </div>
          </motion.div>

          {/* Featured Item (Articles only, unfiltered) */}
          {activeType === "Articles" && filtered.length > 0 && activeCategory === "All" && search === "" &&
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0} className="mb-10">
              <Link to={`/insights/${filtered[0].slug}`} className="block group">
                <div className="bg-card rounded-lg border border-border overflow-hidden card-shadow hover-sink">
                  <div className="grid md:grid-cols-2 gap-0">
                    <div className="aspect-[16/10] bg-muted/50 flex items-center justify-center">
                      <img src={filtered[0].heroImage || "/placeholder.svg"} alt={filtered[0].title} className="w-full h-full object-contain" />
                    </div>
                    <div className="p-8 flex flex-col justify-center">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="inline-block text-xs font-medium bg-accent/10 text-accent px-2 py-1 rounded-pill">Latest</span>
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
          }

          {/* Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(activeType === "Articles" && activeCategory === "All" && search === "" ? filtered.slice(1) : filtered).map((item, i) =>
            <motion.div key={item.id} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}>
                <Link to={`/insights/${item.slug}`} className="block group h-full">
                  <div className="bg-card rounded-lg border border-border overflow-hidden card-shadow hover-sink h-full flex flex-col">
                    {/* Media area */}
                    <div className="aspect-[16/9] bg-muted/50 flex items-center justify-center relative">
                      {item.contentType === "Podcasts" ?
                    <div className="flex flex-col items-center gap-3 text-muted-foreground">
                          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                            <Mic className="w-7 h-7 text-primary" />
                          </div>
                          <span className="text-xs font-medium">Podcast Episode</span>
                        </div> :
                    item.contentType === "Videos" ?
                    <div className="flex flex-col items-center gap-3 text-muted-foreground">
                          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                            <Video className="w-7 h-7 text-primary" />
                          </div>
                          <span className="text-xs font-medium">Video</span>
                        </div> :
                    item.contentType === "Research" ?
                    <div className="flex flex-col items-center gap-3 text-muted-foreground">
                          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                            <FileText className="w-7 h-7 text-primary" />
                          </div>
                          <span className="text-xs font-medium">Research Paper</span>
                        </div> :

                    <img src={item.heroImage || "/placeholder.svg"} alt={item.title} className="w-full h-full object-contain" />
                    }
                      {/* Type badge */}
                      {item.contentType !== "Articles" &&
                    <span className="absolute top-3 right-3 text-[10px] font-semibold uppercase tracking-wider bg-background/90 backdrop-blur-sm text-foreground px-2 py-1 rounded">
                          {item.contentType === "Podcasts" ? "Audio" : item.contentType === "Videos" ? "Video" : "PDF"}
                        </span>
                    }
                    </div>
                    <div className="p-6 flex flex-col flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="inline-block text-xs font-medium bg-primary/10 text-primary px-2 py-1 rounded-pill">
                          {item.category}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          {new Date(item.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </span>
                      </div>
                      <h2 className="font-display font-semibold text-lg text-foreground leading-snug mb-1 group-hover:text-primary transition-colors">
                        {item.title}
                      </h2>
                      <p className="text-xs text-muted-foreground font-medium mb-3">{item.subtitle}</p>
                      <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3 flex-1">{item.excerpt}</p>
                      <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {item.readTime} {item.contentType === "Research" ? "" : "read"}
                        </span>
                        <span className="text-xs font-medium text-primary group-hover:text-accent transition-colors">
                          {item.contentType === "Podcasts" ? "Listen →" : item.contentType === "Videos" ? "Watch →" : item.contentType === "Research" ? "View →" : "Read →"}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            )}
          </div>

          {filtered.length === 0 &&
          <div className="text-center py-16">
              <p className="text-muted-foreground">No {activeType.toLowerCase()} found matching your criteria.</p>
            </div>
          }

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
    </Layout>);

};

export default Insights;