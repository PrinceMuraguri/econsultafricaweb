import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp, TrendingDown, DollarSign, BarChart3 } from "lucide-react";

interface AdminTradingTabProps {
  adminKey: string;
}

const AdminTradingTab = ({ adminKey }: AdminTradingTabProps) => {
  const { data: trades = [], isLoading } = useQuery({
    queryKey: ["admin-trades"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trades")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 15000,
  });

  const { data: positions = [] } = useQuery({
    queryKey: ["admin-positions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("positions")
        .select("*");
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 15000,
  });

  const totalBuyVolume = trades.filter(t => t.side === "buy").reduce((s, t) => s + Number(t.total_amount), 0);
  const totalSellVolume = trades.filter(t => t.side === "sell").reduce((s, t) => s + Number(t.total_amount), 0);
  const totalFees = trades.reduce((s, t) => s + Number(t.fee), 0);
  const totalOpenShares = positions.reduce((s, p) => s + Number(p.shares), 0);

  return (
    <div>
      <h2 className="text-xl font-bold text-foreground mb-4">Trading Activity</h2>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { icon: TrendingUp, label: "Buy Volume", value: `$${totalBuyVolume.toFixed(2)}`, color: "text-green-600" },
          { icon: TrendingDown, label: "Sell Volume", value: `$${totalSellVolume.toFixed(2)}`, color: "text-red-500" },
          { icon: DollarSign, label: "Platform Fees", value: `$${totalFees.toFixed(2)}`, color: "text-primary" },
          { icon: BarChart3, label: "Open Shares", value: totalOpenShares.toFixed(0), color: "text-foreground" },
        ].map(s => (
          <div key={s.label} className="bg-card border border-border rounded-lg p-4">
            <s.icon className={`w-5 h-5 mb-2 ${s.color}`} />
            <p className={`text-2xl font-bold font-mono ${s.color}`}>{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Recent trades table */}
      <h3 className="text-lg font-semibold mb-3">Recent Trades ({trades.length})</h3>
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 font-semibold text-muted-foreground">Time</th>
                <th className="text-left py-2 font-semibold text-muted-foreground">Side</th>
                <th className="text-left py-2 font-semibold text-muted-foreground">Shares</th>
                <th className="text-left py-2 font-semibold text-muted-foreground">Price</th>
                <th className="text-left py-2 font-semibold text-muted-foreground">Amount</th>
                <th className="text-left py-2 font-semibold text-muted-foreground">Fee</th>
                <th className="text-left py-2 font-semibold text-muted-foreground">User</th>
              </tr>
            </thead>
            <tbody>
              {trades.map((t: any) => (
                <tr key={t.id} className="border-b border-border/50">
                  <td className="py-2 text-muted-foreground">{new Date(t.created_at).toLocaleString()}</td>
                  <td className="py-2">
                    <span className={`font-bold uppercase ${t.side === "buy" ? "text-green-600" : "text-red-500"}`}>
                      {t.side}
                    </span>
                  </td>
                  <td className="py-2 font-mono">{Number(t.shares)}</td>
                  <td className="py-2 font-mono">${Number(t.price).toFixed(2)}</td>
                  <td className="py-2 font-mono">${Number(t.total_amount).toFixed(2)}</td>
                  <td className="py-2 font-mono text-muted-foreground">${Number(t.fee).toFixed(2)}</td>
                  <td className="py-2 text-muted-foreground truncate max-w-[120px]">{t.user_id?.slice(0, 8)}…</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminTradingTab;
