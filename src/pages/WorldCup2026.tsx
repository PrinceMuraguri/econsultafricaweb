import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import MatchPollCard from "@/components/forecast/MatchPollCard";
import { usePolls, type Poll } from "@/hooks/use-polls";
import { supabase } from "@/integrations/supabase/client";
import { Trophy, Zap, Users, Clock } from "lucide-react";

function useCountdown(target: Date | null) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  if (!target) return null;
  const diff = target.getTime() - now;
  if (diff <= 0) return "Kickoff!";
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff / 3600000) % 24);
  const m = Math.floor((diff / 60000) % 60);
  const s = Math.floor((diff / 1000) % 60);
  return d > 0 ? `${d}d ${h}h ${m}m` : `${h}h ${m}m ${s}s`;
}

const WorldCup2026 = () => {
  const { data: activePolls = [], isLoading: loadingActive } = usePolls("active", "Football");
  const { data: resolvedPolls = [], isLoading: loadingResolved } = usePolls("resolved", "Football");

  const nextKickoff = useMemo(() => {
    const upcoming = [...activePolls]
      .filter(p => new Date(p.close_at) > new Date())
      .sort((a, b) => new Date(a.close_at).getTime() - new Date(b.close_at).getTime());
    return upcoming[0] ? new Date(upcoming[0].close_at) : null;
  }, [activePolls]);

  const countdown = useCountdown(nextKickoff);

  const totalPredictions = useMemo(() => {
    const all: Poll[] = [...activePolls, ...resolvedPolls];
    return all.reduce((sum, p) =>
      sum + p.poll_options.reduce((s, o) => s + (o.total_votes_count || 0), 0), 0);
  }, [activePolls, resolvedPolls]);

  const sortedActive = useMemo(() =>
    [...activePolls].sort((a, b) => new Date(a.close_at).getTime() - new Date(b.close_at).getTime()),
    [activePolls]);

  const sortedResolved = useMemo(() =>
    [...resolvedPolls].sort((a, b) => new Date(b.close_at).getTime() - new Date(a.close_at).getTime()),
    [resolvedPolls]);

  return (
    <Layout>
      <SEO
        title="World Cup 2026 Predictions — Free Football Sentiment Voting"
        description="Predict every FIFA World Cup 2026 match. See what the crowd believes in real time. Vote for free — no signup required."
        path="/world-cup-2026"
      />

      <div className="wc26-theme">
        {/* Hero */}
        <section className="relative overflow-hidden text-white" style={{
          background: "radial-gradient(1200px 400px at 10% 0%, rgba(244,113,77,0.25), transparent 60%), radial-gradient(1000px 400px at 90% 100%, rgba(56,82,192,0.35), transparent 60%), linear-gradient(180deg,#050d24 0%,#0a1a44 100%)"
        }}>
          {/* Pitch pattern */}
          <div className="absolute inset-0 opacity-[0.07] pointer-events-none" style={{
            backgroundImage: "repeating-linear-gradient(90deg,#22c55e 0 60px,transparent 60px 120px)"
          }} />
          <div className="container-page relative py-10 md:py-14">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[10px] font-black uppercase tracking-widest bg-amber-400 text-amber-950 px-2 py-0.5 rounded">Free · No signup</span>
              <span className="text-[10px] font-black uppercase tracking-widest bg-emerald-500 text-emerald-950 px-2 py-0.5 rounded">Live</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-black leading-[0.95] tracking-tight uppercase">
              World Cup <span className="text-amber-400">2026</span><br />
              <span className="text-white/80 text-3xl md:text-5xl">MAKE&nbsp; FREE&nbsp; PREDICTIONS</span>
            </h1>
            <p className="mt-3 text-white/70 text-base md:text-lg max-w-2xl">
              Predict every match. See what the crowd believes. Vote for free — no signup.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <div className="rounded-xl border border-white/15 bg-white/5 backdrop-blur px-4 py-3 min-w-[180px]">
                <p className="text-[10px] uppercase tracking-widest text-white/50 flex items-center gap-1"><Clock className="w-3 h-3" /> Next kickoff</p>
                <p className="text-2xl font-mono font-black tabular-nums">{countdown || "—"}</p>
              </div>
              <div className="rounded-xl border border-white/15 bg-white/5 backdrop-blur px-4 py-3">
                <p className="text-[10px] uppercase tracking-widest text-white/50 flex items-center gap-1"><Users className="w-3 h-3" /> Predictions</p>
                <p className="text-2xl font-mono font-black tabular-nums">{totalPredictions.toLocaleString()}</p>
              </div>
              <div className="rounded-xl border border-white/15 bg-white/5 backdrop-blur px-4 py-3">
                <p className="text-[10px] uppercase tracking-widest text-white/50 flex items-center gap-1"><Zap className="w-3 h-3" /> Active matches</p>
                <p className="text-2xl font-mono font-black tabular-nums">{activePolls.length}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Upcoming matches */}
        <section className="py-8 md:py-10 bg-slate-50 dark:bg-slate-950">
          <div className="container-page">
            <div className="flex items-end justify-between mb-4">
              <div>
                <h2 className="text-2xl md:text-3xl font-black text-foreground uppercase tracking-tight">Upcoming Matches</h2>
                <p className="text-sm text-muted-foreground">Round of 16 · Vote for free before kickoff</p>
              </div>
              <span className="text-xs text-muted-foreground">{sortedActive.length} matches</span>
            </div>
            {loadingActive ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1,2,3,4,5,6].map(i => <div key={i} className="rounded-2xl bg-slate-200/60 dark:bg-slate-800/40 h-64 animate-pulse" />)}
              </div>
            ) : sortedActive.length === 0 ? (
              <p className="text-muted-foreground text-sm">No upcoming matches yet.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sortedActive.map((p, i) => (
                  <motion.div key={p.id} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }} transition={{ delay: (i % 6) * 0.05 }}>
                    <MatchPollCard poll={p} />
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Completed matches */}
        <section className="py-8 md:py-10 bg-white dark:bg-slate-900">
          <div className="container-page">
            <div className="flex items-end justify-between mb-4">
              <div>
                <h2 className="text-2xl md:text-3xl font-black text-foreground uppercase tracking-tight flex items-center gap-2">
                  <Trophy className="w-6 h-6 text-amber-500" /> Completed Matches
                </h2>
                <p className="text-sm text-muted-foreground">Round of 32 · How the crowd did</p>
              </div>
              <span className="text-xs text-muted-foreground">{sortedResolved.length} matches</span>
            </div>
            {loadingResolved ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1,2,3,4,5,6].map(i => <div key={i} className="rounded-2xl bg-slate-200/60 dark:bg-slate-800/40 h-64 animate-pulse" />)}
              </div>
            ) : sortedResolved.length === 0 ? (
              <p className="text-muted-foreground text-sm">No completed matches yet.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sortedResolved.map((p, i) => (
                  <motion.div key={p.id} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }} transition={{ delay: (i % 6) * 0.05 }}>
                    <MatchPollCard poll={p} />
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default WorldCup2026;
