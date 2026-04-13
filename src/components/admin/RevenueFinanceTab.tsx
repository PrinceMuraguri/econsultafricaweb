import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Loader2 } from "lucide-react";
import { useMemo } from "react";

interface Props {
  isAuthenticated: boolean;
}

const fmt = (v: number | null | undefined) =>
  `$${(v ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const pct = (part: number | null | undefined, total: number | null | undefined) => {
  const t = total ?? 0;
  if (t === 0) return 0;
  return Math.round(((part ?? 0) / t) * 100);
};

const SOURCE_COLORS: Record<string, string> = {
  buy_shares: "bg-blue-500",
  sell_shares: "bg-orange-500",
  settlement: "bg-green-500",
  order_fill: "bg-purple-500",
  p2p_listing: "bg-pink-500",
};

const SOURCE_LABELS: Record<string, string> = {
  buy_shares: "Buy Shares",
  sell_shares: "Sell Shares",
  settlement: "Settlement",
  order_fill: "Order Fills",
  p2p_listing: "P2P Marketplace",
};

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  active: "default",
  settled: "secondary",
  closed: "destructive",
  resolved: "outline",
};

export default function RevenueFinanceTab({ isAuthenticated }: Props) {
  const { data: revSummary, isLoading: loadingSummary } = useQuery({
    queryKey: ["admin-revenue-summary"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("revenue_summary")
        .select("*")
        .single();
      if (error) throw error;
      return data;
    },
    enabled: isAuthenticated,
    refetchInterval: 30000,
  });

  const { data: revByPoll, isLoading: loadingByPoll } = useQuery({
    queryKey: ["admin-revenue-by-poll"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("revenue_by_poll")
        .select("*");
      if (error) throw error;
      return data;
    },
    enabled: isAuthenticated,
    refetchInterval: 30000,
  });

  const { data: reconciliation } = useQuery({
    queryKey: ["admin-reconciliation"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("money_reconciliation")
        .select("*")
        .single();
      if (error) throw error;
      return data;
    },
    enabled: isAuthenticated,
    refetchInterval: 30000,
  });

  const { data: recentFees, isLoading: loadingFees } = useQuery({
    queryKey: ["admin-platform-fees"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("platform_fees")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data;
    },
    enabled: isAuthenticated,
    refetchInterval: 30000,
  });

  const sortedPolls = useMemo(() => {
    if (!revByPoll) return [];
    return [...revByPoll].sort(
      (a, b) => (b.total_fees ?? 0) - (a.total_fees ?? 0)
    );
  }, [revByPoll]);

  const sourceBreakdown = useMemo(() => {
    if (!revSummary) return [];
    const total = revSummary.total_revenue ?? 0;
    return [
      { key: "buy_shares", value: revSummary.revenue_buy_shares },
      { key: "sell_shares", value: revSummary.revenue_sell_shares },
      { key: "settlement", value: revSummary.revenue_settlement },
      { key: "order_fill", value: revSummary.revenue_order_fills },
      { key: "p2p_listing", value: revSummary.revenue_p2p },
    ].map((s) => ({
      ...s,
      label: SOURCE_LABELS[s.key] || s.key,
      color: SOURCE_COLORS[s.key] || "bg-gray-500",
      pct: pct(s.value, total),
    }));
  }, [revSummary]);

  const discrepancy = reconciliation?.discrepancy ?? 0;
  const isBalanced = Math.abs(discrepancy) < 0.01;

  if (loadingSummary) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Section 1: KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { emoji: "💰", label: "Total Revenue", value: fmt(revSummary?.total_revenue) },
          { emoji: "📅", label: "This Month", value: fmt(revSummary?.revenue_this_month) },
          { emoji: "📆", label: "Last 7 Days", value: fmt(revSummary?.revenue_last_7_days) },
          { emoji: "⏰", label: "Last 24h", value: fmt(revSummary?.revenue_last_24h) },
          { emoji: "📊", label: "Fee Events", value: String(revSummary?.total_fee_events ?? 0) },
        ].map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="p-4">
              <p className="text-lg mb-1">{kpi.emoji}</p>
              <p className="text-2xl font-bold font-mono text-foreground">{kpi.value}</p>
              <p className="text-xs text-muted-foreground">{kpi.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Section 2: Revenue by Source */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Revenue by Source</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {sourceBreakdown.map((s) => (
            <div key={s.key} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-foreground font-medium">{s.label}</span>
                <span className="text-muted-foreground font-mono">
                  {fmt(s.value)} ({s.pct}%)
                </span>
              </div>
              <div className="relative h-3 w-full overflow-hidden rounded-full bg-secondary">
                <div
                  className={`h-full rounded-full transition-all ${s.color}`}
                  style={{ width: `${Math.max(s.pct, 1)}%` }}
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Section 3: Reconciliation */}
      <Card className={`border-2 ${isBalanced ? "border-green-500/50" : "border-destructive/50"}`}>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            Money Reconciliation
            <Badge variant={isBalanced ? "default" : "destructive"} className="text-xs">
              {isBalanced ? "✅ Balanced" : `⚠️ ${fmt(discrepancy)} discrepancy`}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            {[
              { label: "Total Deposits", value: fmt(reconciliation?.total_deposits) },
              { label: "Wallet Balances", value: fmt(reconciliation?.total_wallet_balances) },
              { label: "Total Withdrawals", value: fmt(reconciliation?.total_withdrawals) },
              { label: "Platform Fees", value: fmt(reconciliation?.total_platform_fees) },
            ].map((item) => (
              <div key={item.label} className="bg-muted/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className="text-lg font-bold font-mono text-foreground">{item.value}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground text-center font-mono">
            Deposits = Wallets + Withdrawals + Fees
          </p>
        </CardContent>
      </Card>

      {/* Section 4: Per-Poll Revenue Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Revenue by Poll</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingByPoll ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
            </div>
          ) : !sortedPolls.length ? (
            <p className="text-sm text-muted-foreground text-center py-4">No fee data yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Poll</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Buy</TableHead>
                    <TableHead className="text-right">Sell</TableHead>
                    <TableHead className="text-right">Settlement</TableHead>
                    <TableHead className="text-right">Orders</TableHead>
                    <TableHead className="text-right">P2P</TableHead>
                    <TableHead>Events</TableHead>
                    <TableHead>Last Fee</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedPolls.map((row) => (
                    <TableRow key={row.poll_id}>
                      <TableCell className="max-w-[200px] truncate text-xs font-medium">
                        {row.poll_title || row.poll_id?.slice(0, 8)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={STATUS_VARIANT[row.poll_status ?? ""] ?? "outline"} className="text-[10px]">
                          {row.poll_status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs font-bold">{fmt(row.total_fees)}</TableCell>
                      <TableCell className="text-right font-mono text-xs">{fmt(row.fees_buy)}</TableCell>
                      <TableCell className="text-right font-mono text-xs">{fmt(row.fees_sell)}</TableCell>
                      <TableCell className="text-right font-mono text-xs">{fmt(row.fees_settlement)}</TableCell>
                      <TableCell className="text-right font-mono text-xs">{fmt(row.fees_orders)}</TableCell>
                      <TableCell className="text-right font-mono text-xs">{fmt(row.fees_p2p)}</TableCell>
                      <TableCell className="text-xs">{row.fee_events}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {row.last_fee_at
                          ? new Date(row.last_fee_at).toLocaleDateString()
                          : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Section 5: Recent Fee Events */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Fee Events</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingFees ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
            </div>
          ) : !recentFees?.length ? (
            <p className="text-sm text-muted-foreground text-center py-4">No fees recorded yet.</p>
          ) : (
            <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date/Time</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Poll ID</TableHead>
                    <TableHead>User ID</TableHead>
                    <TableHead>Reference</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentFees.map((fee) => (
                    <TableRow key={fee.id}>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(fee.created_at!).toLocaleString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`text-[10px] ${SOURCE_COLORS[fee.source] ? `${SOURCE_COLORS[fee.source]} text-white border-0` : ""}`}
                        >
                          {SOURCE_LABELS[fee.source] || fee.source}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs font-bold">
                        {fmt(fee.amount)}
                      </TableCell>
                      <TableCell className="text-xs font-mono text-muted-foreground">
                        {fee.poll_id?.slice(0, 8) || "—"}
                      </TableCell>
                      <TableCell className="text-xs font-mono text-muted-foreground">
                        {fee.user_id?.slice(0, 8) || "—"}
                      </TableCell>
                      <TableCell className="text-xs font-mono text-muted-foreground max-w-[120px] truncate">
                        {fee.reference || "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
