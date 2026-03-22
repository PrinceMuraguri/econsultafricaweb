import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Clock, Users, Lock, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { getFingerprint } from "@/lib/fingerprint";
import { useToast } from "@/hooks/use-toast";
import type { Poll } from "@/hooks/use-polls";

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
  const [localOptions, setLocalOptions] = useState(poll.poll_options);

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
      // Increment count
      await supabase.rpc("increment_vote_count", { p_option_id: optionId });
      setHasVoted(true);
      setVotedOptionId(optionId);
      setLocalOptions(prev =>
        prev.map(o => o.id === optionId ? { ...o, total_votes_count: o.total_votes_count + 1 } : o)
      );
      toast({ title: "Position locked", description: "Your forecast has been recorded." });
    } catch {
      toast({ title: "Error", description: "Could not record vote. Try again.", variant: "destructive" });
    } finally {
      setVoting(false);
    }
  };

  // Subscribe to realtime updates
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

      {/* Voting bars */}
      <div className="space-y-2 mb-4 flex-1">
        {localOptions.map((option) => {
          const pct = totalVotes > 0 ? Math.round((option.total_votes_count / totalVotes) * 100) : 50;
          const isYes = option.label.toLowerCase() === "yes";
          const isVoted = votedOptionId === option.id;

          return (
            <button
              key={option.id}
              onClick={() => handleVote(option.id)}
              disabled={hasVoted || voting || isClosed}
              className={`w-full relative overflow-hidden rounded-md border transition-all text-left ${
                isVoted
                  ? "border-accent ring-1 ring-accent/30"
                  : hasVoted || isClosed
                  ? "border-border cursor-default"
                  : "border-border hover:border-primary/40 cursor-pointer"
              }`}
            >
              <div
                className={`absolute inset-0 transition-all ${
                  isYes ? "bg-primary/10" : "bg-accent/10"
                }`}
                style={{ width: `${pct}%` }}
              />
              <div className="relative flex items-center justify-between px-3 py-2">
                <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                  {isVoted && <Check className="w-3.5 h-3.5 text-accent" />}
                  {option.label}
                </span>
                <span className="font-mono text-sm font-semibold text-foreground">
                  {pct}%
                </span>
              </div>
            </button>
          );
        })}
      </div>

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
    </motion.div>
  );
};

export default PollCard;
