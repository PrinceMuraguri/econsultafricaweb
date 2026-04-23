import { useState, useEffect, useMemo, useRef, type KeyboardEvent, type MouseEvent, type PointerEvent } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, Users, Lock, Check, Loader2, Rocket, ChevronDown, ChevronUp, Lightbulb, TrendingUp, Download, DollarSign, Tag, ShoppingBag, CheckCircle, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { getFingerprint } from "@/lib/fingerprint";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import StakeModal from "./StakeModal";
import ExitPositionModal from "./ExitPositionModal";
import ListSharesModal from "./ListSharesModal";
import RegistrationModal from "@/components/auth/RegistrationModal";
import LoginModal from "@/components/auth/LoginModal";
import BookmarkToggle from "./BookmarkToggle";
import SharePopover from "./SharePopover";
import type { Poll, PollOption } from "@/hooks/use-polls";

const CONTEXT_PREVIEW_LENGTH = 120;

function getTimeRemaining(closeAt: string) {
  const diff = new Date(closeAt).getTime() - Date.now();
  if (diff <= 0) return "Closed";
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  if (days > 0) return `${days}d ${hours}h left`;
  const mins = Math.floor((diff / (1000 * 60)) % 60);
  return `${hours}h ${mins}m left`;
}

interface PollCardProProps {
  poll: Poll;
  compact?: boolean;
  isTrending?: boolean;
  homepage?: boolean;
}

interface PeerListing {
  id: string;
  seller_id: string;
  poll_id: string;
  option_id: string;
  shares: number;
  price_per_share: number;
  total_ask: number;
  status: string;
  created_at: string | null;
}

