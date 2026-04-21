# Feature Flags

This project uses a build-time feature flag to control visibility of Forecast Arena Pro. The flag lives in `src/lib/features.ts` as a hardcoded constant.

## PRO_ENABLED

Gates the entire Forecast Arena Pro tier (staked-trading, order book, secondary listings, Pro dashboard).

**Source:** `export const PRO_ENABLED` in `src/lib/features.ts`.

**To toggle:** edit the constant to `true` or `false`, commit, redeploy.

### What the flag gates

When `PRO_ENABLED === false`, the following must be hidden from users:

1. The Pro link in the navbar (`src/components/Navbar.tsx`).
2. The `/forecast-arena-pro` and `/forecast-arena-pro/:slug` routes — they serve `src/pages/ProPaused.tsx` instead (`src/App.tsx`).
3. The amber "Upgrade to Pro" banner under the homepage hero (`src/pages/ForecastArena.tsx`).
4. The "🚀 Want to go further? Try Forecast Arena Pro" sentence in the homepage hero expandable details (`src/pages/ForecastArena.tsx`).
5. The inline "Try Pro to commit capital →" link on each Free poll card (`src/components/forecast/PollCard.tsx`).
6. The amber "Want to back your forecast with real capital?" post-vote card on each Free poll card (`src/components/forecast/PollCard.tsx`). The "Share your view" row beneath it must remain visible.
7. The amber "Forecast Arena Pro — Capital Markets / Trade Pro →" banner on the Free poll detail page (`src/pages/ForecastPollDetail.tsx`).
8. The "💰 Try Pro — back forecasts with capital" footer link on the floating ForecastWidget (`src/components/forecast/ForecastWidget.tsx`).

Every guard in those files is marked with an inline comment starting with `// Pro flag:`. Do not remove these guards without explicit instruction from the project owner.

### Files that remain untouched by this flag

The following files live inside Pro territory and become unreachable when the routes are redirected. They intentionally do NOT check `PRO_ENABLED` at the component level — the route-level guard is sufficient for Round 1:

- `src/pages/ForecastArenaPro.tsx`
- `src/pages/ForecastPollDetailPro.tsx`
- `src/pages/StakeResult.tsx`
- `src/pages/UserProfile.tsx` (Pro positions links)
- `src/pages/MyDashboard.tsx`
- `src/components/forecast/PollCardPro.tsx`
- `src/components/dashboard/ProTradingTab.tsx`
- `src/components/dashboard/FreeForecastsTab.tsx`

Component-level guards for these, plus server-side guards on Pro-only Edge Functions, are planned for a future iteration.

### Known limitations

This is a client-side flag. Someone with a bookmarked Edge Function URL and a Paystack reference could still trigger a Pro-only function directly. For production pause, server-side guards on Pro Edge Functions are required — those will be added in a follow-up prompt.
