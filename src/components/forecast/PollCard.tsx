import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, Users, Lock, Check, Loader2, Rocket, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { getFingerprint } from "@/lib/fingerprint";
import { useToast } from "@/hooks/use-toast";
import TradingWaitlistModal from "./TradingWaitlistModal";
import StakeModal from "./StakeModal";
import ParticipantLoginModal from "./ParticipantLoginModal";
import type { Poll, PollOption } from "@/hooks/use-polls";

const PARTICIPATION_ENABLED = true;
const CONTEXT_PREVIEW_LENGTH = 120;

function getTimeRemaining(closeAt: string) {
  const diff = new Date(closeAt).getTime() - Date.now();
  if (diff <= 0) return "Closed";
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  if (days > 0) return `${days}d ${hours}h left`;
  const mins = Math.floor((diff / (1000 * 60)) % 60);
  return `${hours}h ${mins}m left`;
}

function isParticipantLoggedIn(): boolean {
  return !!localStorage.getItem("forecast_participant");
}

interface PollCardProps {
  poll: Poll;
  compact?: boolean;
}

const PollCard = ({ poll, compact = false }: PollCardProps) => {
  const { toast } = useToast();
  const [voting, setVoting] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [votedOptionId, setVotedOptionId] = useState<string | null>(null);
  const [localOptions, setLocalOptions] = useState(poll.poll_options);
  const [justVoted, setJustVoted] = useState(false);
  const [waitlistOpen, setWaitlistOpen] = useState(false);
  const [stakeOpen, setStakeOpen] = useState(false);
  const [stakeOption, setStakeOption] = useState<PollOption | null>(null);
  const [loginOpen, setLoginOpen] = useState(false);
  const [pendingVoteOptionId, setPendingVoteOptionId] = useState<string | null>(null);
  const [detailsExpanded, setDetailsExpanded] = useState(false);

  useEffect(() => { setLocalOptions(poll.poll_options); }, [poll.poll_options]);

  useEffect(() => {
    (async () => {
      const fp = await getFingerprint();
      const { data } = await supabase
        .from("votes")
        .select("option_id")
        .eq("poll_id", poll.id)
        .eq("voter_fingerprint", fp)
        .maybeSingle();
      if (data) { setHasVoted(true); setVotedOptionId(data.option_id); }
    })();
  }, [poll.id]);

  const totalVotes = localOptions.reduce((s, o) => s + o.total_votes_count, 0);
  const isClosed = poll.status !== "active" || new Date(poll.close_at) < new Date();

  const handleVote = async (optionId: string) => {
    if (hasVoted || voting || isClosed) return;
    if (!isParticipantLoggedIn()) { setPendingVoteOptionId(optionId); setLoginOpen(true); return; }
    setVoting(true);
    try {
      const fp = await getFingerprint();
      const { error } = await supabase.from("votes").insert({ poll_id: poll.id, option_id: optionId, voter_fingerprint: fp });
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
      toast({ title: "🎯 Forecast submitted!", description: "Your view has been recorded." });
    } catch {
      toast({ title: "Error", description: "Could not record forecast. Try again.", variant: "destructive" });
    } finally { setVoting(false); }
  };

  const handleLoginSuccess = () => { if (pendingVoteOptionId) { handleVote(pendingVoteOptionId); setPendingVoteOptionId(null); } };

  const handleAllocate = (option: PollOption) => {
    if (!isParticipantLoggedIn()) { setLoginOpen(true); return; }
    setStakeOption(option);
    setStakeOpen(true);
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

  return (
    <motion.div whileHover={{ y: -2 }} className="bg-card rounded-lg border border-border p-3 card-shadow flex flex-col">
      {/* Header row */}
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-[10px] font-medium bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">{poll.category}</span>
        
        <span className="flex items-center gap-1 text-[10px] text-muted-foreground ml-auto">
          <Clock className="w-3 h-3" />{getTimeRemaining(poll.close_at)}
        </span>
      </div>

      {/* Question title */}
      <h3 className="font-display font-bold text-foreground leading-snug text-sm mb-1">{poll.title}</h3>

      {/* Context preview — show inline, expand if long */}
      {poll.context && (
        <div className="mb-2">
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

      {/* Two-column layout: Left = Vote, Right = Sentiment */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-2">
        {/* LEFT: Make Your Prediction */}
        <div className="flex flex-col">
          <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold mb-1.5">Make Your Prediction</p>

          <AnimatePresence>
            {justVoted && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                className="flex items-center justify-center gap-2 py-1 mb-1.5 rounded-md bg-primary/10 border border-primary/20">
                <Loader2 className="w-3 h-3 text-primary animate-spin" />
                <span className="text-[10px] font-semibold text-primary">Updating…</span>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-1.5 flex-1">
            {sortedOptions.map((option) => {
              const pct = totalVotes > 0 ? Math.round((option.total_votes_count / totalVotes) * 100) : Math.round(100 / sortedOptions.length);
              const isVoted = votedOptionId === option.id;
              const canVote = !hasVoted && !voting && !isClosed;
              const isYes = option.label.toLowerCase() === "yes";
              const isNo = option.label.toLowerCase() === "no";

              const selectedBorder = isYes ? "border-green-500 ring-1 ring-green-500/30" : isNo ? "border-red-500 ring-1 ring-red-500/30" : "border-primary ring-1 ring-primary/30";
              const selectedBg = isYes ? "bg-green-500/10" : isNo ? "bg-red-500/10" : "bg-primary/10";
              const selectedText = isYes ? "text-green-600" : isNo ? "text-red-500" : "text-primary";

              return (
                <button key={option.id} onClick={() => handleVote(option.id)} disabled={hasVoted || voting || isClosed}
                  className={`w-full relative overflow-hidden rounded-md border transition-all text-left ${
                    isVoted ? `${selectedBorder} ${selectedBg}` : canVote ? "border-border hover:border-muted-foreground/40 cursor-pointer bg-transparent" : "border-border cursor-default bg-transparent"
                  }`}>
                  {(hasVoted || isClosed) && (
                    <div className={`absolute inset-0 transition-all duration-700 ${isVoted ? selectedBg : "bg-muted/30"} opacity-40`} style={{ width: `${pct}%` }} />
                  )}
                  <div className="relative flex items-center justify-between px-2.5 py-2">
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
              <a href="/documents/terms-of-use.pdf" target="_blank" rel="noopener noreferrer" className="text-primary underline hover:text-accent">Terms of Use</a>.
            </p>
          )}

          {/* Capital commitment — after voting */}
          {!isClosed && PARTICIPATION_ENABLED && hasVoted && (() => {
            const votedOption = sortedOptions.find(o => o.id === votedOptionId);
            if (!votedOption) return null;
            const consensusPct = totalVotes > 0 ? (votedOption.total_votes_count / totalVotes) : 0.50;
            const price = Math.max(0.05, Math.min(0.95, Math.round(consensusPct * 100) / 100));
            const isYes = votedOption.label.toLowerCase() === "yes";
            const isNo = votedOption.label.toLowerCase() === "no";
            const potentialGain = (1 - price).toFixed(2);
            return (
              <div className="mt-2 pt-2 border-t border-border">
                <p className="text-[9px] text-muted-foreground mb-1.5 text-center flex items-center justify-center gap-1 flex-wrap">
                  <span className="text-[9px] font-black uppercase tracking-wider text-accent-foreground bg-accent px-1 py-0.5 rounded">New Feature</span>
                  Commit capital to your position. Gain <span className="font-mono font-bold text-primary">${potentialGain}</span> if your prediction is correct.
                </p>
                <Button size="sm" onClick={() => handleAllocate(votedOption)}
                  className={`w-full text-xs font-bold text-white transition-all ${
                    isYes ? "bg-green-600 hover:bg-green-700" : isNo ? "bg-red-500 hover:bg-red-600" : "bg-primary hover:bg-primary/90"
                  }`}>
                  Commit capital (${price.toFixed(2)})
                </Button>
              </div>
            );
          })()}

          {!isClosed && PARTICIPATION_ENABLED && !hasVoted && (
            <div className="mt-1.5 pt-1.5 border-t border-border">
              <p className="text-[9px] text-muted-foreground text-center flex items-center justify-center gap-1">
                <Rocket className="w-3 h-3 text-accent" />
                Vote first to commit capital
              </p>
            </div>
          )}
        </div>

        {/* RIGHT: What Others Are Saying */}
        <div className="flex flex-col">
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">What Others Are Saying</p>
            <span className="text-[9px] text-muted-foreground font-mono">{totalVotes} {totalVotes === 1 ? "vote" : "votes"}</span>
          </div>

          <div className="space-y-2 flex-1">
            {sortedOptions.map((option) => {
              const pct = totalVotes > 0 ? Math.round((option.total_votes_count / totalVotes) * 100) : 0;
              const isYes = option.label.toLowerCase() === "yes";
              const isNo = option.label.toLowerCase() === "no";
              const barColor = isYes ? "bg-green-500" : isNo ? "bg-red-400" : "bg-primary";

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

      {isClosed && (
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <Lock className="w-3 h-3" />Forecasting closed
        </div>
      )}

      <ParticipantLoginModal open={loginOpen} onOpenChange={setLoginOpen} onSuccess={handleLoginSuccess} />
      <StakeModal open={stakeOpen} onOpenChange={setStakeOpen} poll={poll} selectedOption={stakeOption} />
      <TradingWaitlistModal open={waitlistOpen} onOpenChange={setWaitlistOpen} />
    </motion.div>
  );
};

export default PollCard;
