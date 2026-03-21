import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 16, filter: "blur(4px)" },
  visible: (i: number) => ({
    opacity: 1, y: 0, filter: "blur(0px)",
    transition: { delay: i * 0.09, duration: 0.6, ease: [0.16, 1, 0.3, 1] as const }
  })
};

interface CountryNode {
  id: string;
  name: string;
  xPct: number;
  yPct: number;
  status: "active" | "coming";
  label: string;
  description: string;
}

const countryNodes: CountryNode[] = [
  { id: "egypt", name: "Egypt", xPct: 66.2, yPct: 10.2, status: "coming", label: "Coming Soon", description: "IMF reform roadmap & growth projections" },
  { id: "nigeria", name: "Nigeria", xPct: 39.2, yPct: 39.3, status: "coming", label: "Coming Soon", description: "Currency dynamics & diversification signals" },
  { id: "kenya", name: "Kenya", xPct: 73.8, yPct: 51.7, status: "active", label: "Available Now", description: "Kenya 2026 Economic Outlook" },
  { id: "rwanda", name: "Rwanda", xPct: 64.4, yPct: 54.5, status: "coming", label: "Coming Soon", description: "Innovation hub & regional integration" },
  { id: "south-africa", name: "South Africa", xPct: 59.1, yPct: 91.9, status: "coming", label: "Coming Soon", description: "Fiscal trajectory & mining outlook" },
];

