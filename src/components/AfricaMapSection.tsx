import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: [0.2, 0, 0, 1] as const }
  })
};

interface CountryNode {
  id: string;
  name: string;
  cx: number;
  cy: number;
  status: "active" | "coming";
  label: string;
  description: string;
}

const countryNodes: CountryNode[] = [
  { id: "egypt", name: "Egypt", cx: 555, cy: 195, status: "coming", label: "Coming Soon", description: "IMF reform roadmap & growth projections" },
  { id: "nigeria", name: "Nigeria", cx: 385, cy: 340, status: "coming", label: "Coming Soon", description: "Currency dynamics & diversification signals" },
  { id: "kenya", name: "Kenya", cx: 570, cy: 390, status: "active", label: "Available Now", description: "Kenya 2026 Economic Outlook" },
  { id: "rwanda", name: "Rwanda", cx: 540, cy: 410, status: "coming", label: "Coming Soon", description: "Innovation hub & regional integration" },
  { id: "south-africa", name: "South Africa", cx: 490, cy: 560, status: "coming", label: "Coming Soon", description: "Fiscal trajectory & mining outlook" },
];

// Network lines connecting featured countries
const networkLines = [
  { x1: 555, y1: 195, x2: 385, y2: 340 }, // Egypt → Nigeria
  { x1: 555, y1: 195, x2: 570, y2: 390 }, // Egypt → Kenya
  { x1: 385, y1: 340, x2: 570, y2: 390 }, // Nigeria → Kenya
  { x1: 570, y1: 390, x2: 540, y2: 410 }, // Kenya → Rwanda
  { x1: 570, y1: 390, x2: 490, y2: 560 }, // Kenya → South Africa
  { x1: 540, y1: 410, x2: 490, y2: 560 }, // Rwanda → South Africa
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
              className="text-3xl md:text-4xl font-bold text-background mb-6"
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

            {/* Country list — mobile-friendly cards */}
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
                  {/* Status dot */}
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

          {/* Interactive Africa Map — right */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.7, ease: [0.2, 0, 0, 1] as const }}
            className="relative hidden lg:block"
          >
            <svg
              viewBox="100 50 600 600"
              className="w-full h-auto max-w-[520px] mx-auto"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                {/* Glow filter for Kenya */}
                <filter id="glow-active" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="6" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
                <filter id="glow-soft" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
                {/* Radial gradient for map */}
                <radialGradient id="map-grad" cx="50%" cy="45%" r="50%">
                  <stop offset="0%" stopColor="hsl(220 20% 95%)" stopOpacity="0.12" />
                  <stop offset="100%" stopColor="hsl(220 20% 95%)" stopOpacity="0.03" />
                </radialGradient>
                {/* Pulse animation */}
                <radialGradient id="pulse-grad">
                  <stop offset="0%" stopColor="#F4714D" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="#F4714D" stopOpacity="0" />
                </radialGradient>
              </defs>

              {/* Simplified Africa silhouette - stylized outline */}
              <path
                d="M420,80 C380,75 340,85 310,100 C280,115 260,140 250,170 
                   C240,200 235,230 240,255 C242,270 248,282 255,295 
                   C260,305 258,315 250,325 C240,340 225,355 220,370 
                   C215,385 218,400 225,415 C232,430 245,445 255,460 
                   C265,475 270,490 280,505 C290,520 305,540 320,555 
                   C335,570 350,580 370,585 C385,588 400,590 415,595 
                   C425,598 435,605 445,610 C455,615 465,615 475,610 
                   C485,605 490,598 498,590 C506,582 515,572 520,560 
                   C525,548 528,535 530,520 C532,505 530,490 535,478 
                   C540,466 548,458 555,448 C562,438 568,425 572,410 
                   C576,395 578,378 580,360 C582,342 583,324 585,308 
                   C587,292 592,278 598,265 C604,252 610,240 612,225 
                   C614,210 610,195 602,182 C594,169 583,158 572,148 
                   C561,138 548,130 535,122 C522,114 508,108 495,100 
                   C482,92 468,85 450,82 C435,79 428,80 420,80Z"
                fill="url(#map-grad)"
                stroke="hsl(220 20% 95%)"
                strokeOpacity="0.1"
                strokeWidth="1.5"
              />

              {/* Subtle grid dots for intelligence feel */}
              {Array.from({ length: 15 }).map((_, i) => {
                const x = 250 + (i % 5) * 80;
                const y = 150 + Math.floor(i / 5) * 160;
                return (
                  <circle key={`dot-${i}`} cx={x} cy={y} r="1" fill="hsl(220 20% 95%)" opacity="0.06" />
                );
              })}

              {/* Network lines */}
              {networkLines.map((line, i) => (
                <line
                  key={`line-${i}`}
                  x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2}
                  stroke="hsl(220 20% 95%)"
                  strokeOpacity="0.08"
                  strokeWidth="1"
                  strokeDasharray="4 6"
                />
              ))}

              {/* Country nodes */}
              {countryNodes.map((country) => {
                const isActive = country.status === "active";
                const isHovered = hovered === country.id;

                return (
                  <g
                    key={country.id}
                    onMouseEnter={() => setHovered(country.id)}
                    onMouseLeave={() => setHovered(null)}
                    className="cursor-pointer"
                  >
                    {/* Pulse ring for Kenya */}
                    {isActive && (
                      <>
                        <circle cx={country.cx} cy={country.cy} r="24" fill="url(#pulse-grad)">
                          <animate attributeName="r" values="14;28;14" dur="3s" repeatCount="indefinite" />
                          <animate attributeName="opacity" values="0.5;0;0.5" dur="3s" repeatCount="indefinite" />
                        </circle>
                        <circle cx={country.cx} cy={country.cy} r="18" fill="url(#pulse-grad)">
                          <animate attributeName="r" values="10;22;10" dur="3s" begin="0.5s" repeatCount="indefinite" />
                          <animate attributeName="opacity" values="0.3;0;0.3" dur="3s" begin="0.5s" repeatCount="indefinite" />
                        </circle>
                      </>
                    )}

                    {/* Node outer ring */}
                    <circle
                      cx={country.cx} cy={country.cy}
                      r={isActive ? 10 : 6}
                      fill="none"
                      stroke={isActive ? "#F4714D" : "hsl(220 20% 95%)"}
                      strokeOpacity={isActive ? 0.6 : 0.2}
                      strokeWidth={isActive ? 2 : 1}
                      filter={isActive ? "url(#glow-active)" : undefined}
                    />

                    {/* Node center */}
                    <circle
                      cx={country.cx} cy={country.cy}
                      r={isActive ? 5 : 3}
                      fill={isActive ? "#F4714D" : "hsl(220 20% 95%)"}
                      fillOpacity={isActive ? 1 : 0.3}
                      filter={isActive ? "url(#glow-active)" : "url(#glow-soft)"}
                      className="transition-all duration-300"
                      style={{
                        transform: isHovered ? "scale(1.4)" : "scale(1)",
                        transformOrigin: `${country.cx}px ${country.cy}px`,
                      }}
                    />

                    {/* Country label */}
                    <text
                      x={country.cx + (isActive ? 16 : 12)}
                      y={country.cy + 4}
                      fill="hsl(220 20% 95%)"
                      fillOpacity={isActive ? 0.9 : 0.35}
                      fontSize={isActive ? "12" : "10"}
                      fontFamily="'Schibsted Grotesk', sans-serif"
                      fontWeight={isActive ? 700 : 500}
                      letterSpacing="-0.02em"
                    >
                      {country.name}
                    </text>

                    {/* Status label */}
                    {isActive && (
                      <text
                        x={country.cx + 16}
                        y={country.cy + 18}
                        fill="#F4714D"
                        fontSize="8"
                        fontFamily="'JetBrains Mono', monospace"
                        style={{ textTransform: "uppercase" }}
                        letterSpacing="0.1em"
                      >
                        AVAILABLE NOW
                      </text>
                    )}

                    {/* Hover tooltip */}
                    {isHovered && (
                      <g>
                        <rect
                          x={country.cx - 90}
                          y={country.cy - 55}
                          width="180"
                          height={isActive ? 42 : 36}
                          rx="4"
                          fill="hsl(224 30% 15%)"
                          stroke={isActive ? "#F4714D" : "hsl(220 20% 95%)"}
                          strokeOpacity={isActive ? 0.4 : 0.15}
                          strokeWidth="1"
                          filter="url(#glow-soft)"
                        />
                        <text
                          x={country.cx}
                          y={country.cy - 37}
                          textAnchor="middle"
                          fill="hsl(220 20% 95%)"
                          fontSize="10"
                          fontFamily="'Schibsted Grotesk', sans-serif"
                          fontWeight="600"
                        >
                          {country.description}
                        </text>
                        {isActive && (
                          <text
                            x={country.cx}
                            y={country.cy - 22}
                            textAnchor="middle"
                            fill="#F4714D"
                            fontSize="9"
                            fontFamily="'JetBrains Mono', monospace"
                          >
                            → View Report
                          </text>
                        )}
                        {!isActive && (
                          <text
                            x={country.cx}
                            y={country.cy - 25}
                            textAnchor="middle"
                            fill="hsl(220 20% 95%)"
                            fillOpacity="0.4"
                            fontSize="8"
                            fontFamily="'JetBrains Mono', monospace"
                          >
                            IN DEVELOPMENT
                          </text>
                        )}
                      </g>
                    )}
                  </g>
                );
              })}
            </svg>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default AfricaMapSection;
