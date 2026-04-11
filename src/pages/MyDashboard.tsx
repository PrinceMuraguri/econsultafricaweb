import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import Layout from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Activity, ArrowRight, User, Wallet } from "lucide-react";
import { useState, useEffect, useMemo, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import DualCurrency from "@/components/DualCurrency";
import FreeForecastsTab from "@/components/dashboard/FreeForecastsTab";
import ProTradingTab from "@/components/dashboard/ProTradingTab";

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
  payment_reference?: string | null;
}

type ActivityItem = {
  id: string;
  kind: string;
  label: string;
  description?: string;
  amount?: number;
  amountSign?: '+' | '-';
  link?: string;
  timestamp: string;
};

const MyDashboard = () => {
  const { user, profile, wallet, loading, refreshWallet, refreshProfile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  // Tab state: auto-detect or use URL param
  const [dashboardMode, setDashboardMode] = useState<"free" | "pro">(
    (searchParams.get("tab") as "free" | "pro") || "free"
  );

  // Auto-refresh wallet & profile on mount and after deposit return
  useEffect(() => {
    if (!user) return;
    const params = new URLSearchParams(window.location.search);
    const isDepositReturn = params.get("deposit") === "success";

    refreshWallet();
    refreshProfile();

    if (isDepositReturn) {
      toast({ title: "💰 Deposit processing", description: "Your wallet balance will update shortly." });
      const interval = setInterval(() => refreshWallet(), 3000);
      setTimeout(() => clearInterval(interval), 30000);
      // Preserve tab param
      const tab = params.get("tab");
      window.history.replaceState({}, "", tab ? `/my-dashboard?tab=${tab}` : "/my-dashboard");
    }
  }, [user]);

  // Realtime subscriptions
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`dashboard-${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'wallets', filter: `user_id=eq.${user.id}` }, () => refreshWallet())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'wallet_transactions', filter: `user_id=eq.${user.id}` }, () => {
        queryClient.invalidateQueries({ queryKey: ['my-wallet-transactions', user.id] });
        queryClient.invalidateQueries({ queryKey: ['my-wallet-payouts', user.id] });
        refreshWallet();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'votes' }, () => {
        queryClient.invalidateQueries({ queryKey: ['my-positions', user.id] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payouts' }, () => {
        queryClient.invalidateQueries({ queryKey: ['my-payouts', user.id] });
        queryClient.invalidateQueries({ queryKey: ['my-wallet-payouts', user.id] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'positions', filter: `user_id=eq.${user.id}` }, () => {
        queryClient.invalidateQueries({ queryKey: ['my-share-positions', user.id] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trades', filter: `user_id=eq.${user.id}` }, () => {
        queryClient.invalidateQueries({ queryKey: ['my-trades', user.id] });
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, () => {
        queryClient.invalidateQueries({ queryKey: ['my-notifications', user.id] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'listings', filter: `seller_id=eq.${user.id}` }, () => {
        queryClient.invalidateQueries({ queryKey: ['my-active-listings', user.id] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'polls' }, () => {
        queryClient.invalidateQueries({ queryKey: ['my-positions', user.id] });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  // Fetch user's votes
  const { data: positions, isLoading } = useQuery({
    queryKey: ["my-positions", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data: userVotes } = await supabase
        .from("votes")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      const { data: userProfile } = await supabase
        .from("user_profiles")
        .select("voter_fingerprint")
        .eq("user_id", user.id)
        .maybeSingle();

      let fpVotes: any[] = [];
      if (userProfile?.voter_fingerprint) {
        const { data } = await supabase
          .from("votes")
          .select("*")
          .eq("voter_fingerprint", userProfile.voter_fingerprint)
          .is("user_id", null)
          .order("created_at", { ascending: false });
        fpVotes = data || [];
      }

      const allVotes = [...(userVotes || []), ...fpVotes];
      const seenPolls = new Set<string>();
      const deduped = allVotes.filter(v => {
        if (seenPolls.has(v.poll_id)) return false;
        seenPolls.add(v.poll_id);
        return true;
      });

      if (!deduped.length) return [];

      const pollIds = [...new Set(deduped.map(v => v.poll_id))];
      const { data: polls } = await supabase
        .from("polls")
        .select("*, poll_options!poll_options_poll_id_fkey(*)")
        .in("id", pollIds);

      const pollMap = new Map(polls?.map(p => [p.id, p]) || []);

      return deduped.map(vote => {
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
          payment_reference: vote.payment_reference,
        } as Position;
      });
    },
    enabled: !!user,
    refetchInterval: 15000,
  });

  // Fetch transactions
  const { data: transactions } = useQuery({
    queryKey: ["my-transactions", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data: userProfile } = await supabase
        .from("user_profiles").select("voter_fingerprint").eq("user_id", user.id).maybeSingle();
      if (!userProfile?.voter_fingerprint) return [];
      const { data, error } = await supabase.from("transactions").select("*")
        .eq("voter_fingerprint", userProfile.voter_fingerprint).order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
    refetchInterval: 15000,
  });

  // Fetch wallet transactions
  const { data: walletTxns } = useQuery({
    queryKey: ["my-wallet-transactions", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase.from("wallet_transactions").select("*")
        .eq("user_id", user.id).order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
    refetchInterval: 15000,
  });

  // Fetch share positions
  const { data: sharePositions = [] } = useQuery({
    queryKey: ["my-share-positions", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase.from("positions").select("*").eq("user_id", user.id);
      if (error) throw error;
      if (!data || data.length === 0) return [];
      const pollIds = [...new Set(data.map(p => p.poll_id))];
      const optionIds = [...new Set(data.map(p => p.option_id))];
      const [pollsRes, optionsRes] = await Promise.all([
        supabase.from("polls").select("id, title, slug, status, close_at").in("id", pollIds),
        supabase.from("poll_options").select("id, label").in("id", optionIds),
      ]);
      const pollMap = new Map((pollsRes.data || []).map((p: any) => [p.id, p]));
      const optionMap = new Map((optionsRes.data || []).map((o: any) => [o.id, o]));
      return data.map(pos => ({
        ...pos,
        poll_title: pollMap.get(pos.poll_id)?.title || "Unknown",
        poll_slug: pollMap.get(pos.poll_id)?.slug || "",
        poll_status: pollMap.get(pos.poll_id)?.status || "unknown",
        poll_close_at: pollMap.get(pos.poll_id)?.close_at || "",
        option_label: optionMap.get(pos.option_id)?.label || "Unknown",
      }));
    },
    enabled: !!user,
    refetchInterval: 15000,
  });

  // Fetch active listings
  const { data: myActiveListings = [] } = useQuery({
    queryKey: ["my-active-listings", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await (supabase as any).from("listings").select("*")
        .eq("seller_id", user.id).eq("status", "active").order("created_at", { ascending: false });
      if (error) return [];
      if (!data || data.length === 0) return [];
      const pollIds = [...new Set(data.map((l: any) => l.poll_id))] as string[];
      const optionIds = [...new Set(data.map((l: any) => l.option_id))] as string[];
      const [pollsRes, optionsRes] = await Promise.all([
        supabase.from("polls").select("id, title, slug").in("id", pollIds),
        supabase.from("poll_options").select("id, label").in("id", optionIds),
      ]);
      const pollMap = new Map((pollsRes.data || []).map((p: any) => [p.id, p]));
      const optionMap = new Map((optionsRes.data || []).map((o: any) => [o.id, o]));
      return data.map((l: any) => ({ ...l, polls: pollMap.get(l.poll_id) || null, poll_options: optionMap.get(l.option_id) || null }));
    },
    enabled: !!user,
    refetchInterval: 30000,
  });

  // Fetch trade history
  const { data: tradeHistory = [] } = useQuery({
    queryKey: ["my-trades", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase.from("trades").select("*")
        .eq("user_id", user.id).order("created_at", { ascending: false }).limit(50);
      if (error) throw error;
      if (!data || data.length === 0) return [];
      const pollIds = [...new Set(data.map(t => t.poll_id))];
      const optionIds = [...new Set(data.map(t => t.option_id))];
      const [pollsRes, optionsRes] = await Promise.all([
        supabase.from("polls").select("id, title, slug").in("id", pollIds),
        supabase.from("poll_options").select("id, label").in("id", optionIds),
      ]);
      const pollMap = new Map((pollsRes.data || []).map((p: any) => [p.id, p]));
      const optionMap = new Map((optionsRes.data || []).map((o: any) => [o.id, o]));
      return data.map(t => ({ ...t, poll_title: pollMap.get(t.poll_id)?.title || "Unknown", poll_slug: pollMap.get(t.poll_id)?.slug || "", option_label: optionMap.get(t.option_id)?.label || "Unknown" }));
    },
    enabled: !!user,
    refetchInterval: 15000,
  });

  const { data: payouts } = useQuery({
    queryKey: ["my-payouts", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data: userProfile } = await supabase.from("user_profiles").select("voter_fingerprint").eq("user_id", user.id).maybeSingle();
      if (userProfile?.voter_fingerprint) {
        const { data, error } = await supabase.from("payouts").select("*").eq("voter_fingerprint", userProfile.voter_fingerprint).order("created_at", { ascending: false });
        if (!error && data?.length) return data;
      }
      const { data: userVotes } = await supabase.from("votes").select("voter_fingerprint").eq("user_id", user.id).eq("is_staked", true);
      if (!userVotes?.length) return [];
      const fingerprints = [...new Set(userVotes.map((v: any) => v.voter_fingerprint))];
      const { data, error } = await supabase.from("payouts").select("*").in("voter_fingerprint", fingerprints).order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
    refetchInterval: 15000,
  });

  const { data: walletPayouts } = useQuery({
    queryKey: ["my-wallet-payouts", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase.from("wallet_transactions").select("amount, created_at")
        .eq("user_id", user.id).in("type", ["payout", "payout_mpesa"]);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
    refetchInterval: 15000,
  });

  const { data: notifications = [] } = useQuery({
    queryKey: ["my-notifications", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase.from("notifications").select("*")
        .eq("user_id", user.id).order("created_at", { ascending: false }).limit(50);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
    refetchInterval: 15000,
  });

  // Discriminate Free vs Pro positions
  const proPositionPollIds = useMemo(() => {
    const ids = new Set<string>();
    // Positions from positions table are always Pro
    sharePositions.forEach((sp: any) => ids.add(sp.poll_id));
    // Staked votes or votes with payment_reference are Pro
    positions?.forEach(p => {
      if (p.is_staked || p.payment_reference) ids.add(p.poll_id);
    });
    return ids;
  }, [positions, sharePositions]);

  // Merge P2P-only share positions into Pro active — memoized to avoid new array refs
  const votePollIds = useMemo(() => new Set(positions?.map(p => p.poll_id) || []), [positions]);
  const p2pOnlyPositions = useMemo(() =>
    sharePositions.filter((sp: any) =>
      !votePollIds.has(sp.poll_id) && sp.poll_status === "active"
    ).map((sp: any) => ({
      id: sp.id, poll_id: sp.poll_id, option_id: sp.option_id,
      created_at: sp.created_at, is_staked: true,
      stake_amount: Number(sp.total_cost), poll_title: sp.poll_title,
      poll_status: sp.poll_status, poll_slug: sp.poll_slug,
      option_label: sp.option_label, winning_option_id: null,
      close_at: sp.poll_close_at, total_votes: 0, option_votes: 0,
      entry_price: Number(sp.avg_price), potential_payout: Number(sp.shares),
      outcome: "pending" as const, _isP2POnly: true,
    })),
    [sharePositions, votePollIds]
  );

  const freeActive = useMemo(() =>
    (positions?.filter(p => p.outcome === "pending" && !proPositionPollIds.has(p.poll_id)) || []),
    [positions, proPositionPollIds]
  );
  const freeResolved = useMemo(() =>
    (positions?.filter(p => p.outcome !== "pending" && !proPositionPollIds.has(p.poll_id)) || []),
    [positions, proPositionPollIds]
  );
  const proActiveVotes = useMemo(() =>
    (positions?.filter(p => p.outcome === "pending" && proPositionPollIds.has(p.poll_id)) || []),
    [positions, proPositionPollIds]
  );
  const proActive = useMemo(() => [...proActiveVotes, ...p2pOnlyPositions], [proActiveVotes, p2pOnlyPositions]);
  const proResolved = useMemo(() =>
    (positions?.filter(p => p.outcome !== "pending" && proPositionPollIds.has(p.poll_id)) || []),
    [positions, proPositionPollIds]
  );

  // Build trade reference map
  const tradeByRef = useMemo(() => {
    const map = new Map<string, any>();
    tradeHistory.forEach((t: any) => { if (t.reference) map.set(t.reference, t); });
    return map;
  }, [tradeHistory]);

  // Build full activity feed then split
  const allActivity = useMemo(() => {
    const items: ActivityItem[] = [];

    positions?.forEach(pos => {
      const isPro = proPositionPollIds.has(pos.poll_id);
      const linkBase = isPro ? '/forecast-arena-pro' : '/forecast-arena';
      items.push({
        id: `vote-${pos.id}`, kind: 'vote',
        label: `Voted ${pos.option_label}`, description: pos.poll_title,
        timestamp: pos.created_at, link: pos.poll_slug ? `${linkBase}/${pos.poll_slug}` : undefined,
      });
      if (pos.is_staked && pos.stake_amount) {
        items.push({
          id: `stake-${pos.id}`, kind: 'stake',
          label: `Committed $${pos.stake_amount.toFixed(2)} capital`, description: pos.poll_title,
          amount: pos.stake_amount, amountSign: '-', timestamp: pos.created_at,
          link: pos.poll_slug ? `${linkBase}/${pos.poll_slug}` : undefined,
        });
      }
    });

    walletTxns?.forEach((tx: any) => {
      if (tx.type === 'deposit') {
        items.push({ id: `wtx-${tx.id}`, kind: 'deposit', label: 'Wallet funded', description: tx.description || undefined, amount: Math.abs(tx.amount), amountSign: '+', timestamp: tx.created_at });
      } else if (tx.type === 'withdrawal') {
        items.push({ id: `wtx-${tx.id}`, kind: 'withdrawal', label: 'Withdrawal initiated', description: tx.description || undefined, amount: Math.abs(tx.amount), amountSign: '-', timestamp: tx.created_at });
      } else if (tx.type === 'payout' || tx.type === 'payout_mpesa') {
        items.push({ id: `wtx-${tx.id}`, kind: 'payout', label: 'Payout received', description: tx.description || undefined, amount: Math.abs(tx.amount), amountSign: '+', timestamp: tx.created_at });
      } else if (tx.type === 'share_purchase') {
        const trade = tradeByRef.get(tx.reference);
        items.push({ id: `wtx-${tx.id}`, kind: 'share_purchase', label: trade ? `Bought shares — ${trade.option_label}` : 'Bought shares (P2P)', description: trade?.poll_title || tx.description || undefined, amount: Math.abs(tx.amount), amountSign: '-', timestamp: tx.created_at, link: trade?.poll_slug ? `/forecast-arena-pro/${trade.poll_slug}` : undefined });
      } else if (tx.type === 'share_sale') {
        const trade = tradeByRef.get(tx.reference);
        items.push({ id: `wtx-${tx.id}`, kind: 'share_sale', label: trade ? `Sold shares — ${trade.option_label}` : 'Sold shares (P2P)', description: trade?.poll_title || tx.description || undefined, amount: Math.abs(tx.amount), amountSign: '+', timestamp: tx.created_at, link: trade?.poll_slug ? `/forecast-arena-pro/${trade.poll_slug}` : undefined });
      }
    });

    const notifKinds = new Set(['position_won', 'position_lost', 'payout_completed', 'withdrawal_completed', 'withdrawal_failed', 'comment_reply', 'listing_sold']);
    notifications?.forEach((notif: any) => {
      if (!notifKinds.has(notif.type)) return;
      // Carry poll_id so we can split notifications between Free/Pro tabs
      items.push({
        id: `notif-${notif.id}`, kind: notif.type, label: notif.title,
        description: notif.body || undefined, timestamp: notif.created_at,
        link: notif.link || undefined,
        _pollId: notif.poll_id || undefined,
      } as ActivityItem & { _pollId?: string });
    });

    items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    const seen = new Set<string>();
    return items.filter(i => { if (seen.has(i.id)) return false; seen.add(i.id); return true; }).slice(0, 40);
  }, [positions, walletTxns, notifications, tradeByRef, proPositionPollIds]);

  // Split activity: Free = votes + comment_reply only for free polls; Pro = everything financial + pro poll votes
  // Defined as module-constant equivalents via useMemo to avoid new Set refs every render
  const FREE_ACTIVITY_KINDS = useMemo(() => new Set(['vote', 'comment_reply', 'position_won', 'position_lost']), []);
  const PRO_ACTIVITY_KINDS = useMemo(() => new Set(['stake', 'deposit', 'withdrawal', 'payout', 'share_purchase', 'share_sale', 'payout_completed', 'withdrawal_completed', 'withdrawal_failed', 'listing_sold']), []);

  const freeActivity = useMemo(() =>
    allActivity.filter(item => {
      if (FREE_ACTIVITY_KINDS.has(item.kind)) {
        // For vote items — only include votes for free polls
        if (item.kind === 'vote' && item.id.startsWith('vote-')) {
          const voteId = item.id.replace('vote-', '');
          const pos = positions?.find(p => p.id === voteId);
          if (pos && proPositionPollIds.has(pos.poll_id)) return false;
        }
        // For position_won/position_lost notifications — exclude if poll is a Pro poll
        if ((item.kind === 'position_won' || item.kind === 'position_lost') && (item as any)._pollId) {
          if (proPositionPollIds.has((item as any)._pollId)) return false;
        }
        return true;
      }
      return false;
    }),
    [allActivity, positions, proPositionPollIds, FREE_ACTIVITY_KINDS]
  );

  const proActivity = useMemo(() =>
    allActivity.filter(item => {
      if (PRO_ACTIVITY_KINDS.has(item.kind)) return true;
      // Include votes/outcomes for pro polls
      if (item.kind === 'vote' && item.id.startsWith('vote-')) {
        const voteId = item.id.replace('vote-', '');
        const pos = positions?.find(p => p.id === voteId);
        return pos && proPositionPollIds.has(pos.poll_id);
      }
      // Include position_won/position_lost for pro polls
      if ((item.kind === 'position_won' || item.kind === 'position_lost') && (item as any)._pollId) {
        return proPositionPollIds.has((item as any)._pollId);
      }
      return false;
    }),
    [allActivity, positions, proPositionPollIds, PRO_ACTIVITY_KINDS]
  );

  // Auto-select tab ONCE based on whether user has any Pro activity
  // Uses a ref to prevent re-forcing Pro after user manually switches to Free
  const hasAutoSelected = useRef(false);
  useEffect(() => {
    if (hasAutoSelected.current) return;
    if (searchParams.get("tab")) {
      hasAutoSelected.current = true;
      return;
    }
    if (positions && positions.length > 0) {
      hasAutoSelected.current = true;
      const hasProActivity = proPositionPollIds.size > 0 || (wallet?.balance_usd || 0) > 0;
      if (hasProActivity) {
        setDashboardMode("pro");
      }
    }
  }, [positions, proPositionPollIds, wallet]);

  const handleTabChange = (tab: "free" | "pro") => {
    setDashboardMode(tab);
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      next.set("tab", tab);
      return next;
    });
  };

  if (loading) {
    return (
      <Layout>
        <section className="section-padding">
          <div className="container-page max-w-md mx-auto text-center py-20">
            <Activity className="w-10 h-10 text-muted-foreground mx-auto mb-4 animate-spin" />
            <p className="text-sm text-muted-foreground">Loading your dashboard…</p>
          </div>
        </section>
      </Layout>
    );
  }

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

  return (
    <Layout>
      <section className="section-padding">
        <div className="container-page">
          {/* Header */}
          <div className="mb-6">
            <h1 className="font-display text-3xl font-bold text-foreground">My Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              Welcome back, {profile?.full_name || user.email}.
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
                {wallet && (
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Wallet</p>
                    <p className="font-mono font-bold text-foreground"><DualCurrency amount={wallet.balance_usd} /></p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab Bar */}
          <div className="flex gap-1 mb-8 bg-muted p-1 rounded-lg w-fit">
            <button
              onClick={() => handleTabChange("free")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                dashboardMode === "free"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              🗳️ Free Forecasts
            </button>
            <button
              onClick={() => handleTabChange("pro")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                dashboardMode === "pro"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              💰 Pro Trading
            </button>
          </div>

          {/* Tab Content */}
          {dashboardMode === "free" ? (
            <FreeForecastsTab
              freeActive={freeActive}
              freeResolved={freeResolved}
              freeActivity={freeActivity}
              isLoading={isLoading}
            />
          ) : (
            <ProTradingTab
              user={user}
              profile={profile}
              wallet={wallet}
              refreshWallet={refreshWallet}
              proActive={proActive}
              proResolved={proResolved}
              proActivity={proActivity}
              sharePositions={sharePositions}
              myActiveListings={myActiveListings}
              tradeHistory={tradeHistory}
              walletTxns={walletTxns || []}
              transactions={transactions || []}
              payouts={payouts || []}
              walletPayouts={walletPayouts || []}
              isLoading={isLoading}
            />
          )}
        </div>
      </section>
    </Layout>
  );
};

export default MyDashboard;
