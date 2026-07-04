import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getFingerprint } from "@/lib/fingerprint";
import { useToast } from "@/hooks/use-toast";

/**
 * Shared anonymous vote engine used by both the economics PollCard and the
 * football MatchPollCard. Reuses the existing `votes` table, `voter_fingerprint`
 * dedupe path, and `increment_vote_count` RPC — one engine, many surfaces.
 */
export function useCastVote() {
  const { toast } = useToast();
  const [voting, setVoting] = useState(false);

  const castVote = async (pollId: string, optionId: string): Promise<{ success: boolean; already?: boolean }> => {
    if (voting) return { success: false };
    setVoting(true);
    try {
      const fp = await getFingerprint();
      const { error } = await supabase
        .from("votes")
        .insert({ poll_id: pollId, option_id: optionId, voter_fingerprint: fp, user_id: null });
      if (error) {
        if (error.code === "23505") {
          toast({ title: "Already voted", description: "You've already voted in this match.", variant: "destructive" });
          return { success: false, already: true };
        }
        throw error;
      }
      await supabase.rpc("increment_vote_count", { p_option_id: optionId });
      return { success: true };
    } catch {
      toast({ title: "Error", description: "Could not record vote. Try again.", variant: "destructive" });
      return { success: false };
    } finally {
      setVoting(false);
    }
  };

  return { castVote, voting };
}
