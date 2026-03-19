import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.5, ease: [0.2, 0, 0, 1] as const } }),
};

const filters = ["All", "Country Reports", "Sector Briefs"];

const products = [
  { title: "Kenya 2026 Economic Outlook", price: "$495", description: "120+ page flagship report covering GDP, inflation, currency, fiscal policy, and 10 sector deep-dives. The definitive intelligence product for Kenya.", type: "Country Reports", featured: true, href: "/kenya-2026" },
  { title: "Tourism Sector Brief — Kenya", price: "$195", description: "Post-pandemic recovery trajectory, revenue forecasts, regulatory landscape, and opportunity mapping for Kenya's tourism sector.", type: "Sector Briefs", featured: false, href: "/contact" },
  { title: "Financial Services Brief — Kenya", price: "$195", description: "Banking sector health, fintech disruption, digital lending regulation, and capital markets outlook.", type: "Sector Briefs", featured: false, href: "/contact" },
  { title: "Agriculture Sector Brief — Kenya", price: "$195", description: "Climate risk analysis, horticulture export dynamics, value chain mapping, and food security projections.", type: "Sector Briefs", featured: false, href: "/contact" },
  { title: "Energy & Infrastructure Brief — Kenya", price: "$195", description: "Geothermal expansion, renewable energy targets, and infrastructure pipeline analysis.", type: "Sector Briefs", featured: false, href: "/contact" },
  { title: "South Africa 2026 Outlook", price: "Coming Soon", description: "Fiscal trajectory, mining sector outlook, energy crisis analysis, and policy risk framework.", type: "Country Reports", featured: false, href: "#" },
  { title: "Nigeria 2026 Outlook", price: "Coming Soon", description: "Currency dynamics, oil dependency analysis, diversification signals, and growth corridor mapping.", type: "Country Reports", featured: false, href: "#" },
];

const Products = () => {
  const [activeFilter, setActiveFilter] = useState("All");

  const filtered = products.filter((p) => activeFilter === "All" || p.type === activeFilter);

  return (
    <Layout>
      <section className="section-padding">
        <div className="container-page">
          <div className="max-w-3xl mb-12">
            <motion.p initial="hidden" animate="visible" variants={fadeUp} custom={0} className="font-mono text-xs text-gold uppercase tracking-widest mb-4">Products</motion.p>
            <motion.h1 initial="hidden" animate="visible" variants={fadeUp} custom={1} className="text-4xl md:text-5xl font-bold text-foreground leading-[1.1] mb-6">
              Explore Our Reports & Products
            </motion.h1>
            <motion.p initial="hidden" animate="visible" variants={fadeUp} custom={2} className="text-lg text-muted-foreground leading-relaxed">
              Premium economic intelligence products designed for strategic decision-makers across African markets.
            </motion.p>
          </div>

          {/* Filters */}
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={3} className="flex gap-2 mb-10 flex-wrap">
            {filters.map((f) => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`px-4 py-2 rounded-pill text-sm font-medium transition-colors ${
                  activeFilter === f
                    ? "bg-primary text-primary-foreground"
                    : "bg-background border border-border text-muted-foreground hover:text-primary hover:border-primary/30"
                }`}
              >
                {f}
              </button>
            ))}
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((product, i) => (
              <motion.div
                key={product.title}
                initial="hidden" whileInView="visible" viewport={{ once: true }}
                variants={fadeUp} custom={i}
                whileHover={{ y: -4 }}
                className={`bg-background rounded-lg border p-6 card-shadow flex flex-col ${
                  product.featured ? "border-primary/30 ring-1 ring-primary/20" : "border-border"
                }`}
              >
                {product.featured && (
                  <span className="inline-block text-xs font-semibold bg-accent text-accent-foreground px-2 py-0.5 rounded-pill mb-3 w-fit">Flagship</span>
                )}
                <span className="text-xs font-medium text-muted-foreground mb-2">{product.type}</span>
                <h3 className="font-display font-bold text-lg text-foreground mb-2">{product.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed mb-4 flex-1">{product.description}</p>
                <p className={`font-display font-bold text-xl mb-4 ${product.price === "Coming Soon" ? "text-muted-foreground" : "text-primary"}`}>
                  {product.price}
                </p>
                {product.price !== "Coming Soon" ? (
                  <Button variant={product.featured ? "hero" : "hero-outline"} size="sm" className="w-full hover-sink" asChild>
                    <Link to={product.href}>{product.featured ? "Buy Report" : "Inquire"} <ArrowRight className="ml-1" /></Link>
                  </Button>
                ) : (
                  <Button variant="hero-outline" size="sm" className="w-full" disabled>Coming Soon</Button>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Products;
