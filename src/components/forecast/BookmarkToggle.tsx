import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface Props {
  pollId: string;
  size?: "sm" | "md";
  onRequireAuth?: () => void;
}

const BookmarkToggle = ({ pollId, size = "sm", onRequireAuth }: Props) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: isBookmarked = false } = useQuery({
    queryKey: ["bookmark", pollId, user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data } = await supabase
        .from("user_watchlist")
        .select("id")
        .eq("user_id", user.id)
        .eq("poll_id", pollId)
        .maybeSingle();
      return !!data;
    },
    enabled: !!user,
  });

  const toggle = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      onRequireAuth?.();
      return;
    }

    if (isBookmarked) {
      await supabase.from("user_watchlist").delete().eq("user_id", user.id).eq("poll_id", pollId);
      toast({ title: "Removed from watchlist" });
    } else {
      await supabase.from("user_watchlist").insert({ user_id: user.id, poll_id: pollId });
      toast({ title: "Added to watchlist", description: "You'll find this in your Watchlist page." });
    }
    queryClient.invalidateQueries({ queryKey: ["bookmark", pollId, user.id] });
    queryClient.invalidateQueries({ queryKey: ["watchlist", user.id] });
  }, [user, isBookmarked, pollId, queryClient, toast, onRequireAuth]);

  const iconSize = size === "sm" ? "w-3.5 h-3.5" : "w-4.5 h-4.5";

  return (
    <button
      onClick={toggle}
      className={`p-1 rounded transition-colors ${
        isBookmarked
          ? "text-primary hover:text-primary/80"
          : "text-muted-foreground/40 hover:text-muted-foreground"
      }`}
      title={isBookmarked ? "Remove from watchlist" : "Add to watchlist"}
    >
      {isBookmarked ? (
        <BookmarkCheck className={iconSize} />
      ) : (
        <Bookmark className={iconSize} />
      )}
    </button>
  );
};

export default BookmarkToggle;
