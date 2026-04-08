import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  BarChart3, TrendingUp, Clock, CheckCircle, XCircle,
  DollarSign, Activity, ArrowRight, User, Wallet, Plus, ArrowDownToLine,
  ChevronDown, ChevronUp, History, Receipt, CreditCard, Tag
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import DualCurrency from "@/components/DualCurrency";

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
  const { user, profile, wallet, loading, refreshWallet, refreshProfile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [depositLoading, setDepositLoading] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawPhone, setWithdrawPhone] = useState("");
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [withdrawBankOpen, setWithdrawBankOpen] = useState(false);
  const [bankAmount, setBankAmount] = useState("");
  const [bankCode, setBankCode] = useState("");
  const [bankAccountNumber, setBankAccountNumber] = useState("");
  const [bankAccountName, setBankAccountName] = useState("");
  const [bankCurrency, setBankCurrency] = useState("KES");
  const [bankList, setBankList] = useState<{ name: string; code: string }[]>([]);
  const [banksLoading, setBanksLoading] = useState(false);
  const [bankWithdrawLoading, setBankWithdrawLoading] = useState(false);

  // Section expand/collapse state (default: collapsed to 5 items)
  const [showAllActivity, setShowAllActivity] = useState(false);
  const [showAllActive, setShowAllActive] = useState(false);
  const [showAllClosed, setShowAllClosed] = useState(false);
  const [showAllWalletTxns, setShowAllWalletTxns] = useState(false);
  const [showAllTransactions, setShowAllTransactions] = useState(false);
  const [showAllPayouts, setShowAllPayouts] = useState(false);

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
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [user]);

  // Realtime subscriptions — push updates instantly when DB changes
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`dashboard-${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'wallets', filter: `user_id=eq.${user.id}` }, () => {
        refreshWallet();
      })
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

  // Fetch user's votes — match by BOTH voter_fingerprint AND email to capture all historical positions
  const { data: positions, isLoading, refetch: refetchPositions } = useQuery({
    queryKey: ["my-positions", user?.id],
    queryFn: async () => {
      if (!user) return [];

      // PRIMARY: fetch votes by user_id (survives fingerprint changes)
      const { data: userVotes } = await supabase
        .from("votes")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      // SECONDARY: fetch by fingerprint for legacy votes without user_id
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

      // Merge and deduplicate by poll_id
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
        } as Position;
      });
    },
    enabled: !!user,
    refetchInterval: 15000,
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

      if (!userProfile?.voter_fingerprint) return [];

      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("voter_fingerprint", userProfile.voter_fingerprint)
        .order("created_at", { ascending: false });
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
      const { data, error } = await supabase
        .from("wallet_transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
    refetchInterval: 15000,
  });

  // Fetch share positions from the new trading system — enriched with poll/option info
  const { data: sharePositions = [] } = useQuery({
    queryKey: ["my-share-positions", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("positions")
        .select("*")
        .eq("user_id", user.id);
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

  // Fetch user's active P2P listings across all polls
  const { data: myActiveListings = [] } = useQuery({
    queryKey: ["my-active-listings", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await (supabase as any)
        .from("listings")
        .select("*")
        .eq("seller_id", user.id)
        .eq("status", "active")
        .order("created_at", { ascending: false });
      if (error) {
        console.error("[Dashboard] myActiveListings query error:", error);
        return [];
      }
      // Fetch poll details separately to avoid FK join issues
      if (!data || data.length === 0) return [];
      const pollIds = [...new Set(data.map((l: any) => l.poll_id))] as string[];
      const optionIds = [...new Set(data.map((l: any) => l.option_id))] as string[];
      const [pollsRes, optionsRes] = await Promise.all([
        supabase.from("polls").select("id, title, slug").in("id", pollIds),
        supabase.from("poll_options").select("id, label").in("id", optionIds),
      ]);
      const pollMap = new Map((pollsRes.data || []).map((p: any) => [p.id, p]));
      const optionMap = new Map((optionsRes.data || []).map((o: any) => [o.id, o]));
      return data.map((l: any) => ({
        ...l,
        polls: pollMap.get(l.poll_id) || null,
        poll_options: optionMap.get(l.option_id) || null,
      }));
    },
    enabled: !!user,
    refetchInterval: 30000,
  });

  // Fetch trade history — enriched with poll/option info
  const { data: tradeHistory = [] } = useQuery({
    queryKey: ["my-trades", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("trades")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);
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
      return data.map(t => ({
        ...t,
        poll_title: pollMap.get(t.poll_id)?.title || "Unknown",
        poll_slug: pollMap.get(t.poll_id)?.slug || "",
        option_label: optionMap.get(t.option_id)?.label || "Unknown",
      }));
    },
    enabled: !!user,
    refetchInterval: 15000,
  });


  const { data: payouts } = useQuery({
    queryKey: ["my-payouts", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data: userProfile } = await supabase
        .from("user_profiles")
        .select("voter_fingerprint")
        .eq("user_id", user.id)
        .maybeSingle();

      // Try by voter_fingerprint first
      if (userProfile?.voter_fingerprint) {
        const { data, error } = await supabase
          .from("payouts")
          .select("*")
          .eq("voter_fingerprint", userProfile.voter_fingerprint)
          .order("created_at", { ascending: false });
        if (!error && data?.length) return data;
      }

      // Fallback: find payouts via votes linked directly to this user_id
      const { data: userVotes } = await supabase
        .from("votes")
        .select("voter_fingerprint")
        .eq("user_id", user.id)
        .eq("is_staked", true);

      if (!userVotes?.length) return [];

      const fingerprints = [...new Set(userVotes.map((v: any) => v.voter_fingerprint))];
      const { data, error } = await supabase
        .from("payouts")
        .select("*")
        .in("voter_fingerprint", fingerprints)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
    refetchInterval: 15000,
  });

  // Also fetch payout wallet transactions directly by user_id (wallet-mode payouts)
  const { data: walletPayouts } = useQuery({
    queryKey: ["my-wallet-payouts", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("wallet_transactions")
        .select("amount, created_at")
        .eq("user_id", user.id)
        .in("type", ["payout", "payout_mpesa"]);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
    refetchInterval: 15000,
  });

  // Fetch notifications for activity feed
  const { data: notifications = [] } = useQuery({
    queryKey: ["my-notifications", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
    refetchInterval: 15000,
  });

  const handleDeposit = async (amount: number) => {
    if (!user) return;
    setDepositLoading(true);
    try {
      const callbackUrl = `${window.location.origin}/my-dashboard?deposit=success`;
      const { data, error } = await supabase.functions.invoke("paystack-checkout", {
        body: {
          email: user.email,
          amount: amount,
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

  // Pre-fill phone from profile when opening withdraw modal
  useEffect(() => {
    if (withdrawOpen && profile?.phone && !withdrawPhone) {
      setWithdrawPhone(profile.phone);
    }
  }, [withdrawOpen, profile]);

  const handleWithdraw = async () => {
    if (!user) return;
    const amt = parseFloat(withdrawAmount);
    if (isNaN(amt) || amt < 1) {
      toast({ title: "Invalid amount", description: "Minimum withdrawal is $1.00", variant: "destructive" });
      return;
    }
    if (amt > (wallet?.balance_usd || 0)) {
      toast({ title: "Insufficient balance", variant: "destructive" });
      return;
    }
    if (!withdrawPhone || withdrawPhone.length < 9) {
      toast({ title: "Enter a valid phone number", variant: "destructive" });
      return;
    }
    setWithdrawLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("withdraw", {
        body: { amount: amt, phone_number: withdrawPhone, method: "mobile_money", currency: "KES" },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.detail || data.error);
      toast({ title: "✅ Withdrawal initiated", description: `$${amt.toFixed(2)} → ~KES ${data.amount_kes?.toFixed(0) || '—'}. Check your mobile money shortly.` });
      setWithdrawOpen(false);
      setWithdrawAmount("");
      refreshWallet();
    } catch (err: any) {
      toast({ title: "Withdrawal failed", description: err.message, variant: "destructive" });
    } finally {
      setWithdrawLoading(false);
    }
  };

  const fetchBanks = async (currency: string) => {
    setBanksLoading(true);
    try {
      const { data } = await supabase.functions.invoke("get-banks", { body: { currency } });
      setBankList(data?.banks || []);
    } catch {
      setBankList([]);
    } finally {
      setBanksLoading(false);
    }
  };

  const handleBankWithdraw = async () => {
    if (!user) return;
    const amt = parseFloat(bankAmount);
    if (isNaN(amt) || amt < 1) {
      toast({ title: "Invalid amount", description: "Minimum withdrawal is $1.00", variant: "destructive" });
      return;
    }
    if (amt > (wallet?.balance_usd || 0)) {
      toast({ title: "Insufficient balance", variant: "destructive" });
      return;
    }
    if (!bankCode || !bankAccountNumber || !bankAccountName) {
      toast({ title: "Missing details", description: "Please fill in all bank fields.", variant: "destructive" });
      return;
    }
    setBankWithdrawLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("withdraw", {
        body: {
          amount: amt,
          method: "bank",
          bank_code: bankCode,
          account_number: bankAccountNumber,
          account_name: bankAccountName,
          currency: bankCurrency,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.detail || data.error);
      toast({ title: "✅ Bank transfer initiated", description: `$${amt.toFixed(2)} → ${bankCurrency} ${data.amount_local?.toFixed(0) || '—'}. Funds typically arrive within 1–2 business days.` });
      setWithdrawBankOpen(false);
      setBankAmount("");
      setBankAccountNumber("");
      setBankAccountName("");
      setBankCode("");
      refreshWallet();
    } catch (err: any) {
      toast({ title: "Bank withdrawal failed", description: err.message, variant: "destructive" });
    } finally {
      setBankWithdrawLoading(false);
    }
  };

  const activePositions = positions?.filter(p => p.outcome === "pending") || [];
  const resolvedPositions = positions?.filter(p => p.outcome !== "pending") || [];
  const totalCommitted = positions?.reduce((s, p) => s + (p.stake_amount || 0), 0) || 0;
  const earningsFromPayouts = payouts?.reduce((s, p) => s + (p.amount || 0), 0) || 0;
  const earningsFromWallet = walletPayouts?.reduce((s, p) => s + Math.abs(p.amount || 0), 0) || 0;
  const totalEarnings = earningsFromPayouts || earningsFromWallet;
  const wonCount = resolvedPositions.filter(p => p.outcome === "won").length;

  // Build reference→trade map for enriching P2P activity feed with poll titles
  const tradeByRef = useMemo(() => {
    const map = new Map<string, any>();
    tradeHistory.forEach((t: any) => { if (t.reference) map.set(t.reference, t); });
    return map;
  }, [tradeHistory]);

  // Unified activity feed — merges votes, stakes, wallet events, and notifications
  const activityFeed = useMemo(() => {
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
    const items: ActivityItem[] = [];

    // Forecast votes & conviction stakes from positions
    positions?.forEach(pos => {
      items.push({
        id: `vote-${pos.id}`,
        kind: 'vote',
        label: `Voted ${pos.option_label}`,
        description: pos.poll_title,
        timestamp: pos.created_at,
        link: pos.poll_slug ? `/forecast-arena/${pos.poll_slug}` : undefined,
      });
      if (pos.is_staked && pos.stake_amount) {
        items.push({
          id: `stake-${pos.id}`,
          kind: 'stake',
          label: `Committed $${pos.stake_amount.toFixed(2)} capital`,
          description: pos.poll_title,
          amount: pos.stake_amount,
          amountSign: '-',
          timestamp: pos.created_at,
          link: pos.poll_slug ? `/forecast-arena/${pos.poll_slug}` : undefined,
        });
      }
    });

    // Wallet events — deposits, withdrawals, P2P trades
    walletTxns?.forEach((tx: any) => {
      if (tx.type === 'deposit') {
        items.push({
          id: `wtx-${tx.id}`,
          kind: 'deposit',
          label: 'Wallet funded',
          description: tx.description || undefined,
          amount: Math.abs(tx.amount),
          amountSign: '+',
          timestamp: tx.created_at,
        });
      } else if (tx.type === 'withdrawal') {
        items.push({
          id: `wtx-${tx.id}`,
          kind: 'withdrawal',
          label: 'Withdrawal initiated',
          description: tx.description || undefined,
          amount: Math.abs(tx.amount),
          amountSign: '-',
          timestamp: tx.created_at,
        });
      } else if (tx.type === 'payout' || tx.type === 'payout_mpesa') {
        items.push({
          id: `wtx-${tx.id}`,
          kind: 'payout',
          label: 'Payout received',
          description: tx.description || undefined,
          amount: Math.abs(tx.amount),
          amountSign: '+',
          timestamp: tx.created_at,
        });
      } else if (tx.type === 'share_purchase') {
        const trade = tradeByRef.get(tx.reference);
        items.push({
          id: `wtx-${tx.id}`,
          kind: 'share_purchase',
          label: trade ? `Bought shares — ${trade.option_label}` : 'Bought shares (P2P)',
          description: trade?.poll_title || tx.description || undefined,
          amount: Math.abs(tx.amount),
          amountSign: '-',
          timestamp: tx.created_at,
          link: trade?.poll_slug ? `/forecast-arena/${trade.poll_slug}` : undefined,
        });
      } else if (tx.type === 'share_sale') {
        const trade = tradeByRef.get(tx.reference);
        items.push({
          id: `wtx-${tx.id}`,
          kind: 'share_sale',
          label: trade ? `Sold shares — ${trade.option_label}` : 'Sold shares (P2P)',
          description: trade?.poll_title || tx.description || undefined,
          amount: Math.abs(tx.amount),
          amountSign: '+',
          timestamp: tx.created_at,
          link: trade?.poll_slug ? `/forecast-arena/${trade.poll_slug}` : undefined,
        });
      }
    });

    // Notifications — position outcomes, payouts, withdrawal results, comment replies
    const notifKinds = new Set([
      'position_won', 'position_lost',
      'payout_completed', 'withdrawal_completed', 'withdrawal_failed',
      'comment_reply', 'listing_sold',
    ]);
    notifications?.forEach((notif: any) => {
      if (!notifKinds.has(notif.type)) return;
      items.push({
        id: `notif-${notif.id}`,
        kind: notif.type,
        label: notif.title,
        description: notif.body || undefined,
        timestamp: notif.created_at,
        link: notif.link || undefined,
      });
    });

    // Sort newest first, cap at 40
    items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    // Deduplicate by id
    const seen = new Set<string>();
    return items.filter(i => { if (seen.has(i.id)) return false; seen.add(i.id); return true; }).slice(0, 40);
  }, [positions, walletTxns, notifications]);

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
              { icon: Wallet, label: "Wallet Balance", value: <DualCurrency amount={wallet?.balance_usd || 0} /> },
              { icon: Activity, label: "My Active Forecasts", value: activePositions.length },
              { icon: DollarSign, label: "Conviction Committed", value: <DualCurrency amount={totalCommitted} /> },
              { icon: TrendingUp, label: "Total Earnings", value: <DualCurrency amount={totalEarnings} /> },
              { icon: CheckCircle, label: "Accuracy", value: resolvedPositions.length > 0 ? `${Math.round((wonCount / resolvedPositions.length) * 100)}%` : "—" },
            ].map((stat) => (
              <div key={stat.label} className="bg-card border border-border rounded-lg p-4">
                <stat.icon className="w-5 h-5 text-primary mb-2" />
                <p className="text-2xl font-bold font-mono text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Section Quick-Nav */}
          <div className="flex flex-wrap gap-2 mb-8">
            {[
              { label: "Recent Activity", href: "#recent-activity", icon: Activity },
              { label: "Active Forecasts", href: "#active-forecasts", icon: BarChart3 },
              { label: "My Listings", href: "#my-listings", icon: Tag },
              { label: "Closed Forecasts", href: "#closed-forecasts", icon: History },
              { label: "Wallet Activity", href: "#wallet-activity", icon: Wallet },
              { label: "Transactions", href: "#transactions", icon: Receipt },
              { label: "Payouts", href: "#payouts", icon: CreditCard },
            ].map(({ label, href, icon: Icon }) => (
              <a key={href} href={href} onClick={e => { e.preventDefault(); document.getElementById(href.slice(1))?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}>
                <Button variant="outline" size="sm" className="flex items-center gap-1.5 text-xs">
                  <Icon className="w-3.5 h-3.5" />{label}
                </Button>
              </a>
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

          {/* Withdraw */}
          <div className="mb-8">
            <h2 className="font-display text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <ArrowDownToLine className="w-5 h-5 text-primary" />
              Withdraw Funds
            </h2>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                disabled={(wallet?.balance_usd || 0) < 1}
                onClick={() => setWithdrawOpen(true)}
              >
                <ArrowDownToLine className="w-3 h-3 mr-1" /> Withdraw to Mobile Money
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={(wallet?.balance_usd || 0) < 1}
                onClick={() => { setWithdrawBankOpen(true); fetchBanks(bankCurrency); }}
              >
                <ArrowDownToLine className="w-3 h-3 mr-1" /> Withdraw to Bank
              </Button>
            </div>
            {(wallet?.balance_usd || 0) < 1 && (
              <p className="text-xs text-muted-foreground mt-1">Minimum balance of $1.00 required.</p>
            )}
          </div>

          {/* Withdraw Modal */}
          <Dialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
            <DialogContent className="max-w-sm">
              <DialogHeader>
                <DialogTitle>Withdraw to Mobile Money</DialogTitle>
                <DialogDescription>
                  Send funds from your wallet to your mobile money account.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Available balance</p>
                  <p className="text-2xl font-bold font-mono text-foreground">${(wallet?.balance_usd || 0).toFixed(2)}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-foreground mb-1 block">Amount (USD)</label>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {[5, 10, 25, 50].filter(a => a <= (wallet?.balance_usd || 0)).map(a => (
                      <button key={a} onClick={() => setWithdrawAmount(String(a))}
                        className={`text-xs px-2 py-1 rounded border ${withdrawAmount === String(a) ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground'}`}
                      >${a}</button>
                    ))}
                    <button onClick={() => setWithdrawAmount(String(wallet?.balance_usd || 0))}
                      className={`text-xs px-2 py-1 rounded border ${withdrawAmount === String(wallet?.balance_usd || 0) ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground'}`}
                    >All</button>
                  </div>
                  <Input
                    type="number" min="1" step="0.01"
                    placeholder="Enter amount"
                    value={withdrawAmount}
                    onChange={e => setWithdrawAmount(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-foreground mb-1 block">Mobile money phone number</label>
                  <Input
                    type="tel"
                    placeholder="+254 7XX XXX XXX"
                    value={withdrawPhone}
                    onChange={e => setWithdrawPhone(e.target.value)}
                  />
                </div>
                {withdrawAmount && parseFloat(withdrawAmount) > 0 && (
                  <p className="text-sm text-muted-foreground">
                    You will receive approximately <span className="font-semibold text-foreground">KES {(parseFloat(withdrawAmount) * 130).toFixed(0)}</span>
                  </p>
                )}
                <p className="text-[10px] text-muted-foreground">
                  Withdrawals are sent via mobile money and typically arrive within a few minutes. A small Paystack transfer fee may apply.
                </p>
                <Button
                  className="w-full"
                  disabled={withdrawLoading || !withdrawAmount || parseFloat(withdrawAmount) < 1}
                  onClick={handleWithdraw}
                >
                  {withdrawLoading ? "Processing…" : `Withdraw $${parseFloat(withdrawAmount || "0").toFixed(2)}`}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Bank Withdraw Modal */}
          <Dialog open={withdrawBankOpen} onOpenChange={setWithdrawBankOpen}>
            <DialogContent className="max-w-sm">
              <DialogHeader>
                <DialogTitle>Withdraw to Bank Account</DialogTitle>
                <DialogDescription>
                  Send funds from your wallet directly to your bank account.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Available balance</p>
                  <p className="text-2xl font-bold font-mono text-foreground">${(wallet?.balance_usd || 0).toFixed(2)}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-foreground mb-1 block">Currency</label>
                  <select
                    className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background text-foreground"
                    value={bankCurrency}
                    onChange={e => { setBankCurrency(e.target.value); fetchBanks(e.target.value); setBankCode(""); }}
                  >
                    {[
                      { code: "KES", label: "KES — Kenya Shilling" },
                      { code: "NGN", label: "NGN — Nigerian Naira" },
                      { code: "GHS", label: "GHS — Ghanaian Cedi" },
                      { code: "ZAR", label: "ZAR — South African Rand" },
                      { code: "UGX", label: "UGX — Ugandan Shilling" },
                      { code: "TZS", label: "TZS — Tanzanian Shilling" },
                    ].map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-foreground mb-1 block">Amount (USD)</label>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {[5, 10, 25, 50].filter(a => a <= (wallet?.balance_usd || 0)).map(a => (
                      <button key={a} onClick={() => setBankAmount(String(a))}
                        className={`text-xs px-2 py-1 rounded border ${bankAmount === String(a) ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground'}`}
                      >${a}</button>
                    ))}
                    <button onClick={() => setBankAmount(String(wallet?.balance_usd || 0))}
                      className={`text-xs px-2 py-1 rounded border ${bankAmount === String(wallet?.balance_usd || 0) ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground'}`}
                    >All</button>
                  </div>
                  <Input
                    type="number" min="1" step="0.01"
                    placeholder="Enter amount"
                    value={bankAmount}
                    onChange={e => setBankAmount(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-foreground mb-1 block">Bank</label>
                  {banksLoading ? (
                    <p className="text-xs text-muted-foreground">Loading banks…</p>
                  ) : (
                    <select
                      className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background text-foreground"
                      value={bankCode}
                      onChange={e => setBankCode(e.target.value)}
                    >
                      <option value="">Select a bank</option>
                      {bankList.map(b => (
                        <option key={b.code} value={b.code}>{b.name}</option>
                      ))}
                    </select>
                  )}
                </div>
                <div>
                  <label className="text-xs font-medium text-foreground mb-1 block">Account Number</label>
                  <Input
                    type="text"
                    placeholder="e.g. 1234567890"
                    value={bankAccountNumber}
                    onChange={e => setBankAccountNumber(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-foreground mb-1 block">Account Name</label>
                  <Input
                    type="text"
                    placeholder="Name on bank account"
                    value={bankAccountName}
                    onChange={e => setBankAccountName(e.target.value)}
                  />
                </div>
                {bankAmount && parseFloat(bankAmount) > 0 && (
                  <p className="text-sm text-muted-foreground">
                    You will receive approximately <span className="font-semibold text-foreground">{bankCurrency} {(parseFloat(bankAmount) * (bankCurrency === 'KES' ? 130 : bankCurrency === 'NGN' ? 1600 : bankCurrency === 'GHS' ? 15 : bankCurrency === 'ZAR' ? 18 : bankCurrency === 'UGX' ? 3700 : 2700)).toFixed(0)}</span>
                  </p>
                )}
                <p className="text-[10px] text-muted-foreground">
                  Bank transfers typically arrive within 1–2 business days. A small Paystack transfer fee may apply.
                </p>
                <Button
                  className="w-full"
                  disabled={bankWithdrawLoading || !bankAmount || parseFloat(bankAmount) < 1 || !bankCode || !bankAccountNumber || !bankAccountName}
                  onClick={handleBankWithdraw}
                >
                  {bankWithdrawLoading ? "Processing…" : `Withdraw $${parseFloat(bankAmount || "0").toFixed(2)} to Bank`}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Share Positions (Trading) */}
          {sharePositions.length > 0 && (
            <div className="mb-8">
              <h2 className="font-display text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                My Forecast Positions ({sharePositions.length})
              </h2>
              <div className="space-y-2">
                {sharePositions.map((pos: any) => (
                  <div key={pos.id} className="bg-card border border-border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-sm font-semibold text-foreground">{Number(pos.shares)} shares</span>
                        <span className="text-xs text-muted-foreground ml-2">avg ${Number(pos.avg_price).toFixed(2)}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-muted-foreground">Cost basis: </span>
                        <span className="font-mono text-sm font-bold">${Number(pos.total_cost).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Activity — unified feed */}
          <div id="recent-activity" className="mb-8 scroll-mt-20">
            <h2 className="font-display text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              Recent Activity
              {activityFeed.length > 0 && (
                <span className="text-sm font-normal text-muted-foreground ml-1">({activityFeed.length})</span>
              )}
            </h2>
            {activityFeed.length === 0 ? (
              <div className="bg-card border border-border rounded-lg p-6 text-center">
                <p className="text-sm text-muted-foreground">No activity yet. Make your first forecast to get started.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {(showAllActivity ? activityFeed : activityFeed.slice(0, 5)).map(item => {
                  const kindConfig: Record<string, { badge: string; color: string }> = {
                    vote:                 { badge: "Voted",       color: "bg-blue-500/10 text-blue-600" },
                    stake:                { badge: "Committed",   color: "bg-orange-500/10 text-orange-600" },
                    deposit:              { badge: "Deposit",     color: "bg-green-500/10 text-green-600" },
                    withdrawal:           { badge: "Withdrawal",  color: "bg-red-500/10 text-red-500" },
                    payout:               { badge: "Payout",      color: "bg-emerald-500/10 text-emerald-600" },
                    share_purchase:       { badge: "Bought Shares", color: "bg-indigo-500/10 text-indigo-600" },
                    share_sale:           { badge: "Sold Shares",   color: "bg-teal-500/10 text-teal-600" },
                    position_won:         { badge: "✓ Won",       color: "bg-green-500/10 text-green-600" },
                    position_lost:        { badge: "✗ Lost",      color: "bg-red-500/10 text-red-500" },
                    payout_completed:     { badge: "Payout",      color: "bg-emerald-500/10 text-emerald-600" },
                    withdrawal_completed: { badge: "Sent",        color: "bg-green-500/10 text-green-600" },
                    withdrawal_failed:    { badge: "Failed",      color: "bg-red-500/10 text-red-500" },
                    comment_reply:        { badge: "Reply",       color: "bg-purple-500/10 text-purple-600" },
                    listing_sold:         { badge: "Listing Sold", color: "bg-amber-500/10 text-amber-600" },
                  };
                  const cfg = kindConfig[item.kind] ?? { badge: item.kind, color: "bg-muted text-muted-foreground" };

                  const inner = (
                    <div className="bg-card border border-border rounded-lg p-3 flex items-center justify-between gap-3 hover:border-primary/40 transition-colors">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded shrink-0 ${cfg.color}`}>
                          {cfg.badge}
                        </span>
                        <div className="min-w-0">
                          <p className="text-xs text-foreground truncate">{item.label}</p>
                          {item.description && (
                            <p className="text-[10px] text-muted-foreground truncate">{item.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        {item.amount != null && (
                          <p className={`font-mono text-xs font-semibold ${item.amountSign === '+' ? 'text-green-600' : 'text-red-500'}`}>
                            {item.amountSign}${item.amount.toFixed(2)}
                          </p>
                        )}
                        <p className="text-[9px] text-muted-foreground">
                          {new Date(item.timestamp).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}
                        </p>
                      </div>
                    </div>
                  );

                  return item.link ? (
                    <Link key={item.id} to={item.link}>{inner}</Link>
                  ) : (
                    <div key={item.id}>{inner}</div>
                  );
                })}
                {activityFeed.length > 5 && (
                  <button
                    onClick={() => setShowAllActivity(v => !v)}
                    className="w-full flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground py-2 border border-dashed border-border rounded-lg hover:border-primary/40 transition-colors"
                  >
                    {showAllActivity ? (
                      <><ChevronUp className="w-3.5 h-3.5" /> Show less</>
                    ) : (
                      <><ChevronDown className="w-3.5 h-3.5" /> Show {activityFeed.length - 5} more</>
                    )}
                  </button>
                )}
              </div>
            )}
          </div>

          <div id="active-forecasts" className="mb-8 scroll-mt-20">
            <h2 className="font-display text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              My Active Forecasts ({activePositions.length})
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
                {(showAllActive ? activePositions : activePositions.slice(0, 5)).map(pos => {
                  const consensusPct = pos.total_votes > 0 ? Math.round((pos.option_votes / pos.total_votes) * 100) : 50;
                  const isYes = pos.option_label.toLowerCase() === "yes";
                  // Check if user has shares in escrow (listed) for this poll
                  const activeListing = myActiveListings.find((l: any) => l.poll_id === pos.poll_id);
                  const hasCapital = pos.is_staked || !!activeListing;
                  const capitalAmount = pos.is_staked ? pos.stake_amount : (activeListing ? Number(activeListing.cost_basis) : 0);
                  return (
                    <Link key={pos.id} to={`/forecast-arena/${pos.poll_slug}`} className="block">
                      <div className={`bg-card border rounded-lg p-4 hover:border-primary/40 transition-colors ${activeListing ? "border-amber-500/30" : "border-border"}`}>
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="text-sm font-semibold text-foreground leading-snug flex-1 mr-4">{pos.poll_title}</h3>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {activeListing && (
                              <span className="text-[10px] bg-amber-500/10 text-amber-700 border border-amber-500/20 px-1.5 py-0.5 rounded-full font-medium">Listed</span>
                            )}
                            <span className={`text-xs font-bold px-2 py-0.5 rounded ${isYes ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-500"}`}>
                              {pos.option_label}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                          <span>Backed at: ${pos.entry_price.toFixed(2)}</span>
                          <span>Consensus: {consensusPct}%</span>
                          {hasCapital && <span className="text-primary font-semibold">Capital: ${Number(capitalAmount || 0).toFixed(2)}</span>}
                          {pos.is_staked && !activeListing && <span className="text-green-600 font-semibold">If correct: ${pos.potential_payout.toFixed(2)}</span>}
                          {activeListing && <span className="text-amber-700 font-semibold">Listed at ${Number(activeListing.total_ask).toFixed(2)}</span>}
                          <span className="flex items-center gap-1 ml-auto">
                            <Clock className="w-3 h-3" />
                            {new Date(pos.close_at) > new Date() ? "Open" : "Closing..."}
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
                {activePositions.length > 5 && (
                  <button
                    onClick={() => setShowAllActive(v => !v)}
                    className="w-full flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground py-2 border border-dashed border-border rounded-lg hover:border-primary/40 transition-colors"
                  >
                    {showAllActive ? <><ChevronUp className="w-3.5 h-3.5" /> Show less</> : <><ChevronDown className="w-3.5 h-3.5" /> Show {activePositions.length - 5} more</>}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* My Active P2P Listings */}
          <div id="my-listings" className="mb-8 scroll-mt-20">
            <h2 className="font-display text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <Tag className="w-5 h-5 text-primary" />
              My Active Listings ({myActiveListings.length})
            </h2>
            {myActiveListings.length === 0 ? (
              <div className="bg-card border border-border rounded-lg p-6 text-center">
                <p className="text-sm text-muted-foreground mb-1">No active listings.</p>
                <p className="text-xs text-muted-foreground">When you list shares for sale on a poll, they appear here.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {myActiveListings.map((listing) => (
                  <Link key={listing.id} to={`/forecast-arena/${listing.polls?.slug}`} className="block">
                    <div className="bg-card border border-amber-500/30 rounded-lg p-4 hover:border-amber-500/60 transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 mr-4">
                          <h3 className="text-sm font-semibold text-foreground leading-snug">{listing.polls?.title}</h3>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Your forecast: <span className="font-semibold text-foreground">{listing.poll_options?.label}</span>
                          </p>
                        </div>
                        <span className="text-[10px] bg-amber-500/10 text-amber-700 border border-amber-500/20 px-2 py-0.5 rounded-full font-semibold shrink-0">
                          Listed
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-3 text-xs">
                        <div>
                          <p className="text-muted-foreground text-[10px]">Shares listed</p>
                          <p className="font-mono font-bold text-foreground">{Number(listing.shares).toFixed(4)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-[10px]">Price / share</p>
                          <p className="font-mono font-bold text-foreground">${Number(listing.price_per_share).toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-[10px]">You receive if sold</p>
                          <p className="font-mono font-bold text-green-600">${(Number(listing.total_ask) * 0.965).toFixed(2)}</p>
                        </div>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-2">
                        Listed {new Date(listing.created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })} · Cancel from the poll page
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Closed Forecasts */}
          <div id="closed-forecasts" className="mb-8 scroll-mt-20">
            <h2 className="font-display text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <History className="w-5 h-5 text-primary" />
              Closed Forecasts ({resolvedPositions.length})
            </h2>
            {resolvedPositions.length === 0 ? (
              <div className="bg-card border border-border rounded-lg p-6 text-center">
                <p className="text-sm text-muted-foreground">No closed forecasts yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {(showAllClosed ? resolvedPositions : resolvedPositions.slice(0, 5)).map(pos => (
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
                      <span>Backed at: ${pos.entry_price.toFixed(2)}</span>
                      {pos.is_staked && <span>Conviction: ${pos.stake_amount?.toFixed(2)}</span>}
                      {pos.outcome === "won" && pos.is_staked && (
                        <span className="text-green-600 font-semibold">Earned: ${pos.potential_payout.toFixed(2)}</span>
                      )}
                      <span className="text-muted-foreground/60 ml-auto">{new Date(pos.created_at).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}</span>
                    </div>
                  </div>
                ))}
                {resolvedPositions.length > 5 && (
                  <button
                    onClick={() => setShowAllClosed(v => !v)}
                    className="w-full flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground py-2 border border-dashed border-border rounded-lg hover:border-primary/40 transition-colors"
                  >
                    {showAllClosed ? <><ChevronUp className="w-3.5 h-3.5" /> Show less</> : <><ChevronDown className="w-3.5 h-3.5" /> Show {resolvedPositions.length - 5} more</>}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Wallet Transactions */}
          {walletTxns && walletTxns.length > 0 && (
            <div id="wallet-activity" className="mb-8 scroll-mt-20">
              <h2 className="font-display text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                <Wallet className="w-5 h-5 text-primary" />
                Wallet Activity ({walletTxns.length})
              </h2>
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
                      {(showAllWalletTxns ? walletTxns : walletTxns.slice(0, 5)).map((tx: any) => (
                        <tr key={tx.id} className="border-t border-border">
                          <td className="px-4 py-2 text-foreground">{new Date(tx.created_at).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}</td>
                          <td className="px-4 py-2 capitalize text-muted-foreground">{tx.type.replace(/_/g, ' ')}</td>
                          <td className={`px-4 py-2 font-mono font-semibold ${tx.amount > 0 ? "text-green-600" : "text-red-500"}`}>
                            {tx.amount > 0 ? "+" : ""}${Math.abs(tx.amount).toFixed(2)}
                          </td>
                          <td className="px-4 py-2 text-muted-foreground max-w-[200px] truncate">{tx.description || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              {walletTxns.length > 5 && (
                <button
                  onClick={() => setShowAllWalletTxns(v => !v)}
                  className="w-full flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground py-2 border border-dashed border-border rounded-lg hover:border-primary/40 transition-colors mt-2"
                >
                  {showAllWalletTxns ? <><ChevronUp className="w-3.5 h-3.5" /> Show less</> : <><ChevronDown className="w-3.5 h-3.5" /> Show {walletTxns.length - 5} more</>}
                </button>
              )}
            </div>
          )}

          {/* Paystack Transactions */}
          {transactions && transactions.length > 0 && (
            <div id="transactions" className="mb-8 scroll-mt-20">
              <h2 className="font-display text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                <Receipt className="w-5 h-5 text-primary" />
                Transaction History ({transactions.length})
              </h2>
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
                      {(showAllTransactions ? transactions : transactions.slice(0, 5)).map((tx: any) => (
                        <tr key={tx.id} className="border-t border-border">
                          <td className="px-4 py-2 text-foreground">{new Date(tx.created_at).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}</td>
                          <td className="px-4 py-2 font-mono font-semibold text-foreground">${tx.amount.toFixed(2)}</td>
                          <td className="px-4 py-2 text-muted-foreground capitalize">{tx.channel}</td>
                          <td className="px-4 py-2">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                              tx.status === "success" || tx.status === "completed" ? "bg-green-100 text-green-700" :
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
              {transactions.length > 5 && (
                <button
                  onClick={() => setShowAllTransactions(v => !v)}
                  className="w-full flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground py-2 border border-dashed border-border rounded-lg hover:border-primary/40 transition-colors mt-2"
                >
                  {showAllTransactions ? <><ChevronUp className="w-3.5 h-3.5" /> Show less</> : <><ChevronDown className="w-3.5 h-3.5" /> Show {transactions.length - 5} more</>}
                </button>
              )}
            </div>
          )}

          {/* Payouts */}
          <div id="payouts" className="mb-8 scroll-mt-20">
            <h2 className="font-display text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-primary" />
              Payouts {payouts && payouts.length > 0 && `(${payouts.length})`}
            </h2>
            {!payouts || payouts.length === 0 ? (
              <div className="bg-card border border-border rounded-lg p-6 text-center">
                <p className="text-sm text-muted-foreground">No payouts yet. Win a forecast to earn a payout.</p>
              </div>
            ) : (
              <>
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
                        {(showAllPayouts ? payouts : payouts.slice(0, 5)).map((p: any) => (
                          <tr key={p.id} className="border-t border-border">
                            <td className="px-4 py-2 text-foreground">{new Date(p.created_at).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}</td>
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
                {payouts.length > 5 && (
                  <button
                    onClick={() => setShowAllPayouts(v => !v)}
                    className="w-full flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground py-2 border border-dashed border-border rounded-lg hover:border-primary/40 transition-colors mt-2"
                  >
                    {showAllPayouts ? <><ChevronUp className="w-3.5 h-3.5" /> Show less</> : <><ChevronDown className="w-3.5 h-3.5" /> Show {payouts.length - 5} more</>}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default MyDashboard;
