import { useEffect, useState } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

interface Props {
  commentId: string;
  initialScore: number;
  /** Open the login modal when an anonymous visitor tries to vote. */
  onRequireAuth: () => void;
  /** Compact size for replies. */
  size?: "sm" | "md";
}

/**
 * Reddit-style up/down vote rail. Clicking the same arrow toggles off.
 * Optimistic updates locally; the recompute_comment_score trigger refreshes
 * authoritative totals on the next list refetch.
 */
const CommentVoteButtons = ({ commentId, initialScore, onRequireAuth, size = "md" }: Props) => {
  const { user } = useAuth();
  const [score, setScore] = useState(initialScore);
  const [myValue, setMyValue] = useState<-1 | 0 | 1>(0);
  const [busy, setBusy] = useState(false);

  // Keep score in sync if the parent refetches and passes a new value
  useEffect(() => setScore(initialScore), [initialScore]);

  // Load this user's existing vote (if any)
  useEffect(() => {
    if (!user) {
      setMyValue(0);
      return;
    }
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("comment_votes")
        .select("value")
        .eq("comment_id", commentId)
        .eq("user_id", user.id)
        .maybeSingle();
      if (!cancelled) setMyValue(((data?.value as -1 | 1) ?? 0));
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id, commentId]);

  const cast = async (next: 1 | -1) => {
    if (!user) {
      onRequireAuth();
      return;
    }
    if (busy) return;
    setBusy(true);

    const previous = myValue;
    const target = previous === next ? 0 : next; // toggle off on same-arrow click
    const delta = target - previous;

    // Optimistic
    setMyValue(target);
    setScore((s) => s + delta);

    try {
      if (target === 0) {
        await supabase.from("comment_votes").delete()
          .eq("comment_id", commentId).eq("user_id", user.id);
      } else {
        await supabase.from("comment_votes").upsert(
          { comment_id: commentId, user_id: user.id, value: target, updated_at: new Date().toISOString() },
          { onConflict: "comment_id,user_id" },
        );
      }
    } catch {
      // Roll back optimistic state
      setMyValue(previous);
      setScore((s) => s - delta);
    } finally {
      setBusy(false);
    }
  };

  const iconSize = size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5";
  const textSize = size === "sm" ? "text-[10px]" : "text-[11px]";

  return (
    <div className="inline-flex items-center gap-0.5">
      <button
        onClick={() => cast(1)}
        aria-label="Upvote"
        className={cn(
          "p-0.5 rounded hover:bg-accent/10 transition-colors",
          myValue === 1 ? "text-accent" : "text-muted-foreground hover:text-accent",
        )}
      >
        <ChevronUp className={iconSize} strokeWidth={2.5} />
      </button>
      <span
        className={cn(
          "font-mono tabular-nums min-w-[1.25rem] text-center",
          textSize,
          myValue === 1 ? "text-accent" : myValue === -1 ? "text-primary" : "text-muted-foreground",
        )}
      >
        {score}
      </span>
      <button
        onClick={() => cast(-1)}
        aria-label="Downvote"
        className={cn(
          "p-0.5 rounded hover:bg-primary/10 transition-colors",
          myValue === -1 ? "text-primary" : "text-muted-foreground hover:text-primary",
        )}
      >
        <ChevronDown className={iconSize} strokeWidth={2.5} />
      </button>
    </div>
  );
};

export default CommentVoteButtons;
