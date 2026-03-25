import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, Users, Lock, Check, DollarSign, HelpCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { getFingerprint } from "@/lib/fingerprint";
import { useToast } from "@/hooks/use-toast";
import StakeModal from "./StakeModal";
import HowItWorksModal from "./HowItWorksModal";
import type { Poll, PollOption } from "@/hooks/use-polls";

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
  const [stakeOpen, setStakeOpen] = useState(false);
  const [stakeOption, setStakeOption] = useState<PollOption | null>(null);
  const [howItWorksOpen, setHowItWorksOpen] = useState(false);
  const [justVoted, setJustVoted] = useState(false);

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
          toast({ title: "Already voted", description: "You've already taken a position on this poll.", variant: "destructive" });
          setHasVoted(true);
          return;
        }
        throw error;
      }
      await supabase.rpc("increment_vote_count", { p_option_id: optionId });

      // Show "updating" state briefly for dopamine
      setJustVoted(true);
      setTimeout(() => setJustVoted(false), 1500);

      setHasVoted(true);
      setVotedOptionId(optionId);
      setLocalOptions(prev =>
        prev.map(o => o.id === optionId ? { ...o, total_votes_count: o.total_votes_count + 1 } : o)
      );
      toast({ title: "🎯 Position locked!", description: "Your forecast is in. The market just moved." });
    } catch {
      toast({ title: "Error", description: "Could not record vote. Try again.", variant: "destructive" });
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

      {/* "What people are saying" label before voting */}
      {!hasVoted && !isClosed && totalVotes > 0 && (
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1.5">
          📊 What people are saying so far
        </p>
      )}

      {/* Updating votes overlay */}
      <AnimatePresence>
        {justVoted && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center justify-center gap-2 py-3 mb-2 rounded-md bg-accent/10 border border-accent/20"
          >
            <Loader2 className="w-4 h-4 text-accent animate-spin" />
            <span className="text-sm font-semibold text-accent">Updating market data...</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Voting bars */}
      <div className="space-y-2 mb-4 flex-1">
        {localOptions.map((option) => {
          const pct = totalVotes > 0 ? Math.round((option.total_votes_count / totalVotes) * 100) : 50;
          const isYes = option.label.toLowerCase() === "yes";
          const isVoted = votedOptionId === option.id;
          const isSelected = selectedOptionId === option.id;
          const canVote = !hasVoted && !voting && !isClosed;

          return (
            <button
              key={option.id}
              onClick={() => handleVote(option.id)}
              disabled={hasVoted || voting || isClosed}
              className={`w-full relative overflow-hidden rounded-md border-2 transition-all text-left ${
                isVoted
                  ? "border-accent ring-2 ring-accent/30 bg-accent/5"
                  : isSelected
                  ? "border-primary ring-2 ring-primary/30 bg-primary/5"
                  : canVote
                  ? "border-border hover:border-primary/50 cursor-pointer"
                  : "border-border cursor-default"
              }`}
            >
              {/* Only show progress bar if voted or closed */}
              {(hasVoted || isClosed) && (
                <div
                  className={`absolute inset-0 transition-all duration-700 ${
                    isYes ? "bg-primary/10" : "bg-accent/10"
                  }`}
                  style={{ width: `${pct}%` }}
                />
              )}
              <div className="relative flex items-center justify-between px-3 py-2.5">
                <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                  {isVoted && <Check className="w-3.5 h-3.5 text-accent" />}
                  {hasVoted || isClosed
                    ? option.label
                    : isSelected
                    ? `✓ Tap again to confirm ${option.label}`
                    : `Vote ${option.label}`}
                </span>
                <span className="font-mono text-sm font-semibold text-foreground">
                  {hasVoted || isClosed ? `${pct}%` : ""}
                </span>
              </div>
            </button>
          );
        })}
        {!hasVoted && !isClosed && selectedOptionId && (
          <p className="text-[10px] text-center text-muted-foreground animate-pulse">
            Tap your choice again to lock in your forecast
          </p>
        )}
      </div>

      {/* Buy shares CTA — always visible after voting or before */}
      {!isClosed && (
        <div className="mb-4 pt-2 border-t border-border">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-muted-foreground font-medium">
              {hasVoted ? "Back your forecast — buy shares:" : "Or buy shares in your prediction:"}
            </p>
            <button
              onClick={() => setHowItWorksOpen(true)}
              className="flex items-center gap-1 text-[10px] text-primary hover:text-accent transition-colors"
            >
              <HelpCircle className="w-3 h-3" />
              How it works
            </button>
          </div>
          <div className="flex gap-2">
            {localOptions.map((option) => {
              const sharePrice = totalVotes > 0 ? (option.total_votes_count / totalVotes).toFixed(2) : "0.50";
              return (
                <motion.button
                  key={`stake-${option.id}`}
                  onClick={() => { setStakeOption(option); setStakeOpen(true); }}
                  animate={{
                    scale: [1, 1.03, 1],
                    boxShadow: [
                      "0 0 0 0 rgba(var(--accent), 0)",
                      "0 0 12px 4px hsl(var(--accent) / 0.3)",
                      "0 0 0 0 rgba(var(--accent), 0)"
                    ]
                  }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-md border-2 border-accent bg-accent/10 text-accent hover:bg-accent hover:text-accent-foreground transition-colors text-xs font-bold"
                >
                  <DollarSign className="w-3.5 h-3.5" />
                  Buy {option.label} ${sharePrice}
                </motion.button>
              );
            })}
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
          Voting closed
        </div>
      )}

      <StakeModal
        open={stakeOpen}
        onOpenChange={setStakeOpen}
        poll={poll}
        selectedOption={stakeOption}
      />
      <HowItWorksModal
        open={howItWorksOpen}
        onOpenChange={setHowItWorksOpen}
      />
    </motion.div>
  );
};

export default PollCard;
