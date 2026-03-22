import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TrendingUp, TrendingDown } from "lucide-react";

const ShareCalculator = () => {
  const [shares, setShares] = useState(10);
  const [price, setPrice] = useState(0.60);

  const totalCost = parseFloat((shares * price).toFixed(2));
  const payout = shares;
  const profit = parseFloat((payout - totalCost).toFixed(2));

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
        <div className="space-y-2">
          <Label className="text-sm font-medium">Number of Shares</Label>
          <Input
            type="number"
            value={shares}
            onChange={(e) => setShares(Math.max(1, Math.floor(Number(e.target.value))))}
            className="font-mono text-lg"
            min={1}
          />
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-medium">Share Price ($)</Label>
          <Input
            type="number"
            value={price}
            onChange={(e) => setPrice(Math.max(0.01, Math.min(0.99, Number(e.target.value))))}
            className="font-mono text-lg"
            min={0.01}
            max={0.99}
            step={0.01}
          />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-center py-2 border-b border-border">
          <span className="text-sm text-muted-foreground">Total Cost</span>
          <span className="font-mono text-lg font-semibold text-foreground">${totalCost.toFixed(2)}</span>
        </div>
        <div className="flex justify-between items-center py-2 border-b border-border">
          <span className="text-sm text-muted-foreground flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-green-600" />
            If correct — you receive
          </span>
          <span className="font-mono text-lg font-bold text-green-600">${payout.toFixed(2)}</span>
        </div>
        <div className="flex justify-between items-center py-2 border-b border-border">
          <span className="text-sm text-muted-foreground">Profit</span>
          <span className={`font-mono text-lg font-bold ${profit > 0 ? "text-green-600" : "text-red-500"}`}>
            {profit > 0 ? "+" : ""}${profit.toFixed(2)}
          </span>
        </div>
        <div className="flex justify-between items-center py-2">
          <span className="text-sm text-muted-foreground flex items-center gap-1.5">
            <TrendingDown className="w-4 h-4 text-red-500" />
            If wrong — you lose
          </span>
          <span className="font-mono text-lg font-bold text-red-500">-${totalCost.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
};

export default ShareCalculator;
