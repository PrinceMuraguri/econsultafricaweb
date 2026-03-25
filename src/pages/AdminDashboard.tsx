import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Shield, Lock, Eye, CheckCircle, DollarSign, Download,
  AlertTriangle, Loader2, BarChart3, Users, TrendingUp
} from "lucide-react";

const ADMIN_KEY_STORAGE = "econsult_admin_key";

const AdminDashboard = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [adminKey, setAdminKey] = useState(() => localStorage.getItem(ADMIN_KEY_STORAGE) || "");
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem(ADMIN_KEY_STORAGE));
  const [keyInput, setKeyInput] = useState("");
  const [activeTab, setActiveTab] = useState<"entries" | "polls" | "payouts" | "audit" | "downloads">("polls");
  const [selectedPollId, setSelectedPollId] = useState<string | null>(null);
  const [selectedWinnerOptionId, setSelectedWinnerOptionId] = useState<string>("");

  const handleLogin = () => {
    localStorage.setItem(ADMIN_KEY_STORAGE, keyInput);
    setAdminKey(keyInput);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem(ADMIN_KEY_STORAGE);
    setAdminKey("");
    setIsAuthenticated(false);
  };

  // Fetch all polls
  const { data: polls, isLoading: pollsLoading } = useQuery({
    queryKey: ["admin-polls"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("polls")
        .select("*, poll_options!poll_options_poll_id_fkey(*)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: isAuthenticated,
  });

  // Fetch all staked entries
  const { data: entries, isLoading: entriesLoading } = useQuery({
    queryKey: ["admin-entries", selectedPollId],
    queryFn: async () => {
      let query = supabase
        .from("votes")
        .select("*")
        .eq("is_staked", true)
        .order("created_at", { ascending: false });
      if (selectedPollId) query = query.eq("poll_id", selectedPollId);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: isAuthenticated,
  });

  // Fetch transactions
  const { data: transactions } = useQuery({
    queryKey: ["admin-transactions", selectedPollId],
    queryFn: async () => {
      let query = supabase
        .from("transactions")
        .select("*")
        .order("created_at", { ascending: false });
      if (selectedPollId) query = query.eq("poll_id", selectedPollId);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: isAuthenticated,
  });

  // Fetch payouts
  const { data: payouts, isLoading: payoutsLoading } = useQuery({
    queryKey: ["admin-payouts", selectedPollId],
    queryFn: async () => {
      let query = supabase
        .from("payouts")
        .select("*")
        .order("created_at", { ascending: false });
      if (selectedPollId) query = query.eq("poll_id", selectedPollId);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: isAuthenticated,
  });

  // Fetch payout winners view
  const { data: payoutWinners } = useQuery({
    queryKey: ["admin-payout-winners"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payout_winners")
        .select("*");
      if (error) throw error;
      return data;
    },
    enabled: isAuthenticated,
  });

  // Fetch audit log
  const { data: auditLog } = useQuery({
    queryKey: ["admin-audit-log"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_audit_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
    enabled: isAuthenticated,
  });

  // Fetch sample downloads
  const { data: sampleDownloads } = useQuery({
    queryKey: ["admin-sample-downloads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sample_downloads")
        .select("*")
        .order("downloaded_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data;
    },
    enabled: isAuthenticated,
  });

  // Settle market mutation
  const settleMutation = useMutation({
    mutationFn: async ({ pollId, winningOptionId }: { pollId: string; winningOptionId: string }) => {
      const { data, error } = await supabase.functions.invoke("settle-market", {
        body: { poll_id: pollId, winning_option_id: winningOptionId, admin_key: adminKey },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      toast({ title: "✅ Market Settled", description: `${data.summary.winners} winners, $${data.summary.total_payouts.toFixed(2)} in payouts created.` });
      queryClient.invalidateQueries({ queryKey: ["admin-polls"] });
      queryClient.invalidateQueries({ queryKey: ["admin-payouts"] });
      queryClient.invalidateQueries({ queryKey: ["admin-audit-log"] });
    },
    onError: (err: any) => {
      toast({ title: "Settlement Failed", description: err.message, variant: "destructive" });
    },
  });

  // Run payouts mutation
  const payoutMutation = useMutation({
    mutationFn: async (pollId: string) => {
      const { data, error } = await supabase.functions.invoke("run-payouts", {
        body: { poll_id: pollId, admin_key: adminKey },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      toast({ title: "💰 Payouts Processing", description: `${data.summary.processing} transfers initiated, ${data.summary.failed} failed.` });
      queryClient.invalidateQueries({ queryKey: ["admin-payouts"] });
      queryClient.invalidateQueries({ queryKey: ["admin-audit-log"] });
    },
    onError: (err: any) => {
      toast({ title: "Payout Failed", description: err.message, variant: "destructive" });
    },
  });

  // CSV export
  const exportCSV = (data: any[], filename: string) => {
    if (!data?.length) return;
    const headers = Object.keys(data[0]);
    const csv = [
      headers.join(","),
      ...data.map(row => headers.map(h => JSON.stringify(row[h] ?? "")).join(","))
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!isAuthenticated) {
    return (
      <Layout>
        <section className="section-padding">
          <div className="container-page max-w-md mx-auto">
            <div className="bg-card border border-border rounded-lg p-8 card-shadow text-center">
              <Lock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h1 className="font-display text-2xl font-bold text-foreground mb-2">Admin Access</h1>
              <p className="text-sm text-muted-foreground mb-6">Enter your admin key to access the Forecast Arena dashboard.</p>
              <div className="space-y-4">
                <Input
                  type="password"
                  placeholder="Admin key"
                  value={keyInput}
                  onChange={(e) => setKeyInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                />
                <Button onClick={handleLogin} className="w-full" disabled={!keyInput}>
                  <Shield className="w-4 h-4 mr-2" />
                  Access Dashboard
                </Button>
              </div>
            </div>
          </div>
        </section>
      </Layout>
    );
  }

  const selectedPoll = polls?.find((p: any) => p.id === selectedPollId);

  return (
    <Layout>
      <section className="section-padding">
        <div className="container-page">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="font-display text-3xl font-bold text-foreground">Forecast Arena Admin</h1>
              <p className="text-sm text-muted-foreground">Manage polls, settlements, and payouts</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout}>Logout</Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { icon: BarChart3, label: "Active Polls", value: polls?.filter((p: any) => p.status === "active").length || 0 },
              { icon: Users, label: "Staked Entries", value: entries?.length || 0 },
              { icon: DollarSign, label: "Total Staked", value: `$${(entries?.reduce((s: number, e: any) => s + (e.stake_amount || 0), 0) || 0).toFixed(2)}` },
              { icon: TrendingUp, label: "Pending Payouts", value: payouts?.filter((p: any) => p.status === "pending").length || 0 },
            ].map((stat) => (
              <div key={stat.label} className="bg-card border border-border rounded-lg p-4">
                <stat.icon className="w-5 h-5 text-primary mb-2" />
                <p className="text-2xl font-bold font-mono text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6 border-b border-border pb-4 flex-wrap">
            {([
              { key: "polls", label: "Polls & Settlement" },
              { key: "entries", label: "Staked Entries" },
              { key: "payouts", label: "Payouts & Transfers" },
              { key: "downloads", label: "Sample Downloads" },
              { key: "audit", label: "Audit Log" },
            ] as const).map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === tab.key
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Poll filter */}
          <div className="mb-6">
            <label className="text-xs font-medium text-muted-foreground block mb-2">Filter by Poll</label>
            <select
              value={selectedPollId || ""}
              onChange={(e) => setSelectedPollId(e.target.value || null)}
              className="w-full max-w-sm border border-border rounded-md px-3 py-2 text-sm bg-background text-foreground"
            >
              <option value="">All Polls</option>
              {polls?.map((p: any) => (
                <option key={p.id} value={p.id}>{p.title} ({p.status})</option>
              ))}
            </select>
          </div>

          {/* Tab: Polls & Settlement */}
          {activeTab === "polls" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-xl font-bold text-foreground">Polls & Settlement</h2>
              </div>

              {pollsLoading ? (
                <div className="flex items-center gap-2 text-muted-foreground py-8">
                  <Loader2 className="w-4 h-4 animate-spin" /> Loading...
                </div>
              ) : (
                <div className="space-y-4">
                  {polls?.map((poll: any) => {
                    const totalVotes = poll.poll_options?.reduce((s: number, o: any) => s + o.total_votes_count, 0) || 0;
                    const totalStake = poll.poll_options?.reduce((s: number, o: any) => s + o.total_stake_amount, 0) || 0;
                    const isSettled = !!poll.settled_at;

                    return (
                      <div key={poll.id} className="bg-card border border-border rounded-lg p-5">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-semibold text-foreground">{poll.title}</h3>
                            <p className="text-xs text-muted-foreground">
                              Status: <span className={`font-semibold ${poll.status === 'active' ? 'text-green-600' : poll.status === 'settled' ? 'text-primary' : 'text-muted-foreground'}`}>{poll.status}</span>
                              {" · "}{totalVotes} votes · ${totalStake.toFixed(2)} staked
                            </p>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded-full ${isSettled ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                            {isSettled ? "Settled" : "Open"}
                          </span>
                        </div>

                        {/* Options */}
                        <div className="space-y-2 mb-4">
                          {poll.poll_options?.map((opt: any) => {
                            const pct = totalVotes > 0 ? Math.round((opt.total_votes_count / totalVotes) * 100) : 0;
                            const isWinner = poll.winning_option_id === opt.id;
                            return (
                              <div key={opt.id} className={`flex items-center justify-between px-3 py-2 rounded-md border text-sm ${
                                isWinner ? "border-green-500 bg-green-50" : "border-border"
                              }`}>
                                <span className="font-medium text-foreground">
                                  {isWinner && <CheckCircle className="w-3.5 h-3.5 text-green-600 inline mr-1" />}
                                  {opt.label}
                                </span>
                                <span className="font-mono text-xs text-muted-foreground">
                                  {opt.total_votes_count} votes ({pct}%) · ${opt.total_stake_amount.toFixed(2)}
                                </span>
                              </div>
                            );
                          })}
                        </div>

                        {/* Settlement controls */}
                        {!isSettled && (
                          <div className="border-t border-border pt-4 space-y-3">
                            <p className="text-xs font-semibold text-foreground">Settle this market</p>
                            <div className="flex gap-2 items-center flex-wrap">
                              <select
                                className="border border-border rounded-md px-3 py-2 text-sm bg-background text-foreground"
                                value={selectedPollId === poll.id ? selectedWinnerOptionId : ""}
                                onChange={(e) => { setSelectedPollId(poll.id); setSelectedWinnerOptionId(e.target.value); }}
                              >
                                <option value="">Select winning outcome</option>
                                {poll.poll_options?.map((opt: any) => (
                                  <option key={opt.id} value={opt.id}>{opt.label}</option>
                                ))}
                              </select>
                              <Button
                                size="sm"
                                disabled={!(selectedPollId === poll.id && selectedWinnerOptionId) || settleMutation.isPending}
                                onClick={() => {
                                  if (confirm(`Are you sure you want to settle "${poll.title}" with winner "${poll.poll_options?.find((o: any) => o.id === selectedWinnerOptionId)?.label}"? This cannot be undone.`)) {
                                    settleMutation.mutate({ pollId: poll.id, winningOptionId: selectedWinnerOptionId });
                                  }
                                }}
                                className="bg-primary"
                              >
                                {settleMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-1" />}
                                Validate & Settle
                              </Button>
                            </div>
                          </div>
                        )}

                        {/* Payout controls for settled polls */}
                        {isSettled && (
                          <div className="border-t border-border pt-4 flex gap-2 flex-wrap">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => { setSelectedPollId(poll.id); setActiveTab("payouts"); }}
                            >
                              <Eye className="w-4 h-4 mr-1" /> Preview Payouts
                            </Button>
                            <Button
                              size="sm"
                              disabled={payoutMutation.isPending}
                              onClick={() => {
                                if (confirm(`Run M-PESA payouts for "${poll.title}"? This will transfer funds to all winners.`)) {
                                  payoutMutation.mutate(poll.id);
                                }
                              }}
                              className="bg-green-600 hover:bg-green-700 text-white"
                            >
                              {payoutMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <DollarSign className="w-4 h-4 mr-1" />}
                              Run Payouts
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Tab: Staked Entries */}
          {activeTab === "entries" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-xl font-bold text-foreground">
                  Staked Entries {entries?.length ? `(${entries.length})` : ""}
                </h2>
                <Button variant="outline" size="sm" onClick={() => exportCSV(entries || [], "staked_entries")}>
                  <Download className="w-4 h-4 mr-1" /> Export CSV
                </Button>
              </div>

              {entriesLoading ? (
                <div className="flex items-center gap-2 text-muted-foreground py-8">
                  <Loader2 className="w-4 h-4 animate-spin" /> Loading...
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-left">
                        <th className="pb-2 text-xs text-muted-foreground font-medium">Date</th>
                        <th className="pb-2 text-xs text-muted-foreground font-medium">Fingerprint</th>
                        <th className="pb-2 text-xs text-muted-foreground font-medium">Option</th>
                        <th className="pb-2 text-xs text-muted-foreground font-medium">Stake</th>
                        <th className="pb-2 text-xs text-muted-foreground font-medium">Reference</th>
                      </tr>
                    </thead>
                    <tbody>
                      {entries?.map((entry: any) => (
                        <tr key={entry.id} className="border-b border-border/50">
                          <td className="py-2 font-mono text-xs">{new Date(entry.created_at).toLocaleDateString()}</td>
                          <td className="py-2 font-mono text-xs">{entry.voter_fingerprint?.slice(0, 12)}...</td>
                          <td className="py-2 text-xs">{entry.option_id?.slice(0, 8)}</td>
                          <td className="py-2 font-mono text-xs font-semibold">${entry.stake_amount?.toFixed(2)}</td>
                          <td className="py-2 font-mono text-xs">{entry.payment_reference || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {(!entries || entries.length === 0) && (
                    <p className="text-center text-muted-foreground py-8">No staked entries found.</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Tab: Payouts */}
          {activeTab === "payouts" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-xl font-bold text-foreground">
                  Payouts {payouts?.length ? `(${payouts.length})` : ""}
                </h2>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => exportCSV(payoutWinners || [], "payout_winners")}>
                    <Download className="w-4 h-4 mr-1" /> Export Winners
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => exportCSV(payouts || [], "payouts")}>
                    <Download className="w-4 h-4 mr-1" /> Export All
                  </Button>
                </div>
              </div>

              {payoutsLoading ? (
                <div className="flex items-center gap-2 text-muted-foreground py-8">
                  <Loader2 className="w-4 h-4 animate-spin" /> Loading...
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-left">
                        <th className="pb-2 text-xs text-muted-foreground font-medium">Date</th>
                        <th className="pb-2 text-xs text-muted-foreground font-medium">Fingerprint</th>
                        <th className="pb-2 text-xs text-muted-foreground font-medium">Amount</th>
                        <th className="pb-2 text-xs text-muted-foreground font-medium">Status</th>
                        <th className="pb-2 text-xs text-muted-foreground font-medium">Reference</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payouts?.map((payout: any) => (
                        <tr key={payout.id} className="border-b border-border/50">
                          <td className="py-2 font-mono text-xs">{new Date(payout.created_at).toLocaleDateString()}</td>
                          <td className="py-2 font-mono text-xs">{payout.voter_fingerprint?.slice(0, 12)}...</td>
                          <td className="py-2 font-mono text-xs font-semibold">${payout.amount?.toFixed(2)}</td>
                          <td className="py-2">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              payout.status === "success" ? "bg-green-100 text-green-700" :
                              payout.status === "processing" ? "bg-blue-100 text-blue-700" :
                              payout.status === "failed" ? "bg-red-100 text-red-700" :
                              "bg-yellow-100 text-yellow-700"
                            }`}>
                              {payout.status}
                            </span>
                          </td>
                          <td className="py-2 font-mono text-xs">{payout.reference || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {(!payouts || payouts.length === 0) && (
                    <p className="text-center text-muted-foreground py-8">No payouts found.</p>
                  )}
                </div>
              )}

              {/* Payout Winners */}
              {payoutWinners && payoutWinners.length > 0 && (
                <div className="mt-8">
                  <h3 className="font-display text-lg font-bold text-foreground mb-4">Winner Details</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border text-left">
                          <th className="pb-2 text-xs text-muted-foreground font-medium">Name</th>
                          <th className="pb-2 text-xs text-muted-foreground font-medium">Email</th>
                          <th className="pb-2 text-xs text-muted-foreground font-medium">Phone</th>
                          <th className="pb-2 text-xs text-muted-foreground font-medium">Poll</th>
                          <th className="pb-2 text-xs text-muted-foreground font-medium">Stake</th>
                          <th className="pb-2 text-xs text-muted-foreground font-medium">Payout</th>
                          <th className="pb-2 text-xs text-muted-foreground font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {payoutWinners.map((w: any, i: number) => (
                          <tr key={i} className="border-b border-border/50">
                            <td className="py-2 text-xs">{w.full_name || "—"}</td>
                            <td className="py-2 text-xs">{w.email || "—"}</td>
                            <td className="py-2 font-mono text-xs">{w.phone_number || "—"}</td>
                            <td className="py-2 text-xs">{w.poll_title}</td>
                            <td className="py-2 font-mono text-xs">${w.stake_amount?.toFixed(2)}</td>
                            <td className="py-2 font-mono text-xs font-semibold">${w.payout_amount?.toFixed(2)}</td>
                            <td className="py-2">
                              <span className={`text-xs px-2 py-0.5 rounded-full ${
                                w.payout_status === "success" ? "bg-green-100 text-green-700" :
                                w.payout_status === "processing" ? "bg-blue-100 text-blue-700" :
                                "bg-yellow-100 text-yellow-700"
                              }`}>
                                {w.payout_status || "pending"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}


          {/* Tab: Sample Downloads */}
          {activeTab === "downloads" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-xl font-bold text-foreground">
                  Sample Downloads {sampleDownloads?.length ? `(${sampleDownloads.length})` : ""}
                </h2>
                <Button variant="outline" size="sm" onClick={() => exportCSV(sampleDownloads || [], "sample_downloads")}>
                  <Download className="w-4 h-4 mr-1" /> Export CSV
                </Button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                <div className="bg-card border border-border rounded-lg p-4">
                  <p className="text-2xl font-bold font-mono text-foreground">{sampleDownloads?.length || 0}</p>
                  <p className="text-xs text-muted-foreground">Total Downloads</p>
                </div>
                <div className="bg-card border border-border rounded-lg p-4">
                  <p className="text-2xl font-bold font-mono text-foreground">
                    {sampleDownloads?.filter((d: any) => {
                      const downloadDate = new Date(d.downloaded_at);
                      const now = new Date();
                      return now.getTime() - downloadDate.getTime() < 86400000;
                    }).length || 0}
                  </p>
                  <p className="text-xs text-muted-foreground">Last 24 Hours</p>
                </div>
                <div className="bg-card border border-border rounded-lg p-4">
                  <p className="text-2xl font-bold font-mono text-foreground">
                    {new Set(sampleDownloads?.map((d: any) => d.fingerprint).filter(Boolean)).size || 0}
                  </p>
                  <p className="text-xs text-muted-foreground">Unique Users</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left">
                      <th className="pb-2 text-xs text-muted-foreground font-medium">Timestamp</th>
                      <th className="pb-2 text-xs text-muted-foreground font-medium">Source Page</th>
                      <th className="pb-2 text-xs text-muted-foreground font-medium">Referrer</th>
                      <th className="pb-2 text-xs text-muted-foreground font-medium">Fingerprint</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sampleDownloads?.map((dl: any) => (
                      <tr key={dl.id} className="border-b border-border/50">
                        <td className="py-2 font-mono text-xs">{new Date(dl.downloaded_at).toLocaleString()}</td>
                        <td className="py-2 text-xs">{dl.source_page}</td>
                        <td className="py-2 text-xs truncate max-w-[200px]">{dl.referrer || "—"}</td>
                        <td className="py-2 font-mono text-xs">{dl.fingerprint?.slice(0, 12) || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {(!sampleDownloads || sampleDownloads.length === 0) && (
                  <p className="text-center text-muted-foreground py-8">No downloads recorded yet.</p>
                )}
              </div>
            </div>
          )}

          {/* Tab: Audit Log */}
          {activeTab === "audit" && (
            <div className="space-y-4">
              <h2 className="font-display text-xl font-bold text-foreground">Audit Log</h2>
              <div className="space-y-2">
                {auditLog?.map((log: any) => (
                  <div key={log.id} className="bg-card border border-border rounded-md px-4 py-3 flex items-start gap-3">
                    <AlertTriangle className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold text-foreground uppercase">{log.action}</span>
                        <span className="text-xs text-muted-foreground">· {log.entity_type}</span>
                        <span className="text-xs font-mono text-muted-foreground ml-auto">
                          {new Date(log.created_at).toLocaleString()}
                        </span>
                      </div>
                      <pre className="text-xs text-muted-foreground bg-muted/50 rounded p-2 overflow-x-auto">
                        {JSON.stringify(log.details, null, 2)}
                      </pre>
                    </div>
                  </div>
                ))}
                {(!auditLog || auditLog.length === 0) && (
                  <p className="text-center text-muted-foreground py-8">No audit entries yet.</p>
                )}
              </div>
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default AdminDashboard;