const PollCardPro = ({ poll, compact = false, isTrending = false, homepage = false }: PollCardProProps) => {
  const { toast } = useToast();
  const { user, profile, proMode } = useAuth();
  const isDemo = proMode === "demo";
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [localOptions, setLocalOptions] = useState(poll.poll_options);
  const [stakeOpen, setStakeOpen] = useState(false);
  const [stakeOption, setStakeOption] = useState<PollOption | null>(null);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [detailsExpanded, setDetailsExpanded] = useState(false);
  const [exitModalOpen, setExitModalOpen] = useState(false);
  const [listOpen, setListOpen] = useState(false);
  const [savedListInfo, setSavedListInfo] = useState<{ optionId: string; optionLabel: string; shares: number; price: number } | null>(null);
  const [hasCommitted, setHasCommitted] = useState(false);
  const [peerOffersOpen, setPeerOffersOpen] = useState(false);
  const [hasRequestedPeerListings, setHasRequestedPeerListings] = useState(false);
  const [inlineBuyingId, setInlineBuyingId] = useState<string | null>(null);
  const [inlineConfirming, setInlineConfirming] = useState<string | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [votedOptionId, setVotedOptionId] = useState<string | null>(null);

  const isLoggedIn = !!user;
  const isHomepageMode = homepage;

  // Fetch user's vote (live mode only — demo has no votes row, just demo_positions)
  const { data: userStake } = useQuery({
    queryKey: ["user-stake", poll.id, user?.id, isDemo],
    queryFn: async () => {
      if (!user || isDemo) return null;
      const { data } = await supabase
        .from("votes")
        .select("stake_amount, created_at, option_id, is_staked")
        .eq("poll_id", poll.id)
        .eq("user_id", user.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user && !isDemo,
  });

  // Fetch user's positions — demo_positions in demo mode, positions in live mode
  const { data: userPositions = [] } = useQuery({
    queryKey: ["positions-card", poll.id, user?.id, isDemo],
    queryFn: async () => {
      if (!user) return [];
      const table = isDemo ? "demo_positions" : "positions";
      const { data } = await (supabase as any).from(table).select("*").eq("user_id", user.id).eq("poll_id", poll.id);
      return data || [];
    },
    enabled: !!user,
  });

  // Fetch user's active listings — demo_listings in demo mode
  const { data: userListings = [] } = useQuery({
    queryKey: ["user-listings", poll.id, user?.id, isDemo],
    queryFn: async () => {
      if (!user) return [];
      const table = isDemo ? "demo_listings" : "listings";
      const { data } = await (supabase as any)
        .from(table)
        .select("id, option_id, shares, price_per_share, total_ask, cost_basis, created_at")
        .eq("poll_id", poll.id)
        .eq("seller_id", user.id)
        .eq("status", "active");
      return (data || []) as any[];
    },
    enabled: !!user,
  });

  // All active listings for inline P2P
  const {
    data: pollListings = [],
    error: peerListingsError,
    isFetching: loadingPeerListings,
    refetch: refetchPeerListings,
  } = useQuery<PeerListing[]>({
    queryKey: ["peer-listings", poll.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("listings")
        .select("id, seller_id, poll_id, option_id, shares, price_per_share, total_ask, status, created_at")
        .eq("poll_id", poll.id)
        .eq("status", "active")
        .order("price_per_share", { ascending: true });
      if (error) throw error;
      return (data || []) as PeerListing[];
    },
    enabled: false,
  });

  const { data: nudgeWallet } = useQuery({
    queryKey: ["wallet-balance", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase.from("wallets").select("balance_usd").eq("user_id", user.id).single();
      return data;
    },
    enabled: !!user,
  });

  useEffect(() => { if (isLoggedIn) { setRegisterOpen(false); setLoginModalOpen(false); } }, [isLoggedIn]);
  useEffect(() => { setLocalOptions(poll.poll_options); }, [poll.poll_options]);
  useEffect(() => {
    if ((userStake?.stake_amount && Number(userStake.stake_amount) > 0) || userPositions.length > 0) {
      setHasCommitted(true);
    }
  }, [userStake, userPositions]);

  // One-shot Free→Pro hand-off: only highlight if user just voted on Free and clicked "Try Pro"
  // for THIS exact poll within the last 60 seconds. Never inherit historical Free votes.
  useEffect(() => {
    const state = location.state as { justVotedOptionId?: string; justVotedAt?: number; pollId?: string } | null;
    if (
      state?.justVotedOptionId &&
      state.pollId === poll.id &&
      typeof state.justVotedAt === "number" &&
      Date.now() - state.justVotedAt < 60_000
    ) {
      setHasVoted(true);
      setVotedOptionId(state.justVotedOptionId);
      // Clear router state so refresh doesn't persist this hand-off highlight
      navigate(location.pathname, { replace: true, state: {} });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [poll.id]);

  // *** PRO: Use total_stake_amount for price calculations ***
  const totalStake = localOptions.reduce((s, o) => s + (o.total_stake_amount || 0), 0);
  const totalVotes = localOptions.reduce((s, o) => s + o.total_votes_count, 0);
  const isClosed = poll.status !== "active" || new Date(poll.close_at) < new Date();

  const handleAllocate = (option: PollOption) => {
    if (!isLoggedIn) { setRegisterOpen(true); return; }
    setStakeOption(option);
    setStakeOpen(true);
  };

  // Clicking an option on Pro navigates to detail (homepage) or opens stake modal (detail)
  const handleOptionClick = (optionId: string, event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (isHomepageMode) {
      // Carry the user's selection to the detail page so the option stays
      // highlighted with a "commit capital" CTA — mirroring Free's behavior.
      navigate(`/forecast-arena-pro/${poll.slug}`, {
        state: { justVotedOptionId: optionId, justVotedAt: Date.now(), pollId: poll.id },
      });
      return;
    }
    // On detail page, clicking opens stake modal
    const option = sortedOptions.find(o => o.id === optionId);
    if (option && !isClosed) {
      handleAllocate(option);
    }
  };

  const handleTogglePeerOffers = () => {
    if (peerOffersOpen) { setPeerOffersOpen(false); setHasRequestedPeerListings(false); setInlineConfirming(null); return; }
    setPeerOffersOpen(true);
  };
  const handleLoadPeerListings = async () => {
    setHasRequestedPeerListings(true);
    setInlineConfirming(null);
    await refetchPeerListings();
  };

  // Real-time subscription including total_stake_amount
  useEffect(() => {
    const channel = supabase
      .channel(`poll-options-pro-${poll.id}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "poll_options", filter: `poll_id=eq.${poll.id}` },
        (payload) => {
          const updated = payload.new as { id: string; total_votes_count: number; total_stake_amount: number };
          setLocalOptions(prev => prev.map(o => o.id === updated.id ? { ...o, total_votes_count: updated.total_votes_count, total_stake_amount: updated.total_stake_amount } : o));
        })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [poll.id]);

  const sortedOptions = useMemo(() => [...localOptions].sort((a, b) => {
    const rank = (l: string) => l === "yes" ? 0 : l === "no" ? 2 : 1;
    return rank(a.label.toLowerCase()) - rank(b.label.toLowerCase());
  }), [localOptions]);

  // The user's primary committed option on THIS Pro poll, derived from real
  // Pro signals only (positions first, then a recorded stake). This drives
  // the persistent "You staked $X on Yes" sub-label on the homepage card so
  // users can see their previous Pro selections as they scroll.
  const userPrimaryCommit = useMemo(() => {
    if (userPositions.length > 0) {
      // Pick the position with the most shares
      const best = [...userPositions].sort((a: any, b: any) => Number(b.shares) - Number(a.shares))[0];
      const opt = localOptions.find(o => o.id === best.option_id);
      if (opt && Number(best.shares) > 0) {
        return {
          optionId: opt.id,
          label: opt.label,
          amount: Number(best.total_cost ?? best.cost_basis) || 0,
          source: "position" as const,
        };
      }
    }
    if (userStake?.option_id && userStake.is_staked && Number(userStake.stake_amount) > 0) {
      const opt = localOptions.find(o => o.id === userStake.option_id);
      if (opt) {
        return {
          optionId: opt.id,
          label: opt.label,
          amount: Number(userStake.stake_amount) || 0,
          source: "stake" as const,
        };
      }
    }
    return null;
  }, [userPositions, userStake, localOptions]);

  const optionLabels = useMemo(
    () => new Map(localOptions.map((option) => [option.id, option.label])),
    [localOptions]
  );

  const isYesNo = sortedOptions.length === 2 && sortedOptions.some(o => o.label.toLowerCase() === "yes") && sortedOptions.some(o => o.label.toLowerCase() === "no");

  const contextIsLong = (poll.context?.length || 0) > CONTEXT_PREVIEW_LENGTH;
  const contextPreview = poll.context
    ? contextIsLong ? poll.context.slice(0, CONTEXT_PREVIEW_LENGTH) + "…" : poll.context
    : null;

  // Leading option by stake amount (market price)
  const leadingOption = useMemo(() => {
    if (totalStake === 0) return null;
    return sortedOptions.reduce((best, o) => (o.total_stake_amount || 0) > (best.total_stake_amount || 0) ? o : best, sortedOptions[0]);
  }, [sortedOptions, totalStake]);

  const leadingPct = leadingOption && totalStake > 0 ? Math.round(((leadingOption.total_stake_amount || 0) / totalStake) * 100) : 0;
  const probColor = leadingPct >= 60
    ? (leadingOption?.label.toLowerCase() === "no" ? "text-amber-500" : "text-green-600")
    : "text-amber-500";

  const handleCardClick = () => {
    if (isHomepageMode) {
      navigate(`/forecast-arena-pro/${poll.slug}`);
    }
  };

  const handleInlineBuy = async (listing: any) => {
    if (!user) { toast({ title: "Sign in to buy", variant: "destructive" }); return; }
    setInlineBuyingId(listing.id);
    try {
      const { data, error } = await supabase.functions.invoke("buy-listing", { body: { listing_id: listing.id } });
      if (error || data?.error) throw new Error(data?.error || error?.message);
      const optLabel = optionLabels.get(listing.option_id) || "Unknown";
      toast({ title: "Purchase complete! 🎉", description: `You acquired ${Number(listing.shares).toFixed(4)} shares of "${optLabel}"` });
      queryClient.invalidateQueries({ queryKey: ["peer-listings", poll.id] });
      queryClient.invalidateQueries({ queryKey: ["positions-card", poll.id] });
      queryClient.invalidateQueries({ queryKey: ["user-stake", poll.id] });
      queryClient.invalidateQueries({ queryKey: ["user-listings", poll.id] });
      queryClient.invalidateQueries({ queryKey: ["wallet-balance", user.id] });
      queryClient.invalidateQueries({ queryKey: ["my-wallet-transactions", user.id] });
      queryClient.invalidateQueries({ queryKey: ["my-positions", user.id] });
      queryClient.invalidateQueries({ queryKey: ["my-share-positions", user.id] });
      queryClient.invalidateQueries({ queryKey: ["my-trades", user.id] });
      queryClient.invalidateQueries({ queryKey: ["my-active-listings", user.id] });
      setInlineConfirming(null);
      setPeerOffersOpen(false);
      setHasRequestedPeerListings(false);
    } catch (err: any) {
      toast({ title: "Purchase failed", description: err.message, variant: "destructive" });
    } finally {
      setInlineBuyingId(null);
    }
  };

  return (
    <motion.div
      whileHover={{ y: -2 }}
      onClick={handleCardClick}
      className={`bg-card rounded-lg border p-3 card-shadow flex flex-col relative ${
        isTrending ? "border-accent ring-2 ring-accent/20 shadow-lg shadow-accent/10" : "border-amber-500/30"
      } ${isHomepageMode ? "cursor-pointer hover:border-amber-500/60 hover:shadow-md transition-all" : ""}`}
      animate={isTrending ? { boxShadow: ["0 0 0px hsl(var(--accent) / 0.1)", "0 0 20px hsl(var(--accent) / 0.25)", "0 0 0px hsl(var(--accent) / 0.1)"] } : {}}
      transition={isTrending ? { duration: 2, repeat: Infinity, ease: "easeInOut" } : {}}
    >
      {/* Trending badge */}
      {isTrending && (
        <div className="flex items-center gap-1.5 mb-1.5">
          <motion.span
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-accent bg-accent/10 px-2 py-0.5 rounded-full border border-accent/30"
          >
            <TrendingUp className="w-3 h-3" />
            🔥 Trending
          </motion.span>
        </div>
      )}

      {/* Header row */}
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-[10px] font-medium bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">{poll.category}</span>
        <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <Clock className="w-3 h-3" />{getTimeRemaining(poll.close_at)}
        </span>
        <div className="flex items-center gap-1 ml-auto">
          <BookmarkToggle pollId={poll.id} onRequireAuth={() => setRegisterOpen(true)} />
          <SharePopover url={`/forecast-arena-pro/${poll.slug}`} title={poll.title} />
        </div>
      </div>

      {/* Question title + Market Price badge */}
      <div className="flex items-start justify-between gap-3 mb-1">
        <Link to={`/forecast-arena-pro/${poll.slug}`} className="flex-1">
          <h3 className="font-display font-bold text-foreground leading-snug text-sm hover:underline decoration-amber-500/60 underline-offset-2 cursor-pointer transition-all">{poll.title}</h3>
        </Link>
        {leadingOption && totalStake > 0 && (
          <div className="text-right shrink-0">
            <span className={`font-mono text-xl font-bold ${probColor}`}>{leadingPct}%</span>
            <span className={`font-mono text-sm font-bold ml-1 ${probColor}`}>{leadingOption.label}</span>
            <p className="text-[9px] text-amber-600 font-semibold">market price</p>
          </div>
        )}
        {totalStake === 0 && (
          <div className="text-right shrink-0">
            <span className="font-mono text-lg font-bold text-muted-foreground">50%</span>
            <p className="text-[9px] text-muted-foreground">no capital yet</p>
          </div>
        )}
      </div>

      {/* Context preview */}
      {poll.context && (
        <div className="mb-1">
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            {detailsExpanded ? poll.context : contextPreview}
          </p>
          {contextIsLong && (
            <button onClick={() => setDetailsExpanded(!detailsExpanded)} className="flex items-center gap-0.5 text-[10px] text-primary hover:text-accent transition-colors mt-0.5">
              {detailsExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              {detailsExpanded ? "Less" : "View details"}
            </button>
          )}
        </div>
      )}

      {/* Two-column layout: Left = Market Options, Right = Capital Distribution */}
      <div className="grid grid-cols-2 gap-3 mb-2">
        {/* LEFT: Market options */}
        <div className="flex flex-col relative">
          <p className="text-[9px] uppercase tracking-wider text-amber-600 font-semibold mb-0.5">
            Back with capital
            {userPrimaryCommit ? (
              <span className="ml-1 normal-case tracking-normal font-normal text-amber-700 dark:text-amber-400">
                — you staked <span className="font-semibold">${userPrimaryCommit.amount.toFixed(2)}</span> on{" "}
                <span className="font-semibold">{userPrimaryCommit.label}</span>
              </span>
            ) : hasVoted && votedOptionId ? (() => {
              const votedOpt = sortedOptions.find(o => o.id === votedOptionId);
              return votedOpt ? (
                <span className="ml-1 normal-case tracking-normal font-normal text-primary">
                  — voted <span className="font-semibold">{votedOpt.label}</span>
                </span>
              ) : null;
            })() : null}
          </p>

          <div className="space-y-1.5 flex-1 relative">
            {sortedOptions.map((option) => {
              const price = totalStake > 0 ? Math.max(0.05, Math.min(0.95, (option.total_stake_amount || 0) / totalStake)) : 0.50;
              const isYes = option.label.toLowerCase() === "yes";
              const isNo = option.label.toLowerCase() === "no";
              const optStake = option.total_stake_amount || 0;

              const hasPosition = userPositions.some((p: any) => p.option_id === option.id && Number(p.shares) > 0);
              const isPrimaryCommit = userPrimaryCommit?.optionId === option.id;
              const isSelected = votedOptionId === option.id || hasPosition || isPrimaryCommit;

              const selectedBorder = isYes ? "border-green-500 ring-1 ring-green-500/30" : isNo ? "border-blue-500 ring-1 ring-blue-500/30" : "border-amber-500 ring-1 ring-amber-500/30";
              const selectedBg = isYes ? "bg-green-500/10" : isNo ? "bg-blue-500/10" : "bg-amber-500/10";

              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={(e) => handleOptionClick(option.id, e)}
                  disabled={isClosed}
                  className={`relative z-10 w-full pointer-events-auto overflow-hidden rounded-md border transition-all text-left touch-manipulation ${
                    isSelected ? `${selectedBorder} ${selectedBg}` : "border-border hover:border-amber-500/40 hover:bg-amber-500/5 bg-transparent"
                  } ${isHomepageMode ? "hover:scale-[1.02] hover:shadow-sm" : ""} cursor-pointer`}
                >
                  <div className="relative z-10 flex items-center justify-between px-2.5 py-2">
                    <span className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                      {option.label}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-amber-600">${price.toFixed(2)}</span>
                      {optStake > 0 && (
                        <span className="text-[9px] text-muted-foreground font-mono">${optStake.toFixed(0)}</span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {!isClosed && (
            <div className="mt-1.5 pt-1.5 border-t border-border">
              <p className="text-[9px] text-muted-foreground text-center flex items-center justify-center gap-1">
                <DollarSign className="w-3 h-3 text-amber-500" />
                {isLoggedIn ? "Click an option to commit capital" : "Sign in to commit capital"}
              </p>
            </div>
          )}
        </div>

        {/* RIGHT: Capital Distribution */}
        <div className="flex flex-col">
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">Capital Distribution</p>
            <span className="text-[9px] text-muted-foreground font-mono">${totalStake.toFixed(0)} committed</span>
          </div>

          <div className="space-y-2 flex-1">
            {sortedOptions.map((option) => {
              const pct = totalStake > 0 ? Math.round(((option.total_stake_amount || 0) / totalStake) * 100) : 0;
              const isYes = option.label.toLowerCase() === "yes";
              const isNo = option.label.toLowerCase() === "no";
              const barColor = isYes ? "bg-green-500" : isNo ? "bg-blue-400" : "bg-amber-500";

              return (
                <div key={option.id} className="space-y-0.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-foreground font-medium">{option.label}</span>
                    <span className="font-mono text-muted-foreground">
                      ${(option.total_stake_amount || 0).toFixed(0)} <span className="text-[9px]">({pct}%)</span>
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-700 ${barColor}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-border">
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <Users className="w-3 h-3" />{totalVotes} forecasts · ${totalStake.toFixed(0)} committed
            </span>
            {!compact && (
              <Link to={`/forecast-arena-pro/${poll.slug}`} className="text-[10px] font-medium text-amber-600 hover:text-amber-500 transition-colors">
                Full details →
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Detail-page only content */}
      {!isHomepageMode && (
        <>
          {/* Nudge to commit capital (if user voted but hasn't committed) */}
          {!isClosed && hasVoted && !hasCommitted && userPositions.length === 0 && userListings.length === 0 && (() => {
            const votedOption = sortedOptions.find(o => o.id === votedOptionId);
            if (!votedOption) return null;
            const price = totalStake > 0 ? Math.max(0.05, Math.min(0.95, (votedOption.total_stake_amount || 0) / totalStake)) : 0.50;
            const isDismissed = !!localStorage.getItem(`nudge_dismissed_pro_${poll.id}`);
            const nudgeWalletBalance = Number(nudgeWallet?.balance_usd || 0);

            // Inline listings panel
            const inlineListingsPanel = (
              <AnimatePresence>
                {peerOffersOpen && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                    <div className="bg-muted/40 border border-border rounded-md p-2.5 space-y-2 mt-2">
                      <p className="text-[10px] font-semibold text-muted-foreground flex items-center gap-1">
                        <ShoppingBag className="w-3 h-3" /> Shares listed by other forecasters
                      </p>
                      {user && <p className="text-[9px] text-muted-foreground">Your wallet: <span className="font-mono font-semibold text-foreground">${nudgeWalletBalance.toFixed(2)}</span></p>}
                      <Button size="sm" variant="outline" className="w-full text-[10px] h-7" onClick={() => void handleLoadPeerListings()} disabled={loadingPeerListings}>
                        {loadingPeerListings ? <><Loader2 className="w-3 h-3 mr-1 animate-spin" />Loading…</> : hasRequestedPeerListings ? "Reload listings" : "Load listings"}
                      </Button>
                      {hasRequestedPeerListings && (
                        peerListingsError ? <p className="text-[10px] text-destructive text-center py-2">Could not load listings.</p>
                        : pollListings.length === 0 ? <p className="text-[10px] text-muted-foreground text-center py-2">No listings available</p>
                        : <div className="space-y-1.5">
                            {pollListings.map((listing) => {
                              const isOwn = user?.id === listing.seller_id;
                              const canAfford = nudgeWalletBalance >= Number(listing.total_ask);
                              const isConfirmingThis = inlineConfirming === listing.id;
                              const isBuyingThis = inlineBuyingId === listing.id;
                              const optLabel = optionLabels.get(listing.option_id) || "Unknown";
                              return (
                                <div key={listing.id} className={`border rounded-md p-2 space-y-1 ${isOwn ? "border-amber-500/40 bg-amber-500/5" : "border-border"}`}>
                                  <div className="flex items-center justify-between text-[10px]">
                                    <span className="flex items-center gap-1"><Tag className="w-2.5 h-2.5 text-muted-foreground" /><span className="font-semibold text-foreground">{optLabel}</span>
                                      {isOwn && <span className="text-[8px] bg-amber-500/15 text-amber-700 px-1 py-0.5 rounded font-medium">Your listing</span>}
                                    </span>
                                    <span className="font-mono font-bold text-foreground">${Number(listing.total_ask).toFixed(2)}</span>
                                  </div>
                                  <div className="flex items-center gap-3 text-[9px] text-muted-foreground">
                                    <span>{Number(listing.shares).toFixed(4)} shares</span>
                                    <span>${Number(listing.price_per_share).toFixed(2)}/share</span>
                                  </div>
                                  {isOwn ? null : user ? (
                                    isConfirmingThis ? (
                                      <div className="space-y-1">
                                        <p className="text-[9px] text-foreground font-medium text-center">Buy {Number(listing.shares).toFixed(4)} shares for <span className="font-mono font-bold">${Number(listing.total_ask).toFixed(2)}</span>?</p>
                                        <div className="flex gap-1.5">
                                          <Button size="sm" className="flex-1 text-[9px] h-6 bg-green-600 hover:bg-green-700" disabled={isBuyingThis || !canAfford} onClick={() => handleInlineBuy(listing)}>
                                            {isBuyingThis ? <><Loader2 className="w-2.5 h-2.5 animate-spin" />Buying…</> : <><CheckCircle className="w-2.5 h-2.5" />Confirm</>}
                                          </Button>
                                          <Button size="sm" variant="outline" className="flex-1 text-[9px] h-6" onClick={() => setInlineConfirming(null)} disabled={isBuyingThis}>Back</Button>
                                        </div>
                                      </div>
                                    ) : (
                                      <Button size="sm" className="w-full text-[9px] h-6" disabled={!canAfford} onClick={() => setInlineConfirming(listing.id)}>
                                        {canAfford ? "Buy" : `Need $${Number(listing.total_ask).toFixed(2)}`}
                                      </Button>
                                    )
                                  ) : <p className="text-[9px] text-muted-foreground text-center">Sign in to buy</p>}
                                </div>
                              );
                            })}
                          </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            );

            if (isDismissed) {
              return (
                <div className="mt-2 pt-2 border-t border-border space-y-0">
                  <div className="flex items-center gap-2">
                    <Button size="sm" onClick={() => handleAllocate(votedOption)} className="flex-1 text-xs font-bold gap-1 bg-amber-600 hover:bg-amber-700 animate-subtle-blink">
                      <DollarSign className="w-3 h-3" /> Commit capital
                    </Button>
                    <Button size="sm" variant="outline" onClick={handleTogglePeerOffers}
                      className="flex-1 text-xs font-medium gap-1 border-amber-500 text-amber-600 hover:bg-amber-50">
                      <Tag className="w-3 h-3 text-amber-500" /> Browse peer offers
                    </Button>
                  </div>
                  {inlineListingsPanel}
                </div>
              );
            }

            return (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-2 pt-2 border-t border-border overflow-hidden">
                <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-3 space-y-2 relative">
                  <button
                    onClick={() => { localStorage.setItem(`nudge_dismissed_pro_${poll.id}`, "1"); }}
                    className="absolute top-2 right-2 text-muted-foreground hover:text-foreground text-xs"
                    aria-label="Dismiss"
                  >✕</button>
                  <p className="text-xs font-semibold text-foreground">
                    Back your forecast with capital
                  </p>
                  <p className="text-[10px] text-muted-foreground leading-relaxed">
                    You've shared your view — now back it with conviction. Each share pays $1.00 if the outcome matches your forecast.
                  </p>
                  <div className="text-[10px] text-muted-foreground space-y-0.5">
                    <p>Your forecast: <span className="font-semibold text-foreground">{votedOption.label}</span></p>
                    <p>Market price: <span className="font-mono font-semibold text-amber-600">${price.toFixed(2)}</span></p>
                    <p>If correct: <span className="font-mono font-semibold text-green-600">$1.00 per share</span></p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => { localStorage.setItem(`nudge_dismissed_pro_${poll.id}`, "1"); handleAllocate(votedOption); }}
                      className="flex-1 text-xs font-bold gap-1 bg-amber-600 hover:bg-amber-700 animate-subtle-blink">
                      <DollarSign className="w-3 h-3" /> Commit capital
                    </Button>
                    <Button size="sm" variant="outline" onClick={handleTogglePeerOffers}
                      className="flex-1 text-xs font-medium gap-1 border-amber-500 text-amber-600 hover:bg-amber-50">
                      <Tag className="w-3 h-3 text-amber-500" /> Browse peer offers
                    </Button>
                  </div>
                  {inlineListingsPanel}
                </div>
              </motion.div>
            );
          })()}

          {/* Position panel */}
          {user && (hasCommitted || userPositions.length > 0 || userListings.length > 0) && (() => {
            const stakedOptionId = userStake?.option_id || userPositions[0]?.option_id || userListings[0]?.option_id;
            if (!stakedOptionId) return null;
            const stakedOption = sortedOptions.find(o => o.id === stakedOptionId);
            const stakedPosition = userPositions.find(p => p.option_id === stakedOptionId);
            const totalShares = stakedPosition ? Number(stakedPosition.shares) : 0;
            const stakeAmount = stakedPosition
              ? Number(stakedPosition.total_cost)
              : userListings.length > 0
                ? userListings.reduce((s: number, l: any) => s + Number(l.cost_basis || 0), 0)
                : Number(userStake?.stake_amount || 0);
            const stakeDate = userStake?.created_at || stakedPosition?.created_at;
            const listedShares = userListings.reduce((s, l) => s + Number(l.shares), 0);
            const totalActive = totalShares + listedShares;
            const potentialGain = totalActive > 0 ? totalActive : (stakeAmount || 0);
            const stakedOptionData = sortedOptions.find(o => o.id === stakedOptionId);
            const currentMarketPrice = stakedOptionData && totalStake > 0
              ? Math.max(0.05, Math.min(0.95, (stakedOptionData.total_stake_amount || 0) / totalStake))
              : 0.5;

            return (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-2 pt-2 border-t border-border">
                <div className="bg-amber-500/5 border border-amber-500/15 rounded-lg p-2.5 space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-amber-600" />
                    <span className="text-[10px] font-bold text-foreground">Your Position</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-[10px]">
                    <div>
                      <p className="text-muted-foreground">Committed</p>
                      <p className="font-mono font-bold text-foreground">${Number(stakeAmount || 0).toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">On</p>
                      <p className="font-semibold text-foreground">{stakedOption?.label || "—"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">If correct</p>
                      <p className="font-mono font-bold text-green-600">${potentialGain.toFixed(2)}</p>
                    </div>
                  </div>
                  {userListings.length > 0 && (
                    <div className="mt-1 space-y-1.5">
                      <p className="text-[9px] uppercase tracking-wider text-amber-600 font-semibold">
                        📋 Active listing{userListings.length > 1 ? "s" : ""} — shares in escrow
                      </p>
                      {userListings.map((listing) => (
                        <div key={listing.id} className="bg-amber-500/5 border border-amber-500/20 rounded-md px-2.5 py-2 space-y-0.5">
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="font-semibold text-foreground">
                              {Number(listing.shares).toFixed(4)} shares @ ${Number(listing.price_per_share).toFixed(2)}/share
                            </span>
                            <span className="font-mono font-bold text-foreground">${Number(listing.total_ask).toFixed(2)}</span>
                          </div>
                          <p className="text-[9px] text-amber-700">
                            Visible to all users · You receive ${(Number(listing.total_ask) * 0.965).toFixed(2)} when sold (after 3.5% fee)
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                  {stakeDate && (
                    <p className="text-[9px] text-muted-foreground">
                      Committed {new Date(stakeDate).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                    </p>
                  )}
                  {!isClosed && (
                    <div className="flex gap-1.5 mt-1 flex-wrap">
                      {stakedOption && (
                        <button
                          onClick={(e) => { e.stopPropagation(); setStakeOption(stakedOption); setStakeOpen(true); }}
                          className="flex-1 flex items-center justify-center gap-1 text-[10px] font-bold py-1.5 px-2 rounded-md bg-amber-600 hover:bg-amber-700 text-white transition-colors"
                        >
                          Buy more
                        </button>
                      )}
                      {totalShares > 0 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSavedListInfo({
                              optionId: stakedOptionId!,
                              optionLabel: stakedOption?.label || "",
                              shares: totalShares,
                              price: currentMarketPrice,
                            });
                            setListOpen(true);
                          }}
                          className="flex-1 flex items-center justify-center gap-1 text-[10px] font-bold py-1.5 px-2 rounded-md border border-amber-500/40 bg-amber-500/5 hover:bg-amber-500/10 text-amber-600 transition-colors"
                        >
                          List for sale
                        </button>
                      )}
                      {totalShares > 0 && (
                        <button
                          onClick={(e) => { e.stopPropagation(); setExitModalOpen(true); }}
                          className="flex-1 flex items-center justify-center gap-1 text-[10px] font-bold py-1.5 px-2 rounded-md border border-border bg-background hover:bg-muted transition-colors text-foreground"
                        >
                          Exit early
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {stakedOptionId && totalShares > 0 && (
                  <ExitPositionModal
                    open={exitModalOpen}
                    onOpenChange={setExitModalOpen}
                    poll={{ id: poll.id, title: poll.title }}
                    optionId={stakedOptionId}
                    optionLabel={stakedOption?.label || ""}
                    shares={totalShares}
                    stakeAmount={Number(stakeAmount || 0)}
                    currentPrice={currentMarketPrice}
                    potentialPayoutIfCorrect={potentialGain}
                  />
                )}
              </motion.div>
            );
          })()}

          <StakeModal open={stakeOpen} onOpenChange={setStakeOpen} poll={{ ...poll, poll_options: localOptions }} selectedOption={stakeOption} />
          {savedListInfo && (
            <ListSharesModal
              open={listOpen}
              onOpenChange={(open) => { setListOpen(open); if (!open) setSavedListInfo(null); }}
              poll={{ id: poll.id, title: poll.title }}
              optionId={savedListInfo.optionId}
              optionLabel={savedListInfo.optionLabel}
              availableShares={savedListInfo.shares}
              suggestedPrice={savedListInfo.price}
            />
          )}
        </>
      )}

      {isClosed && (
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <Lock className="w-3 h-3" />Market closed
        </div>
      )}

      <RegistrationModal open={registerOpen} onOpenChange={setRegisterOpen}
        onSwitchToLogin={() => { setRegisterOpen(false); setLoginModalOpen(true); }} />
      <LoginModal open={loginModalOpen} onOpenChange={setLoginModalOpen}
        onSwitchToRegister={() => { setLoginModalOpen(false); setRegisterOpen(true); }} />
    </motion.div>
  );
};

export default PollCardPro;
