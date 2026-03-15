import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sprout, Landmark, ShoppingCart, Heart, GraduationCap, Hotel, Factory, HandHeart, Zap, Laptop } from "lucide-react";

const sectors = [
  { name: "Agriculture", icon: Sprout, outlook: "Positive", signal: "Export diversification accelerating. Horticulture revenue up 12% YoY. Climate adaptation investment rising." },
  { name: "Financial Services", icon: Landmark, outlook: "Positive", signal: "Digital lending regulation maturing. M-Pesa ecosystem expanding. Bank consolidation expected." },
  { name: "Retail & FMCG", icon: ShoppingCart, outlook: "Neutral", signal: "Consumer spending constrained by inflation. Formal retail penetration growing in secondary cities." },
  { name: "Healthcare", icon: Heart, outlook: "Positive", signal: "Universal health coverage rollout creating procurement opportunities. Private sector investment growing." },
  { name: "Education", icon: GraduationCap, outlook: "Neutral", signal: "Competency-based curriculum driving ed-tech adoption. TVET funding increasing." },
  { name: "Hospitality", icon: Hotel, outlook: "Positive", signal: "Tourism recovery to pre-2020 levels. Conference tourism driving Nairobi hotel occupancy." },
  { name: "Manufacturing", icon: Factory, outlook: "Neutral", signal: "Special Economic Zones attracting FDI. Local content requirements tightening." },
  { name: "Nonprofits", icon: HandHeart, outlook: "Neutral", signal: "Donor landscape shifting. Localization mandates increasing. Compliance costs rising." },
  { name: "Energy", icon: Zap, outlook: "Positive", signal: "Geothermal expansion on track. Green energy transition creating grid opportunities." },
  { name: "Technology", icon: Laptop, outlook: "Positive", signal: "Startup ecosystem maturing post-correction. B2B SaaS growth outpacing consumer tech." },
];

const outlookColors: Record<string, string> = {
  Positive: "text-primary",
  Neutral: "text-gold",
  Negative: "text-destructive",
};

const SectorExplorer = () => {
  const [active, setActive] = useState<string | null>(null);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {sectors.map((sector, i) => (
        <motion.div
          key={sector.name}
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.05, duration: 0.4 }}
        >
          <button
            onClick={() => setActive(active === sector.name ? null : sector.name)}
            className="w-full text-left bg-background rounded-lg border-t-2 border-t-primary border border-border p-6 hover-sink card-shadow transition-colors hover:bg-muted/50"
          >
            <div className="flex items-center gap-3 mb-3">
              <sector.icon className="w-5 h-5 text-primary" />
              <h3 className="font-display font-semibold text-foreground">{sector.name}</h3>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Outlook:</span>
              <span className={`font-mono text-xs font-semibold ${outlookColors[sector.outlook]}`}>{sector.outlook}</span>
            </div>
            <AnimatePresence>
              {active === sector.name && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <p className="text-sm text-muted-foreground leading-relaxed mt-3 pt-3 border-t border-border">
                    {sector.signal}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </button>
        </motion.div>
      ))}
    </div>
  );
};

export default SectorExplorer;
