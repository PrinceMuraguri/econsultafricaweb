import { useExchangeRate } from "@/hooks/use-exchange-rate";

interface DualCurrencyProps {
  amount: number;
  className?: string;
}

const DualCurrency = ({ amount, className = "" }: DualCurrencyProps) => {
  const { toKes } = useExchangeRate();
  return (
    <span className={className}>
      <span className="font-mono font-semibold">${amount.toFixed(2)}</span>
      <span className="text-[9px] text-muted-foreground ml-1">(KES {toKes(amount).toLocaleString()})</span>
    </span>
  );
};

export default DualCurrency;
