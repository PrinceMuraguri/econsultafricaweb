import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Clock, Calendar, ArrowRight, ImageIcon } from "lucide-react";
import Layout from "@/components/Layout";
import { articles } from "@/data/articles";
import { Button } from "@/components/ui/button";

const ArticleDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const article = articles.find((a) => a.slug === slug);
  const articleIndex = articles.findIndex((a) => a.slug === slug);
  const nextArticle = articleIndex >= 0 && articleIndex < articles.length - 1 ? articles[articleIndex + 1] : null;
  const prevArticle = articleIndex > 0 ? articles[articleIndex - 1] : null;

  if (!article) {
    return (
      <Layout>
        <section className="section-padding">
          <div className="container-page max-w-3xl text-center">
            <h2 className="text-2xl font-bold text-foreground mb-4">Article not found</h2>
            <Link to="/insights" className="text-primary hover:text-accent transition-colors">
              ← Back to Insights
            </Link>
          </div>
        </section>
      </Layout>
    );
  }

  const formattedDate = new Date(article.date).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <Layout>
      <article className="section-padding">
        <div className="container-page max-w-3xl">
          <Link
            to="/insights"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Insights
          </Link>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            {/* Meta */}
            <div className="flex items-center gap-4 mb-4 flex-wrap">
              <span className="inline-block text-xs font-medium bg-primary/10 text-primary px-2.5 py-1 rounded-pill">
                {article.category}
              </span>
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Calendar className="w-3 h-3" />
                {formattedDate}
              </span>
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                {article.readTime} read
              </span>
            </div>

            {/* Title */}
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground leading-[1.1] mb-3">
              {article.title}
            </h1>
            <p className="text-xl text-muted-foreground font-display mb-8">
              {article.subtitle}
            </p>

            {/* Hero Image Placeholder */}
            <div className="w-full aspect-[16/9] bg-muted/50 border border-border rounded-lg mb-10 flex items-center justify-center">
              <img src={article.heroImage || "/placeholder.svg"} alt={article.title} className="w-full h-full object-contain rounded-lg" />
            </div>

            {/* Content */}
            <div className="prose prose-lg max-w-none">
              {article.content.map((block, i) => {
                if (block.startsWith("## ")) {
                  return (
                    <h2 key={i} className="text-2xl font-bold text-foreground mt-10 mb-4 font-display">
                      {block.replace("## ", "")}
                    </h2>
                  );
                }
                return (
                  <p key={i} className="text-foreground/80 leading-relaxed mb-5 text-base">
                    {block}
                  </p>
                );
              })}
            </div>

            {/* Author */}
            <div className="mt-12 pt-8 border-t border-border">
              <p className="text-sm text-muted-foreground mb-1">Written by</p>
              <p className="font-display font-semibold text-foreground">Prince Muraguri</p>
              <p className="text-sm text-muted-foreground">Founder, Econsult Africa</p>
            </div>

            {/* CTA Bridge */}
            <div className="mt-12 bg-primary/5 border border-primary/10 rounded-lg p-8 text-center">
              <p className="font-display font-semibold text-foreground text-lg mb-2">
                Want the full analysis?
              </p>
              <p className="text-sm text-muted-foreground mb-6">
                This article scratches the surface. Our Kenya 2026 Economic Outlook goes 10× deeper — with sector-level analysis and actionable frameworks.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button variant="hero" size="default" className="hover-sink" asChild>
                  <Link to="/kenya-2026">Buy Kenya 2026 Outlook <ArrowRight className="ml-1 w-4 h-4" /></Link>
                </Button>
                <Button variant="hero-outline" size="default" className="hover-sink" asChild>
                  <Link to="/intelligence-marketplace">Browse Intelligence Products</Link>
                </Button>
              </div>
            </div>

            {/* Navigation */}
            <div className="mt-12 flex justify-between gap-4">
              {prevArticle ? (
                <Link
                  to={`/insights/${prevArticle.slug}`}
                  className="flex-1 bg-card border border-border rounded-lg p-4 hover:border-primary/30 transition-colors group"
                >
                  <span className="text-xs text-muted-foreground">← Previous</span>
                  <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1 mt-1">
                    {prevArticle.title}
                  </p>
                </Link>
              ) : <div className="flex-1" />}
              {nextArticle ? (
                <Link
                  to={`/insights/${nextArticle.slug}`}
                  className="flex-1 bg-card border border-border rounded-lg p-4 hover:border-primary/30 transition-colors text-right group"
                >
                  <span className="text-xs text-muted-foreground">Next →</span>
                  <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1 mt-1">
                    {nextArticle.title}
                  </p>
                </Link>
              ) : <div className="flex-1" />}
            </div>
          </motion.div>
        </div>
      </article>
    </Layout>
  );
};

export default ArticleDetail;
