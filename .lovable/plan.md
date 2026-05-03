## Root cause

The homepage (`/`) goes blank a few seconds after loading because the page **crashes after data loads**, not because of demo/Pro mode.

In the network log, one of the active polls is:

```
title: "Will tomorrow be sunny?"
category: ""   ← empty string
```

In `src/pages/ForecastArena.tsx` (line 90–93) the category filter is built from distinct poll categories:

```ts
const categories = useMemo(() => {
  if (!polls) return ["All"];
  return ["All", ...[...new Set(polls.map(p => p.category))].sort()];
}, [polls]);
```

This produces `["All", "", "Capital Markets...", ...]`. Each entry is rendered as a Radix `<SelectItem value={cat}>`. Radix throws a hard error when `value=""`:

> `A <Select.Item /> must have a value prop that is not an empty string.`

This matches the runtime error in the console and the React component stack ending at `ForecastArena → Layout → Select`. Because there is no error boundary, the whole tree unmounts → blank white screen. This started "a few hours ago" because that test poll was created today (2026-05-03 03:58 UTC).

It is unrelated to Pro/demo mode switching.

## Fix

1. **`src/pages/ForecastArena.tsx`** — when building `categories`, filter out empty/null/whitespace categories so no `SelectItem` ever gets `value=""`:
   ```ts
   const categories = useMemo(() => {
     if (!polls) return ["All"];
     const unique = [...new Set(
       polls.map(p => (p.category || "").trim()).filter(Boolean)
     )].sort();
     return ["All", ...unique];
   }, [polls]);
   ```
   Also harden `filteredPolls` so a poll with no category isn't dropped unexpectedly when "All" is selected (it already isn't, since we only filter when `selectedCategory !== "All"`, but confirm `(p.category || "")` comparison stays safe).

2. **Quick data hygiene** (optional but recommended): in the admin Poll Manager, give the test poll "Will tomorrow be sunny?" a real category (or delete it) so the dropdown isn't missing the question. The code fix above is what stops the crash; this is just cleanup.

3. **Defensive guard** — add a tiny check inside any other place that maps DB strings into `<SelectItem value={…}>` to skip empty values. I'll grep `src/` for other `SelectItem` lists fed by DB data (e.g. country/category dropdowns elsewhere) and apply the same `.filter(Boolean)` pattern where needed. No behavior change for non-empty values.

No DB migration, no edge-function change, no Pro/demo logic touched.

## Why this is the right fix

- The exact Radix error in your console (`<Select.Item /> must have a value prop that is not an empty string`) maps 1:1 to the empty `category` returned by the `polls` query.
- The crash happens **after** the polls fetch resolves (a few seconds in), which matches your "loads, then goes blank" symptom.
- Filtering empties at the source is the standard fix and keeps the dropdown clean.