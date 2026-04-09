

## Make Poll Options Vote Directly on Homepage

### Problem
When users click a poll option on the Forecast Arena homepage, it navigates them to the detail page instead of recording their vote. Users expect their click to count as a vote immediately.

### Solution
Change `interactionMode` from `"navigate"` (default) to `"vote"` on every `PollCard` rendered on the ForecastArena homepage. This is a one-line change per PollCard usage.

### Changes

**File: `src/pages/ForecastArena.tsx`** (1 change)

In the poll grid (around line 305), where `<PollCard poll={poll} ... />` is rendered, add `interactionMode="vote"`:

```tsx
<PollCard poll={poll} isTrending={!isSearching && i === 0} interactionMode="vote" />
```

This makes clicking an option on the homepage immediately record the vote (same behavior as the detail page). After voting, the nudge card appears with "Buy instantly" and "Browse peer offers" buttons — the user can then commit capital or navigate to the full detail page for history, charts, etc.

No other files need changing. The voting logic, auth gating, duplicate-vote prevention, and post-vote nudge card already work correctly in `"vote"` mode.

