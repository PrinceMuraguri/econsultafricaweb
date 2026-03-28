import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  BarChart3, TrendingUp, Clock, CheckCircle, XCircle,
  DollarSign, Activity, ArrowRight, User, Wallet, Plus
} from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface Position {
  id: string;
  poll_id: string;
  option_id: string;
  created_at: string;
  is_staked: boolean;
  stake_amount: number | null;
  poll_title: string;
  poll_status: string;
  poll_slug: string;
  option_label: string;
  winning_option_id: string | null;
  close_at: string;
  total_votes: number;
  option_votes: number;
  entry_price: number;
  potential_payout: number;
  outcome: "pending" | "won" | "lost";
}

const DEPOSIT_AMOUNTS = [1, 5, 10, 20, 50, 100, 250, 500, 1000];

const MyDashboard = () => {
  const { user, profile, wallet, refreshWallet } = useAuth();
  const { toast } = useToast();
  const [depositLoading, setDepositLoading] = useState(false);

  // Fetch user's votes with poll data
  const { data: positions, isLoading } = useQuery({
    queryKey: ["my-positions", user?.id],
    queryFn: async () => {
      if (!user) return [];
      // Get fingerprint from profile or generate
      const { data: userProfile } = await supabase
        .from("user_profiles")
        .select("voter_fingerprint")
        .eq("user_id", user.id)
        .maybeSingle();

      const fp = userProfile?.voter_fingerprint;
      if (!fp) return [];

      const { data: votes, error: votesErr } = await supabase
        .from("votes")
        .select("*")
        .eq("voter_fingerprint", fp)
        .order("created_at", { ascending: false });
      if (votesErr) throw votesErr;
      if (!votes?.length) return [];

      const pollIds = [...new Set(votes.map(v => v.poll_id))];
      const { data: polls } = await supabase
        .from("polls")
        .select("*, poll_options!poll_options_poll_id_fkey(*)")
        .in("id", pollIds);

      const pollMap = new Map(polls?.map(p => [p.id, p]) || []);

      return votes.map(vote => {
        const poll = pollMap.get(vote.poll_id);
        const options = poll?.poll_options || [];
        const option = options.find((o: any) => o.id === vote.option_id);
        const totalVotes = options.reduce((s: number, o: any) => s + o.total_votes_count, 0);
        const optionVotes = option?.total_votes_count || 0;
        const entryPrice = totalVotes > 0 ? Math.max(0.05, Math.min(0.95, Math.round((optionVotes / totalVotes) * 100) / 100)) : 0.50;

        let outcome: "pending" | "won" | "lost" = "pending";
        if (poll?.settled_at) {
          outcome = poll.winning_option_id === vote.option_id ? "won" : "lost";
        }

        const shares = vote.stake_amount ? Math.round(vote.stake_amount / entryPrice) : 0;
        const potentialPayout = vote.is_staked ? shares * 1.0 : 0;

        return {
          id: vote.id, poll_id: vote.poll_id, option_id: vote.option_id,
          created_at: vote.created_at, is_staked: vote.is_staked,
          stake_amount: vote.stake_amount, poll_title: poll?.title || "Unknown",
          poll_status: poll?.status || "unknown", poll_slug: poll?.slug || "",
          option_label: option?.label || "Unknown",
          winning_option_id: poll?.winning_option_id,
          close_at: poll?.close_at || "", total_votes: totalVotes,
          option_votes: optionVotes, entry_price: entryPrice,
          potential_payout: potentialPayout, outcome,
        } as Position;
      });
    },
    enabled: !!user,
  });

  // Fetch user's transactions
  const { data: transactions } = useQuery({
    queryKey: ["my-transactions", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data: userProfile } = await supabase
        .from("user_profiles")
        .select("voter_fingerprint")
        .eq("user_id", user.id)
        .maybeSingle();
      const fp = userProfile?.voter_fingerprint;
      if (!fp) return [];
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("voter_fingerprint", fp)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  // Fetch wallet transactions
  const { data: walletTxns } = useQuery({
    queryKey: ["my-wallet-transactions", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("wallet_transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  // Fetch payouts
  const { data: payouts } = useQuery({
    queryKey: ["my-payouts", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data: userProfile } = await supabase
        .from("user_profiles")
        .select("voter_fingerprint")
        .eq("user_id", user.id)
        .maybeSingle();
      const fp = userProfile?.voter_fingerprint;
      if (!fp) return [];
      const { data, error } = await supabase
        .from("payouts")
        .select("*")
        .eq("voter_fingerprint", fp)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const handleDeposit = async (amount: number) => {
    if (!user) return;
    setDepositLoading(true);
    try {
      const callbackUrl = `${window.location.origin}/my-dashboard?deposit=success`;
      const { data, error } = await supabase.functions.invoke("paystack-checkout", {
        body: {
          email: user.email,
          amount: amount, // USD amount — edge function converts to KES
          callback_url: callbackUrl,
          metadata: { type: "wallet_deposit", user_id: user.id },
        },
      });
      if (error || !data?.authorization_url) throw new Error(data?.error || "Failed to start deposit");
      window.location.href = data.authorization_url;
    } catch (err: any) {
      toast({ title: "Deposit Error", description: err.message, variant: "destructive" });
      setDepositLoading(false);
    }
  };

  if (!user) {
    return (
      <Layout>
        <section className="section-padding">
          <div className="container-page max-w-md mx-auto text-center">
            <User className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h1 className="font-display text-2xl font-bold text-foreground mb-2">My Dashboard</h1>
            <p className="text-sm text-muted-foreground mb-6">
              Sign in or create an account to view your dashboard.
            </p>
            <Link to="/">
              <Button>Go to Forecast Arena</Button>
            </Link>
          </div>
        </section>
      </Layout>
    );
  }

  const activePositions = positions?.filter(p => p.outcome === "pending") || [];
  const resolvedPositions = positions?.filter(p => p.outcome !== "pending") || [];
  const totalCommitted = positions?.reduce((s, p) => s + (p.stake_amount || 0), 0) || 0;
  const totalEarnings = payouts?.reduce((s, p) => s + p.amount, 0) || 0;
  const wonCount = resolvedPositions.filter(p => p.outcome === "won").length;

  return (
    <Layout>
      <section className="section-padding">
        <div className="container-page">
          {/* Header */}
          <div className="mb-8">
            <h1 className="font-display text-3xl font-bold text-foreground">My Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              Welcome back, {profile?.full_name || user.email}. Track your forecast positions and activity.
            </p>
          </div>

          {/* Profile Card */}
          {profile && (
            <div className="bg-card border border-border rounded-lg p-4 mb-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-foreground">{profile.full_name}</p>
                  <p className="text-xs text-muted-foreground">@{profile.username} · {profile.country} · {profile.occupation || "—"}</p>
                </div>
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            {[
              { icon: Wallet, label: "Wallet Balance", value: `$${(wallet?.balance_usd || 0).toFixed(2)}` },
              { icon: Activity, label: "Active Positions", value: activePositions.length },
              { icon: DollarSign, label: "Capital Committed", value: `$${totalCommitted.toFixed(2)}` },
              { icon: TrendingUp, label: "Total Earnings", value: `$${totalEarnings.toFixed(2)}` },
              { icon: CheckCircle, label: "Accuracy", value: resolvedPositions.length > 0 ? `${Math.round((wonCount / resolvedPositions.length) * 100)}%` : "—" },
            ].map((stat) => (
              <div key={stat.label} className="bg-card border border-border rounded-lg p-4">
                <stat.icon className="w-5 h-5 text-primary mb-2" />
                <p className="text-2xl font-bold font-mono text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Wallet Deposit */}
          <div className="mb-8">
            <h2 className="font-display text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <Wallet className="w-5 h-5 text-primary" />
              Add Funds
            </h2>
            <div className="flex flex-wrap gap-2">
              {DEPOSIT_AMOUNTS.map(amount => (
                <Button key={amount} variant="outline" size="sm"
                  onClick={() => handleDeposit(amount)} disabled={depositLoading}
                  className="font-mono">
                  <Plus className="w-3 h-3 mr-1" />${amount}
                </Button>
              ))}
            </div>
          </div>

          {/* Active Positions */}
          <div className="mb-8">
            <h2 className="font-display text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              Active Positions
            </h2>
            {isLoading ? (
              <p className="text-sm text-muted-foreground py-4">Loading...</p>
            ) : activePositions.length === 0 ? (
              <div className="bg-card border border-border rounded-lg p-6 text-center">
                <p className="text-sm text-muted-foreground mb-3">No active positions yet.</p>
                <Link to="/"><Button variant="outline" size="sm">Browse Forecast Questions <ArrowRight className="w-3.5 h-3.5 ml-1" /></Button></Link>
              </div>
            ) : (
              <div className="space-y-3">
                {activePositions.map(pos => {
                  const consensusPct = pos.total_votes > 0 ? Math.round((pos.option_votes / pos.total_votes) * 100) : 50;
                  const isYes = pos.option_label.toLowerCase() === "yes";
                  return (
                    <Link key={pos.id} to={`/forecast-arena/${pos.poll_slug}`} className="block">
                      <div className="bg-card border border-border rounded-lg p-4 hover:border-primary/40 transition-colors">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="text-sm font-semibold text-foreground leading-snug flex-1 mr-4">{pos.poll_title}</h3>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded ${isYes ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-500"}`}>
                            {pos.option_label}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>Entry: ${pos.entry_price.toFixed(2)}</span>
                          <span>Consensus: {consensusPct}%</span>
                          {pos.is_staked && <span className="text-primary font-semibold">Committed: ${pos.stake_amount?.toFixed(2)}</span>}
                          {pos.is_staked && <span className="text-green-600 font-semibold">Potential: ${pos.potential_payout.toFixed(2)}</span>}
                          <span className="flex items-center gap-1 ml-auto">
                            <Clock className="w-3 h-3" />
                            {new Date(pos.close_at) > new Date() ? "Open" : "Closing..."}
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Resolved Positions */}
          {resolvedPositions.length > 0 && (
            <div className="mb-8">
              <h2 className="font-display text-xl font-bold text-foreground mb-4">Past Positions</h2>
              <div className="space-y-3">
                {resolvedPositions.map(pos => (
                  <div key={pos.id} className="bg-card border border-border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-sm font-semibold text-foreground leading-snug flex-1 mr-4">{pos.poll_title}</h3>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded flex items-center gap-1 ${
                        pos.outcome === "won" ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-500"
                      }`}>
                        {pos.outcome === "won" ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        {pos.outcome === "won" ? "Correct" : "Incorrect"}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>Position: {pos.option_label}</span>
                      <span>Entry: ${pos.entry_price.toFixed(2)}</span>
                      {pos.is_staked && <span>Committed: ${pos.stake_amount?.toFixed(2)}</span>}
                      {pos.outcome === "won" && pos.is_staked && (
                        <span className="text-green-600 font-semibold">Earned: ${pos.potential_payout.toFixed(2)}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Wallet Transactions */}
          {walletTxns && walletTxns.length > 0 && (
            <div className="mb-8">
              <h2 className="font-display text-xl font-bold text-foreground mb-4">Wallet Activity</h2>
              <div className="bg-card border border-border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left px-4 py-2 font-medium text-muted-foreground">Date</th>
                        <th className="text-left px-4 py-2 font-medium text-muted-foreground">Type</th>
                        <th className="text-left px-4 py-2 font-medium text-muted-foreground">Amount</th>
                        <th className="text-left px-4 py-2 font-medium text-muted-foreground">Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {walletTxns.map((tx: any) => (
                        <tr key={tx.id} className="border-t border-border">
                          <td className="px-4 py-2 text-foreground">{new Date(tx.created_at).toLocaleDateString()}</td>
                          <td className="px-4 py-2 capitalize text-muted-foreground">{tx.type}</td>
                          <td className={`px-4 py-2 font-mono font-semibold ${tx.amount > 0 ? "text-green-600" : "text-red-500"}`}>
                            {tx.amount > 0 ? "+" : ""}${Math.abs(tx.amount).toFixed(2)}
                          </td>
                          <td className="px-4 py-2 text-muted-foreground">{tx.description || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Recent Transactions */}
          {transactions && transactions.length > 0 && (
            <div className="mb-8">
              <h2 className="font-display text-xl font-bold text-foreground mb-4">Transaction History</h2>
              <div className="bg-card border border-border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left px-4 py-2 font-medium text-muted-foreground">Date</th>
                        <th className="text-left px-4 py-2 font-medium text-muted-foreground">Amount</th>
                        <th className="text-left px-4 py-2 font-medium text-muted-foreground">Channel</th>
                        <th className="text-left px-4 py-2 font-medium text-muted-foreground">Status</th>
                        <th className="text-left px-4 py-2 font-medium text-muted-foreground">Reference</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((tx: any) => (
                        <tr key={tx.id} className="border-t border-border">
                          <td className="px-4 py-2 text-foreground">{new Date(tx.created_at).toLocaleDateString()}</td>
                          <td className="px-4 py-2 font-mono font-semibold text-foreground">${tx.amount.toFixed(2)}</td>
                          <td className="px-4 py-2 text-muted-foreground capitalize">{tx.channel}</td>
                          <td className="px-4 py-2">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                              tx.status === "completed" ? "bg-green-100 text-green-700" :
                              tx.status === "pending" ? "bg-yellow-100 text-yellow-700" :
                              "bg-red-100 text-red-700"
                            }`}>{tx.status}</span>
                          </td>
                          <td className="px-4 py-2 font-mono text-muted-foreground text-[10px]">{tx.reference}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Payouts */}
          {payouts && payouts.length > 0 && (
            <div>
              <h2 className="font-display text-xl font-bold text-foreground mb-4">Payouts</h2>
              <div className="bg-card border border-border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left px-4 py-2 font-medium text-muted-foreground">Date</th>
                        <th className="text-left px-4 py-2 font-medium text-muted-foreground">Amount</th>
                        <th className="text-left px-4 py-2 font-medium text-muted-foreground">Status</th>
                        <th className="text-left px-4 py-2 font-medium text-muted-foreground">Method</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payouts.map((p: any) => (
                        <tr key={p.id} className="border-t border-border">
                          <td className="px-4 py-2 text-foreground">{new Date(p.created_at).toLocaleDateString()}</td>
                          <td className="px-4 py-2 font-mono font-semibold text-green-600">${p.amount.toFixed(2)}</td>
                          <td className="px-4 py-2">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                              p.status === "completed" ? "bg-green-100 text-green-700" :
                              p.status === "pending" ? "bg-yellow-100 text-yellow-700" :
                              "bg-red-100 text-red-700"
                            }`}>{p.status}</span>
                          </td>
                          <td className="px-4 py-2 text-muted-foreground capitalize">{p.payout_method || "mpesa"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default MyDashboard;
