import { useState, useEffect, useMemo, useRef, type KeyboardEvent, type MouseEvent, type PointerEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, Users, Lock, Check, Loader2, Rocket, ChevronDown, ChevronUp, Lightbulb, TrendingUp, Download, HelpCircle, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { getFingerprint } from "@/lib/fingerprint";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import RegistrationModal from "@/components/auth/RegistrationModal";
import LoginModal from "@/components/auth/LoginModal";

import BookmarkToggle from "./BookmarkToggle";
import SharePopover from "./SharePopover";
import type { Poll, PollOption } from "@/hooks/use-polls";
import { useAIPredictions } from "@/hooks/use-ai-council";
import { Bot } from "lucide-react";

const PARTICIPATION_ENABLED = true;
const CONTEXT_PREVIEW_LENGTH = 120;

const FREE_INSIGHT_PDF = "/reports/kenya-oil-shortage-assessment-march-2026.pdf";

function getTimeRemaining(closeAt: string) {
  const diff = new Date(closeAt).getTime() - Date.now();
  if (diff <= 0) return "Closed";
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  if (days > 0) return `${days}d ${hours}h left`;
  const mins = Math.floor((diff / (1000 * 60)) % 60);
  return `${hours}h ${mins}m left`;
}

interface PollCardProps {
  poll: Poll;
  compact?: boolean;
  isTrending?: boolean;
  interactionMode?: "navigate" | "vote";
  homepage?: boolean;
}

const PollCard = ({ poll, compact = false, isTrending = false, interactionMode = "navigate", homepage = false }: PollCardProps) => {
  const { data: aiPredictions = [] } = useAIPredictions(poll.id);
  const { toast } = useToast();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [voting, setVoting] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [votedOptionId, setVotedOptionId] = useState<string | null>(null);
  const [localOptions, setLocalOptions] = useState(poll.poll_options);
  const [justVoted, setJustVoted] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [pendingVoteOptionId, setPendingVoteOptionId] = useState<string | null>(null);
  const [detailsExpanded, setDetailsExpanded] = useState(false);
  const activationRef = useRef<{ optionId: string; timestamp: number } | null>(null);

  const isLoggedIn = !!user;

  useEffect(() => {
    if (isLoggedIn) {
      setRegisterOpen(false);
      setLoginModalOpen(false);
    }
  }, [isLoggedIn]);

  useEffect(() => { setLocalOptions(poll.poll_options); }, [poll.poll_options]);

  useEffect(() => {
    (async () => {
      if (user) {
        const { data } = await supabase
          .from("votes")
          .select("option_id")
          .eq("poll_id", poll.id)
          .eq("user_id", user.id)
          .maybeSingle();
        if (data) {
          setHasVoted(true);
          setVotedOptionId(data.option_id);
          return;
        }
      }
      const fp = await getFingerprint();
      const { data } = await supabase
        .from("votes")
        .select("option_id")
        .eq("poll_id", poll.id)
        .eq("voter_fingerprint", fp)
        .maybeSingle();
      if (data) {
        setHasVoted(true);
        setVotedOptionId(data.option_id);
      }
    })();
  }, [poll.id, user]);

  const totalVotes = localOptions.reduce((s, o) => s + o.total_votes_count, 0);
  const isClosed = poll.status !== "active" || new Date(poll.close_at) < new Date();

  const handleVote = async (optionId: string) => {
    if (hasVoted || voting || isClosed) return;
    if (!isLoggedIn) {
      setPendingVoteOptionId(optionId);
      setRegisterOpen(true);
      return;
    }
    setVoting(true);
    try {
      const fp = await getFingerprint();
      const { error } = await supabase.from("votes").insert({ poll_id: poll.id, option_id: optionId, voter_fingerprint: fp, user_id: user?.id || null });
      if (error) {
        if (error.code === "23505") { toast({ title: "Already submitted", description: "You've already submitted a forecast.", variant: "destructive" }); setHasVoted(true); return; }
        throw error;
      }
      await supabase.rpc("increment_vote_count", { p_option_id: optionId });
      setJustVoted(true);
      setTimeout(() => setJustVoted(false), 1500);
      setHasVoted(true);
      setVotedOptionId(optionId);
      setLocalOptions(prev => prev.map(o => o.id === optionId ? { ...o, total_votes_count: o.total_votes_count + 1 } : o));
      toast({ title: "🎯 Forecast recorded", description: "Your view has been added to the collective sentiment." });
    } catch {
      toast({ title: "Error", description: "Could not record forecast. Try again.", variant: "destructive" });
    } finally { setVoting(false); }
  };

  const handleAuthSuccess = () => { if (pendingVoteOptionId) { handleVote(pendingVoteOptionId); setPendingVoteOptionId(null); } };

  const activateOption = (optionId: string) => {
    const now = Date.now();
    const lastActivation = activationRef.current;

    if (lastActivation && lastActivation.optionId === optionId && now - lastActivation.timestamp < 350) {
      return;
    }

    activationRef.current = { optionId, timestamp: now };

    if (interactionMode === "vote") {
      if (hasVoted || voting || isClosed) {
        navigate(`/forecast-arena/${poll.slug}`);
        return;
      }
      void handleVote(optionId).then(() => {
        navigate(`/forecast-arena/${poll.slug}`);
      });
      return;
    }

    navigate(`/forecast-arena/${poll.slug}`);
  };

  const handleOptionPointerUp = (optionId: string, event: PointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (event.pointerType === "mouse" && event.button !== 0) return;
    activateOption(optionId);
  };

  const handleOptionClick = (optionId: string, event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    activateOption(optionId);
  };

  const handleOptionKeyDown = (optionId: string, event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    event.stopPropagation();
    activateOption(optionId);
  };

  const isPumpPriceQuestion = poll.title.toLowerCase().includes("pump price") && poll.title.toLowerCase().includes("kenya");

  const handleUnlockInsight = () => {
    if (isPumpPriceQuestion) {
      window.open(FREE_INSIGHT_PDF, "_blank");
      return;
    }
    if (!isLoggedIn) { setRegisterOpen(true); return; }
    const email = user?.email || "";
    const storedProfile = profile;
    if (!email) { toast({ title: "Login required", description: "Please sign in first.", variant: "destructive" }); setRegisterOpen(true); return; }
    if (poll.expert_insight) {
      toast({ title: "🔓 Expert Insight", description: poll.expert_insight, duration: 15000 });
      return;
    }
    (async () => {
      try {
        await supabase.from("inquiries").insert({
          inquiry_type: "expert_insight", source: "forecast_arena",
          name: storedProfile?.full_name || null, email,
          phone: storedProfile?.phone || null, poll_id: poll.id,
          poll_title: poll.title, message: `Requested expert insight for: ${poll.title}`,
        });
        toast({ title: "📩 Request received", description: "Expert insight for this question is being prepared. We'll send it to your email shortly.", duration: 8000 });
      } catch {
        toast({ title: "Error", description: "Could not submit request. Try again.", variant: "destructive" });
      }
    })();
  };

  useEffect(() => {
    const channel = supabase
      .channel(`poll-options-${poll.id}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "poll_options", filter: `poll_id=eq.${poll.id}` },
        (payload) => {
          const updated = payload.new as { id: string; total_votes_count: number };
          setLocalOptions(prev => prev.map(o => o.id === updated.id ? { ...o, total_votes_count: updated.total_votes_count } : o));
        })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [poll.id]);

  const sortedOptions = useMemo(() => [...localOptions].sort((a, b) => {
    const rank = (l: string) => l === "yes" ? 0 : l === "no" ? 2 : 1;
    return rank(a.label.toLowerCase()) - rank(b.label.toLowerCase());
  }), [localOptions]);

  const isYesNo = sortedOptions.length === 2 && sortedOptions.some(o => o.label.toLowerCase() === "yes") && sortedOptions.some(o => o.label.toLowerCase() === "no");

  const contextIsLong = (poll.context?.length || 0) > CONTEXT_PREVIEW_LENGTH;
  const contextPreview = poll.context
    ? contextIsLong ? poll.context.slice(0, CONTEXT_PREVIEW_LENGTH) + "…" : poll.context
    : null;

  // Leading option for probability badge
  const leadingOption = useMemo(() => {
    if (totalVotes === 0) return null;
    return sortedOptions.reduce((best, o) => o.total_votes_count > best.total_votes_count ? o : best, sortedOptions[0]);
  }, [sortedOptions, totalVotes]);

  const leadingPct = leadingOption && totalVotes > 0 ? Math.round((leadingOption.total_votes_count / totalVotes) * 100) : 0;
  const probColor = leadingPct >= 60
    ? (leadingOption?.label.toLowerCase() === "no" ? "text-amber-500" : "text-green-600")
    : leadingPct <= 40 ? "text-amber-500" : "text-amber-500";

  const isHomepageMode = homepage;

  const handleCardClick = () => {
    if (isHomepageMode) {
      navigate(`/forecast-arena/${poll.slug}`);
    }
  };

  return (
    <motion.div
      whileHover={{ y: -2 }}
      onClick={handleCardClick}
      className={`bg-card rounded-lg border p-3 card-shadow flex flex-col relative ${
        isTrending ? "border-accent ring-2 ring-accent/20 shadow-lg shadow-accent/10" : "border-border"
      } ${isHomepageMode ? "cursor-pointer hover:border-primary/50 hover:shadow-md transition-all" : ""}`}
      animate={isTrending ? { boxShadow: ["0 0 0px hsl(var(--accent) / 0.1)", "0 0 20px hsl(var(--accent) / 0.25)", "0 0 0px hsl(var(--accent) / 0.1)"] } : {}}
      transition={isTrending ? { duration: 2, repeat: Infinity, ease: "easeInOut" } : {}}
    >
      {/* Trending badge */}
      {isTrending && (
        <div className="flex items-center gap-1.5 mb-1.5">
          <motion.span
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-accent bg-accent/10 px-2 py-0.5 rounded-full border border-accent/30"
          >
            <TrendingUp className="w-3 h-3" />
            🔥 Trending
          </motion.span>
        </div>
      )}

      {/* Header row */}
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-[10px] font-medium bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">{poll.category}</span>
        <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <Clock className="w-3 h-3" />{getTimeRemaining(poll.close_at)}
        </span>
        <div className="flex items-center gap-1 ml-auto">
          <BookmarkToggle pollId={poll.id} onRequireAuth={() => setRegisterOpen(true)} />
          <SharePopover url={`/forecast-arena/${poll.slug}`} title={poll.title} />
        </div>
      </div>

      {/* Question title + Probability badge side by side */}
      <div className="flex items-start justify-between gap-3 mb-1">
        <Link to={`/forecast-arena/${poll.slug}`} className="flex-1">
          <h3 className="font-display font-bold text-foreground leading-snug text-sm hover:underline decoration-primary/60 underline-offset-2 cursor-pointer transition-all">{poll.title}</h3>
        </Link>
        {leadingOption && totalVotes > 0 && (
          <div className="text-right shrink-0">
            <span className={`font-mono text-xl font-bold ${probColor}`}>{leadingPct}%</span>
            <span className={`font-mono text-sm font-bold ml-1 ${probColor}`}>{leadingOption.label}</span>
            <p className="text-[9px] text-muted-foreground">consensus</p>
          </div>
        )}
      </div>

      {/* Context preview */}
      {poll.context && (
        <div className="mb-1">
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            {detailsExpanded ? poll.context : contextPreview}
          </p>
          {contextIsLong && (
            <button onClick={() => setDetailsExpanded(!detailsExpanded)} className="flex items-center gap-0.5 text-[10px] text-primary hover:text-accent transition-colors mt-0.5">
              {detailsExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              {detailsExpanded ? "Less" : "View details"}
            </button>
          )}
        </div>
      )}

      {/* Unlock Insight */}
      {(!contextIsLong || detailsExpanded || !poll.context) && (
        <div className="mb-2">
          <Button variant="ghost" size="sm"
            className="text-[10px] font-semibold gap-1 px-2 py-1 h-auto text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-500/10"
            onClick={handleUnlockInsight}>
            {isPumpPriceQuestion ? (
              <><Download className="w-3 h-3 text-amber-500" /> Unlock Insight</>
            ) : (
              <><Lightbulb className="w-3 h-3 text-amber-500" /> Unlock Insight</>
            )}
          </Button>
        </div>
      )}

      {/* Voting layout: 2 or 3 columns based on AI predictions */}
      <div className={`grid grid-cols-1 gap-3 mb-2 items-start ${aiPredictions.length > 0 ? "md:grid-cols-[1.2fr_1fr_1fr]" : "md:grid-cols-2"}`}>
        {/* LEFT: Add your voice */}
        <div className="flex flex-col relative">
          <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold mb-0.5">
            Add your voice
            {hasVoted && votedOptionId && (() => {
              const votedOpt = sortedOptions.find(o => o.id === votedOptionId);
              return votedOpt ? (
                <span className="ml-1 normal-case tracking-normal font-normal text-primary">
                  — you selected <span className="font-semibold">{votedOpt.label}</span>
                </span>
              ) : null;
            })()}
          </p>

          <AnimatePresence>
            {justVoted && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                className="flex items-center justify-center gap-2 py-1 mb-1.5 rounded-md bg-primary/10 border border-primary/20">
                <Check className="w-3 h-3 text-primary" />
                <span className="text-[10px] font-semibold text-primary">Forecast recorded</span>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-1.5 flex-1 relative">
            {sortedOptions.map((option) => {
              const pct = totalVotes > 0 ? Math.round((option.total_votes_count / totalVotes) * 100) : Math.round(100 / sortedOptions.length);
              const isVoted = votedOptionId === option.id;
              const canVote = !hasVoted && !voting && !isClosed;
              const isYes = option.label.toLowerCase() === "yes";
              const isNo = option.label.toLowerCase() === "no";

              const selectedBorder = isYes ? "border-green-500 ring-1 ring-green-500/30" : isNo ? "border-blue-500 ring-1 ring-blue-500/30" : "border-primary ring-1 ring-primary/30";
              const selectedBg = isYes ? "bg-green-500/10" : isNo ? "bg-blue-500/10" : "bg-primary/10";
              const selectedText = isYes ? "text-green-600" : isNo ? "text-blue-600" : "text-primary";

              return (
                <button
                  key={option.id}
                  type="button"
                  onPointerUp={(e) => handleOptionPointerUp(option.id, e)}
                  onClick={(e) => handleOptionClick(option.id, e)}
                  onKeyDown={(e) => handleOptionKeyDown(option.id, e)}
                  disabled={false}
                  className={`relative z-10 w-full pointer-events-auto overflow-hidden rounded-md border transition-all text-left touch-manipulation ${
                    isVoted ? `${selectedBorder} ${selectedBg}` : "border-border hover:border-primary/40 hover:bg-primary/5 bg-transparent"
                  } ${canVote && isHomepageMode ? "hover:scale-[1.02] hover:shadow-sm" : ""} cursor-pointer`}
                >
                  {(hasVoted || isClosed) && (
                    <div className={`pointer-events-none absolute inset-0 transition-all duration-700 ${isVoted ? selectedBg : "bg-muted/30"} opacity-40`} style={{ width: `${pct}%` }} />
                  )}
                  <div className="relative z-10 flex items-center justify-between px-2.5 py-2">
                    <span className={`flex items-center gap-1.5 text-sm font-semibold ${isVoted ? selectedText : "text-foreground"}`}>
                      {isVoted && <Check className={`w-3.5 h-3.5 ${selectedText}`} />}
                      {canVote && isYesNo ? (isYes ? "Vote Yes" : "Vote No") : option.label}
                    </span>
                    {(hasVoted || isClosed) && (
                      <span className={`font-mono text-xs font-semibold ${isVoted ? selectedText : "text-muted-foreground"}`}>{pct}%</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          <p className="text-[8px] text-muted-foreground mt-2 pt-1.5 border-t border-border italic">Submit your personal forecast on the outcome</p>
        </div>

        {/* RIGHT: What Humans Think */}
        <div className="flex flex-col">
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">What Humans Think</p>
            <span className="text-[9px] text-muted-foreground font-mono">{totalVotes} {totalVotes === 1 ? "vote" : "votes"}</span>
          </div>

          <div className="space-y-2 flex-1">
            {sortedOptions.map((option) => {
              const pct = totalVotes > 0 ? Math.round((option.total_votes_count / totalVotes) * 100) : 0;
              const isYes = option.label.toLowerCase() === "yes";
              const isNo = option.label.toLowerCase() === "no";
              const barColor = isYes ? "bg-green-500" : isNo ? "bg-blue-400" : "bg-primary";

              return (
                <div key={option.id} className="space-y-0.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-foreground font-medium">{option.label}</span>
                    <span className="font-mono text-muted-foreground">
                      {option.total_votes_count} <span className="text-[9px]">({pct}%)</span>
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-700 ${barColor}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>

          <p className="text-[8px] text-muted-foreground mt-2 pt-1.5 border-t border-border italic">Live aggregate of people's forecasts</p>
        </div>
        {/* Column 3: What AI Thinks */}
        {aiPredictions.length > 0 && (
          <div className="flex flex-col">
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-1">
                <Bot className="w-3 h-3 text-purple-500" /> What AI Thinks
              </p>
              <span className="text-[9px] text-muted-foreground font-mono">{aiPredictions.length} {aiPredictions.length === 1 ? "forecast" : "forecasts"}</span>
            </div>

            <div className="space-y-2 flex-1">
              {sortedOptions.map((option) => {
                const aiCount = aiPredictions.filter(p => p.option_id === option.id).length;
                const aiPct = aiPredictions.length > 0 ? Math.round((aiCount / aiPredictions.length) * 100) : 0;

                return (
                  <div key={option.id} className="space-y-0.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-foreground font-medium">{option.label}</span>
                      <span className="font-mono text-muted-foreground">
                        {aiCount} <span className="text-[9px]">({aiPct}%)</span>
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700 bg-purple-500" style={{ width: `${aiPct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>

            <p className="text-[8px] text-muted-foreground mt-2 pt-1.5 border-t border-border italic">Independent AI predictions from verified models</p>
          </div>
        )}
      </div>

      {/* Post-vote: cross-promotion to Pro (only on detail page, not homepage) */}
      {!isHomepageMode && hasVoted && !isClosed && (
        <div className="mt-2 pt-2 border-t border-border">
          <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-3 text-center space-y-1.5">
            <p className="text-xs font-semibold text-foreground">💰 Want to back your forecast with real capital?</p>
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              Commit capital to your view and earn rewards if you're right. Each share pays $1.00 if the outcome matches.
            </p>
            <Link
              to={`/forecast-arena-pro/${poll.slug}`}
              className="inline-flex items-center justify-center rounded-md bg-amber-500 text-white px-4 py-1.5 text-xs font-bold shadow hover:bg-amber-600 transition-colors"
            >
              Try Forecast Arena Pro →
            </Link>
          </div>
          {hasVoted && (
            <div className="flex items-center justify-center gap-3 mt-1 pt-1 border-t border-border">
              <span className="text-[9px] text-muted-foreground">Share your view:</span>
              <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`I just shared my forecast on "${poll.title}" on Forecast Arena! What's your view?`)}&url=${encodeURIComponent(window.location.origin + "/forecast-arena/" + poll.slug)}`}
                target="_blank" rel="noopener noreferrer" className="text-[10px] text-primary hover:text-accent font-medium">𝕏</a>
              <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.origin + "/forecast-arena/" + poll.slug)}`}
                target="_blank" rel="noopener noreferrer" className="text-[10px] text-primary hover:text-accent font-medium">LinkedIn</a>
              <a href={`https://wa.me/?text=${encodeURIComponent(`I just shared my forecast on "${poll.title}" — What's your view? ${window.location.origin}/forecast-arena/${poll.slug}`)}`}
                target="_blank" rel="noopener noreferrer" className="text-[10px] text-primary hover:text-accent font-medium">WhatsApp</a>
              <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/forecast-arena/${poll.slug}`); toast({ title: "Link copied!" }); }}
                className="text-[10px] text-primary hover:text-accent font-medium flex items-center gap-0.5"><Copy className="w-2.5 h-2.5" /> Copy</button>
            </div>
          )}
        </div>
      )}

      {isClosed && (
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <Lock className="w-3 h-3" />Forecasting closed
        </div>
      )}

      <RegistrationModal open={registerOpen} onOpenChange={setRegisterOpen} onSuccess={handleAuthSuccess}
        onSwitchToLogin={() => { setRegisterOpen(false); setLoginModalOpen(true); }} />
      <LoginModal open={loginModalOpen} onOpenChange={setLoginModalOpen} onSuccess={handleAuthSuccess}
        onSwitchToRegister={() => { setLoginModalOpen(false); setRegisterOpen(true); }} />
      
    </motion.div>
  );
};

export default PollCard;
