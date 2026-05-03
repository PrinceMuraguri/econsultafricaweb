## Batch 2.2 (revised) — PollCardPro currency sweep + Pro hero subhead

Folding in the three notes from review.

### 1. `src/components/forecast/PollCardPro.tsx`

Add import:
```ts
import CurrencyAmount from "@/components/CurrencyAmount";
```
Pull `proMode` from auth (already calls `useAuth()` for `user`):
```ts
const { user, proMode } = useAuth();
```
(Not strictly required since `CurrencyAmount` reads proMode internally, but kept for any conditional copy.)

Twelve sites — full enumeration, no truncation:

| # | Line | Current | Replacement |
|---|------|---------|-------------|
| 1 | 407 | `$${userPrimaryCommit.amount.toFixed(2)}` (inside `<span className="font-semibold">`) | `<CurrencyAmount amount={userPrimaryCommit.amount} />` |
| 2 | 449 | `<span className="font-mono text-xs font-bold text-amber-600">${price.toFixed(2)}</span>` | `<CurrencyAmount amount={price} />` (drop wrapper — component owns mono/bold/amber in demo; in live we want $-foreground, which CurrencyAmount also handles) |
| 3 | 451 | `<span className="text-[9px] text-muted-foreground font-mono">${optStake.toFixed(0)}</span>` | `<CurrencyAmount amount={optStake} decimals={0} className="text-[9px]" />` |
| 4 | 474 | `<span className="text-[9px] text-muted-foreground font-mono">${totalStake.toFixed(0)} committed</span>` | `<span className="text-[9px] text-muted-foreground"><CurrencyAmount amount={totalStake} decimals={0} className="text-[9px]" /> committed</span>` |
| 5 | 489 | `${(option.total_stake_amount || 0).toFixed(0)} <span className="text-[9px]">({pct}%)</span>` (inside `<span className="font-mono text-muted-foreground">`) | `<CurrencyAmount amount={option.total_stake_amount || 0} decimals={0} /> <span className="text-[9px]">({pct}%)</span>` (remove the outer `font-mono text-muted-foreground` from that wrapping span since CurrencyAmount handles its own typography; keep the parent flex layout intact) |
| 6 | 502 | `<Users />{totalVotes} forecasts · ${totalStake.toFixed(0)} committed` | `<Users />{totalVotes} forecasts · <CurrencyAmount amount={totalStake} decimals={0} /> committed` |
| 7 | 620 | Market price `<span className="font-mono font-semibold text-amber-600">${price.toFixed(2)}</span>` | `<CurrencyAmount amount={price} />` |
| 8 | 621 | If correct `<span className="font-mono font-semibold text-green-600">$1.00 per share</span>` | `<span className="text-green-600"><CurrencyAmount amount={1} className="text-green-600" /> per share</span>` (green color preserved on parent) |
| 9 | 670 | `<p className="font-mono font-bold text-foreground">${Number(stakeAmount || 0).toFixed(2)}</p>` | `<p><CurrencyAmount amount={Number(stakeAmount || 0)} /></p>` |
| 10 | 678 | `<p className="font-mono font-bold text-green-600">${potentialGain.toFixed(2)}</p>` | `<p className="text-green-600"><CurrencyAmount amount={potentialGain} className="text-green-600" /></p>` |
| 11 | 690 | `${Number(listing.shares).toFixed(4)} shares @ ${Number(listing.price_per_share).toFixed(2)}/share` | `{Number(listing.shares).toFixed(4)} shares @ <CurrencyAmount amount={Number(listing.price_per_share)} />/share` |
| 12 | 692 | `${Number(listing.total_ask).toFixed(2)}` | `<CurrencyAmount amount={Number(listing.total_ask)} />` |
| 13 | 695 | `You receive ${(Number(listing.total_ask) * 0.965).toFixed(2)} when sold (after 3.5% fee)` | `You receive <CurrencyAmount amount={Number(listing.total_ask) * 0.965} /> when sold (after 3.5% fee)` |

(13 sites total — line 695 was already in the original twelve; previous table grouped 690 and 692 separately. All twelve enumerated lines from Batch 2.1 are covered: 407, 449, 451, 474, 489, 502, 620, 670, 678, 690, 692, 695. Confirmed.)

Note on color overrides: where the original used `text-green-600` or similar semantic color, we keep the color on the parent `<p>` / `<span>` rather than passing it via `className` to `CurrencyAmount`, so live mode inherits foreground correctly and demo mode keeps the amber `CurrencyAmount` styling intact (no class collision).

### 2. `src/pages/ForecastArenaPro.tsx` line 146 — hero subhead

Drop the `text-background/70` overrides per review note 1, and use `decimals={2}` on the zero amount per review note 2 for `0.00 AC` parallelism with `1.00 AC`:

```tsx
<p className="text-background/50 text-xs mt-1">
  Market odds adjust based on participant activity. Each position settles at{" "}
  <CurrencyAmount amount={1} /> if correct,{" "}
  <CurrencyAmount amount={0} decimals={2} /> if incorrect.
</p>
```

In demo mode this renders `1.00 AC ... 0.00 AC` in CurrencyAmount's native amber. In live mode `$1.00 ... $0.00` in foreground (mono semibold). Both read as deliberate emphasis inside the gray hero copy.

### 3. ShareCalculator

Confirmed deferred. `HowItWorksModal` is dead code (not imported anywhere). If it's ever re-wired into a Pro surface, ShareCalculator must be added to a future batch's scope.

### Out of scope
- OrderBookModal price-ladder literals (deferred per prior call).
- Batch 3 admin Pro/Demo toggle UI + `_shared/pro-mode.ts` centralization (pending re-QA).
