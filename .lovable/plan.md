

## Goal

Stop Forecast Arena Pro from auto-highlighting historical Free votes as if they were Pro selections. Only carry over a Free vote when the user comes to Pro **immediately after** voting via a "Try Pro" CTA for that exact poll.

## Current behavior (the bug)

In `src/components/forecast/PollCardPro.tsx` (lines 160–170), on every Pro card mount we query the `votes` table for any vote (by `user.id` or `voter_fingerprint`) and set:
- `hasVoted = true`
- `votedOptionId = <the free vote's option>`

Those values drive the option button's `isSelected` styling (lines 377–391, the colored border + ring + tinted bg) and the small `— voted Yes/No` label (lines 360–367). Because the query is unconditional, **any historical Free vote** — even from days ago — appears as a pre-selection on Pro, making the user feel they've already chosen.

The user's intent: Pro is a separate, capital-based mechanic. A Free sentiment vote is not a Pro position and should not visually pre-fill Pro. Only a **just-now** Free vote, followed by an explicit "Try Pro" hand-off, should briefly reflect on Pro.

## Plan

### 1. Decouple Pro highlight from Free votes by default

In `PollCardPro.tsx`:
- Remove the unconditional `votes` lookup that sets `hasVoted` / `votedOptionId` from Free vote history.
- The Pro card's `isSelected` highlight should be driven **only** by Pro signals:
  - `userPositions` (user has shares in the option), or
  - `userStake` (user has a stake on Pro), or
  - The "just-voted hand-off" signal (see step 2).
- The "— voted Yes" sub-label next to "Back with capital" is also removed in the default case (since it implied Free vote = Pro selection). It will only show in the hand-off case below.

### 2. Add a one-shot "just-voted" hand-off from Free → Pro

The only legitimate carry-over is when a user votes on Free and *immediately* clicks "Try Pro" for the **same poll**. We pass that intent via React Router navigation state, never via a persistent DB lookup.

**On the Free side** (`src/components/forecast/PollCard.tsx`):
- Replace the static `<Link to="/forecast-arena-pro/...">Try Pro to commit capital</Link>` (line 419-423) with a `useNavigate()` call that:
  - Only runs when `hasVoted === true` AND `userVoteId` is known for this poll
  - Calls `navigate(`/forecast-arena-pro/${poll.slug}`, { state: { justVotedOptionId: <id>, justVotedAt: Date.now(), pollId: poll.id } })`
- If the user hasn't voted yet, the link still works as a plain navigation — Pro will simply show no selection.

**On the Pro side** (`PollCardPro.tsx` and `src/pages/ForecastPollDetailPro.tsx`):
- Read `useLocation().state` once on mount.
- If `state?.justVotedOptionId` exists AND `state.pollId === poll.id` AND `state.justVotedAt` is within the last ~60 seconds, set `votedOptionId` and `hasVoted` from that state (so the option highlights and the "— voted X" sub-label appears).
- Then immediately clear it via `navigate(location.pathname, { replace: true, state: {} })` so a page refresh doesn't keep showing the highlight forever.
- Result: the highlight is a one-time, contextual hand-off, not a persistent inheritance.

### 3. Keep all Pro-native selection logic intact

The existing visual selection rules stay for genuinely Pro-derived state:
- Owning shares in an option (`userPositions`) → highlighted.
- Having a stake recorded with `is_staked = true` on the Pro flow → highlighted.
- Active P2P listing for the option → unchanged.

Nothing in the StakeModal flow, listings, P2P, or AMM math changes.

### 4. No DB / migration changes

Pure frontend behavior change. No schema, RLS, or edge function edits.

## Files to edit

1. `src/components/forecast/PollCardPro.tsx`
   - Remove the `votes` table lookup that seeds `hasVoted` / `votedOptionId`.
   - Add a `useLocation()` reader for the one-shot `justVotedOptionId` hand-off (with timestamp + pollId guard, then `replace`).
   - Tighten `isSelected` to depend only on Pro positions + the hand-off signal.

2. `src/components/forecast/PollCard.tsx`
   - Convert the inline "Try Pro to commit capital →" link into a `useNavigate()` button that passes `{ justVotedOptionId, justVotedAt, pollId }` in router state when the user has just voted on this poll.

3. `src/pages/ForecastPollDetailPro.tsx`
   - No structural changes; the `PollCardPro` it renders will pick up the router state directly. (Listed only because it's the entry point for the Pro detail view that consumes the hand-off.)

## Acceptance criteria

- A user with an old Free vote on poll X who navigates to `/forecast-arena-pro/X` sees **no pre-selected option** (unless they hold a Pro position).
- A user who votes Yes on Free poll X and immediately clicks "Try Pro" on that same poll lands on Pro with **Yes highlighted** and the "— voted Yes" label, exactly once.
- Refreshing the Pro page after the hand-off clears the highlight (since router state is wiped).
- Navigating directly to a Pro poll URL never inherits a Free vote.
- Users who own Pro shares still see their option highlighted, as today.