const AfricaMapSection = () => {
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <section id="africa-coverage" className="section-padding bg-foreground overflow-hidden">
      <div className="container-page">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Text intro — left */}
          <div>
            <motion.p
              initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }}
              variants={fadeUp} custom={0}
              className="font-mono text-xs text-gold uppercase tracking-widest mb-4"
            >
              Coverage
            </motion.p>
            <motion.h2
              initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }}
              variants={fadeUp} custom={1}
              className="text-3xl md:text-4xl font-bold text-background mb-6 leading-[1.1]"
            >
              Pan-African Economic Intelligence
            </motion.h2>
            <motion.p
              initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }}
              variants={fadeUp} custom={2}
              className="text-lg text-background/70 leading-relaxed mb-4 max-w-lg"
            >
              Country-level insight across Africa's most important economies — with Kenya available now and additional markets in development.
            </motion.p>
            <motion.p
              initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }}
              variants={fadeUp} custom={3}
              className="text-sm text-background/50 mb-10 max-w-lg"
            >
              Africa is made up of 54 distinct economies, each with its own dynamics. We are building intelligence coverage across the continent's most strategic markets.
            </motion.p>

            {/* Country list */}
            <div className="space-y-3">
              {countryNodes.map((country, i) => (
                <motion.div
                  key={country.id}
                  initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }}
                  variants={fadeUp} custom={i + 4}
                  onMouseEnter={() => setHovered(country.id)}
                  onMouseLeave={() => setHovered(null)}
                  className={`flex items-center gap-4 rounded-lg px-5 py-4 transition-all duration-300 cursor-default ${
                    country.status === "active"
                      ? "bg-primary/15 border border-primary/30"
                      : "bg-background/5 border border-background/10"
                  } ${hovered === country.id ? "scale-[1.02]" : ""}`}
                >
                  <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                    country.status === "active"
                      ? "bg-gold shadow-[0_0_8px_hsl(var(--gold)/0.6)]"
                      : "bg-background/30"
                  }`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-display font-bold text-background text-sm">{country.name}</span>
                      <span className={`font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        country.status === "active"
                          ? "bg-gold/20 text-gold"
                          : "bg-background/10 text-background/40"
                      }`}>
                        {country.label}
                      </span>
                    </div>
                    <p className="text-xs text-background/40 mt-0.5 truncate">{country.description}</p>
                  </div>
                  {country.status === "active" && (
                    <Button variant="ghost" size="sm" className="text-gold hover:text-gold hover:bg-gold/10 flex-shrink-0 text-xs" asChild>
                      <Link to="/kenya-2026">View Report <ArrowRight className="w-3 h-3 ml-1" /></Link>
                    </Button>
                  )}
                </motion.div>
              ))}
            </div>

            <motion.div
              initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }}
              variants={fadeUp} custom={9}
              className="mt-8"
            >
              <Button variant="hero" size="lg" className="hover-sink" asChild>
                <Link to="/kenya-2026">Get Kenya 2026 Outlook <ArrowRight className="ml-1" /></Link>
              </Button>
            </motion.div>
          </div>

          {/* Africa Map — right */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="relative hidden lg:block"
          >
            <div className="relative w-full max-w-[540px] mx-auto">
              {/* Real Africa SVG map */}
              <img
                src="/images/africa.svg"
                alt="Map of Africa"
                className="w-full h-auto opacity-50"
                style={{ filter: "brightness(6) saturate(0.2)" }}
              />

              {/* SVG overlay for nodes, lines, and labels */}
              <svg
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                className="absolute inset-0 w-full h-full pointer-events-none"
              >
                <defs>
                  <radialGradient id="pulse-grad-active">
                    <stop offset="0%" stopColor="hsl(var(--gold))" stopOpacity="0.5" />
                    <stop offset="100%" stopColor="hsl(var(--gold))" stopOpacity="0" />
                  </radialGradient>
                </defs>

                {/* Network lines between nodes */}
                {countryNodes.map((from, i) =>
                  countryNodes.slice(i + 1).map((to) => (
                    <line
                      key={`${from.id}-${to.id}`}
                      x1={from.xPct} y1={from.yPct}
                      x2={to.xPct} y2={to.yPct}
                      stroke="hsl(var(--background))"
                      strokeOpacity="0.06"
                      strokeWidth="0.3"
                      strokeDasharray="1.5 2"
                    />
                  ))
                )}
              </svg>

              {/* Country markers as HTML overlays for proper interaction */}
              {countryNodes.map((country) => {
                const isActive = country.status === "active";
                const isHovered = hovered === country.id;

                return (
                  <div
                    key={country.id}
                    className="absolute group"
                    style={{
                      left: `${country.xPct}%`,
                      top: `${country.yPct}%`,
                      transform: "translate(-50%, -50%)",
                    }}
                    onMouseEnter={() => setHovered(country.id)}
                    onMouseLeave={() => setHovered(null)}
                  >
                    {/* Pulse rings for Kenya */}
                    {isActive && (
                      <>
                        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-gold/20 animate-ping" />
                        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-7 w-7 rounded-full bg-gold/25" />
                      </>
                    )}

                    {/* Soft glow for coming-soon */}
                    {!isActive && (
                      <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-6 w-6 rounded-full bg-primary/10 blur-[2px]" />
                    )}

                    {/* Node dot */}
                    <span
                      className={`relative block rounded-full border-2 transition-transform duration-300 ${
                        isActive
                          ? "h-4 w-4 bg-gold border-gold/40 shadow-[0_0_12px_hsl(var(--gold)/0.5)]"
                          : "h-3 w-3 bg-primary/40 border-primary/20"
                      } ${isHovered ? "scale-150" : "scale-100"}`}
                    />

                    {/* Tooltip on hover */}
                    {isHovered && (
                      <div
                        className={`absolute z-30 mt-2 left-4 min-w-[170px] rounded-xl border px-4 py-3 text-left shadow-xl backdrop-blur-md transition-all duration-200 ${
                          isActive
                            ? "border-gold/20 bg-foreground/95"
                            : "border-background/15 bg-foreground/90"
                        }`}
                      >
                        <div className="text-sm font-bold text-background">{country.name}</div>
                        <div className={`mt-0.5 text-xs font-medium font-mono ${
                          isActive ? "text-gold" : "text-background/40"
                        }`}>
                          {country.label}
                        </div>
                        <div className="mt-1 text-[11px] text-background/50">{country.description}</div>
                        {isActive && (
                          <Link
                            to="/kenya-2026"
                            className="mt-2 inline-flex items-center text-xs font-semibold text-gold hover:underline"
                          >
                            View Report <ArrowRight className="w-3 h-3 ml-1" />
                          </Link>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default AfricaMapSection;
