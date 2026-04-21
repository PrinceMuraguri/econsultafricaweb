

## Pro Tier Feature Flag — Scaffold

Add a single hardcoded constant `PRO_ENABLED` that gates every Forecast Arena Pro surface across the Free tier without affecting Free behavior. Initial value is `true` (no behavior change). Flipping to `false` cleanly hides the Pro nav link, redirects Pro routes to a "paused" landing page, and removes every Pro upsell across the Free tier.

Every guard added is tagged with an inline `// Pro flag:` comment so future edits recognize and preserve them.

### New files

1. **`src/lib/features.ts`** — exports `export const PRO_ENABLED = true;` with documentation comments. Single source of truth.
2. **`src/pages/ProPaused.tsx`** — landing page rendered on `/forecast-arena-pro*` when the flag is off. Explains the pause, reassures wallet balances are safe, and links back to Free Arena and Contact.
3. **`FEATURE_FLAGS.md`** (project root) — operator documentation: how to toggle, what gets gated, what's intentionally not gated yet, and the known client-side-only limitation.

### Edits (all conditionals tagged `// Pro flag:`)

4. **`src/App.tsx`** — import `ProPaused` and `PRO_ENABLED`; wrap the two Pro routes so they conditionally render `ProPaused` when off. Imports for `ForecastArenaPro` / `ForecastPollDetailPro` are kept so re-enabling is a one-line flip.
5. **`src/components/Navbar.tsx`** — replace the static `navLinks` array with a conditional that omits the Pro entry when off. Rendering logic untouched.
6. **`src/pages/ForecastArena.tsx`** — wrap (a) the amber "Upgrade to Pro" cross-promotion banner under the hero and (b) the "🚀 Want to go further? Try Forecast Arena Pro" line inside the hero's expandable details.
7. **`src/components/forecast/PollCard.tsx`** — wrap (a) the inline "Try Pro to commit capital →" link under the vote box and (b) the post-vote amber "Want to back your forecast with real capital?" card. Restructure the post-vote block so the amber card is gated but the "Share your view" row beneath it remains unconditional.
8. **`src/pages/ForecastPollDetail.tsx`** — wrap the amber "Forecast Arena Pro — Capital Markets / Trade Pro →" banner.
9. **`src/components/forecast/ForecastWidget.tsx`** — wrap the "💰 Try Pro — back forecasts with capital" footer link in the floating widget.

### Files intentionally NOT touched (Round 1 scope)

`ForecastArenaPro.tsx`, `ForecastPollDetailPro.tsx`, `StakeResult.tsx`, `UserProfile.tsx`, `MyDashboard.tsx`, `PollCardPro.tsx`, `ProTradingTab.tsx`, `FreeForecastsTab.tsx`. These live inside Pro territory; the route-level redirect is sufficient for now. Component-level guards and Edge Function server-side guards are deferred to a follow-up.

### Acceptance check

- **Flag ON (default):** every current Pro surface renders identically — no visual change. Verified by visiting homepage, a Free poll detail, the floating widget, and the Pro routes.
- **Flag OFF:** Pro nav link gone (desktop + mobile), Pro routes show ProPaused, all 6 Free-tier upsells gone, "Share your view" row still present after voting on a Free poll.

### Known limitation (documented in FEATURE_FLAGS.md)

This is a client-only flag. Pro Edge Functions remain reachable directly with a crafted request. Server-side guards are a follow-up task.

