import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Loader2, ShoppingBag, Tag, X, CheckCircle } from "lucide-react";
import type { Poll } from "@/hooks/use-polls";

interface ListingRow {
  id: string;
  seller_id: string;
  poll_id: string;
  option_id: string;
  shares: number;
  price_per_share: number;
  total_ask: number;
  status: string;
  created_at: string;
  poll_options: { label: string } | null;
}

interface ListingsPanelProps {
  poll: Poll;
}

export default function ListingsPanel({ poll }: ListingsPanelProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [buyingId, setBuyingId] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<string | null>(null);

  // Fetch active listings for this poll
  const { data: listings = [], isLoading } = useQuery<ListingRow[]>({
    queryKey: ["listings", poll.id],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("listings")
        .select("*, poll_options(label)")
        .eq("poll_id", poll.id)
        .eq("status", "active")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as ListingRow[];
    },
  });

  // Fetch buyer's wallet balance
  const { data: wallet } = useQuery({
    queryKey: ["wallet-balance", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from("wallets")
        .select("balance_usd")
        .eq("user_id", user.id)
        .single();
      return data;
    },
    enabled: !!user,
  });

  // Realtime: refresh listings on any change + on reconnect after network gap
  useEffect(() => {
    const invalidate = () => queryClient.invalidateQueries({ queryKey: ["listings", poll.id] });

    const channel = supabase
      .channel(`listings-panel-${poll.id}`)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "listings",
        filter: `poll_id=eq.${poll.id}`,
      }, invalidate)
      .subscribe((status) => {
        // Re-fetch when the subscription reconnects after a network gap
        // so stale listings (bought/cancelled while offline) are cleared
        if (status === "SUBSCRIBED") invalidate();
      });

    return () => { supabase.removeChannel(channel); };
  }, [poll.id, queryClient]);

  const handleBuy = async (listing: ListingRow) => {
    if (!user) { toast({ title: "Sign in to buy", variant: "destructive" }); return; }
    setBuyingId(listing.id);
    try {
      const { data, error } = await supabase.functions.invoke("buy-listing", {
        body: { listing_id: listing.id },
      });
      if (error || data?.error) throw new Error(data?.error || error?.message);

      toast({
        title: "Purchase complete! 🎉",
        description: `You acquired ${Number(listing.shares).toFixed(4)} shares at $${Number(listing.price_per_share).toFixed(2)}/share`,
      });
      queryClient.invalidateQueries({ queryKey: ["listings", poll.id] });
      queryClient.invalidateQueries({ queryKey: ["positions-card", poll.id] });
      queryClient.invalidateQueries({ queryKey: ["user-stake", poll.id] });
      queryClient.invalidateQueries({ queryKey: ["wallet-balance", user.id] });
      queryClient.invalidateQueries({ queryKey: ["my-wallet-transactions"] });
      setConfirming(null);
    } catch (err: any) {
      toast({ title: "Purchase failed", description: err.message, variant: "destructive" });
    } finally {
      setBuyingId(null);
    }
  };

  const handleCancel = async (listing: ListingRow) => {
    if (!user) return;
    setCancellingId(listing.id);
    try {
      const { data, error } = await supabase.functions.invoke("cancel-listing", {
        body: { listing_id: listing.id },
      });
      if (error || data?.error) throw new Error(data?.error || error?.message);

      toast({ title: "Listing cancelled", description: "Your shares have been returned to your position." });
      queryClient.invalidateQueries({ queryKey: ["listings", poll.id] });
      queryClient.invalidateQueries({ queryKey: ["positions-card", poll.id] });
      queryClient.invalidateQueries({ queryKey: ["user-stake", poll.id] });
      queryClient.invalidateQueries({ queryKey: ["user-listings", poll.id] });
    } catch (err: any) {
      toast({ title: "Cancellation failed", description: err.message, variant: "destructive" });
    } finally {
      setCancellingId(null);
    }
  };

  if (isLoading) return null;
  if (listings.length === 0) return null;

  const walletBalance = Number(wallet?.balance_usd || 0);

  return (
    <div className="bg-card border border-border rounded-lg p-4 space-y-3">
      <div className="flex items-center gap-2">
        <ShoppingBag className="w-4 h-4 text-primary" />
        <span className="text-sm font-bold text-foreground">Peer-to-peer marketplace</span>
        <span className="ml-auto text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
          {listings.length} listing{listings.length !== 1 ? "s" : ""} available
        </span>
      </div>

      {user && (
        <div className="text-[10px] text-muted-foreground">
          Your wallet: <span className="font-mono font-semibold text-foreground">${walletBalance.toFixed(2)}</span>
          {walletBalance === 0 && (
            <span className="ml-1 text-amber-600">— fund your wallet to buy</span>
          )}
        </div>
      )}

      <div className="space-y-2">
        {listings.map((listing) => {
          const isOwnListing = user?.id === listing.seller_id;
          const canAfford = walletBalance >= Number(listing.total_ask);
          const isConfirming = confirming === listing.id;
          const isBuying = buyingId === listing.id;
          const isCancelling = cancellingId === listing.id;
          const optionLabel = listing.poll_options?.label || "Unknown";

          return (
            <div
              key={listing.id}
              className={`border rounded-lg p-3 space-y-2 transition-colors ${
                isOwnListing
                  ? "border-primary/30 bg-primary/5"
                  : "border-border bg-muted/20"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Tag className="w-3 h-3 text-muted-foreground" />
                  <span className="text-[11px] font-semibold text-foreground">{optionLabel}</span>
                  {isOwnListing && (
                    <span className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-medium">Your listing</span>
                  )}
                </div>
                <span className="text-[10px] text-muted-foreground">
                  {new Date(listing.created_at).toLocaleDateString()}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-[10px]">
                <div>
                  <p className="text-muted-foreground">Shares</p>
                  <p className="font-mono font-bold text-foreground">{Number(listing.shares).toFixed(4)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Price/share</p>
                  <p className="font-mono font-bold text-foreground">${Number(listing.price_per_share).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Total ask</p>
                  <p className="font-mono font-bold text-foreground">${Number(listing.total_ask).toFixed(2)}</p>
                </div>
              </div>

              {isOwnListing ? (
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full text-[10px] h-7 text-destructive border-destructive/30 hover:bg-destructive/5"
                  disabled={isCancelling}
                  onClick={() => handleCancel(listing)}
                >
                  {isCancelling ? (
                    <><Loader2 className="w-3 h-3 mr-1 animate-spin" />Cancelling…</>
                  ) : (
                    <><X className="w-3 h-3 mr-1" />Cancel listing</>
                  )}
                </Button>
              ) : user ? (
                isConfirming ? (
                  <div className="space-y-1.5">
                    <p className="text-[10px] text-foreground font-medium text-center">
                      Confirm: pay <span className="font-mono font-bold">${Number(listing.total_ask).toFixed(2)}</span> from wallet?
                    </p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="flex-1 text-[10px] h-7 bg-green-600 hover:bg-green-700"
                        disabled={isBuying || !canAfford}
                        onClick={() => handleBuy(listing)}
                      >
                        {isBuying ? (
                          <><Loader2 className="w-3 h-3 mr-1 animate-spin" />Buying…</>
                        ) : (
                          <><CheckCircle className="w-3 h-3 mr-1" />Confirm buy</>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 text-[10px] h-7"
                        onClick={() => setConfirming(null)}
                        disabled={isBuying}
                      >
                        Back
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    className="w-full text-[10px] h-7"
                    disabled={!canAfford}
                    onClick={() => setConfirming(listing.id)}
                  >
                    {canAfford ? "Buy these shares" : `Need $${Number(listing.total_ask).toFixed(2)} in wallet`}
                  </Button>
                )
              ) : (
                <p className="text-[10px] text-muted-foreground text-center">Sign in to buy</p>
              )}
            </div>
          );
        })}
      </div>

      <p className="text-[9px] text-muted-foreground text-center">
        P2P trades are instant. Platform takes 3.5% from seller. Buyer pays full ask price.
      </p>
    </div>
  );
}
