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
  cx: number;
  cy: number;
  status: "active" | "coming";
  label: string;
  description: string;
}

const countryNodes: CountryNode[] = [
  { id: "egypt", name: "Egypt", cx: 497, cy: 98, status: "coming", label: "Coming Soon", description: "IMF reform roadmap & growth projections" },
  { id: "nigeria", name: "Nigeria", cx: 264, cy: 283, status: "coming", label: "Coming Soon", description: "Currency dynamics & diversification signals" },
  { id: "kenya", name: "Kenya", cx: 558, cy: 369, status: "active", label: "Available Now", description: "Kenya 2026 Economic Outlook" },
  { id: "rwanda", name: "Rwanda", cx: 479, cy: 400, status: "coming", label: "Coming Soon", description: "Innovation hub & regional integration" },
  { id: "south-africa", name: "South Africa", cx: 427, cy: 666, status: "coming", label: "Coming Soon", description: "Fiscal trajectory & mining outlook" },
];

const networkLines = [
  { x1: 497, y1: 98, x2: 264, y2: 283 },
  { x1: 497, y1: 98, x2: 558, y2: 369 },
  { x1: 264, y1: 283, x2: 558, y2: 369 },
  { x1: 558, y1: 369, x2: 479, y2: 400 },
  { x1: 558, y1: 369, x2: 427, y2: 666 },
  { x1: 479, y1: 400, x2: 427, y2: 666 },
];

