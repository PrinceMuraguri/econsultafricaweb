import { useQueries, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  TrendingUp, TrendingDown, DollarSign, BarChart3,
  ListOrdered, Layers, Activity, Info,
} from "lucide-react";
import { useIdentityResolver, PollLink, OptionLabel } from "@/pages/AdminDashboard";
import { useAuth } from "@/contexts/AuthContext";

interface AdminTradingTabProps {
  adminKey: string;
  polls?: any[];
}

type ActivityEvent = {
  id: string;
  kind: "stake" | "buy" | "sell" | "list_created" | "list_sold" | "list_cancelled" | "order_open" | "order_filled" | "order_cancelled";
  created_at: string;
  user_id?: string | null;
  voter_fingerprint?: string | null;
  poll_id?: string | null;
  option_id?: string | null;
  shares?: number | null;
  price?: number | null;
  amount?: number | null;
  fee?: number | null;
  status?: string | null;
};

const KIND_META: Record<ActivityEvent["kind"], { label: string; cls: string }> = {
  stake:           { label: "STAKE",      cls: "bg-orange-100 text-orange-700" },
  buy:             { label: "BUY",        cls: "bg-green-100 text-green-700" },
  sell:            { label: "SELL",       cls: "bg-red-100 text-red-700" },
  list_created:    { label: "LIST",       cls: "bg-amber-100 text-amber-700" },
  list_sold:       { label: "LIST SOLD",  cls: "bg-emerald-100 text-emerald-700" },
  list_cancelled:  { label: "LIST X",     cls: "bg-muted text-muted-foreground" },
  order_open:      { label: "ORDER",      cls: "bg-blue-100 text-blue-700" },
  order_filled:    { label: "ORDER FILL", cls: "bg-emerald-100 text-emerald-700" },
  order_cancelled: { label: "ORDER X",    cls: "bg-muted text-muted-foreground" },
};

