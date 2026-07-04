import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { Clock, Users, Check, X as XIcon, Trophy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCastVote } from "@/hooks/use-cast-vote";
import { getFingerprint } from "@/lib/fingerprint";
import type { Poll, PollOption } from "@/hooks/use-polls";

interface MatchPollCardProps {
  poll: Poll;
}

function formatKickoff(closeAt: string) {
  const d = new Date(closeAt);
  const diff = d.getTime() - Date.now();
  const abs = new Intl.DateTimeFormat(undefined, {
    weekday: "short", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit", timeZoneName: "short",
  }).format(d);
  if (diff <= 0) return { abs, countdown: "Kicked off" };
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff / 3600000) % 24);
  const mins = Math.floor((diff / 60000) % 60);
  const countdown = days > 0 ? `${days}d ${hours}h` : hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  return { abs, countdown };
}

const MatchPollCard = ({ poll }: MatchPollCardProps) => {
  const { castVote, voting } = useCastVote();
  const [options, setOptions] = useState<PollOption[]>(poll.poll_options);
  const [votedOptionId, setVotedOptionId] = useState<string | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [justVoted, setJustVoted] = useState(false);

  useEffect(() => setOptions(poll.poll_options), [poll.poll_options]);

  // Detect prior vote by fingerprint (anonymous)
  useEffect(() => {
    (async () => {
      const fp = await getFingerprint();
      const { data } = await supabase
        .from("votes").select("option_id")
        .eq("poll_id", poll.id).eq("voter_fingerprint", fp)
        .maybeSingle();
      if (data) { setHasVoted(true); setVotedOptionId(data.option_id); }
    })();
  }, [poll.id]);

  // Realtime probability updates
  useEffect(() => {
    const channel = supabase
      .channel(`wc-poll-options-${poll.id}`)
      .on("postgres_changes",
        { event: "UPDATE", schema: "public", table: "poll_options", filter: `poll_id=eq.${poll.id}` },
        (payload) => {
          const u = payload.new as { id: string; total_votes_count: number };
          setOptions(prev => prev.map(o => o.id === u.id ? { ...o, total_votes_count: u.total_votes_count } : o));
        })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [poll.id]);

  const meta = (poll.metadata || {}) as Record<string, any>;
  const stage = meta.stage || "Match";
  const kickoff = formatKickoff(poll.close_at);
  const isClosed = poll.status !== "active" || new Date(poll.close_at) <= new Date();
  const totalVotes = options.reduce((s, o) => s + o.total_votes_count, 0);

  const leading = useMemo(() => {
    if (totalVotes === 0) return null;
    return options.reduce((b, o) => (o.total_votes_count > b.total_votes_count ? o : b), options[0]);
  }, [options, totalVotes]);

  const winningId = poll.winning_option_id || null;
  const communityCorrect = winningId && leading && leading.id === winningId;

  const handleClick = async (optionId: string) => {
    if (hasVoted || voting || isClosed) return;
    const res = await castVote(poll.id, optionId);
    if (res.success) {
      setHasVoted(true);
      setVotedOptionId(optionId);
      setOptions(prev => prev.map(o => o.id === optionId ? { ...o, total_votes_count: o.total_votes_count + 1 } : o));
      setJustVoted(true);
      setTimeout(() => setJustVoted(false), 1600);
      confetti({ particleCount: 60, spread: 65, origin: { y: 0.7 } });
    } else if (res.already) {
      setHasVoted(true);
    }
  };

  // Alternating team colours for the 2 team options in R16
  const optionAccent = (i: number, label: string) => {
    if (label.toLowerCase() === "draw") return { bar: "bg-slate-400", text: "text-slate-700", ring: "ring-slate-400/40" };
    return i === 0
      ? { bar: "bg-blue-600", text: "text-blue-700", ring: "ring-blue-500/40" }
      : { bar: "bg-red-600", text: "text-red-700", ring: "ring-red-500/40" };
  };

  return (
    <motion.div
      whileHover={{ y: -3 }}
      className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#0b1e3f] via-[#0e2554] to-[#132d66] text-white p-4 shadow-xl shadow-black/30 relative overflow-hidden"
    >
      {/* Pitch stripes accent */}
      <div className="absolute inset-0 opacity-[0.06] pointer-events-none"
        style={{ backgroundImage: "repeating-linear-gradient(90deg,#22c55e 0 20px,transparent 20px 40px)" }} />

      {/* Header */}
      <div className="relative flex items-center justify-between mb-3">
        <span className="text-[10px] font-black uppercase tracking-widest bg-amber-400 text-amber-950 px-2 py-0.5 rounded">
          {stage}
        </span>
        <span className="flex items-center gap-1 text-[11px] text-white/70 font-medium">
          <Clock className="w-3 h-3" />
          {isClosed ? (winningId ? "Final" : "Kicked off") : `Kicks off in ${kickoff.countdown}`}
        </span>
      </div>

      {/* Match title */}
      <div className="relative mb-3">
        <div className="grid grid-cols-3 items-center gap-2">
          {options.slice(0, 3).map((o, i) => {
            if (options.length === 2 && i === 1) return null;
            return null;
          })}
        </div>
        <div className="flex items-center justify-center gap-3">
          {options[0] && (
            <div className="flex flex-col items-center flex-1 min-w-0">
              {options[0].image_url && (
                <img src={options[0].image_url} alt={options[0].label} loading="lazy"
                  className="w-12 h-8 object-cover rounded shadow ring-1 ring-white/20 mb-1" />
              )}
              <span className="text-sm font-bold truncate max-w-full">{options[0].label}</span>
            </div>
          )}
          <span className="text-lg font-black text-white/50 shrink-0">VS</span>
          {options[options.length - 1] && options.length > 1 && (
            <div className="flex flex-col items-center flex-1 min-w-0">
              {options[options.length - 1].image_url && (
                <img src={options[options.length - 1].image_url} alt={options[options.length - 1].label} loading="lazy"
                  className="w-12 h-8 object-cover rounded shadow ring-1 ring-white/20 mb-1" />
              )}
              <span className="text-sm font-bold truncate max-w-full">{options[options.length - 1].label}</span>
            </div>
          )}
        </div>
        <p className="text-[11px] text-white/50 text-center mt-1">{kickoff.abs}{meta.stadium ? ` · ${meta.stadium}` : ""}</p>
      </div>

      {/* Community result badge for completed matches */}
      {isClosed && winningId && (
        <div className={`relative flex items-center justify-center gap-1.5 text-[11px] font-bold rounded-lg py-1.5 mb-3 ${
          communityCorrect ? "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/30"
                           : "bg-rose-500/15 text-rose-300 ring-1 ring-rose-400/30"
        }`}>
          {communityCorrect ? <Check className="w-3.5 h-3.5" /> : <XIcon className="w-3.5 h-3.5" />}
          {communityCorrect ? "Community predicted correctly" : "Community prediction was incorrect"}
          {meta.result_note && <span className="font-normal text-white/70 ml-1">· {meta.result_note}</span>}
        </div>
      )}

      {/* Vote buttons + bars */}
      <div className="relative space-y-2">
        <AnimatePresence>
          {justVoted && (
            <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="flex items-center justify-center gap-1.5 py-1 rounded-md bg-emerald-500/15 border border-emerald-400/30">
              <Check className="w-3 h-3 text-emerald-300" />
              <span className="text-[10px] font-semibold text-emerald-300">Prediction recorded</span>
            </motion.div>
          )}
        </AnimatePresence>

        {options.map((o, i) => {
          const pct = totalVotes > 0 ? Math.round((o.total_votes_count / totalVotes) * 100) : 0;
          const accent = optionAccent(i, o.label);
          const isVoted = votedOptionId === o.id;
          const isWinner = winningId === o.id;
          const disabled = hasVoted || voting || isClosed;
          return (
            <button
              key={o.id}
              type="button"
              onClick={() => handleClick(o.id)}
              disabled={disabled}
              aria-label={`Vote ${o.label}. Currently ${pct}% of votes.`}
              className={`relative w-full text-left rounded-lg border overflow-hidden transition-all ${
                isVoted ? `border-white ${accent.ring} ring-2` : "border-white/15 hover:border-white/40"
              } ${disabled ? "cursor-default" : "cursor-pointer"} bg-white/5 backdrop-blur-sm`}
            >
              <motion.div
                className={`absolute inset-y-0 left-0 ${accent.bar} opacity-30`}
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                aria-hidden
              />
              <div className="relative flex items-center gap-2 px-3 py-2">
                {o.image_url && (
                  <img src={o.image_url} alt="" loading="lazy" className="w-6 h-4 object-cover rounded-sm ring-1 ring-white/20" />
                )}
                <span className="text-sm font-semibold flex-1 truncate flex items-center gap-1.5">
                  {o.label}
                  {isWinner && <Trophy className="w-3.5 h-3.5 text-amber-400" />}
                </span>
                <span className="text-sm font-mono font-bold tabular-nums">{pct}%</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Footer stats */}
      <div className="relative flex items-center justify-between mt-3 pt-2 border-t border-white/10">
        <span className="flex items-center gap-1 text-[11px] text-white/60">
          <Users className="w-3 h-3" /> {totalVotes.toLocaleString()} predictions
        </span>
        {isClosed && !winningId && <span className="text-[10px] text-white/50 font-semibold">Voting closed — kickoff</span>}
        {!isClosed && hasVoted && (
          <span className="text-[10px] text-emerald-300 font-semibold">You voted</span>
        )}
      </div>
    </motion.div>
  );
};

export default MatchPollCard;
