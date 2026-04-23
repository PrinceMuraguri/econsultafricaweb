// Single source of truth for Pro currency rendering.
// Demo mode shows Arena Coins (AC) in amber/distinct styling so screenshots can't
// easily be mistaken for real USD. Live mode keeps the existing $X.XX format.

export type ProMode = "demo" | "live" | "loading";

export function formatCurrency(
  amount: number,
  mode: ProMode,
  opts?: { decimals?: number }
): string {
  const d = opts?.decimals ?? 2;
  // 'loading' falls back to a neutral plain-number string; UI should usually skeleton instead.
  if (mode === "demo") return `${amount.toFixed(d)} AC`;
  if (mode === "live") return `$${amount.toFixed(d)}`;
  return amount.toFixed(d);
}

// Bare display label without amount — useful for unit suffixes
export function currencyLabel(mode: ProMode): string {
  if (mode === "demo") return "AC";
  return "$";
}