const AdminTradingTab = ({ polls }: AdminTradingTabProps) => {
  const { proMode } = useAuth();
  // ── Source data: trades, votes (staked), listings, orders ────────────────
  const results = useQueries({
    queries: [
      {
        queryKey: ["admin-trading-activity", "trades"],
        queryFn: async () => {
          const { data, error } = await supabase
            .from("trades")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(150);
          if (error) throw error;
          return data || [];
        },
        refetchInterval: 15000,
      },
      {
        queryKey: ["admin-trading-activity", "stakes"],
        queryFn: async () => {
          const { data, error } = await supabase
            .from("votes")
            .select("*")
            .eq("is_staked", true)
            .order("created_at", { ascending: false })
            .limit(150);
          if (error) throw error;
          return data || [];
        },
        refetchInterval: 15000,
      },
      {
        queryKey: ["admin-trading-activity", "listings"],
        queryFn: async () => {
          const { data, error } = await supabase
            .from("listings")
            .select("*")
            .order("updated_at", { ascending: false })
            .limit(150);
          if (error) throw error;
          return data || [];
        },
        refetchInterval: 15000,
      },
      {
        queryKey: ["admin-trading-activity", "orders"],
        queryFn: async () => {
          const { data, error } = await supabase
            .from("orders")
            .select("*")
            .order("updated_at", { ascending: false })
            .limit(150);
          if (error) throw error;
          return data || [];
        },
        refetchInterval: 15000,
      },
    ],
  });
  const [tradesQ, stakesQ, listingsQ, ordersQ] = results;
  const trades   = (tradesQ.data   as any[]) || [];
  const stakes   = (stakesQ.data   as any[]) || [];
  const listings = (listingsQ.data as any[]) || [];
  const orders   = (ordersQ.data   as any[]) || [];
  const isLoading = results.some(r => r.isLoading);

  // Positions for "Open Shares" stat
  const { data: positions = [] } = useQuery({
    queryKey: ["admin-positions"],
    queryFn: async () => {
      const { data, error } = await supabase.from("positions").select("*");
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 15000,
  });

  // ── Identity resolution ──────────────────────────────────────────────────
  const userIds = [
    ...trades.map(t => t.user_id),
    ...stakes.map(s => s.user_id),
    ...listings.map(l => l.seller_id),
    ...listings.map(l => l.buyer_id),
    ...orders.map(o => o.user_id),
  ];
  const fingerprints = stakes.map(s => s.voter_fingerprint);
  const resolveIdentity = useIdentityResolver(userIds, fingerprints);

  // ── Build merged activity feed ───────────────────────────────────────────
  const events: ActivityEvent[] = [];

  trades.forEach(t => {
    events.push({
      id: `trade_${t.id}`,
      kind: t.side === "buy" ? "buy" : "sell",
      created_at: t.created_at,
      user_id: t.user_id,
      poll_id: t.poll_id,
      option_id: t.option_id,
      shares: Number(t.shares),
      price: Number(t.price),
      amount: Number(t.total_amount),
      fee: Number(t.fee),
    });
  });

  stakes.forEach(s => {
    events.push({
      id: `stake_${s.id}`,
      kind: "stake",
      created_at: s.created_at,
      user_id: s.user_id,
      voter_fingerprint: s.voter_fingerprint,
      poll_id: s.poll_id,
      option_id: s.option_id,
      amount: Number(s.stake_amount || 0),
      price: s.entry_price ? Number(s.entry_price) : null,
    });
  });

  listings.forEach(l => {
    let kind: ActivityEvent["kind"] = "list_created";
    if (l.status === "sold") kind = "list_sold";
    else if (l.status === "cancelled") kind = "list_cancelled";
    events.push({
      id: `listing_${l.id}_${l.status}`,
      kind,
      created_at: l.updated_at || l.created_at,
      user_id: l.status === "sold" ? l.buyer_id : l.seller_id,
      poll_id: l.poll_id,
      option_id: l.option_id,
      shares: Number(l.shares),
      price: Number(l.price_per_share),
      amount: Number(l.total_ask),
      status: l.status,
    });
  });

  orders.forEach(o => {
    let kind: ActivityEvent["kind"] = "order_open";
    if (o.status === "filled") kind = "order_filled";
    else if (o.status === "cancelled") kind = "order_cancelled";
    events.push({
      id: `order_${o.id}_${o.status}`,
      kind,
      created_at: o.updated_at || o.created_at,
      user_id: o.user_id,
      poll_id: o.poll_id,
      option_id: o.option_id,
      shares: Number(o.shares),
      price: Number(o.price),
      amount: Number(o.shares) * Number(o.price),
      status: `${o.side}/${o.status}`,
    });
  });

  events.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  const feed = events.slice(0, 100);

  // ── Stats ────────────────────────────────────────────────────────────────
  const totalBuyVolume   = trades.filter(t => t.side === "buy").reduce((s, t) => s + Number(t.total_amount), 0);
  const totalSellVolume  = trades.filter(t => t.side === "sell").reduce((s, t) => s + Number(t.total_amount), 0);
  const totalFees        = trades.reduce((s, t) => s + Number(t.fee), 0);
  const totalOpenShares  = (positions as any[]).reduce((s, p) => s + Number(p.shares), 0);
  const activeListings   = listings.filter(l => l.status === "active").length;
  const openOrders       = orders.filter(o => o.status === "open" || o.status === "partial").length;

  return (
    <div>
      <h2 className="text-xl font-bold text-foreground mb-4">Trading Activity</h2>

      {/* Pro mode info bar */}
      <div className={`mb-4 rounded-lg border px-3 py-2 flex items-start gap-2 ${
        proMode === "demo"
          ? "bg-amber-500/5 border-amber-500/30"
          : proMode === "live"
            ? "bg-green-500/5 border-green-500/30"
            : "bg-muted/30 border-border"
      }`}>
        <Info className={`w-4 h-4 mt-0.5 shrink-0 ${
          proMode === "demo" ? "text-amber-600" : proMode === "live" ? "text-green-600" : "text-muted-foreground"
        }`} />
        <p className="text-xs text-foreground">
          Pro is currently in <span className="font-bold uppercase">{proMode}</span> mode.{" "}
          {proMode === "demo" && (
            <span className="text-muted-foreground">
              Activity below reflects live tables only — virtual Arena Coin trades are recorded in <code className="font-mono text-[10px]">demo_*</code> tables and do not appear here.
            </span>
          )}
          {proMode === "live" && (
            <span className="text-muted-foreground">All activity below represents real wallet movements.</span>
          )}
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {[
          { icon: TrendingUp,  label: "Buy Volume",      value: `$${totalBuyVolume.toFixed(2)}`,  color: "text-green-600" },
          { icon: TrendingDown,label: "Sell Volume",     value: `$${totalSellVolume.toFixed(2)}`, color: "text-red-500" },
          { icon: DollarSign,  label: "Platform Fees",   value: `$${totalFees.toFixed(2)}`,        color: "text-primary" },
          { icon: BarChart3,   label: "Open Shares",     value: totalOpenShares.toFixed(0),        color: "text-foreground" },
          { icon: Layers,      label: "Active Listings", value: String(activeListings),            color: "text-amber-600" },
          { icon: ListOrdered, label: "Open Orders",     value: String(openOrders),                color: "text-blue-600" },
        ].map(s => (
          <div key={s.label} className="bg-card border border-border rounded-lg p-3">
            <s.icon className={`w-4 h-4 mb-1.5 ${s.color}`} />
            <p className={`text-xl font-bold font-mono ${s.color}`}>{s.value}</p>
            <p className="text-[10px] text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Live activity feed */}
      <div className="flex items-center gap-2 mb-3">
        <Activity className="w-4 h-4 text-primary" />
        <h3 className="text-lg font-semibold text-foreground">
          Live Activity Feed ({feed.length})
        </h3>
        <span className="text-[10px] text-muted-foreground ml-2">
          Realtime — last 100 events across stakes, trades, listings & orders
        </span>
      </div>

      {isLoading && feed.length === 0 ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : feed.length === 0 ? (
        <p className="text-sm text-muted-foreground">No activity yet.</p>
      ) : (
        <div className="overflow-x-auto bg-card border border-border rounded-lg mb-8">
          <table className="w-full text-xs">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-3 py-2 font-medium text-muted-foreground">Time</th>
                <th className="text-left px-3 py-2 font-medium text-muted-foreground">Event</th>
                <th className="text-left px-3 py-2 font-medium text-muted-foreground">Name</th>
                <th className="text-left px-3 py-2 font-medium text-muted-foreground">Email</th>
                <th className="text-left px-3 py-2 font-medium text-muted-foreground">Poll</th>
                <th className="text-left px-3 py-2 font-medium text-muted-foreground">Option</th>
                <th className="text-right px-3 py-2 font-medium text-muted-foreground">Shares</th>
                <th className="text-right px-3 py-2 font-medium text-muted-foreground">Price</th>
                <th className="text-right px-3 py-2 font-medium text-muted-foreground">Amount</th>
              </tr>
            </thead>
            <tbody>
              {feed.map(ev => {
                const id = resolveIdentity(ev.user_id, ev.voter_fingerprint);
                const meta = KIND_META[ev.kind];
                return (
                  <tr key={ev.id} className="border-t border-border/50">
                    <td className="px-3 py-1.5 font-mono text-muted-foreground whitespace-nowrap">
                      {new Date(ev.created_at).toLocaleString()}
                    </td>
                    <td className="px-3 py-1.5">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${meta.cls}`}>
                        {meta.label}
                      </span>
                    </td>
                    <td className="px-3 py-1.5 text-foreground">{id.name}</td>
                    <td className="px-3 py-1.5 text-muted-foreground">{id.email}</td>
                    <td className="px-3 py-1.5"><PollLink pollId={ev.poll_id} polls={polls} /></td>
                    <td className="px-3 py-1.5"><OptionLabel optionId={ev.option_id} pollId={ev.poll_id} polls={polls} /></td>
                    <td className="px-3 py-1.5 text-right font-mono">
                      {ev.shares != null ? ev.shares.toFixed(0) : "—"}
                    </td>
                    <td className="px-3 py-1.5 text-right font-mono">
                      {ev.price != null ? `$${ev.price.toFixed(2)}` : "—"}
                    </td>
                    <td className="px-3 py-1.5 text-right font-mono font-semibold">
                      {ev.amount != null ? `$${ev.amount.toFixed(2)}` : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Raw trades table (kept for raw inspection) */}
      <h3 className="text-lg font-semibold text-foreground mb-3">Recent Trades — Raw ({trades.length})</h3>
      <div className="overflow-x-auto bg-card border border-border rounded-lg">
        <table className="w-full text-xs">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-3 py-2 font-medium text-muted-foreground">Time</th>
              <th className="text-left px-3 py-2 font-medium text-muted-foreground">Side</th>
              <th className="text-left px-3 py-2 font-medium text-muted-foreground">Name</th>
              <th className="text-left px-3 py-2 font-medium text-muted-foreground">Email</th>
              <th className="text-left px-3 py-2 font-medium text-muted-foreground">Poll</th>
              <th className="text-right px-3 py-2 font-medium text-muted-foreground">Shares</th>
              <th className="text-right px-3 py-2 font-medium text-muted-foreground">Price</th>
              <th className="text-right px-3 py-2 font-medium text-muted-foreground">Amount</th>
              <th className="text-right px-3 py-2 font-medium text-muted-foreground">Fee</th>
            </tr>
          </thead>
          <tbody>
            {trades.map((t: any) => {
              const id = resolveIdentity(t.user_id, null);
              return (
                <tr key={t.id} className="border-t border-border/50">
                  <td className="px-3 py-1.5 font-mono text-muted-foreground whitespace-nowrap">
                    {new Date(t.created_at).toLocaleString()}
                  </td>
                  <td className="px-3 py-1.5">
                    <span className={`font-bold uppercase ${t.side === "buy" ? "text-green-600" : "text-red-500"}`}>
                      {t.side}
                    </span>
                  </td>
                  <td className="px-3 py-1.5 text-foreground">{id.name}</td>
                  <td className="px-3 py-1.5 text-muted-foreground">{id.email}</td>
                  <td className="px-3 py-1.5"><PollLink pollId={t.poll_id} polls={polls} /></td>
                  <td className="px-3 py-1.5 text-right font-mono">{Number(t.shares).toFixed(0)}</td>
                  <td className="px-3 py-1.5 text-right font-mono">${Number(t.price).toFixed(2)}</td>
                  <td className="px-3 py-1.5 text-right font-mono font-semibold">${Number(t.total_amount).toFixed(2)}</td>
                  <td className="px-3 py-1.5 text-right font-mono text-muted-foreground">${Number(t.fee).toFixed(2)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {trades.length === 0 && (
          <p className="text-center text-muted-foreground py-4">No trades yet.</p>
        )}
      </div>
    </div>
  );
};

export default AdminTradingTab;
