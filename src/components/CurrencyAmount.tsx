import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { ProMode } from "@/lib/currency";

interface CurrencyAmountProps {
  amount: number;
  /** Override the inherited proMode (rare — usually leave undefined). */
  mode?: ProMode;
  /** Number of decimal places (default 2). */
  decimals?: number;
  /** Show a leading + on positive amounts. */
  showSign?: boolean;
  /** Additional Tailwind classes for the wrapper span. */
  className?: string;
  /** When true, demo styling uses smaller "AC" suffix (default true). */
  showSuffixBadge?: boolean;
}

/**
 * Renders a Pro-mode-aware currency amount.
 *
 *  - In **demo** mode: amber, mono, bold; suffixed with "AC" badge.
 *  - In **live** mode: existing $X.XX styling (mono semibold, foreground).
 *  - In **loading** mode: a tiny skeleton (proMode hasn't resolved yet).
 *
 * Always read the mode from AuthContext unless explicitly overridden — this
 * keeps the visual treatment consistent across the entire Pro surface.
 */
export function CurrencyAmount({
  amount,
  mode,
  decimals = 2,
  showSign = false,
  className,
  showSuffixBadge = true,
}: CurrencyAmountProps) {
  const { proMode } = useAuth();
  const effective: ProMode = mode ?? proMode;

  if (effective === "loading") {
    return <Skeleton className={cn("inline-block h-4 w-16 align-middle", className)} />;
  }

  const sign = showSign && amount > 0 ? "+" : "";
  const formatted = `${sign}${amount.toFixed(decimals)}`;

  if (effective === "demo") {
    return (
      <span className={cn("inline-flex items-baseline gap-0.5", className)}>
        <span className="font-mono font-bold text-amber-600">{formatted}</span>
        {showSuffixBadge && (
          <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">
            AC
          </span>
        )}
      </span>
    );
  }

  // live
  return (
    <span className={cn("font-mono font-semibold", className)}>
      ${formatted}
    </span>
  );
}

export default CurrencyAmount;
