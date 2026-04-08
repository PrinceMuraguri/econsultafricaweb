import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { History, Vote, DollarSign, Tag, ShoppingBag, LogOut } from "lucide-react";

interface UserPollActivityProps {
  pollId: string;
}

interface ActivityEvent {
  id: string;
  type: string;
  label: string;
  detail?: string;
  amount?: number;
  amountSign?: "+" | "-";
  timestamp: string;
}

export default function UserPollActivity({ pollId }: UserPollActivityProps) {
  const { user } = useAuth();

  const { data: events = [], isLoading } = useQuery<ActivityEvent[]>({
    queryKey: ["user-poll-activity", pollId, user?.id],
    queryFn: async () => {
      if (!user) return [];
      const items: ActivityEvent[] = [];

      // 1. Votes
      const { data: votes } = await supabase
        .from("votes")
        .select("id, created_at, option_id, is_staked, stake_amount, entry_price")
        .eq("poll_id", pollId)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      // Get option labels
      const { data: options } = await supabase
        .from("poll_options")
        .select("id, label")
        .eq("poll_id", pollId);
      const optMap = new Map((options || []).map(o => [o.id, o.label]));

      votes?.forEach(v => {
        items.push({
          id: `vote-${v.id}`,
          type: "vote",
          label: `Voted "${optMap.get(v.option_id) || "Unknown"}"`,
          timestamp: v.created_at,
        });
        if (v.is_staked && v.stake_amount) {
          items.push({
            id: `stake-${v.id}`,
            type: "stake",
            label: `Committed capital on "${optMap.get(v.option_id) || "Unknown"}"`,
            amount: v.stake_amount,
            amountSign: "-",
            detail: `Entry price: $${Number(v.entry_price || 0).toFixed(2)}`,
            timestamp: v.created_at,
          });
        }
      });

      // 2. Trades (P2P buys and sells)
      const { data: trades } = await supabase
        .from("trades")
        .select("id, created_at, side, shares, price, total_amount, fee, option_id")
        .eq("poll_id", pollId)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      trades?.forEach(t => {
        const optLabel = optMap.get(t.option_id) || "Unknown";
        if (t.side === "buy") {
          items.push({
            id: `trade-buy-${t.id}`,
            type: "p2p_buy",
            label: `Bought ${Number(t.shares).toFixed(4)} shares of "${optLabel}"`,
            detail: `@ $${Number(t.price).toFixed(2)}/share`,
            amount: Number(t.total_amount),
            amountSign: "-",
            timestamp: t.created_at,
          });
        } else {
          items.push({
            id: `trade-sell-${t.id}`,
            type: "p2p_sell",
            label: `Sold ${Number(t.shares).toFixed(4)} shares of "${optLabel}"`,
            detail: `@ $${Number(t.price).toFixed(2)}/share · Fee: $${Number(t.fee).toFixed(2)}`,
            amount: Number(t.total_amount) - Number(t.fee),
            amountSign: "+",
            timestamp: t.created_at,
          });
        }
      });

      // 3. Listings (created, cancelled, sold)
      const { data: listings } = await (supabase as any)
        .from("listings")
        .select("id, created_at, updated_at, status, shares, price_per_share, total_ask, option_id")
        .eq("poll_id", pollId)
        .eq("seller_id", user.id)
        .order("created_at", { ascending: false });

      (listings || []).forEach((l: any) => {
        const optLabel = optMap.get(l.option_id) || "Unknown";
        items.push({
          id: `listing-created-${l.id}`,
          type: "listing_created",
          label: `Listed ${Number(l.shares).toFixed(4)} shares of "${optLabel}" for sale`,
          detail: `@ $${Number(l.price_per_share).toFixed(2)}/share · Total: $${Number(l.total_ask).toFixed(2)}`,
          timestamp: l.created_at,
        });
        if (l.status === "sold") {
          items.push({
            id: `listing-sold-${l.id}`,
            type: "listing_sold",
            label: `Listing sold — ${Number(l.shares).toFixed(4)} shares of "${optLabel}"`,
            amount: Number(l.total_ask) * 0.965,
            amountSign: "+",
            detail: `Buyer paid $${Number(l.total_ask).toFixed(2)}`,
            timestamp: l.updated_at || l.created_at,
          });
        } else if (l.status === "cancelled") {
          items.push({
            id: `listing-cancelled-${l.id}`,
            type: "listing_cancelled",
            label: `Listing cancelled — ${Number(l.shares).toFixed(4)} shares returned`,
            timestamp: l.updated_at || l.created_at,
          });
        }
      });

      // 4. Listings bought by this user
      const { data: boughtListings } = await (supabase as any)
        .from("listings")
        .select("id, updated_at, shares, price_per_share, total_ask, option_id")
        .eq("poll_id", pollId)
        .eq("buyer_id", user.id)
        .eq("status", "sold");

      (boughtListings || []).forEach((l: any) => {
        const optLabel = optMap.get(l.option_id) || "Unknown";
        // Only add if not already covered by trades
        const tradeExists = items.some(i => i.type === "p2p_buy" && Math.abs((i.amount || 0) - Number(l.total_ask)) < 0.01);
        if (!tradeExists) {
          items.push({
            id: `bought-listing-${l.id}`,
            type: "p2p_buy",
            label: `Bought ${Number(l.shares).toFixed(4)} shares of "${optLabel}" (P2P)`,
            amount: Number(l.total_ask),
            amountSign: "-",
            timestamp: l.updated_at,
          });
        }
      });

      items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      return items;
    },
    enabled: !!user,
  });

  if (!user) return null;
  if (isLoading) return null;
  if (events.length === 0) return null;

  const typeConfig: Record<string, { icon: typeof Vote; color: string }> = {
    vote:              { icon: Vote,        color: "text-blue-600 bg-blue-500/10" },
    stake:             { icon: DollarSign,  color: "text-orange-600 bg-orange-500/10" },
    p2p_buy:           { icon: ShoppingBag, color: "text-indigo-600 bg-indigo-500/10" },
    p2p_sell:          { icon: ShoppingBag, color: "text-teal-600 bg-teal-500/10" },
    listing_created:   { icon: Tag,         color: "text-amber-600 bg-amber-500/10" },
    listing_sold:      { icon: Tag,         color: "text-green-600 bg-green-500/10" },
    listing_cancelled: { icon: Tag,         color: "text-muted-foreground bg-muted" },
  };

  return (
    <div className="bg-card border border-border rounded-lg p-4 space-y-3">
      <div className="flex items-center gap-2">
        <History className="w-4 h-4 text-primary" />
        <span className="text-sm font-bold text-foreground">Your Activity on This Question</span>
        <span className="ml-auto text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
          {events.length} event{events.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="space-y-1.5">
        {events.map(ev => {
          const cfg = typeConfig[ev.type] || { icon: History, color: "text-muted-foreground bg-muted" };
          const Icon = cfg.icon;
          return (
            <div key={ev.id} className="flex items-start gap-2 py-1.5 border-b border-border/50 last:border-0">
              <div className={`w-5 h-5 rounded flex items-center justify-center shrink-0 mt-0.5 ${cfg.color}`}>
                <Icon className="w-3 h-3" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-foreground">{ev.label}</p>
                {ev.detail && <p className="text-[10px] text-muted-foreground">{ev.detail}</p>}
              </div>
              <div className="text-right shrink-0">
                {ev.amount != null && (
                  <p className={`font-mono text-[11px] font-semibold ${ev.amountSign === "+" ? "text-green-600" : "text-red-500"}`}>
                    {ev.amountSign}${ev.amount.toFixed(2)}
                  </p>
                )}
                <p className="text-[9px] text-muted-foreground">
                  {new Date(ev.timestamp).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
