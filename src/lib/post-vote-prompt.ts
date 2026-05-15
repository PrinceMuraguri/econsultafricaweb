/**
 * Tiny sessionStorage signal so the post-vote "Why?" prompt can be raised
 * from anywhere (homepage card, modal) and consumed inside PollDiscussionTabs
 * on the poll detail page.
 */

const KEY = "postVoteCommentPrompt";

export interface PostVoteSignal {
  pollId: string;
  optionLabel: string;
  isHolder: boolean;
}

export function queuePostVotePrompt(signal: PostVoteSignal) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(signal));
  } catch {
    /* ignore */
  }
}

export function consumePostVotePrompt(pollId: string): PostVoteSignal | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PostVoteSignal;
    if (parsed.pollId !== pollId) return null;
    sessionStorage.removeItem(KEY);
    return parsed;
  } catch {
    return null;
  }
}
