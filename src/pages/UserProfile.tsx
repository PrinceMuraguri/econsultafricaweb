import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import Layout from "@/components/Layout";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { User, MapPin, Briefcase, Calendar, Trophy, TrendingUp, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days > 30) return new Date(dateStr).toLocaleDateString("en-US", { month: "short", year: "numeric" });
  if (days > 0) return `${days}d ago`;
  const hrs = Math.floor(diff / 3600000);
  if (hrs > 0) return `${hrs}h ago`;
  return "just now";
}

const UserProfile = () => {
  const { username } = useParams<{ username: string }>();

  const { data: profileData, isLoading: profileLoading } = useQuery({
    queryKey: ["user-profile", username],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("username", username!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!username,
  });

  const { data: leaderboardEntry } = useQuery({
    queryKey: ["user-leaderboard", username],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leaderboard_view" as any)
        .select("*")
        .eq("username", username!)
        .maybeSingle();
      if (error) throw error;
      return data as any;
    },
    enabled: !!username,
  });

  // Staked positions (public)
  const { data: positions = [] } = useQuery({
    queryKey: ["user-positions", profileData?.voter_fingerprint],
    queryFn: async () => {
      if (!profileData?.voter_fingerprint) return [];
      const { data, error } = await supabase
        .from("votes")
        .select("*, polls!votes_poll_id_fkey(title, slug, status, close_at, winning_option_id, settled_at), poll_options!votes_option_id_fkey(label)")
        .eq("voter_fingerprint", profileData.voter_fingerprint)
        .eq("is_staked", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!profileData?.voter_fingerprint,
  });

  // Recent comments
  const { data: userComments = [] } = useQuery({
    queryKey: ["user-comments", profileData?.user_id],
    queryFn: async () => {
      if (!profileData?.user_id) return [];
      const { data, error } = await supabase
        .from("poll_comments")
        .select("id, body, created_at, poll_id")
        .eq("user_id", profileData.user_id)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      // Fetch poll titles
      const pollIds = [...new Set((data || []).map((c: any) => c.poll_id))];
      if (pollIds.length === 0) return [];
      const { data: polls } = await supabase.from("polls").select("id, title, slug").in("id", pollIds);
      const pollMap: Record<string, { title: string; slug: string }> = {};
      (polls || []).forEach((p: any) => { pollMap[p.id] = { title: p.title, slug: p.slug }; });
      return (data || []).map((c: any) => ({ ...c, polls: pollMap[c.poll_id] || null }));
    },
    enabled: !!profileData?.user_id,
  });

  const activePositions = positions.filter((p: any) => p.polls?.status === "active");
  const resolvedPositions = positions.filter((p: any) => p.polls?.settled_at);

  if (profileLoading) {
    return (
      <Layout>
        <section className="section-padding pt-24">
          <div className="container-page max-w-3xl space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </section>
      </Layout>
    );
  }

  if (!profileData) {
    return (
      <Layout>
        <section className="section-padding pt-24">
          <div className="container-page max-w-3xl text-center">
            <h2 className="text-2xl font-bold text-foreground mb-4">Profile not found</h2>
            <Link to="/leaderboard" className="text-primary hover:text-accent">← Back to Leaderboard</Link>
          </div>
        </section>
      </Layout>
    );
  }

  const stats = leaderboardEntry || { win_rate: 0, total_positions: 0, pnl: 0, total_earnings: 0, rank: "—" };

  return (
    <Layout>
      <section className="section-padding pt-24">
        <div className="container-page max-w-3xl">
          <Link to="/leaderboard" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-6">
            <ArrowLeft className="w-4 h-4" /> Back to Leaderboard
          </Link>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            {/* Profile header */}
            <div className="flex items-start gap-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary shrink-0">
                {profileData.full_name?.[0]?.toUpperCase() || "?"}
              </div>
              <div>
                <h1 className="text-2xl font-display font-bold text-foreground">{profileData.username}</h1>
                <p className="text-sm text-muted-foreground">{profileData.full_name}</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {profileData.country && (
                    <Badge variant="secondary" className="text-[10px] gap-1"><MapPin className="w-3 h-3" />{profileData.country}</Badge>
                  )}
                  {profileData.occupation && (
                    <Badge variant="secondary" className="text-[10px] gap-1"><Briefcase className="w-3 h-3" />{profileData.occupation}</Badge>
                  )}
                  <Badge variant="outline" className="text-[10px] gap-1">
                    <Calendar className="w-3 h-3" /> Member since {new Date(profileData.created_at || "").toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
              {[
                { label: "Win Rate", value: `${Number(stats.win_rate).toFixed(1)}%`, icon: Trophy },
                { label: "Positions", value: stats.total_positions, icon: TrendingUp },
                { label: "PnL", value: `${Number(stats.pnl) >= 0 ? "+" : ""}$${Number(stats.pnl).toFixed(2)}` },
                { label: "Earnings", value: `$${Number(stats.total_earnings).toFixed(2)}` },
                { label: "Rank", value: stats.rank === "—" ? "—" : `#${stats.rank}` },
              ].map((s) => (
                <Card key={s.label} className="text-center">
                  <CardContent className="p-3">
                    <p className="font-mono text-lg font-bold text-foreground">{s.value}</p>
                    <p className="text-[10px] text-muted-foreground">{s.label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Tabs */}
            <Tabs defaultValue="active">
              <TabsList className="w-full justify-start bg-muted/50">
                <TabsTrigger value="active" className="text-xs">Active Positions ({activePositions.length})</TabsTrigger>
                <TabsTrigger value="history" className="text-xs">History ({resolvedPositions.length})</TabsTrigger>
                <TabsTrigger value="comments" className="text-xs">Comments ({userComments.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="active" className="mt-4 space-y-2">
                {activePositions.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">No active staked positions.</p>
                ) : (
                  activePositions.map((p: any) => (
                    <Link key={p.id} to={`/forecast-arena/${p.polls?.slug}`} className="flex items-center justify-between p-3 rounded-lg border border-border bg-card hover:border-primary/30">
                      <div className="min-w-0 flex-1 mr-3">
                        <p className="text-sm font-medium text-foreground truncate">{p.polls?.title}</p>
                        <Badge variant="outline" className="text-[9px] mt-1">{(p.poll_options as any)?.label}</Badge>
                      </div>
                      <span className="font-mono text-sm font-bold text-primary">${Number(p.stake_amount).toFixed(2)}</span>
                    </Link>
                  ))
                )}
              </TabsContent>

              <TabsContent value="history" className="mt-4 space-y-2">
                {resolvedPositions.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">No resolved positions yet.</p>
                ) : (
                  resolvedPositions.map((p: any) => {
                    const won = p.polls?.winning_option_id === p.option_id;
                    return (
                      <Link key={p.id} to={`/forecast-arena/${p.polls?.slug}`} className="flex items-center justify-between p-3 rounded-lg border border-border bg-card hover:border-primary/30">
                        <div className="min-w-0 flex-1 mr-3">
                          <p className="text-sm font-medium text-foreground truncate">{p.polls?.title}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-[9px]">{(p.poll_options as any)?.label}</Badge>
                            <span className={`text-[10px] font-bold ${won ? "text-green-600" : "text-red-500"}`}>{won ? "✅ Won" : "❌ Lost"}</span>
                          </div>
                        </div>
                        <span className="font-mono text-sm font-bold text-primary">${Number(p.stake_amount).toFixed(2)}</span>
                      </Link>
                    );
                  })
                )}
              </TabsContent>

              <TabsContent value="comments" className="mt-4 space-y-2">
                {userComments.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">No comments yet.</p>
                ) : (
                  userComments.map((c: any) => (
                    <Link key={c.id} to={`/forecast-arena/${c.polls?.slug}`} className="block p-3 rounded-lg border border-border bg-card hover:border-primary/30">
                      <p className="text-[10px] text-muted-foreground mb-1">{c.polls?.title} · {timeAgo(c.created_at)}</p>
                      <p className="text-sm text-foreground line-clamp-2">{c.body}</p>
                    </Link>
                  ))
                )}
              </TabsContent>
            </Tabs>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
};

export default UserProfile;
