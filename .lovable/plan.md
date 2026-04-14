

# Plan: 3-Column Poll Voting Layout

## Summary
Restructure the poll voting area in PollCard.tsx from a 2-column grid + separate AI section below into a responsive 3-column layout (or 2-column when no AI predictions exist).

## Changes — Single file: `src/components/forecast/PollCard.tsx`

### 1. Update the grid container (line 331)
Change from `grid grid-cols-2 gap-3` to a dynamic grid based on whether AI predictions exist:
- With AI predictions: `grid grid-cols-1 md:grid-cols-[1.2fr_1fr_1fr] gap-3 items-start`
- Without AI predictions: `grid grid-cols-1 md:grid-cols-2 gap-3 items-start`

### 2. Move "What AI Thinks" inside the grid (lines 457-490)
Remove the separate `mt-2 pt-2 border-t` section that currently sits below the grid. Instead, place it as a third column inside the grid container (before the closing `</div>` of the grid at line 455).

The AI column will use the exact same visual structure as the "What Others Think" column:
- Same header pattern: Bot icon + "WHAT AI THINKS" + count
- Same bar layout: option label, count, percentage, bar
- Purple-toned bars (`bg-purple-500`) instead of green/blue
- Footer: "Independent AI predictions from verified models" in muted italic text

### 3. Mobile stacking
The `grid-cols-1` base ensures all 3 columns stack vertically on mobile in order: Vote → Humans → AI.

### 4. No other changes
- No changes to voting logic, data fetching, hooks, or any other component
- All existing functionality preserved (post-vote CTA, share buttons, bookmarks, etc.)

