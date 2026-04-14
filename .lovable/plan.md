

# Poll Card Column Alignment Fix

## Problem
The three voting columns (Add Your Voice, What Humans Think, What AI Thinks) have inconsistent vertical alignment — the italic helper texts and CTA links don't sit on the same horizontal baseline across columns because content heights vary.

## Solution
Restructure each column to use a strict flex layout with `flex-1` on the content area and `mt-auto` on the footer. Wrap the footer (helper text + CTA) in a consistently-sized container with a fixed minimum height so all three footers align regardless of content above.

## Changes (single file: `src/components/forecast/PollCard.tsx`)

1. **Grid container**: Change `items-start` to `items-stretch` on the grid wrapper (line 331) so all columns stretch to equal height.

2. **Each column footer**: Ensure each column's footer div uses identical structure:
   - `mt-auto` pushes footer to the bottom
   - Fixed `min-h-[40px]` (or similar) on the footer ensures consistent height
   - Helper text and CTA link use identical spacing/sizing

3. **Column 1 (Add Your Voice)**: Already has `flex flex-col` and `mt-auto` — just verify `flex-1` is on the content area and footer has matching min-height.

4. **Column 2 (What Humans Think)**: Same structure — already has `flex flex-col` and `mt-auto`.

5. **Column 3 (What AI Thinks)**: Same structure — already has `flex flex-col` and `mt-auto`.

6. **Standardize footer spacing**: All three footer divs get the same classes: `mt-auto pt-2 border-t border-border space-y-1` with consistent text sizing.

## Technical Detail
The key fix is changing `items-start` → `items-stretch` on the grid, which forces all columns to the same height. Combined with `flex flex-col` + `mt-auto` on footers, this guarantees the helper text and CTAs align horizontally across all three columns like rows in a table.

