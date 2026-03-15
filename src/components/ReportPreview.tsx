import { useRef } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";

const pages = [
  {
    title: "Macro Summary",
    subtitle: "GDP, inflation, fiscal outlook, and currency projections for 2026.",
    stats: [
      { label: "GDP Growth", value: "5.4%" },
      { label: "Inflation (Avg)", value: "6.2%" },
      { label: "KES/USD", value: "132.5" },
    ],
    locked: false,
  },
  {
    title: "Demographic Shifts",
    subtitle: "Population growth, urbanization trends, and labor market dynamics.",
    stats: [
      { label: "Urban Pop.", value: "31.2M" },
      { label: "Youth Unemp.", value: "14.8%" },
      { label: "Median Age", value: "20.1" },
    ],
    locked: false,
  },
  {
    title: "Sector Analysis",
    subtitle: "Deep-dive into 10 sectors with opportunity mapping.",
    stats: [],
    locked: true,
  },
  {
    title: "Risk Vectors",
    subtitle: "Political, fiscal, and climate risk assessment.",
    stats: [],
    locked: true,
  },
  {
    title: "Investment Thesis",
    subtitle: "Capital allocation framework for the Kenyan market.",
    stats: [],
    locked: true,
  },
];

const ReportPreview = () => {
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <div className="relative">
      <div
        ref={scrollRef}
        className="flex gap-6 overflow-x-auto pb-6 snap-x snap-mandatory scrollbar-hide"
        style={{ scrollbarWidth: "none" }}
      >
        {pages.map((page, i) => (
          <motion.div
            key={page.title}
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1, duration: 0.5 }}
            className="snap-start flex-shrink-0 w-80 md:w-96"
          >
            <div className={`relative bg-background rounded-lg border border-border p-8 h-72 card-shadow ${page.locked ? "overflow-hidden" : ""}`}>
              {page.locked && (
                <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
                  <Lock className="w-6 h-6 text-muted-foreground mb-3" />
                  <p className="font-display font-semibold text-foreground text-sm mb-3">Unlock the full report</p>
                  <Button variant="hero" size="sm" className="hover-sink" asChild>
                    <Link to="/kenya-2026">Get Access</Link>
                  </Button>
                </div>
              )}
              <p className="font-mono text-xs text-gold mb-1">Page {i + 1} of 5</p>
              <h3 className="font-display font-bold text-xl text-foreground mb-2">{page.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-6">{page.subtitle}</p>
              {page.stats.length > 0 && (
                <div className="space-y-3">
                  {page.stats.map((stat) => (
                    <div key={stat.label} className="flex justify-between items-center py-2 border-b border-border last:border-0">
                      <span className="text-sm text-muted-foreground">{stat.label}</span>
                      <span className="font-mono text-sm font-semibold text-foreground">{stat.value}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default ReportPreview;
