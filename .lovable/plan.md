
# Post-vote comment prompt + anonymized handles + comment voting

Three connected pieces, applied to both Forecast Arena Free and Pro.

---

## 1. Post-vote "Why?" prompt

A small modal that appears immediately after a human commits a choice.

**When it fires**
- **Free arena** — after `PollCard.handleVote` succeeds (the toast "🎯 Forecast recorded" point).
- **Pro arena** — after `StakeModal` confirms a stake, and after `TradingPanel` / `buy-shares` returns success. (First commitment per poll only — we won't re-prompt every trade.)

**What it shows**
```
┌──────────────────────────────────────────── X ┐
│  Let the community know why you think         │
│  "<poll title>" will be <selected option>     │
│                                               │
│  [ Add comment ]                              │
└───────────────────────────────────────────────┘
```
- Click **Add comment** → expands inline into a textarea + Post button (reuses the same insert path as `PollDiscussionTabs`, writing to `poll_comments` with `is_holder = true` since the user just committed).
- Click **X** (top-right) or backdrop → dismisses. We remember dismissal per `(user, poll)` in `localStorage` so it doesn't re-prompt on the next page view.
- Subtle styling: small centered card, no full-screen overlay block — uses `Dialog` with `max-w-md` so it never blanks the screen.

**New file:** `src/components/forecast/PostVoteCommentPrompt.tsx`
**Wired into:** `PollCard.tsx`, `StakeModal.tsx`, `TradingPanel.tsx`.

---

## 2. Anonymized "userXXXX" display handles

**Problem:** `user_profiles.username` is currently seeded from email local-part or self-chosen, so it can leak real names in the comment thread.

**Fix:** introduce a separate **display handle** used everywhere comments / public activity render — never replace `username` itself (it's used for profile URLs and many other places, and changing it is risky).

**Schema change** (migration):
- Add `user_profiles.display_handle text unique`.
- Backfill: `'user' || lpad((floor(random()*9000)+1000)::text, 4, '0')` with a uniqueness retry, for every existing row.
- Trigger on insert: auto-generate `display_handle` if null.

**Code change:**
- `PollDiscussionTabs.tsx` selects and renders `display_handle` instead of `username` / `full_name` initial.
- Avatar initial becomes the last digit of the handle (or a generic icon).
- Profile link `/profile/:handle` now resolves by `display_handle` — `UserProfile.tsx` query updated to look up by `display_handle` first, falling back to `username` for back-compat.
- Top-holders / activity feed sections in the same file also switched to `display_handle`.

I'm **not** changing the user's own dashboard / settings — they still see their real name there.

---

## 3. Reddit-style upvote / downvote on comments

**Schema change** (same migration):

```sql
create table comment_votes (
  id uuid primary key default gen_random_uuid(),
  comment_id uuid not null references poll_comments(id) on delete cascade,
  user_id uuid not null,
  value smallint not null check (value in (-1, 1)),
  created_at timestamptz not null default now(),
  unique (comment_id, user_id)
);
alter table comment_votes enable row level security;

-- read: public; insert/update/delete: own row only
create policy cv_read on comment_votes for select using (true);
create policy cv_write on comment_votes for insert with check (auth.uid() = user_id);
create policy cv_update on comment_votes for update using (auth.uid() = user_id);
create policy cv_delete on comment_votes for delete using (auth.uid() = user_id);

-- denormalized score on poll_comments for cheap sorting
alter table poll_comments
  add column upvotes int not null default 0,
  add column downvotes int not null default 0,
  add column score int not null default 0;

-- trigger keeps counts in sync on insert/update/delete of comment_votes
```

A `recompute_comment_score()` trigger updates `upvotes / downvotes / score` on the parent comment whenever `comment_votes` changes.

**UI** (in `PollDiscussionTabs.tsx`, on each comment + reply row):
- Left rail with ▲ score ▼ (orange when active up, blue when active down, muted otherwise).
- Click ▲ → upserts `value=+1`; click again → deletes (toggle off). Same for ▼. Switching sides replaces the row.
- Anonymous users: clicking either arrow opens the existing login modal.
- Sort dropdown: **Top** (default, by `score desc`), **New** (by `created_at desc`).
- Auto-collapse comments with `score <= -4` behind a "Show comment" link, matching Reddit's threshold.

Voting itself stays anonymous — we never show *who* voted, only the totals.

---

## Files

**New**
- `src/components/forecast/PostVoteCommentPrompt.tsx`
- `src/components/forecast/CommentVoteButtons.tsx`

**Edited**
- `src/components/forecast/PollCard.tsx` — fire prompt after Free vote.
- `src/components/forecast/StakeModal.tsx` — fire prompt after Pro stake.
- `src/components/forecast/TradingPanel.tsx` — fire prompt after first Buy.
- `src/components/forecast/PollDiscussionTabs.tsx` — render `display_handle`, mount `CommentVoteButtons`, add Top/New sort, collapsed-comment behaviour.
- `src/pages/UserProfile.tsx` — resolve route param by `display_handle` with `username` fallback.

**Migration**
- `display_handle` column + backfill + insert trigger.
- `comment_votes` table + RLS + score trigger on `poll_comments`.

---

## Open questions (sensible defaults applied unless you say otherwise)

1. **Pro re-prompts on every trade?** Default: **no — only the first commitment per poll** (we check for an existing position/comment by this user on this poll). Tell me if you want it on every buy.
2. **Handle format.** Default: `userNNNN` (4 digits, e.g. `user4821`). I can switch to `user` + 4 alphanumeric (`user7k2x`) — slightly larger keyspace, similar feel.
3. **Existing usernames.** Left untouched in the DB; only the *display* in comments switches to the new handle. Profile URLs migrate to the handle but keep a fallback so old links still work.
