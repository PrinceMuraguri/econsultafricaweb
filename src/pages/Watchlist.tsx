import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import Layout from "@/components/Layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Bookmark, Trash2, Clock, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { getFingerprint } from "@/lib/fingerprint";

function getTimeRemaining(closeAt: string) {
  const diff = new Date(closeAt).getTime() - Date.now();
  if (diff <= 0) return "Closed";
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  if (days > 0) return `${days}d ${hours}h left`;
  const mins = Math.floor((diff / (1000 * 60)) % 60);
  return `${hours}h ${mins}m left`;
}

const Watchlist = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: watchlistItems = [], isLoading } = useQuery({
    queryKey: ["watchlist", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("user_watchlist")
        .select("id, poll_id, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      if (!data || data.length === 0) return [];

      // Fetch polls
      const pollIds = data.map((w: any) => w.poll_id);
      const { data: polls } = await supabase
        .from("polls")
        .select("*, poll_options!poll_options_poll_id_fkey(*)")
        .in("id", pollIds);

      // Fetch user's votes — prefer user_id, fallback to fingerprint
      let votes: any[] = [];
      if (user) {
        const { data } = await supabase
          .from("votes")
          .select("poll_id, option_id")
          .eq("user_id", user.id)
          .in("poll_id", pollIds);
        votes = data || [];
      }
      if (votes.length === 0) {
        const fp = await getFingerprint();
        const { data } = await supabase
          .from("votes")
          .select("poll_id, option_id")
          .eq("voter_fingerprint", fp)
          .in("poll_id", pollIds);
        votes = data || [];
      }

      const pollMap: Record<string, any> = {};
      (polls || []).forEach((p: any) => { pollMap[p.id] = p; });
      const voteMap: Record<string, string> = {};
      (votes || []).forEach((v: any) => { voteMap[v.poll_id] = v.option_id; });

      return data.map((w: any) => ({
        ...w,
        poll: pollMap[w.poll_id] || null,
        votedOptionId: voteMap[w.poll_id] || null,
      })).filter((w: any) => w.poll);
    },
    enabled: !!user,
  });

  const handleRemove = async (watchlistId: string) => {
    await supabase.from("user_watchlist").delete().eq("id", watchlistId);
    queryClient.invalidateQueries({ queryKey: ["watchlist", user?.id] });
  };

  if (!user) {
    return (
      <Layout>
        <section className="section-padding pt-24">
          <div className="container-page max-w-3xl text-center">
            <Bookmark className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-foreground mb-2">Sign in to see your watchlist</h2>
            <p className="text-muted-foreground">Bookmark markets to track them here.</p>
          </div>
        </section>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="section-padding pt-24">
        <div className="container-page max-w-3xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-3 mb-6">
              <Bookmark className="w-6 h-6 text-primary" />
              <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">Your Watchlist</h1>
            </div>

            {isLoading ? (
              <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}</div>
            ) : watchlistItems.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-border rounded-lg">
                <Bookmark className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground mb-1">No bookmarked markets yet.</p>
                <p className="text-sm text-muted-foreground/60 mb-4">Browse the Forecast Arena to find markets to track.</p>
                <Link to="/">
                  <Button size="sm" className="gap-1">Browse Markets <ArrowRight className="w-3.5 h-3.5" /></Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {watchlistItems.map((item: any) => {
                  const poll = item.poll;
                  const options = poll.poll_options || [];
                  const totalVotes = options.reduce((s: number, o: any) => s + o.total_votes_count, 0);
                  const leading = totalVotes > 0
                    ? options.reduce((best: any, o: any) => o.total_votes_count > (best?.total_votes_count || 0) ? o : best, options[0])
                    : null;
                  const leadPct = leading && totalVotes > 0 ? Math.round((leading.total_votes_count / totalVotes) * 100) : 50;
                  const votedOption = item.votedOptionId ? options.find((o: any) => o.id === item.votedOptionId) : null;

                  return (
                    <div key={item.id} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:border-primary/30 transition-colors">
                      <Link to={`/forecast-arena/${poll.slug}`} className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{poll.title}</p>
                        <div className="flex items-center gap-3 mt-1 flex-wrap">
                          {leading && (
                            <span className="text-xs font-mono font-bold text-primary">{leadPct}% {leading.label}</span>
                          )}
                          <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                            <Clock className="w-3 h-3" />{getTimeRemaining(poll.close_at)}
                          </span>
                          {votedOption && (
                            <Badge variant="outline" className="text-[9px] h-4">You: {votedOption.label}</Badge>
                          )}
                        </div>
                      </Link>
                      <button
                        onClick={() => handleRemove(item.id)}
                        className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors shrink-0"
                        title="Remove from watchlist"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        </div>
      </section>
    </Layout>
  );
};

export default Watchlist;
