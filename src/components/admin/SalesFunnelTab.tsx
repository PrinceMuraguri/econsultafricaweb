import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Download, BarChart3, Eye, ShoppingCart, CreditCard, Mail, MousePointer } from "lucide-react";

const EVENT_LABELS: Record<string, { label: string; icon: any; color: string }> = {
  marketplace_view: { label: "Marketplace Views", icon: Eye, color: "bg-blue-100 text-blue-700" },
  product_click: { label: "Product Clicks", icon: MousePointer, color: "bg-indigo-100 text-indigo-700" },
  sample_view: { label: "Sample Views", icon: Eye, color: "bg-purple-100 text-purple-700" },
  add_to_cart: { label: "Add to Cart", icon: ShoppingCart, color: "bg-amber-100 text-amber-700" },
  checkout_start: { label: "Checkout Started", icon: CreditCard, color: "bg-orange-100 text-orange-700" },
  purchase_complete: { label: "Purchases", icon: CreditCard, color: "bg-green-100 text-green-700" },
  download_report: { label: "Downloads", icon: Download, color: "bg-teal-100 text-teal-700" },
  email_sent: { label: "Emails Sent", icon: Mail, color: "bg-cyan-100 text-cyan-700" },
};

const FUNNEL_ORDER = ["marketplace_view", "product_click", "sample_view", "add_to_cart", "checkout_start", "purchase_complete", "download_report", "email_sent"];

export default function SalesFunnelTab() {
  const { data: events, isLoading } = useQuery({
    queryKey: ["admin-sales-funnel"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sales_funnel_events" as any)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1000);
      if (error) throw error;
      return data as any[];
    },
    refetchInterval: 15000,
  });

  const exportCSV = (data: any[], filename: string) => {
    if (!data?.length) return;
    const headers = Object.keys(data[0]);
    const csv = [headers.join(","), ...data.map(row => headers.map(h => JSON.stringify(row[h] ?? "")).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Aggregate counts by event_type
  const counts: Record<string, number> = {};
  events?.forEach((e: any) => {
    counts[e.event_type] = (counts[e.event_type] || 0) + 1;
  });

  // Product breakdown
  const productCounts: Record<string, Record<string, number>> = {};
  events?.forEach((e: any) => {
    if (e.product_title) {
      if (!productCounts[e.product_title]) productCounts[e.product_title] = {};
      productCounts[e.product_title][e.event_type] = (productCounts[e.product_title][e.event_type] || 0) + 1;
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-bold text-foreground">📊 Sales Funnel</h2>
        <Button variant="outline" size="sm" onClick={() => exportCSV(events || [], "sales_funnel")}>
          <Download className="w-4 h-4 mr-1" /> Export CSV
        </Button>
      </div>

      {/* Funnel visualization */}
      <div className="space-y-2">
        {FUNNEL_ORDER.map((key, i) => {
          const count = counts[key] || 0;
          const maxCount = Math.max(...FUNNEL_ORDER.map(k => counts[k] || 0), 1);
          const pct = Math.round((count / maxCount) * 100);
          const info = EVENT_LABELS[key] || { label: key, color: "bg-muted text-muted-foreground" };
          const prevCount = i > 0 ? (counts[FUNNEL_ORDER[i - 1]] || 0) : 0;
          const convRate = i > 0 && prevCount > 0 ? Math.round((count / prevCount) * 100) : null;

          return (
            <div key={key} className="flex items-center gap-3">
              <div className="w-36 text-xs font-medium text-foreground truncate">{info.label}</div>
              <div className="flex-1 bg-muted rounded-full h-6 overflow-hidden">
                <div className={`h-full ${info.color} rounded-full flex items-center px-2 text-[10px] font-bold`} style={{ width: `${Math.max(pct, 5)}%` }}>
                  {count}
                </div>
              </div>
              {convRate !== null && (
                <span className="text-[10px] text-muted-foreground w-12 text-right">{convRate}%</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Product breakdown */}
      {Object.keys(productCounts).length > 0 && (
        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="text-sm font-bold text-foreground mb-3">By Product</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-3 py-2 font-medium text-muted-foreground">Product</th>
                  {FUNNEL_ORDER.map(k => (
                    <th key={k} className="text-center px-2 py-2 font-medium text-muted-foreground">{EVENT_LABELS[k]?.label?.split(" ")[0] || k}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Object.entries(productCounts).map(([title, evts]) => (
                  <tr key={title} className="border-t border-border/50">
                    <td className="px-3 py-1.5 text-foreground max-w-[200px] truncate">{title}</td>
                    {FUNNEL_ORDER.map(k => (
                      <td key={k} className="px-2 py-1.5 text-center font-mono">{evts[k] || 0}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recent events */}
      <div className="bg-card border border-border rounded-lg overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-3 py-2 font-medium text-muted-foreground">Date</th>
              <th className="text-left px-3 py-2 font-medium text-muted-foreground">Event</th>
              <th className="text-left px-3 py-2 font-medium text-muted-foreground">Product</th>
              <th className="text-left px-3 py-2 font-medium text-muted-foreground">Email</th>
              <th className="text-left px-3 py-2 font-medium text-muted-foreground">Fingerprint</th>
            </tr>
          </thead>
          <tbody>
            {events?.slice(0, 100).map((e: any) => {
              const info = EVENT_LABELS[e.event_type] || { label: e.event_type, color: "bg-muted text-muted-foreground" };
              return (
                <tr key={e.id} className="border-t border-border/50">
                  <td className="px-3 py-1.5 text-foreground whitespace-nowrap">{new Date(e.created_at).toLocaleString()}</td>
                  <td className="px-3 py-1.5">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${info.color}`}>{info.label}</span>
                  </td>
                  <td className="px-3 py-1.5 text-foreground max-w-[200px] truncate">{e.product_title || "—"}</td>
                  <td className="px-3 py-1.5 text-muted-foreground">{e.user_email || "—"}</td>
                  <td className="px-3 py-1.5 font-mono text-muted-foreground">{e.user_fingerprint?.slice(0, 12) || "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {(!events || events.length === 0) && (
          <p className="text-center text-muted-foreground py-8">No funnel events yet. Events will appear as users interact with the marketplace.</p>
        )}
      </div>
    </div>
  );
}
