import { useState, useMemo, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import PollCard from "@/components/forecast/PollCard";
import { usePolls } from "@/hooks/use-polls";
import { Shield, Zap, Globe, ChevronDown, ChevronUp, ArrowRight, Search, X, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp as TrendingUpIcon } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: [0.2, 0, 0, 1] as const }
  })
};

const COUNTRIES = ["All", "Kenya", "Nigeria", "South Africa", "Uganda", "Tanzania", "Rwanda", "Pan-African"];

const PRIORITY_ORDER = [
  "pump price", "headline inflation breach 5.0%", "cut the policy rate at the april",
  "new tax measure in the fy2026", "public debt exceed 72%", "ziidi trader", "list a second state asset",
];

function useDebounce(value: string, delay: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

const ForecastArena = () => {
  const { data: polls, isLoading } = usePolls("active");
  const [selectedCountry, setSelectedCountry] = useState("Kenya");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [onlineUsers, setOnlineUsers] = useState(0);
  const [heroExpanded, setHeroExpanded] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(searchInput, 300);

  // Trending polls
  const { data: trendingPolls = [] } = useQuery({
    queryKey: ["trending-polls"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_trending_polls", { limit_count: 6 });
      if (error) throw error;
      return (data || []) as any[];
    },
    staleTime: 60000,
  });

  // Search results
  const { data: searchResults, isLoading: searchLoading } = useQuery({
    queryKey: ["poll-search", debouncedSearch],
    queryFn: async () => {
      if (!debouncedSearch.trim()) return null;
      const terms = debouncedSearch.trim().split(/\s+/).join(" & ");
      const { data, error } = await supabase
        .from("polls")
        .select("*, poll_options!poll_options_poll_id_fkey(*)")
        .textSearch("fts", terms)
        .eq("status", "active");
      if (error) throw error;
      return data;
    },
    enabled: !!debouncedSearch.trim(),
  });

  useEffect(() => {
    const channel = supabase.channel('online-users', {
      config: { presence: { key: Math.random().toString(36).slice(2) } }
    });
    channel.on('presence', { event: 'sync' }, () => {
      setOnlineUsers(Object.keys(channel.presenceState()).length);
    });
    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') await channel.track({ online_at: new Date().toISOString() });
    });
    return () => { supabase.removeChannel(channel); };
  }, []);

  const categories = useMemo(() => {
    if (!polls) return ["All"];
    return ["All", ...[...new Set(polls.map(p => p.category))].sort()];
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

  const isSearching = !!debouncedSearch.trim();
  const displayPolls = isSearching ? (searchResults || []) : filteredPolls;

  const showTrending = trendingPolls.filter((t: any) => Number(t.trending_score) > 0).length >= 2;

  return (
    <Layout>
      {/* Compact Hero */}
      <section className="py-6 md:py-8 bg-foreground overflow-hidden relative">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: "linear-gradient(hsl(var(--accent)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--accent)) 1px, transparent 1px)",
            backgroundSize: "60px 60px"
          }} />
        </div>
        <div className="container-page relative z-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="max-w-lg">
              <h1 className="block w-full max-w-full overflow-visible text-[clamp(1.9rem,9vw,3.5rem)] font-black text-background leading-[0.95] tracking-tight uppercase whitespace-normal break-words [text-wrap:wrap]">
                <span className="block sm:inline">Forecast</span>{" "}
                <span className="block sm:inline">Arena</span>
                <span className="ml-2 text-xs font-semibold bg-green-500 text-white px-2.5 py-0.5 rounded-full align-middle normal-case tracking-normal border border-green-400 shadow-[0_0_8px_rgba(34,197,94,0.4)]">Free</span>
              </h1>
              <p className="text-sm md:text-base text-accent font-semibold tracking-wide mt-1">The World's First Human + AI Economic Forecasting Arena</p>
              <p className="text-xs text-background/50 tracking-wide mt-0.5">Collective intelligence for the public good</p>
              <p className="text-lg md:text-xl font-bold text-background/90 mt-2">
                Your Voice. <span className="text-accent">Africa's Future.</span>
              </p>
              <p className="text-background/50 text-xs mt-1">A real-time view of economic sentiment across Africa. See what people are signaling. Add your voice.</p>
            </div>

            <div className="flex flex-wrap gap-3 items-center md:flex-col md:items-end">
              {[
                { icon: Shield, label: "Secure platform" },
                { icon: Zap, label: "Real-time sentiment" },
                { icon: Globe, label: "100% Africa-focused" },
              ].map((item) => (
                <span key={item.label} className="flex items-center gap-1.5 text-xs text-background/40">
                  <item.icon className="w-3.5 h-3.5 text-accent" />{item.label}
                </span>
              ))}
              <span className="flex items-center gap-1.5 text-xs text-background/90 font-medium">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                </span>
                Live Data
              </span>
              <span className="flex items-center gap-1.5 text-xs text-background/90 font-medium">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                </span>
                {onlineUsers > 0 ? onlineUsers : "—"} online
              </span>
            </div>
          </div>

          {/* Expandable details */}
          <AnimatePresence>
            {heroExpanded && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden mt-4 border-t border-background/10 pt-4">
                <div className="max-w-2xl text-background/60 text-sm space-y-2">
                  <p className="text-background/90 font-semibold">Move beyond just observing the economy. <span className="text-accent">Take a position on where it's headed.</span></p>
                  <p>This is a platform built on what people across Africa actually believe — not just headlines, not just reports.</p>
                  <p className="text-background/80 font-medium">How well can you read the economy?</p>
                  <p>100+ live economic questions across 10+ African economies. Track real-time sentiment on monetary policy, fiscal outlook, capital markets, and political dynamics.</p>
                  <p className="text-accent/90 text-xs font-medium">🚀 Want to go further? Try <Link to="/forecast-arena-pro" className="underline font-bold hover:text-accent">Forecast Arena Pro</Link> to back your views with real capital and earn rewards.</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <button onClick={() => setHeroExpanded(!heroExpanded)}
            className="mt-2 flex items-center gap-1 text-xs text-background/50 hover:text-background/80 transition-colors mx-auto">
            {heroExpanded ? <><ChevronUp className="w-3.5 h-3.5" /> Less</> : <><ChevronDown className="w-3.5 h-3.5" /> More details</>}
          </button>
        </div>
      </section>

      {/* Disclaimer — single line */}
      <div className="bg-muted/50 border-b border-border">
        <div className="container-page py-2">
          <p className="text-[10px] text-muted-foreground text-center">
            Forecast Arena aggregates people's expectations on economic outcomes for research and insight purposes.
            Not a betting or trading platform. Read our <a href="/terms-of-use" className="text-primary underline">Terms of Use</a>.
          </p>
        </div>
      </div>

      {/* Pro cross-promotion banner */}
      <div className="bg-gradient-to-r from-amber-500/10 to-amber-600/5 border-b border-amber-500/20">
        <div className="container-page py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <TrendingUpIcon className="w-4 h-4 text-amber-500" />
            <p className="text-xs text-foreground">
              You're on the free version of Forecast Arena.{" "}
              <span className="font-bold">Upgrade to Pro</span> to back your predictions with real capital—and earn rewards when you get it right.
            </p>
          </div>
          <Link to="/forecast-arena-pro" className="shrink-0 text-xs font-bold text-amber-600 hover:text-amber-700 transition-colors">
            Upgrade to Pro →
          </Link>
        </div>
      </div>

      {/* Trending Section */}
      {showTrending && (
        <section className="py-4 border-b border-border bg-card/50">
          <div className="container-page">
            <div className="flex items-center gap-2 mb-3">
              <Flame className="w-4 h-4 text-accent" />
              <h2 className="text-sm font-bold text-foreground">Trending Now</h2>
              <span className="text-[10px] text-muted-foreground">Most active markets in the last 24 hours</span>
            </div>
            <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2 -mx-1 px-1">
              {trendingPolls.filter((t: any) => Number(t.trending_score) > 0).map((t: any) => (
                <Link
                  key={t.poll_id}
                  to={`/forecast-arena/${t.slug}`}
                  className="snap-start shrink-0 w-[200px] p-3 rounded-lg border border-border bg-card hover:border-accent/40 transition-colors"
                >
                  <p className="text-xs font-semibold text-foreground line-clamp-2 mb-2">🔥 {t.title}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-mono font-bold text-primary">{t.total_votes}</span>
                    <span className="text-[9px] bg-accent/10 text-accent px-1.5 py-0.5 rounded-full font-medium">
                      {Number(t.recent_votes)} votes today
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Filters + Polls */}
      <section className="py-4 md:py-6">
        <div className="container-page">
          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search markets... e.g. 'inflation', 'CBK', 'oil'"
              className="pl-9 pr-8 h-9 text-sm"
            />
            {searchInput && (
              <button
                onClick={() => setSearchInput("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Compact inline filters (hidden during search) */}
          {!isSearching && (
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-muted-foreground">Country:</span>
                <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                  <SelectTrigger className="h-7 text-xs w-auto min-w-[110px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRIES.map(c => <SelectItem key={c} value={c} className="text-xs">{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-muted-foreground">Category:</span>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="h-7 text-xs w-auto min-w-[110px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(c => <SelectItem key={c} value={c} className="text-xs">{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <span className="text-xs text-muted-foreground ml-auto">{filteredPolls.length} questions</span>
            </div>
          )}

          {isSearching && (
            <p className="text-xs text-muted-foreground mb-3">
              {searchLoading ? "Searching..." : `${(searchResults || []).length} results for "${debouncedSearch}"`}
            </p>
          )}

          {isLoading || searchLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1,2,3,4,5,6].map(i => <div key={i} className="bg-card rounded-lg border border-border p-6 animate-pulse h-56" />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {displayPolls.map((poll: any, i: number) => (
                <motion.div key={poll.id} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i % 6}>
                  <PollCard poll={poll} isTrending={!isSearching && i === 0} interactionMode="vote" homepage />
                </motion.div>
              ))}
            </div>
          )}

          {displayPolls.length === 0 && !isLoading && !searchLoading && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                {isSearching ? `No markets found for "${debouncedSearch}".` : "No forecasts match your filters."}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-10 bg-primary">
        <div className="container-page text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-primary-foreground mb-3">Want Deeper Economic Intelligence?</h2>
          <p className="text-primary-foreground/70 mb-6 max-w-xl mx-auto text-sm">Go beyond forecasts. Get the full analysis behind Africa's economic trajectory.</p>
          <div className="flex justify-center">
            <Link to="/intelligence-marketplace" className="inline-flex items-center justify-center rounded-md bg-accent text-accent-foreground px-6 py-3 font-semibold shadow hover:bg-accent/90 transition-colors text-sm">Take Me to the Intelligence Marketplace <ArrowRight className="ml-2 w-4 h-4" /></Link>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default ForecastArena;
