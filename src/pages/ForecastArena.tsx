import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import PollCard from "@/components/forecast/PollCard";
import { usePolls } from "@/hooks/use-polls";
import { BarChart3, Zap, Globe, Shield, Filter, Radio, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: [0.2, 0, 0, 1] as const }
  })
};

const COUNTRIES = ["All", "Kenya", "Nigeria", "South Africa", "Uganda", "Tanzania", "Rwanda", "Pan-African"];

// Priority ordering for polls — matched by substring in title
const PRIORITY_ORDER = [
  "pump price",
  "headline inflation breach 5.0%",
  "cut the policy rate at the april",
  "new tax measure in the fy2026",
  "public debt exceed 72%",
  "ziidi trader",
  "list a second state asset",
];

const ForecastArena = () => {
  const { data: polls, isLoading } = usePolls("active");
  const [selectedCountry, setSelectedCountry] = useState("Kenya");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [onlineUsers, setOnlineUsers] = useState(0);
  const [showFilterHint, setShowFilterHint] = useState(true);

  // Track online presence via Supabase Realtime
  useEffect(() => {
    const channel = supabase.channel('online-users', {
      config: { presence: { key: Math.random().toString(36).slice(2) } }
    });
    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      setOnlineUsers(Object.keys(state).length);
    });
    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({ online_at: new Date().toISOString() });
      }
    });
    return () => { supabase.removeChannel(channel); };
  }, []);

  // Hide filter hint after 8 seconds
  useEffect(() => {
    const t = setTimeout(() => setShowFilterHint(false), 8000);
    return () => clearTimeout(t);
  }, []);

  const categories = useMemo(() => {
    if (!polls) return ["All"];
    const cats = [...new Set(polls.map(p => p.category))];
    return ["All", ...cats.sort()];
  }, [polls]);

  const filteredPolls = useMemo(() => {
    if (!polls) return [];
    let result = polls.filter(p => {
      if (selectedCountry !== "All") {
        const countryMap: Record<string, string[]> = {
          "Kenya": ["Kenya", "CBK", "KES", "NSE", "KNBS", "KPC"],
          "Nigeria": ["Nigeria", "CBN", "Naira", "NGX", "NBS"],
          "South Africa": ["South Africa", "SARB", "ZAR", "JSE", "Eskom"],
          "Uganda": ["Uganda", "BoU", "UGX", "USE", "EACOP", "Bobi Wine", "Museveni"],
          "Tanzania": ["Tanzania", "BoT", "TZS", "DSE", "Samia"],
          "Rwanda": ["Rwanda", "NBR", "RWF", "RSE", "M23", "DRC"],
          "Pan-African": ["Pan-African", "Africa", "AfCFTA", "Sub-Saharan", "Brent crude", "IMF"],
        };
        const keywords = countryMap[selectedCountry] || [];
        const text = `${p.title} ${p.context || ""} ${p.description || ""}`;
        if (!keywords.some(k => text.includes(k))) return false;
      }
      if (selectedCategory !== "All" && p.category !== selectedCategory) return false;
      return true;
    });

    // Apply priority ordering
    const prioritized: typeof result = [];
    const remaining = [...result];

    for (const keyword of PRIORITY_ORDER) {
      const idx = remaining.findIndex(p => p.title.toLowerCase().includes(keyword));
      if (idx >= 0) {
        const [match] = remaining.splice(idx, 1);
        prioritized.push(match);
      }
    }

    return [...prioritized, ...remaining];
  }, [polls, selectedCountry, selectedCategory]);

  return (
    <Layout>
      {/* Hero — compact */}
      <section className="py-10 md:py-14 bg-foreground overflow-hidden relative">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: "linear-gradient(hsl(var(--accent)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--accent)) 1px, transparent 1px)",
            backgroundSize: "60px 60px"
          }} />
        </div>

        <div className="container-page relative z-10">
          <motion.div initial="hidden" animate="visible" className="flex flex-col md:flex-row md:items-start md:justify-between gap-8">
            {/* Left side — branding */}
            <div className="max-w-md">
              <motion.div variants={fadeUp} custom={0} className="mb-2">
                <span className="font-mono text-[10px] text-accent/70 uppercase tracking-[0.3em] font-medium">Introducing</span>
              </motion.div>

              <motion.h1 variants={fadeUp} custom={0.5}
                className="text-4xl md:text-5xl lg:text-6xl font-black text-background leading-[1] mb-1 tracking-tight uppercase">
                Forecast Arena
              </motion.h1>

              <motion.p variants={fadeUp} custom={1}
                className="text-base md:text-lg text-accent font-semibold tracking-wide mb-4">
                Africa's Economic Sentiment Aggregator
              </motion.p>

              <motion.div variants={fadeUp} custom={1.5} className="mb-3">
                <p className="text-2xl md:text-3xl font-bold text-background/90 leading-tight mb-1">
                  Your Voice. <span className="text-accent">Africa's Future.</span>
                </p>
                <p className="text-background/60 text-sm mt-2">A real-time view of economic sentiment across Africa.</p>
                <p className="text-accent text-xs mt-1 font-medium">See what people are signaling. Add your voice.</p>
              </motion.div>

              <motion.div variants={fadeUp} custom={2} className="flex flex-wrap gap-4 items-center">
                {[
                  { icon: Shield, label: "Secure platform" },
                  { icon: Zap, label: "Real-time sentiment" },
                  { icon: Globe, label: "100% Africa-focused" },
                ].map((item) => (
                  <span key={item.label} className="flex items-center gap-2 text-sm text-background/40">
                    <item.icon className="w-4 h-4 text-accent" />
                    {item.label}
                  </span>
                ))}
                {/* Live Real-Time Data indicator */}
                <span className="flex items-center gap-1.5 text-xs text-background/90 font-medium">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                  </span>
                  Live Real-Time Data
                </span>
                {/* Online users indicator */}
                <span className="flex items-center gap-1.5 text-xs text-background/90 font-medium">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                  </span>
                  {onlineUsers > 0 ? onlineUsers : "—"} online now
                </span>
              </motion.div>
            </div>

            {/* Right side — detail copy */}
            <motion.div variants={fadeUp} custom={2} className="max-w-md text-background/60 text-sm leading-relaxed space-y-3">
              <p className="text-background/90 font-semibold text-base">
                Move beyond just observing the economy.{" "}
                <span className="text-accent">Take a position on where it's headed.</span>
              </p>
              <p>
                This is a platform built on what people across Africa actually believe — not just headlines, not just reports.
              </p>
              <p className="text-background/80 font-medium">How well can you read the economy?</p>
              <p>
                100+ live economic questions across 10+ African economies. Track real-time sentiment on monetary policy, fiscal outlook, capital markets, and political dynamics.
              </p>
              <p className="text-accent/90 text-xs font-medium">
                🚀 New: You can now commit capital to your forecast positions — adding weight to your conviction, and helping shape a clearer picture of where Africa is going.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Disclaimer */}
      <div className="bg-muted/50 border-b border-border">
        <div className="container-page py-3">
          <p className="text-xs text-muted-foreground text-center">
            Forecast Arena aggregates users' expectations on economic outcomes for research and insight purposes.
            It is not a trading, betting, or investment platform.{" "}
            <a href="/documents/terms-of-use.pdf" target="_blank" rel="noopener noreferrer" className="text-primary underline hover:text-accent" download>Read the Terms of Use</a>.
          </p>
        </div>
      </div>

      {/* Filters + Active Forecasts */}
      <section className="section-padding">
        <div className="container-page">
          <div className="flex items-end justify-between mb-6">
            <div>
              <p className="font-mono text-xs text-accent uppercase tracking-widest mb-2">Active Questions</p>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">Share Your View</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {filteredPolls.length} questions available • Share your expectations on key economic questions
              </p>
            </div>
          </div>

          {/* Country filter */}
          <div className="mb-4 relative">
            <div className="flex items-center gap-2 mb-2">
              <Filter className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Country</span>
              <motion.span
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 1.8, repeat: Infinity }}
                className="text-[10px] font-semibold text-accent ml-2 bg-accent/10 px-2 py-0.5 rounded-full"
              >
                Select Country ↓
              </motion.span>
            </div>
            <div className="flex flex-wrap gap-2">
              {COUNTRIES.map((country) => (
                <Button
                  key={country}
                  variant={selectedCountry === country ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCountry(country)}
                  className="text-xs h-7"
                >
                  {country}
                </Button>
              ))}
            </div>
          </div>

          {/* Category filter */}
          <div className="mb-8 relative">
            <div className="flex items-center gap-2 mb-2">
              <Filter className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Category</span>
              <motion.span
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 1.8, repeat: Infinity, delay: 0.5 }}
                className="text-[10px] font-semibold text-accent ml-2 bg-accent/10 px-2 py-0.5 rounded-full"
              >
                Select Category ↓
              </motion.span>
            </div>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <Button
                  key={cat}
                  variant={selectedCategory === cat ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(cat)}
                  className="text-xs h-7"
                >
                  {cat}
                </Button>
              ))}
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-card rounded-lg border border-border p-6 animate-pulse h-64" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPolls.map((poll, i) => (
                <motion.div key={poll.id} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i % 6}>
                  <PollCard poll={poll} isTrending={i === 0} />
                </motion.div>
              ))}
            </div>
          )}

          {filteredPolls.length === 0 && !isLoading && (
            <div className="text-center py-16">
              <p className="text-muted-foreground">No forecasts match your filters. Try a different selection.</p>
            </div>
          )}
        </div>
      </section>

      {/* CTA — Reports */}
      <section className="section-padding bg-primary">
        <div className="container-page text-center">
          <motion.h2 initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}
            className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
            Want Deeper Economic Intelligence?
          </motion.h2>
          <motion.p initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={1}
            className="text-primary-foreground/70 mb-8 max-w-xl mx-auto">
            Go beyond forecasts. Get the full analysis behind Africa's economic trajectory.
          </motion.p>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={2}
            className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/kenya-2026"
              className="inline-flex items-center justify-center rounded-md bg-accent text-accent-foreground px-6 py-3 font-display font-semibold shadow-md hover:bg-accent/90 transition-colors">
              Get Kenya Report
            </Link>
            <Link to="/intelligence-marketplace"
              className="inline-flex items-center justify-center rounded-md border-2 border-primary-foreground/30 text-primary-foreground px-6 py-3 font-display font-semibold hover:bg-primary-foreground/10 transition-colors">
              Browse Intelligence Products
            </Link>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
};

export default ForecastArena;