// Geographically accurate Africa outline generated from Natural Earth 110m data
const AFRICA_PATH = "M519.0,389.5L572.0,426.8L583.2,483.2L575.2,489.0L525.6,495.2L517.4,474.2L487.4,463.4L476.2,445.2L484.2,391.3L519.0,389.5Z M93.3,103.4L93.1,121.2L60.3,120.7L50.7,166.7L9.4,170.0L32.5,165.0L66.1,111.2L93.3,103.4Z M473.4,425.0L487.4,463.4L467.3,465.3L463.7,497.9L477.0,512.6L451.6,496.1L401.6,490.8L397.3,452.9L354.7,460.7L343.3,438.8L301.8,437.9L340.1,415.4L374.7,329.7L404.1,339.7L436.5,327.4L477.2,334.0L491.7,358.0L478.8,374.0L473.4,425.0Z M595.9,396.8L589.8,352.2L629.6,330.0L669.4,285.5L669.5,265.9L691.1,259.8L665.9,326.6L595.9,396.8Z M572.0,426.8L519.0,389.5L530.4,360.9L520.1,337.5L533.0,324.9L561.2,344.0L598.6,340.8L589.8,352.2L595.9,396.8L572.0,426.8Z M425.7,297.7L399.4,254.1L418.9,223.9L430.0,160.0L548.7,160.0L564.1,200.0L548.5,210.4L519.7,293.2L507.4,257.5L493.5,281.9L430.7,277.3L425.7,297.7Z M418.4,184.2L418.9,223.9L399.4,254.1L408.6,268.6L332.8,305.8L319.5,284.5L334.7,280.2L315.4,236.3L339.0,176.1L328.5,151.4L338.6,145.9L418.4,184.2Z M343.4,665.8L378.9,664.6L379.0,627.7L396.1,647.3L413.1,632.7L436.6,634.9L474.3,600.9L491.9,602.5L499.3,623.7L486.9,647.4L508.3,647.4L462.2,707.7L380.7,728.0L363.8,721.4L343.4,665.8Z M469.8,669.6L461.1,685.5L450.0,678.8L469.8,669.6Z M491.9,602.5L460.2,594.9L432.6,557.4L450.4,559.4L482.7,535.1L508.5,547.1L506.6,583.0L491.9,602.5Z M474.3,600.9L436.6,634.9L413.1,632.7L396.1,647.3L379.0,627.7L389.1,562.5L432.6,557.4L474.3,600.9Z M379.0,627.7L378.9,664.6L343.4,665.8L297.3,553.0L430.8,555.8L389.1,562.5L379.0,627.7Z M12.9,244.1L3.7,232.7L34.2,214.0L64.9,255.6L13.2,256.2L41.6,244.9L12.9,244.1Z M64.9,255.6L63.3,226.1L124.6,225.0L115.5,130.4L222.7,188.4L216.4,224.3L139.9,245.3L126.0,276.3L99.7,277.9L88.7,256.9L64.9,255.6Z M9.4,170.0L50.7,166.7L60.3,120.7L93.1,121.2L93.2,106.0L130.8,130.3L115.5,130.4L124.6,225.0L58.3,233.8L34.2,214.0L15.4,218.6L9.4,170.0Z M206.9,317.4L198.7,318.6L187.7,275.3L208.5,257.6L218.0,272.7L206.9,317.4Z M328.5,151.4L339.0,176.1L315.4,236.3L321.8,255.2L310.8,244.0L270.1,251.7L234.4,241.3L221.1,244.7L216.1,263.4L190.2,251.5L183.7,230.7L216.4,224.3L222.7,188.4L300.0,145.3L328.5,151.4Z M206.9,317.4L223.7,242.5L270.1,251.7L310.8,244.0L325.8,259.1L297.5,310.2L272.3,315.6L265.0,332.3L239.0,337.4L223.3,317.3L206.9,317.4Z M325.0,251.4L334.7,280.2L319.5,284.5L334.4,303.1L324.8,332.7L339.4,362.7L276.5,357.2L267.6,325.2L297.5,310.2L325.0,251.4Z M189.0,270.0L198.7,318.6L190.6,320.7L179.5,272.9L189.0,270.0Z M180.2,269.8L190.6,320.7L151.4,330.1L150.6,270.4L180.2,269.8Z M99.7,277.9L151.7,283.6L151.4,330.1L102.9,336.4L99.7,277.9Z M43.0,254.1L88.7,256.9L97.2,303.1L74.9,296.5L68.8,279.5L47.5,291.0L28.7,269.6L43.0,254.1Z M13.2,256.2L42.6,261.9L28.7,269.6L13.2,256.2Z M95.6,303.1L102.9,336.4L65.6,312.1L77.7,295.9L95.6,303.1Z M47.5,291.0L68.8,279.5L77.7,295.9L65.6,312.1L47.5,291.0Z M126.0,276.3L137.2,247.7L169.3,230.3L183.7,230.7L201.8,253.7L189.0,270.0L150.6,270.4L151.7,283.6L126.0,276.3Z M453.7,327.7L404.1,339.7L374.7,329.7L340.1,357.3L324.6,325.5L332.8,305.8L408.6,268.6L414.6,290.5L453.7,327.7Z M364.5,345.0L340.1,415.4L325.8,429.7L299.1,430.4L294.8,407.7L319.9,404.7L324.3,393.3L310.8,357.3L339.4,362.7L351.3,342.7L364.5,345.0Z M292.8,357.4L322.8,368.0L324.3,393.3L290.9,419.8L268.0,391.1L292.8,357.4Z M276.5,357.2L292.8,357.4L292.9,369.4L274.9,369.9L276.5,357.2Z M487.4,463.4L512.3,476.8L512.1,519.7L481.8,528.0L450.4,559.4L412.2,555.2L398.9,540.8L399.3,509.0L420.2,509.1L419.1,489.3L477.0,512.6L463.7,497.9L464.5,471.6L487.4,463.4Z M507.6,472.3L522.8,481.6L536.9,526.1L530.3,548.0L524.6,526.1L506.9,517.1L507.6,472.3Z M525.6,495.2L583.2,483.2L587.8,526.9L527.9,577.8L534.6,621.2L500.7,647.3L491.9,602.5L506.6,583.0L508.5,547.1L481.8,528.0L512.1,519.7L530.3,548.0L536.9,526.1L525.6,495.2Z M500.7,647.3L486.9,647.4L490.4,637.3L500.7,647.3Z M310.0,427.8L301.8,437.9L310.0,427.8Z M303.2,441.0L343.3,438.8L354.7,460.7L397.3,452.9L401.6,490.8L420.2,492.4L420.2,509.1L399.3,509.0L398.9,540.8L412.2,555.2L297.3,553.0L317.4,493.0L303.2,441.0Z M484.7,404.1L473.4,425.0L470.2,408.4L484.7,404.1Z M675.4,504.7L683.8,537.1L651.0,629.4L634.1,636.0L613.5,607.8L619.6,554.1L675.4,504.7Z M12.9,244.1L41.6,244.9L12.9,244.1Z M274.8,76.9L255.2,39.0L275.1,6.5L290.3,9.1L281.5,36.7L294.9,48.6L274.8,76.9Z M93.2,106.0L93.3,91.6L166.9,57.4L158.3,28.3L167.9,22.9L264.2,10.5L255.2,39.0L278.1,85.8L273.2,119.1L300.0,145.3L211.6,189.4L93.2,106.0Z M544.3,235.8L548.5,210.4L564.1,200.0L610.8,253.0L580.3,234.8L544.3,235.8Z M158.3,28.3L166.9,57.4L93.3,91.6L92.1,108.8L66.1,111.2L32.5,165.0L9.8,165.8L35.6,117.5L84.4,80.7L93.4,47.6L120.7,22.4L158.3,28.3Z M548.7,160.0L430.0,160.0L431.6,64.3L522.7,67.8L521.5,101.8L503.2,82.4L548.7,160.0Z M430.0,160.0L430.0,180.0L418.4,184.2L338.6,145.9L321.4,155.1L283.0,136.2L273.2,119.1L279.5,66.2L294.9,48.6L370.9,77.3L388.5,52.9L429.2,61.0L430.0,160.0Z M657.9,300.0L629.6,330.0L575.6,345.8L541.6,335.5L509.5,302.2L544.3,235.8L559.1,230.4L596.0,245.5L597.6,269.5L616.8,288.2L657.9,300.0Z M603.5,254.6L613.2,256.1L607.8,270.7L597.6,269.5L603.5,254.6Z M669.5,265.9L657.9,300.0L605.6,274.3L611.5,265.4L621.2,275.5L669.5,265.9Z M519.0,389.5L475.8,393.4L492.5,342.2L524.8,344.4L519.0,389.5Z M484.2,391.3L487.6,402.9L470.2,408.4L484.2,391.3Z M488.3,344.9L459.8,335.9L418.9,293.8L437.9,275.9L447.5,285.3L493.5,281.9L512.1,258.2L519.7,293.2L509.5,302.2L533.0,324.9L488.3,344.9Z";

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

          {/* Accurate Africa Map — right */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="relative hidden lg:block"
          >
            <svg
              viewBox="-10 -10 720 760"
              className="w-full h-auto max-w-[540px] mx-auto"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <filter id="glow-active" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="6" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
                <filter id="glow-soft" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
                <radialGradient id="pulse-grad">
                  <stop offset="0%" stopColor="hsl(var(--gold))" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="hsl(var(--gold))" stopOpacity="0" />
                </radialGradient>
                {/* Subtle gradient for continent fill */}
                <linearGradient id="africa-fill-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.12" />
                </linearGradient>
              </defs>

              {/* Africa continent — geographically accurate */}
              <path
                d={AFRICA_PATH}
                fill="url(#africa-fill-grad)"
                stroke="hsl(var(--primary))"
                strokeOpacity="0.3"
                strokeWidth="0.8"
                strokeLinejoin="round"
              />

              {/* Network lines */}
              {networkLines.map((line, i) => (
                <line
                  key={`line-${i}`}
                  x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2}
                  stroke="hsl(var(--background))"
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
                    {/* Pulse rings for Kenya */}
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
                      stroke={isActive ? "hsl(var(--gold))" : "hsl(var(--background))"}
                      strokeOpacity={isActive ? 0.6 : 0.2}
                      strokeWidth={isActive ? 2 : 1}
                      filter={isActive ? "url(#glow-active)" : undefined}
                    />

                    {/* Node center */}
                    <circle
                      cx={country.cx} cy={country.cy}
                      r={isActive ? 5 : 3}
                      fill={isActive ? "hsl(var(--gold))" : "hsl(var(--background))"}
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
                      fill="hsl(var(--background))"
                      fillOpacity={isActive ? 0.9 : 0.35}
                      fontSize={isActive ? "12" : "10"}
                      fontFamily="'Schibsted Grotesk', sans-serif"
                      fontWeight={isActive ? 700 : 500}
                      letterSpacing="-0.02em"
                    >
                      {country.name}
                    </text>

                    {/* Status label for active */}
                    {isActive && (
                      <text
                        x={country.cx + 16}
                        y={country.cy + 18}
                        fill="hsl(var(--gold))"
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
                          fill="hsl(var(--foreground))"
                          stroke={isActive ? "hsl(var(--gold))" : "hsl(var(--background))"}
                          strokeOpacity={isActive ? 0.4 : 0.15}
                          strokeWidth="1"
                          filter="url(#glow-soft)"
                        />
                        <text
                          x={country.cx}
                          y={country.cy - 37}
                          textAnchor="middle"
                          fill="hsl(var(--background))"
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
                            fill="hsl(var(--gold))"
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
                            fill="hsl(var(--background))"
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
