import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, Users, Lock, Check, HelpCircle, Loader2, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { getFingerprint } from "@/lib/fingerprint";
import { useToast } from "@/hooks/use-toast";
import TradingWaitlistModal from "./TradingWaitlistModal";
import type { Poll, PollOption } from "@/hooks/use-polls";

// Feature flag — flip to true to re-enable participation allocations
const PARTICIPATION_ENABLED = false;

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
}

const PollCard = ({ poll, compact = false }: PollCardProps) => {
  const { toast } = useToast();
  const [voting, setVoting] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [votedOptionId, setVotedOptionId] = useState<string | null>(null);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [localOptions, setLocalOptions] = useState(poll.poll_options);
  const [justVoted, setJustVoted] = useState(false);
  const [waitlistOpen, setWaitlistOpen] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  useEffect(() => {
    setLocalOptions(poll.poll_options);
  }, [poll.poll_options]);

  // Check if already voted
  useEffect(() => {
    (async () => {
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
  }, [poll.id]);

  const totalVotes = localOptions.reduce((s, o) => s + o.total_votes_count, 0);
  const isClosed = poll.status !== "active" || new Date(poll.close_at) < new Date();

  const handleVote = async (optionId: string) => {
    if (hasVoted || voting || isClosed) return;

    // First click = select, second click on same = confirm
    if (selectedOptionId !== optionId) {
      setSelectedOptionId(optionId);
      return;
    }

    // Check terms acceptance
    if (!termsAccepted) {
      toast({ title: "Terms required", description: "Please accept the Terms of Use before submitting your forecast.", variant: "destructive" });
      return;
    }

    setVoting(true);
    try {
      const fp = await getFingerprint();
      const { error } = await supabase.from("votes").insert({
        poll_id: poll.id,
        option_id: optionId,
        voter_fingerprint: fp,
      });
      if (error) {
        if (error.code === "23505") {
          toast({ title: "Already submitted", description: "You've already submitted a forecast on this question.", variant: "destructive" });
          setHasVoted(true);
          return;
        }
        throw error;
      }
      await supabase.rpc("increment_vote_count", { p_option_id: optionId });

      setJustVoted(true);
      setTimeout(() => setJustVoted(false), 1500);

      setHasVoted(true);
      setVotedOptionId(optionId);
      setLocalOptions(prev =>
        prev.map(o => o.id === optionId ? { ...o, total_votes_count: o.total_votes_count + 1 } : o)
      );
      toast({ title: "🎯 Forecast submitted!", description: "Your view has been recorded. The consensus just shifted." });
    } catch {
      toast({ title: "Error", description: "Could not record forecast. Try again.", variant: "destructive" });
    } finally {
      setVoting(false);
    }
  };

  // Realtime
  useEffect(() => {
    const channel = supabase
      .channel(`poll-options-${poll.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "poll_options", filter: `poll_id=eq.${poll.id}` },
        (payload) => {
          const updated = payload.new as { id: string; total_votes_count: number };
          setLocalOptions(prev =>
            prev.map(o => o.id === updated.id ? { ...o, total_votes_count: updated.total_votes_count } : o)
          );
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [poll.id]);

  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="bg-card rounded-lg border border-border p-6 card-shadow flex flex-col"
    >
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-pill">
          {poll.category}
        </span>
        <span className="flex items-center gap-1 text-xs text-muted-foreground ml-auto">
          <Clock className="w-3 h-3" />
          {getTimeRemaining(poll.close_at)}
        </span>
      </div>

      <h3 className="font-display font-bold text-foreground leading-snug mb-3 text-sm md:text-base">
        {poll.title}
      </h3>

      {!compact && poll.context && (
        <p className="text-xs text-muted-foreground leading-relaxed mb-4 line-clamp-2">
          {poll.context}
        </p>
      )}

      {/* Sentiment label */}
      {totalVotes > 0 && (hasVoted || isClosed) && (
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1.5">
          📊 What people are saying
        </p>
      )}

      {/* Updating consensus overlay */}
      <AnimatePresence>
        {justVoted && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center justify-center gap-2 py-3 mb-2 rounded-md bg-primary/10 border border-primary/20"
          >
            <Loader2 className="w-4 h-4 text-primary animate-spin" />
            <span className="text-sm font-semibold text-primary">Updating consensus data...</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Forecast options */}
      <div className="space-y-2 mb-4 flex-1">
        {localOptions.map((option) => {
          const pct = totalVotes > 0 ? Math.round((option.total_votes_count / totalVotes) * 100) : 50;
          const isYes = option.label.toLowerCase() === "yes";
          const isVoted = votedOptionId === option.id;
          const isSelected = selectedOptionId === option.id;
          const canVote = !hasVoted && !voting && !isClosed;
          const showBar = hasVoted || isClosed;

          // Green for Yes, Red for No
          const colorClass = isYes ? "text-green-600" : "text-red-500";
          const bgColorClass = isYes ? "bg-green-500/10" : "bg-red-500/10";
          const borderColorClass = isYes ? "border-green-500 ring-green-500/30" : "border-red-500 ring-red-500/30";

          return (
            <button
              key={option.id}
              onClick={() => handleVote(option.id)}
              disabled={hasVoted || voting || isClosed}
              className={`w-full relative overflow-hidden rounded-md border-2 transition-all text-left ${
                isVoted
                  ? `${borderColorClass} ring-2 ${bgColorClass}`
                  : isSelected
                  ? `${borderColorClass} ring-2 ${bgColorClass}`
                  : canVote
                  ? `border-border hover:${isYes ? "border-green-400" : "border-red-400"} cursor-pointer`
                  : "border-border cursor-default"
              }`}
            >
              {/* Only show distribution bar AFTER voting */}
              {showBar && (
                <div
                  className={`absolute inset-0 transition-all duration-700 ${bgColorClass}`}
                  style={{ width: `${pct}%` }}
                />
              )}
              <div className="relative flex items-center justify-between px-3 py-2.5">
                <span className={`flex items-center gap-2 text-sm font-medium ${isVoted ? colorClass : "text-foreground"}`}>
                  {isVoted && <Check className={`w-3.5 h-3.5 ${colorClass}`} />}
                  {hasVoted || isClosed
                    ? option.label
                    : isSelected
                    ? `✓ Tap again to confirm ${option.label}`
                    : isYes
                    ? "Vote Yes"
                    : "Vote No"}
                </span>
                {showBar && (
                  <span className={`font-mono text-sm font-semibold ${colorClass}`}>
                    {pct}%
                  </span>
                )}
              </div>
            </button>
          );
        })}

        {/* Terms clickwrap — show before confirmation */}
        {!hasVoted && !isClosed && selectedOptionId && (
          <div className="space-y-1.5 pt-1">
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="mt-0.5 rounded border-border"
              />
              <span className="text-[10px] text-muted-foreground leading-tight">
                By participating, you agree to the{" "}
                <a href="/documents/terms-of-use.pdf" target="_blank" rel="noopener noreferrer" className="text-primary underline hover:text-accent">
                  Terms of Use
                </a>.
              </span>
            </label>
            <p className="text-[10px] text-center text-muted-foreground animate-pulse">
              Tap your choice again to submit your forecast
            </p>
          </div>
        )}
      </div>

      {/* Forecast participation — COMING SOON */}
      {!isClosed && !PARTICIPATION_ENABLED && (
        <div className="mb-4 pt-3 border-t border-border">
          <div className="relative rounded-lg overflow-hidden">
            {/* Semi-blurred content — visible but not interactive */}
            <div className="filter blur-[1px] opacity-60 pointer-events-none select-none p-3 bg-muted/30">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-accent-foreground bg-accent px-1.5 py-0.5 rounded">
                    New
                  </span>
                  <p className="text-sm font-bold text-foreground">
                    Participate with a forecast allocation
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                {localOptions.map((option) => {
                  const consensusPct = totalVotes > 0 ? (option.total_votes_count / totalVotes).toFixed(2) : "0.50";
                  const isYes = option.label.toLowerCase() === "yes";
                  return (
                    <div
                      key={`preview-${option.id}`}
                      className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-md border-2 text-sm font-bold ${
                        isYes
                          ? "border-green-500 bg-green-500/10 text-green-600"
                          : "border-red-500 bg-red-500/10 text-red-500"
                      }`}
                    >
                      {isYes ? "Yes" : "No"} — ${consensusPct}
                    </div>
                  );
                })}
              </div>
            </div>
            {/* Coming soon badge */}
            <div className="absolute top-2 right-2 flex items-center gap-1.5 bg-card/95 backdrop-blur-sm border border-border rounded-full px-3 py-1.5 shadow-md">
              <Rocket className="w-3.5 h-3.5 text-accent" />
              <span className="text-xs font-bold text-foreground">Coming Soon</span>
            </div>
          </div>
          <div className="flex items-center justify-between mt-2">
            <p className="text-[10px] text-muted-foreground">
              Forecast participation with allocation is being built by our team.
            </p>
            <Button
              size="sm"
              variant="ghost"
              className="text-xs text-accent hover:text-accent hover:bg-accent/10 h-7 px-2"
              onClick={() => setWaitlistOpen(true)}
            >
              Get priority access →
            </Button>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <Users className="w-3 h-3" />
          {totalVotes} forecasts
        </span>
        {!compact && (
          <Link
            to={`/forecast-arena/${poll.slug}`}
            className="text-xs font-medium text-primary hover:text-accent transition-colors"
          >
            View details →
          </Link>
        )}
      </div>

      {isClosed && (
        <div className="flex items-center gap-1.5 mt-3 text-xs text-muted-foreground">
          <Lock className="w-3 h-3" />
          Forecasting closed
        </div>
      )}

      <TradingWaitlistModal open={waitlistOpen} onOpenChange={setWaitlistOpen} />
    </motion.div>
  );
};

export default PollCard;
