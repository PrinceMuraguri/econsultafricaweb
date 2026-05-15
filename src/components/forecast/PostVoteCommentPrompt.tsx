import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { X, MessageSquarePlus, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pollId: string;
  pollTitle: string;
  optionLabel: string;
  /** True when this user has actually committed (used for the holder badge). */
  isHolder?: boolean;
}

/**
 * Subtle post-vote nudge: "Tell the community why you think X will be Y".
 * Used after a Free vote OR a Pro stake/buy succeeds.
 */
const PostVoteCommentPrompt = ({
  open,
  onOpenChange,
  pollId,
  pollTitle,
  optionLabel,
  isHolder = false,
}: Props) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState(false);
  const [body, setBody] = useState("");
  const [posting, setPosting] = useState(false);

  const close = () => {
    onOpenChange(false);
    // Reset for next time
    setTimeout(() => {
      setExpanded(false);
      setBody("");
    }, 200);
  };

  const submit = async () => {
    if (!user || !body.trim()) return;
    setPosting(true);
    try {
      const { error } = await supabase.from("poll_comments").insert({
        poll_id: pollId,
        user_id: user.id,
        body: body.trim(),
        is_holder: isHolder,
      });
      if (error) throw error;
      toast({ title: "Comment posted", description: "Thanks for sharing your reasoning." });
      queryClient.invalidateQueries({ queryKey: ["poll-comments", pollId] });
      close();
    } catch {
      toast({ title: "Could not post", description: "Please try again.", variant: "destructive" });
    } finally {
      setPosting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? onOpenChange(true) : close())}>
      <DialogContent
        className="max-w-md p-0 gap-0 border-primary/20 [&>button]:hidden"
        onInteractOutside={(e) => {
          // Don't close when interacting with toast — but still allow backdrop click
          if (posting) e.preventDefault();
        }}
      >
        <div className="relative p-5">
          <button
            onClick={close}
            className="absolute top-2.5 right-2.5 text-muted-foreground hover:text-foreground transition-colors p-1 rounded-full hover:bg-muted"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-start gap-3 pr-6">
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <MessageSquarePlus className="w-4.5 h-4.5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-foreground leading-snug">
                Let the community know why you think{" "}
                <span className="font-semibold">"{pollTitle}"</span> will be{" "}
                <span className="font-semibold text-primary">{optionLabel}</span>.
              </p>
              <p className="text-[11px] text-muted-foreground mt-1">
                Your comment posts under your anonymous handle.
              </p>
            </div>
          </div>

          {!expanded ? (
            <div className="flex justify-end mt-4">
              <Button size="sm" onClick={() => setExpanded(true)} className="gap-1.5">
                <MessageSquarePlus className="w-3.5 h-3.5" /> Add comment
              </Button>
            </div>
          ) : (
            <div className="mt-4 space-y-2">
              <Textarea
                autoFocus
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Share your reasoning..."
                className="min-h-[90px] text-sm resize-none"
                maxLength={2000}
              />
              <div className="flex justify-end gap-2">
                <Button size="sm" variant="ghost" onClick={close} disabled={posting}>
                  Cancel
                </Button>
                <Button size="sm" onClick={submit} disabled={!body.trim() || posting} className="gap-1.5">
                  <Send className="w-3.5 h-3.5" /> Post
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PostVoteCommentPrompt;
