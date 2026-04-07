import { useState, useEffect, useMemo, useRef, type KeyboardEvent, type MouseEvent, type PointerEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, Users, Lock, Check, Loader2, Rocket, ChevronDown, ChevronUp, Lightbulb, TrendingUp, Download, HelpCircle, Copy, DollarSign, Tag, ShoppingBag, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { getFingerprint } from "@/lib/fingerprint";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import TradingWaitlistModal from "./TradingWaitlistModal";
import StakeModal from "./StakeModal";
import ExitPositionModal from "./ExitPositionModal";
import ListSharesModal from "./ListSharesModal";
import RegistrationModal from "@/components/auth/RegistrationModal";
import LoginModal from "@/components/auth/LoginModal";

import BookmarkToggle from "./BookmarkToggle";
import SharePopover from "./SharePopover";
import type { Poll, PollOption } from "@/hooks/use-polls";

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
}

const PollCard = ({ poll, compact = false, isTrending = false, interactionMode = "navigate" }: PollCardProps) => {
  const { toast } = useToast();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [voting, setVoting] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [votedOptionId, setVotedOptionId] = useState<string | null>(null);
  const [localOptions, setLocalOptions] = useState(poll.poll_options);
  const [justVoted, setJustVoted] = useState(false);
  const [waitlistOpen, setWaitlistOpen] = useState(false);
  const [stakeOpen, setStakeOpen] = useState(false);
  const [stakeOption, setStakeOption] = useState<PollOption | null>(null);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [pendingVoteOptionId, setPendingVoteOptionId] = useState<string | null>(null);
  const [detailsExpanded, setDetailsExpanded] = useState(false);
  const [howItWorksOpen, setHowItWorksOpen] = useState(false);
  const [exitModalOpen, setExitModalOpen] = useState(false);
  const [listOpen, setListOpen] = useState(false);
  // savedListInfo captures option/shares/price at the moment the button is clicked,
  // so the modal never depends on live query state (prevents unmount during success screen)
  const [savedListInfo, setSavedListInfo] = useState<{ optionId: string; optionLabel: string; shares: number; price: number } | null>(null);
  // hasCommitted stays true once the user has committed capital — prevents panel flicker during refetch
  const [hasCommitted, setHasCommitted] = useState(false);
  const [peerOffersOpen, setPeerOffersOpen] = useState(false);
  const [inlineBuyingId, setInlineBuyingId] = useState<string | null>(null);
  const [inlineConfirming, setInlineConfirming] = useState<string | null>(null);
  const activationRef = useRef<{ optionId: string; timestamp: number } | null>(null);

  const isLoggedIn = !!user;

  // Fetch user's vote for this poll (even if is_staked has been set to false by a listing)
  // We need option_id and stake_amount even when shares are in escrow
  const { data: userStake } = useQuery({
    queryKey: ["user-stake", poll.id, user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from("votes")
        .select("stake_amount, created_at, option_id, is_staked")
        .eq("poll_id", poll.id)
        .eq("user_id", user.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  // Fetch user's positions for this poll
  const { data: userPositions = [] } = useQuery({
    queryKey: ["positions-card", poll.id, user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from("positions")
        .select("*")
        .eq("user_id", user.id)
        .eq("poll_id", poll.id);
      return data || [];
    },
    enabled: !!user,
  });

  // Fetch user's own active listings for this poll (so position panel stays visible while shares are in escrow)
  const { data: userListings = [] } = useQuery({
    queryKey: ["user-listings", poll.id, user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await (supabase as any)
        .from("listings")
        .select("id, option_id, shares, price_per_share, total_ask, cost_basis, created_at")
        .eq("poll_id", poll.id)
        .eq("seller_id", user.id)
        .eq("status", "active");
      if (error) {
        console.error("[PollCard] userListings query error:", error);
        return [];
      }
      console.log("[PollCard] userListings result:", data?.length, "rows for poll", poll.id);
      return (data || []) as any[];
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (isLoggedIn) {
      setRegisterOpen(false);
      setLoginModalOpen(false);
    }
  }, [isLoggedIn]);

  useEffect(() => { setLocalOptions(poll.poll_options); }, [poll.poll_options]);

  // Once capital is committed, never hide the position panel within this session
  useEffect(() => {
    if ((userStake?.stake_amount && Number(userStake.stake_amount) > 0) || userPositions.length > 0) {
      setHasCommitted(true);
    }
  }, [userStake, userPositions]);

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

  const handleAllocate = (option: PollOption) => {
    if (!isLoggedIn) { setRegisterOpen(true); return; }
    setStakeOption(option);
    setStakeOpen(true);
  };

  const activateOption = (optionId: string) => {
    const now = Date.now();
    const lastActivation = activationRef.current;

    if (lastActivation && lastActivation.optionId === optionId && now - lastActivation.timestamp < 350) {
      return;
    }

    activationRef.current = { optionId, timestamp: now };

    if (interactionMode === "vote") {
      if (hasVoted || voting || isClosed) return;
      void handleVote(optionId);
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

  return (
    <motion.div
      whileHover={{ y: -2 }}
      className={`bg-card rounded-lg border p-3 card-shadow flex flex-col relative ${
        isTrending ? "border-accent ring-2 ring-accent/20 shadow-lg shadow-accent/10" : "border-border"
      }`}
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

      {/* Two-column layout: Left = Vote, Right = Sentiment */}
      <div className="grid grid-cols-2 gap-3 mb-2">
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
                  disabled={interactionMode === "vote" ? isClosed || hasVoted || voting : false}
                  className={`relative z-10 w-full pointer-events-auto overflow-hidden rounded-md border transition-all text-left touch-manipulation ${
                    isVoted ? `${selectedBorder} ${selectedBg}` : "border-border hover:border-primary/40 bg-transparent"
                  } ${interactionMode === "vote" && (isClosed || hasVoted || voting) ? "pointer-events-none opacity-60" : "cursor-pointer"}`}
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

          {!hasVoted && !isClosed && (
            <p className="text-[9px] text-muted-foreground text-center mt-1.5">
              By participating, you agree to the{" "}
              <Link to="/terms-of-use" className="text-primary underline hover:text-accent">Terms of Use</Link>.
            </p>
          )}

          

          {!isClosed && PARTICIPATION_ENABLED && !hasVoted && (
            <div className="mt-1.5 pt-1.5 border-t border-border">
              <p className="text-[9px] text-muted-foreground text-center flex items-center justify-center gap-1">
              <Rocket className="w-3 h-3 text-accent" />
                {isLoggedIn ? "Click an option to add your voice" : "Sign in to add your voice"}
              </p>
            </div>
          )}
        </div>

        {/* RIGHT: What Others Think */}
        <div className="flex flex-col">
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">What Others Think</p>
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

          <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-border">
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <Users className="w-3 h-3" />{totalVotes} forecasts
            </span>
            {!compact && (
              <Link to={`/forecast-arena/${poll.slug}`} className="text-[10px] font-medium text-primary hover:text-accent transition-colors">
                Full details →
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Stage 2: Post-vote nudge — commit capital (full width, hidden if already staked) */}
      {!isClosed && PARTICIPATION_ENABLED && hasVoted && !hasCommitted && userPositions.length === 0 && userListings.length === 0 && (() => {
        const votedOption = sortedOptions.find(o => o.id === votedOptionId);
        if (!votedOption) return null;
        const consensusPct = totalVotes > 0 ? (votedOption.total_votes_count / totalVotes) : 0.50;
        const price = Math.max(0.05, Math.min(0.95, Math.round(consensusPct * 100) / 100));
        const isDismissed = interactionMode !== "vote" && !!localStorage.getItem(`nudge_dismissed_${poll.id}`);
        
        // If dismissed on homepage, show a compact "Commit Capital" button instead of the full nudge
        if (isDismissed) {
          return (
            <div className="mt-2 pt-2 border-t border-border">
              <div className="flex items-center gap-2">
                <Button size="sm" onClick={() => handleAllocate(votedOption)}
                  className="flex-1 text-xs font-bold gap-1">
                  <DollarSign className="w-3 h-3" /> Commit capital — back your forecast
                </Button>
                <Button size="sm" variant="outline" asChild className="text-xs font-medium gap-1 shrink-0">
                  <Link to="/how-it-works"><HelpCircle className="w-3 h-3" /> How it works</Link>
                </Button>
              </div>
            </div>
          );
        }

        return (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mt-2 pt-2 border-t border-border overflow-hidden"
          >
            <div className="bg-muted/30 border border-border rounded-lg p-3 space-y-2 relative">
              <button
                onClick={() => { localStorage.setItem(`nudge_dismissed_${poll.id}`, "1"); setJustVoted(false); }}
                className="absolute top-2 right-2 text-muted-foreground hover:text-foreground text-xs"
                aria-label="Dismiss"
              >✕</button>
              <motion.span
                animate={{ opacity: [1, 0.4, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="inline-block text-[8px] font-black uppercase tracking-wider text-accent-foreground bg-accent px-1.5 py-0.5 rounded"
              >
                New Feature
              </motion.span>
              <p className="text-xs font-semibold text-foreground">
                Commit capital to your forecast and earn rewards if you are right.
              </p>
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                You've shared your view — now you can back it with conviction. When you commit capital, you receive shares in your position. If the outcome matches your forecast, each share pays $1.00.
              </p>
              <div className="text-[10px] text-muted-foreground space-y-0.5">
                <p>Your forecast: <span className="font-semibold text-foreground">{votedOption.label}</span> (currently at {Math.round(consensusPct * 100)}%)</p>
                <p>Cost per share: <span className="font-mono font-semibold text-foreground">${price.toFixed(2)}</span></p>
                <p>If your forecast is correct: <span className="font-mono font-semibold text-green-600">$1.00 per share</span></p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => { localStorage.setItem(`nudge_dismissed_${poll.id}`, "1"); handleAllocate(votedOption); }}
                  className="flex-1 text-xs font-bold">
                  Commit capital
                </Button>
                <Button size="sm" variant="outline" asChild
                  className="text-xs font-medium gap-1 shrink-0">
                  <Link to="/how-it-works"><HelpCircle className="w-3 h-3" /> How it works</Link>
                </Button>
              </div>
              <p className="text-[9px] text-muted-foreground text-center">
                ℹ️ This is optional. Your vote counts either way.
              </p>
            </div>
          </motion.div>
        );
      })()}
      {hasVoted && !isClosed && (
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

      {/* Commitment info badge — shows on all polls where user has staked */}
      {user && (hasCommitted || userPositions.length > 0 || userListings.length > 0) && (() => {
        // Primary position: prefer voted/staked option; fall back to first position or first active listing
        const stakedOptionId = userStake?.option_id || userPositions[0]?.option_id || userListings[0]?.option_id;
        if (!stakedOptionId) return null; // Safety: nothing to show if we can't determine the option
        const stakedOption = sortedOptions.find(o => o.id === stakedOptionId);

        // Per-option position (fixes E-6: don't aggregate shares across different options)
        const stakedPosition = userPositions.find(p => p.option_id === stakedOptionId);
        const totalShares  = stakedPosition ? Number(stakedPosition.shares) : 0;
        // stakeAmount: prefer position total_cost, then listed cost_basis, then original vote stake_amount
        const stakeAmount  = stakedPosition
          ? Number(stakedPosition.total_cost)
          : userListings.length > 0
            ? userListings.reduce((s: number, l: any) => s + Number(l.cost_basis || 0), 0)
            : Number(userStake?.stake_amount || 0);
        const stakeDate    = userStake?.created_at || stakedPosition?.created_at;
        const listedShares = userListings.reduce((s, l) => s + Number(l.shares), 0);
        const totalActive  = totalShares + listedShares;
        const potentialGain = totalActive > 0 ? totalActive : (stakeAmount || 0);

        // Consensus price for the staked option (display + exit modal)
        const stakedOptionData = sortedOptions.find(o => o.id === stakedOptionId);
        const currentConsensusPrice = stakedOptionData && totalVotes > 0
          ? Math.max(0.05, Math.min(0.95, stakedOptionData.total_votes_count / totalVotes))
          : 0.5;

        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-2 pt-2 border-t border-border"
          >
            <div className="bg-primary/5 border border-primary/15 rounded-lg p-2.5 space-y-1.5">
              <div className="flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-primary" />
                <span className="text-[10px] font-bold text-foreground">Your Position</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-[10px]">
                <div>
                  <p className="text-muted-foreground">Committed</p>
                  <p className="font-mono font-bold text-foreground">${Number(stakeAmount || 0).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">On</p>
                  <p className="font-semibold text-foreground">{stakedOption?.label || "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">If correct</p>
                  <p className="font-mono font-bold text-green-600">${potentialGain.toFixed(2)}</p>
                </div>
              </div>

              {/* Active listings tracker — shown whenever user has shares in escrow */}
              {userListings.length > 0 && (
                <div className="mt-1 space-y-1.5">
                  <p className="text-[9px] uppercase tracking-wider text-amber-600 font-semibold">
                    📋 Active listing{userListings.length > 1 ? "s" : ""} — shares in escrow
                  </p>
                  {userListings.map((listing) => (
                    <div key={listing.id} className="bg-amber-500/5 border border-amber-500/20 rounded-md px-2.5 py-2 space-y-0.5">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="font-semibold text-foreground">
                          {Number(listing.shares).toFixed(4)} shares @ ${Number(listing.price_per_share).toFixed(2)}/share
                        </span>
                        <span className="font-mono font-bold text-foreground">${Number(listing.total_ask).toFixed(2)}</span>
                      </div>
                      <p className="text-[9px] text-amber-700">
                        Visible to all users · You receive ${(Number(listing.total_ask) * 0.965).toFixed(2)} when sold (after 3.5% fee)
                      </p>
                    </div>
                  ))}
                </div>
              )}
              {stakeDate && (
                <p className="text-[9px] text-muted-foreground">
                  Committed {new Date(stakeDate).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                </p>
              )}
              {!isClosed && (
                <div className="flex gap-1.5 mt-1 flex-wrap">
                  {stakedOption && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setStakeOption(stakedOption); setStakeOpen(true); }}
                      className="flex-1 flex items-center justify-center gap-1 text-[10px] font-bold py-1.5 px-2 rounded-md bg-accent hover:bg-accent/90 text-accent-foreground transition-colors"
                    >
                      Buy more
                    </button>
                  )}
                  {totalShares > 0 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSavedListInfo({
                          optionId: stakedOptionId!,
                          optionLabel: stakedOption?.label || "",
                          shares: totalShares,
                          price: currentConsensusPrice,
                        });
                        setListOpen(true);
                      }}
                      className="flex-1 flex items-center justify-center gap-1 text-[10px] font-bold py-1.5 px-2 rounded-md border border-primary/40 bg-primary/5 hover:bg-primary/10 text-primary transition-colors"
                    >
                      List for sale
                    </button>
                  )}
                  {totalShares > 0 && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setExitModalOpen(true); }}
                      className="flex-1 flex items-center justify-center gap-1 text-[10px] font-bold py-1.5 px-2 rounded-md border border-border bg-background hover:bg-muted transition-colors text-foreground"
                    >
                      Exit early
                    </button>
                  )}
                </div>
              )}
            </div>

            {stakedOptionId && totalShares > 0 && (
              <ExitPositionModal
                open={exitModalOpen}
                onOpenChange={setExitModalOpen}
                poll={{ id: poll.id, title: poll.title }}
                optionId={stakedOptionId}
                optionLabel={stakedOption?.label || ""}
                shares={totalShares}
                stakeAmount={Number(stakeAmount || 0)}
                currentPrice={currentConsensusPrice}
                potentialPayoutIfCorrect={potentialGain}
              />
            )}
{/* ListSharesModal moved to bottom of component to decouple from query state */}
          </motion.div>
        );
      })()}

      {isClosed && (
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <Lock className="w-3 h-3" />Forecasting closed
        </div>
      )}

      <RegistrationModal open={registerOpen} onOpenChange={setRegisterOpen} onSuccess={handleAuthSuccess}
        onSwitchToLogin={() => { setRegisterOpen(false); setLoginModalOpen(true); }} />
      <LoginModal open={loginModalOpen} onOpenChange={setLoginModalOpen} onSuccess={handleAuthSuccess}
        onSwitchToRegister={() => { setLoginModalOpen(false); setRegisterOpen(true); }} />
      <StakeModal open={stakeOpen} onOpenChange={setStakeOpen} poll={{ ...poll, poll_options: localOptions }} selectedOption={stakeOption} />
      <TradingWaitlistModal open={waitlistOpen} onOpenChange={setWaitlistOpen} />
      {/* ListSharesModal uses savedListInfo captured at button-click time — never unmounts due to query state changes */}
      {savedListInfo && (
        <ListSharesModal
          open={listOpen}
          onOpenChange={(open) => { setListOpen(open); if (!open) setSavedListInfo(null); }}
          poll={{ id: poll.id, title: poll.title }}
          optionId={savedListInfo.optionId}
          optionLabel={savedListInfo.optionLabel}
          availableShares={savedListInfo.shares}
          suggestedPrice={savedListInfo.price}
        />
      )}
      
    </motion.div>
  );
};

export default PollCard;
