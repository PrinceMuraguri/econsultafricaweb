import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import Layout from "@/components/Layout";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Trophy, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

const COUNTRIES = ["All", "Kenya", "Nigeria", "South Africa", "Uganda", "Tanzania", "Rwanda"];
const MIN_POS = [
  { label: "Any", value: 0 },
  { label: "3+", value: 3 },
  { label: "5+", value: 5 },
  { label: "10+", value: 10 },
];

const FLAGS: Record<string, string> = {
  Kenya: "🇰🇪", Nigeria: "🇳🇬", "South Africa": "🇿🇦", Uganda: "🇺🇬", Tanzania: "🇹🇿", Rwanda: "🇷🇼", Ethiopia: "🇪🇹",
};

const rankBadge = (rank: number) => {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return `#${rank}`;
};

const winRateColor = (rate: number) => {
  if (rate >= 60) return "text-green-600";
  if (rate >= 40) return "text-amber-500";
  return "text-red-500";
};

const Leaderboard = () => {
  const [country, setCountry] = useState("All");
  const [minPos, setMinPos] = useState(0);

  const { data: leaders = [], isLoading } = useQuery({
    queryKey: ["leaderboard"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leaderboard_view" as any)
        .select("*")
        .order("rank", { ascending: true })
        .limit(100);
      if (error) throw error;
      return data as any[];
    },
  });

  const filtered = useMemo(() => {
    return leaders.filter((l) => {
      if (country !== "All" && l.country !== country) return false;
      if (l.total_positions < minPos) return false;
      return true;
    });
  }, [leaders, country, minPos]);

  return (
    <Layout>
      <section className="bg-gradient-to-b from-primary/10 to-background pt-24 pb-8">
        <div className="container-page text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center justify-center gap-2 mb-3">
              <Trophy className="w-6 h-6 text-accent" />
              <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground">Forecaster Leaderboard</h1>
            </div>
            <p className="text-muted-foreground max-w-lg mx-auto">Africa's sharpest economic minds, ranked by prediction accuracy and conviction.</p>
          </motion.div>
        </div>
      </section>

      <section className="section-padding">
        <div className="container-page max-w-5xl">
          {/* Filters */}
          <div className="flex flex-wrap gap-3 mb-6">
            <Select value={country} onValueChange={setCountry}>
              <SelectTrigger className="w-[140px] h-8 text-xs">
                <SelectValue placeholder="Country" />
              </SelectTrigger>
              <SelectContent>
                {COUNTRIES.map((c) => (
                  <SelectItem key={c} value={c}>{c === "All" ? "All Countries" : `${FLAGS[c] || ""} ${c}`}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={String(minPos)} onValueChange={(v) => setMinPos(Number(v))}>
              <SelectTrigger className="w-[120px] h-8 text-xs">
                <SelectValue placeholder="Min positions" />
              </SelectTrigger>
              <SelectContent>
                {MIN_POS.map((m) => (
                  <SelectItem key={m.value} value={String(m.value)}>{m.label} positions</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="space-y-3">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <TrendingUp className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No forecasters match your criteria yet. Start making predictions to appear here!</p>
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">Rank</TableHead>
                      <TableHead>Forecaster</TableHead>
                      <TableHead>Country</TableHead>
                      <TableHead className="text-center">Win Rate</TableHead>
                      <TableHead className="text-center">W/L</TableHead>
                      <TableHead className="text-center">Positions</TableHead>
                      <TableHead className="text-right">PnL</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((l, i) => (
                      <TableRow key={l.user_id || i}>
                        <TableCell className="font-mono font-bold text-lg">{rankBadge(Number(l.rank))}</TableCell>
                        <TableCell>
                          <Link to={`/profile/${l.username}`} className="font-semibold text-foreground hover:text-primary transition-colors">
                            {l.username}
                          </Link>
                          {l.occupation && <p className="text-[10px] text-muted-foreground">{l.occupation}</p>}
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{FLAGS[l.country] || ""} {l.country || "—"}</span>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className={`font-mono font-bold ${winRateColor(Number(l.win_rate))}`}>{Number(l.win_rate).toFixed(1)}%</span>
                        </TableCell>
                        <TableCell className="text-center font-mono text-sm">
                          <span className="text-green-600">{l.wins}</span>/<span className="text-red-500">{l.losses}</span>
                        </TableCell>
                        <TableCell className="text-center font-mono text-sm">{l.total_positions}</TableCell>
                        <TableCell className={`text-right font-mono font-semibold ${Number(l.pnl) >= 0 ? "text-green-600" : "text-red-500"}`}>
                          {Number(l.pnl) >= 0 ? "+" : ""}${Number(l.pnl).toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile cards */}
              <div className="md:hidden space-y-2">
                {filtered.map((l, i) => (
                  <Link key={l.user_id || i} to={`/profile/${l.username}`} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:border-primary/30 transition-colors">
                    <span className="text-lg font-bold font-mono w-8 text-center">{rankBadge(Number(l.rank))}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-foreground truncate">{l.username}</p>
                      <p className="text-[10px] text-muted-foreground">{FLAGS[l.country] || ""} {l.country || "—"} {l.occupation ? `· ${l.occupation}` : ""}</p>
                    </div>
                    <div className="text-right">
                      <p className={`font-mono text-sm font-bold ${winRateColor(Number(l.win_rate))}`}>{Number(l.win_rate).toFixed(1)}%</p>
                      <p className={`font-mono text-[10px] ${Number(l.pnl) >= 0 ? "text-green-600" : "text-red-500"}`}>
                        {Number(l.pnl) >= 0 ? "+" : ""}${Number(l.pnl).toFixed(2)}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default Leaderboard;
