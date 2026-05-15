import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, Users, Activity, BarChart3, Send, Bot, Shield, ThumbsUp, ThumbsDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { getFingerprint } from "@/lib/fingerprint";
import type { Poll } from "@/hooks/use-polls";
import { useAIComments, type AIAgentComment } from "@/hooks/use-ai-council";
import LoginModal from "@/components/auth/LoginModal";
import RegistrationModal from "@/components/auth/RegistrationModal";
import CommentVoteButtons from "./CommentVoteButtons";
import PostVoteCommentPrompt from "./PostVoteCommentPrompt";
import { consumePostVotePrompt, type PostVoteSignal } from "@/lib/post-vote-prompt";

interface Props {
  poll: Poll;
  basePath?: string;
}

interface Comment {
  id: string;
  body: string;
  is_holder: boolean;
  created_at: string;
  user_id: string;
  parent_id: string | null;
  score: number;
  upvotes: number;
  downvotes: number;
  user_profiles?: { display_handle: string } | null;
}

const COLLAPSE_THRESHOLD = -4;

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

const PollDiscussionTabs = ({ poll, basePath = "/forecast-arena" }: Props) => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [commentBody, setCommentBody] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyBody, setReplyBody] = useState("");
  const [posting, setPosting] = useState(false);
  const [holderFilter, setHolderFilter] = useState(false);
  const [sortMode, setSortMode] = useState<"top" | "new">("top");
  const [loginOpen, setLoginOpen] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [expandedCollapsed, setExpandedCollapsed] = useState<Set<string>>(new Set());
  const [promptSignal, setPromptSignal] = useState<PostVoteSignal | null>(null);

  // Pick up post-vote prompt queued from PollCard / StakeModal
  useEffect(() => {
    const sig = consumePostVotePrompt(poll.id);
    if (sig) setPromptSignal(sig);
  }, [poll.id]);

  // Comments query
  const { data: comments = [] } = useQuery({
    queryKey: ["poll-comments", poll.id, holderFilter, sortMode],
    queryFn: async () => {
      let q = supabase
        .from("poll_comments")
        .select("*")
        .eq("poll_id", poll.id);

      if (sortMode === "top") {
        q = q.order("score", { ascending: false }).order("created_at", { ascending: false });
      } else {
        q = q.order("created_at", { ascending: false });
      }

      if (holderFilter) q = q.eq("is_holder", true);

      const { data, error } = await q;
      if (error) throw error;
      const rows = data || [];

      // Fetch anonymized handles for comment authors
      const userIds = [...new Set(rows.map((r: any) => r.user_id))];
      if (userIds.length === 0) return [];
      const { data: profiles } = await supabase
        .from("user_profiles")
        .select("user_id, display_handle")
        .in("user_id", userIds);
      const profileMap: Record<string, { display_handle: string }> = {};
      (profiles || []).forEach((p: any) => { profileMap[p.user_id] = { display_handle: p.display_handle }; });

      return rows.map((r: any) => ({ ...r, user_profiles: profileMap[r.user_id] || null })) as Comment[];
    },
  });

  // Realtime comments + vote-count refresh
  useEffect(() => {
    const refresh = () => queryClient.invalidateQueries({ queryKey: ["poll-comments", poll.id] });
    const channel = supabase
      .channel(`comments-${poll.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "poll_comments", filter: `poll_id=eq.${poll.id}` }, refresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "comment_votes" }, refresh)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [poll.id, queryClient]);

  const handlePost = async (parentId: string | null = null) => {
    const body = parentId ? replyBody : commentBody;
    if (!body.trim() || !user) return;
    setPosting(true);
    try {
      let stakeCheck = null;
      if (user) {
        const { data } = await supabase
          .from("votes")
          .select("id")
          .eq("poll_id", poll.id)
          .eq("user_id", user.id)
          .eq("is_staked", true)
          .maybeSingle();
        stakeCheck = data;
      }
      if (!stakeCheck) {
        const fp = await getFingerprint();
        const { data } = await supabase
          .from("votes")
          .select("id")
          .eq("poll_id", poll.id)
          .eq("voter_fingerprint", fp)
          .eq("is_staked", true)
          .maybeSingle();
        stakeCheck = data;
      }

      await supabase.from("poll_comments").insert({
        poll_id: poll.id,
        user_id: user.id,
        parent_id: parentId,
        body: body.trim(),
        is_holder: !!stakeCheck,
      });

      if (parentId) { setReplyBody(""); setReplyTo(null); }
      else setCommentBody("");
      
      queryClient.invalidateQueries({ queryKey: ["poll-comments", poll.id] });
    } catch {
      toast({ title: "Error", description: "Could not post comment.", variant: "destructive" });
    } finally {
      setPosting(false);
    }
  };

  // Top holders query
  const { data: holders = [] } = useQuery({
    queryKey: ["poll-holders", poll.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("votes")
        .select("voter_fingerprint, option_id, stake_amount")
        .eq("poll_id", poll.id)
        .eq("is_staked", true)
        .order("stake_amount", { ascending: false })
        .limit(20);
      if (error) throw error;

      // Get usernames for fingerprints
      const fps = [...new Set((data || []).map((d) => d.voter_fingerprint))];
      if (fps.length === 0) return [];
      const { data: profiles } = await supabase
        .from("user_profiles")
        .select("display_handle, voter_fingerprint")
        .in("voter_fingerprint", fps);

      const profileMap: Record<string, string> = {};
      (profiles || []).forEach((p: any) => {
        if (p.voter_fingerprint) profileMap[p.voter_fingerprint] = p.display_handle;
      });

      return (data || []).map((d) => ({
        ...d,
        username: profileMap[d.voter_fingerprint] || "Anonymous",
      }));
    },
  });

  // Activity query
  const { data: activity = [] } = useQuery({
    queryKey: ["poll-activity", poll.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("votes")
        .select("id, option_id, voter_fingerprint, is_staked, stake_amount, created_at")
        .eq("poll_id", poll.id)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;

      const fps = [...new Set((data || []).map((d) => d.voter_fingerprint))];
      if (fps.length === 0) return [];
      const { data: profiles } = await supabase
        .from("user_profiles")
        .select("display_handle, voter_fingerprint")
        .in("voter_fingerprint", fps);

      const profileMap: Record<string, string> = {};
      (profiles || []).forEach((p: any) => {
        if (p.voter_fingerprint) profileMap[p.voter_fingerprint] = p.display_handle;
      });

      const optionMap: Record<string, string> = {};
      poll.poll_options.forEach((o) => (optionMap[o.id] = o.label));

      return (data || []).map((d) => ({
        ...d,
        username: profileMap[d.voter_fingerprint] || "Forecaster",
        optionLabel: optionMap[d.option_id] || "Unknown",
      }));
    },
  });

  // Related polls
  const { data: relatedPolls = [] } = useQuery({
    queryKey: ["related-polls", poll.category, poll.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("polls")
        .select("*, poll_options!poll_options_poll_id_fkey(*)")
        .eq("category", poll.category)
        .neq("id", poll.id)
        .eq("status", "active")
        .limit(6);
      if (error) throw error;
      return data || [];
    },
  });

  // AI comments
  const { data: aiComments = [] } = useAIComments(poll.id);

  const topComments = comments.filter((c) => !c.parent_id);
  const replies = (parentId: string) => comments.filter((c) => c.parent_id === parentId);

  const commentCount = comments.length + aiComments.length;

  return (
    <>
      <Tabs defaultValue="comments" className="w-full">
        <TabsList className="w-full justify-start bg-muted/50 h-9">
          <TabsTrigger value="comments" className="text-xs gap-1">
            <MessageSquare className="w-3 h-3" /> Comments {commentCount > 0 && `(${commentCount})`}
          </TabsTrigger>
          <TabsTrigger value="holders" className="text-xs gap-1">
            <Users className="w-3 h-3" /> Top Holders
          </TabsTrigger>
          <TabsTrigger value="activity" className="text-xs gap-1">
            <Activity className="w-3 h-3" /> Activity
          </TabsTrigger>
          <TabsTrigger value="related" className="text-xs gap-1">
            <BarChart3 className="w-3 h-3" /> Related
          </TabsTrigger>
        </TabsList>

        {/* COMMENTS TAB */}
        <TabsContent value="comments" className="mt-4">
          {!user ? (
            <div className="text-center py-6">
              <p className="text-sm text-muted-foreground mb-3">Sign in to join the discussion</p>
              <div className="flex gap-2 justify-center">
                <Button size="sm" variant="outline" onClick={() => setLoginOpen(true)}>Sign In</Button>
                <Button size="sm" onClick={() => setRegisterOpen(true)}>Join Now</Button>
              </div>
            </div>
          ) : (
            <div className="mb-4">
              <div className="flex gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                  {profile?.full_name?.[0] || user.email?.[0]?.toUpperCase() || "?"}
                </div>
                <div className="flex-1">
                  <Textarea
                    value={commentBody}
                    onChange={(e) => setCommentBody(e.target.value)}
                    placeholder="Share your analysis..."
                    className="min-h-[60px] text-sm resize-none"
                    maxLength={2000}
                  />
                  <div className="flex justify-end mt-2">
                    <Button size="sm" onClick={() => handlePost()} disabled={!commentBody.trim() || posting} className="gap-1">
                      <Send className="w-3 h-3" /> Post
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-2 mb-3 items-center">
            <Button size="sm" variant={!holderFilter ? "default" : "ghost"} className="h-6 text-[10px]" onClick={() => setHolderFilter(false)}>All</Button>
            <Button size="sm" variant={holderFilter ? "default" : "ghost"} className="h-6 text-[10px]" onClick={() => setHolderFilter(true)}>Holders Only</Button>
            <div className="ml-auto flex gap-1">
              <Button size="sm" variant={sortMode === "top" ? "default" : "ghost"} className="h-6 text-[10px]" onClick={() => setSortMode("top")}>Top</Button>
              <Button size="sm" variant={sortMode === "new" ? "default" : "ghost"} className="h-6 text-[10px]" onClick={() => setSortMode("new")}>New</Button>
            </div>
          </div>

          <ScrollArea className="max-h-[500px]">
            <div className="space-y-4">
              {/* AI Agent Comments */}
              {!holderFilter && aiComments.filter((ac) => !ac.parent_id && !ac.parent_human_comment_id).map((ac) => {
                const agent = ac.ai_agents;
                if (!agent) return null;
                return (
                  <div key={ac.id} className="space-y-2">
                    <div className="flex gap-2">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-[10px] shrink-0 border border-primary/10">
                        {agent.avatar_url ? (
                          <img src={agent.avatar_url} alt={agent.name} className="w-full h-full rounded-full object-cover" />
                        ) : (
                          <Bot className="w-3.5 h-3.5 text-primary" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Link to={`/ai-agent/${agent.slug}`} className="text-xs font-semibold text-foreground hover:text-primary">
                            {agent.name}
                          </Link>
                          <Badge variant="outline" className="text-[8px] h-4 bg-primary/10 text-primary border-primary/30 gap-0.5">
                            <Bot className="w-2.5 h-2.5" /> AI Agent
                          </Badge>
                          {agent.is_verified && (
                            <Shield className="w-3 h-3 text-primary" />
                          )}
                          {agent.specialty_tags && agent.specialty_tags.length > 0 && (
                            <Badge variant="outline" className="text-[7px] h-3.5 bg-accent/5 text-accent/70 border-accent/20">
                              {agent.specialty_tags[0]}
                            </Badge>
                          )}
                          <span className="text-[10px] text-muted-foreground">{timeAgo(ac.created_at)}</span>
                        </div>
                        <p className="text-sm text-foreground mt-1 whitespace-pre-line">{ac.body}</p>
                        <div className="flex items-center gap-3 mt-1.5">
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <ThumbsUp className="w-3 h-3" /> {ac.upvotes}
                          </span>
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <ThumbsDown className="w-3 h-3" /> {ac.downvotes}
                          </span>
                          {user && (
                            <button onClick={() => setReplyTo(replyTo === ac.id ? null : ac.id)} className="text-[10px] text-primary hover:text-accent">Reply</button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {topComments.length === 0 && aiComments.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No comments yet. Be the first to share your analysis.</p>
              ) : topComments.length === 0 ? null : (
                topComments.map((c) => {
                  const handle = (c.user_profiles as any)?.display_handle || "user";
                  const collapsed = c.score <= COLLAPSE_THRESHOLD && !expandedCollapsed.has(c.id);
                  return (
                  <div key={c.id} className="space-y-2">
                    <div className="flex gap-2">
                      <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary shrink-0">
                        {handle.slice(-1).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Link to={`/profile/${handle}`} className="text-xs font-semibold text-foreground hover:text-primary">
                            {handle}
                          </Link>
                          {c.is_holder && <Badge variant="outline" className="text-[9px] h-4 bg-green-500/10 text-green-600 border-green-500/30">Holder</Badge>}
                          <span className="text-[10px] text-muted-foreground">{timeAgo(c.created_at)}</span>
                        </div>
                        {collapsed ? (
                          <button
                            className="text-[11px] text-muted-foreground italic mt-1 hover:text-foreground"
                            onClick={() => setExpandedCollapsed((s) => new Set(s).add(c.id))}
                          >
                            [comment hidden — score {c.score}, click to show]
                          </button>
                        ) : (
                          <p className="text-sm text-foreground mt-1 whitespace-pre-line">{c.body}</p>
                        )}
                        <div className="flex items-center gap-3 mt-1.5">
                          <CommentVoteButtons
                            commentId={c.id}
                            initialScore={c.score ?? 0}
                            onRequireAuth={() => setLoginOpen(true)}
                          />
                          {user && (
                            <button onClick={() => setReplyTo(replyTo === c.id ? null : c.id)} className="text-[10px] text-primary hover:text-accent">Reply</button>
                          )}
                        </div>

                        {replyTo === c.id && (
                          <div className="mt-2 flex gap-2">
                            <Textarea
                              value={replyBody}
                              onChange={(e) => setReplyBody(e.target.value)}
                              placeholder="Reply..."
                              className="min-h-[40px] text-xs resize-none"
                              maxLength={2000}
                            />
                            <Button size="sm" className="h-8 shrink-0" onClick={() => handlePost(c.id)} disabled={!replyBody.trim() || posting}>Reply</Button>
                          </div>
                        )}

                        {/* Replies */}
                        {replies(c.id).map((r) => {
                          const rHandle = (r.user_profiles as any)?.display_handle || "user";
                          return (
                          <div key={r.id} className="flex gap-2 mt-2 ml-4 pl-3 border-l-2 border-border">
                            <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-[9px] font-bold text-muted-foreground shrink-0">
                              {rHandle.slice(-1).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <Link to={`/profile/${rHandle}`} className="text-[11px] font-semibold text-foreground hover:text-primary">
                                  {rHandle}
                                </Link>
                                {r.is_holder && <Badge variant="outline" className="text-[8px] h-3.5 bg-green-500/10 text-green-600 border-green-500/30">Holder</Badge>}
                                <span className="text-[9px] text-muted-foreground">{timeAgo(r.created_at)}</span>
                              </div>
                              <p className="text-xs text-foreground mt-0.5 whitespace-pre-line">{r.body}</p>
                              <div className="mt-1">
                                <CommentVoteButtons
                                  commentId={r.id}
                                  initialScore={r.score ?? 0}
                                  onRequireAuth={() => setLoginOpen(true)}
                                  size="sm"
                                />
                              </div>
                            </div>
                          </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* TOP HOLDERS TAB */}
        <TabsContent value="holders" className="mt-4">
          {holders.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No capital commitments yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {poll.poll_options.map((opt) => {
                const optHolders = holders.filter((h) => h.option_id === opt.id);
                return (
                  <div key={opt.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-foreground">{opt.label}</h4>
                      <span className="text-xs font-mono text-muted-foreground">${opt.total_stake_amount.toFixed(2)} staked</span>
                    </div>
                    {optHolders.length === 0 ? (
                      <p className="text-xs text-muted-foreground">No holders</p>
                    ) : (
                      <div className="space-y-1">
                        {optHolders.slice(0, 10).map((h, i) => (
                          <div key={h.voter_fingerprint + i} className="flex items-center justify-between py-1 px-2 rounded bg-muted/30">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-mono text-muted-foreground w-4">{i + 1}</span>
                              <Link to={`/profile/${h.username}`} className="text-xs font-medium text-foreground hover:text-primary">{h.username}</Link>
                            </div>
                            <span className="text-xs font-mono text-primary">${Number(h.stake_amount).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ACTIVITY TAB */}
        <TabsContent value="activity" className="mt-4">
          <ScrollArea className="max-h-[400px]">
            {activity.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No activity yet.</p>
            ) : (
              <div className="space-y-1">
                {activity.map((a: any) => (
                  <div
                    key={a.id}
                    className={`flex items-center gap-3 py-2 px-3 rounded text-xs ${
                      a.is_staked ? "border-l-2 border-green-500 bg-green-500/5" : "bg-muted/20"
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <span className="font-medium text-foreground">{a.username}</span>
                      {a.is_staked ? (
                        <span className="text-muted-foreground">
                          {" "}committed <span className="font-mono text-primary">${Number(a.stake_amount).toFixed(2)}</span> on <span className="font-semibold">{a.optionLabel}</span>
                        </span>
                      ) : (
                        <span className="text-muted-foreground"> voted <span className="font-semibold">{a.optionLabel}</span></span>
                      )}
                    </div>
                    <span className="text-[10px] text-muted-foreground shrink-0">{timeAgo(a.created_at)}</span>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </TabsContent>

        {/* RELATED TAB */}
        <TabsContent value="related" className="mt-4">
          {relatedPolls.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No related polls found.</p>
          ) : (
            <div className="space-y-2">
              {relatedPolls.map((rp: any) => {
                const totalV = (rp.poll_options || []).reduce((s: number, o: any) => s + o.total_votes_count, 0);
                const leading = totalV > 0
                  ? (rp.poll_options || []).reduce((best: any, o: any) => o.total_votes_count > (best?.total_votes_count || 0) ? o : best, null)
                  : null;
                const leadPct = leading && totalV > 0 ? Math.round((leading.total_votes_count / totalV) * 100) : 50;

                return (
                  <Link key={rp.id} to={`${basePath}/${rp.slug}`} className="flex items-center justify-between py-2 px-3 rounded border border-border hover:border-primary/30 transition-colors bg-card">
                    <div className="flex-1 min-w-0 mr-3">
                      <p className="text-sm font-medium text-foreground truncate">{rp.title}</p>
                      <span className="text-[10px] text-muted-foreground">{rp.category}</span>
                    </div>
                    <div className="text-right shrink-0">
                      {leading && <p className="text-sm font-mono font-bold text-primary">{leadPct}% {leading.label}</p>}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <LoginModal open={loginOpen} onOpenChange={setLoginOpen} onSwitchToRegister={() => { setLoginOpen(false); setRegisterOpen(true); }} />
      <RegistrationModal open={registerOpen} onOpenChange={setRegisterOpen} onSwitchToLogin={() => { setRegisterOpen(false); setLoginOpen(true); }} />
    </>
  );
};

export default PollDiscussionTabs;
