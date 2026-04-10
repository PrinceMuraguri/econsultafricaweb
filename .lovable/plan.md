

# Audit Results: Free Forecast Arena System

## Issues Found

### Bug 1: `PollDiscussionTabs` ignores `basePath` prop
The component accepts `basePath` as a prop (line 20: `basePath?: string;`) but destructures it away on line 44: `const PollDiscussionTabs = ({ poll }: Props)`. The `basePath` prop is never read, and the "Related Questions" section on line 436 hardcodes `/forecast-arena/${rp.slug}`.

**Impact**: When PollDiscussionTabs is used from the Pro detail page with `basePath="/forecast-arena-pro"`, related question links still go to the free detail page instead of Pro. This is a navigation bug for the Pro side — not a free-side issue, but a missed implementation detail.

**Fix**: Destructure `basePath` and use it in the related questions Link.

### Bug 2: Hero expandable text references capital commitment
Line 195 of `ForecastArena.tsx`:
```
🚀 Beyond sentiment, you can now commit capital to your forecasts and earn rewards if you are right.
```
This text lives inside the "More details" expandable section on the FREE arena homepage. It directly tells users to commit capital — but the free system has no capital features. This should be rewritten to point users to Pro, or removed.

**Fix**: Replace with something like: "🚀 Want to go further? Try Forecast Arena Pro to back your views with real capital."

### Bug 3: `UserPollActivity` shows capital/trading data on free detail page
The `UserPollActivity` component (rendered on `ForecastPollDetail.tsx` line 101) displays stakes, trades, listings, P2P buys — all capital-related activity. While it's useful data, showing "Committed capital," "Bought shares," and dollar amounts on the **free** detail page creates confusion. Users see financial activity on a page that's supposed to be capital-free.

**Impact**: UX inconsistency. A user who only voted sees no activity, but a user who also traded on Pro sees capital events on the free page. Not a code bug per se, but architecturally inconsistent with the "free = no capital" separation.

**Fix**: Either (a) filter out capital events (stake, p2p_buy, p2p_sell, listing_*) when displayed on the free detail page, or (b) add a "View full activity in Pro" link and only show vote events on the free page.

### Bug 4: `notify_comment_reply` DB function hardcodes `/forecast-arena/` links
The database trigger function `notify_comment_reply` inserts notifications with `link: '/forecast-arena/' || pslug`. When a user comments on a poll from the Pro detail page, the resulting notification link sends the replying user to the **free** detail page, not Pro. This is a backend issue that affects cross-system navigation.

**Fix**: This is harder to fix without adding a context column. For now it's acceptable since the free detail page works fine as a landing — but worth noting.

### Non-issue confirmations (things that ARE correct)
- **PollCard.tsx**: No StakeModal, ExitPositionModal, ListSharesModal, TradingWaitlistModal imports — clean ✓
- **PollCard.tsx**: No userStake, userPositions, userListings queries — clean ✓
- **PollCard.tsx**: Consensus uses `total_votes_count` — correct ✓
- **PollCard.tsx**: Post-vote section shows Pro cross-promotion, not capital commit nudge — correct ✓
- **PollCard.tsx**: All links use `/forecast-arena/` not Pro — correct ✓
- **ForecastArena.tsx**: No WalletTopUpPrompt — clean ✓
- **ForecastArena.tsx**: Pro cross-promotion banner present — correct ✓
- **ForecastArena.tsx**: "Free" badge in title — correct ✓
- **ForecastPollDetail.tsx**: No ListingsPanel or TradingPanel — clean ✓
- **ForecastPollDetail.tsx**: Pro cross-promotion card present — correct ✓
- **ForecastWidget.tsx**: Uses free PollCard, has "Try Pro" link — correct ✓
- **Watchlist.tsx**: Links to `/forecast-arena/` (free context) — correct ✓
- **MyDashboard.tsx**: Position/listing links go to `/forecast-arena-pro/` — correct ✓
- **Navbar.tsx**: Pro link present with gold styling — correct ✓

---

## Implementation Plan

### Fix 1: PollDiscussionTabs — use basePath
In `src/components/forecast/PollDiscussionTabs.tsx`:
- Line 44: change `({ poll }: Props)` → `({ poll, basePath = "/forecast-arena" }: Props)`
- Line 436: change hardcoded `/forecast-arena/${rp.slug}` → `` `${basePath}/${rp.slug}` ``

### Fix 2: ForecastArena hero text
In `src/pages/ForecastArena.tsx` line 195:
- Replace with: `"🚀 Want to go further? Try Forecast Arena Pro to back your views with real capital and earn rewards."`

### Fix 3: UserPollActivity on free detail page
In `src/components/forecast/UserPollActivity.tsx`:
- Add an optional `freeMode` prop
- When `freeMode=true`, filter out capital-related events (stake, p2p_buy, p2p_sell, listing_created, listing_sold, listing_cancelled) so only vote events are shown
In `src/pages/ForecastPollDetail.tsx`:
- Pass `freeMode` to `UserPollActivity`

### Fix 4: No code change (documented limitation)
The `notify_comment_reply` DB function hardcodes free links. This is acceptable for now — adding a migration to fix it would require schema changes.

---

**Total files to modify**: 4
- `src/components/forecast/PollDiscussionTabs.tsx`
- `src/pages/ForecastArena.tsx`
- `src/components/forecast/UserPollActivity.tsx`
- `src/pages/ForecastPollDetail.tsx`

