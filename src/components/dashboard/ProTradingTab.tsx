import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  BarChart3, TrendingUp, CheckCircle, XCircle, Clock,
  DollarSign, Activity, ArrowRight, Wallet, Plus, ArrowDownToLine,
  ChevronDown, ChevronUp, History, Receipt, CreditCard, Tag
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
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
  payment_reference?: string | null;
  _isP2POnly?: boolean;
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

const DEPOSIT_AMOUNTS = [1, 5, 10, 20, 50, 100, 250, 500, 1000];

interface ProTradingTabProps {
  user: any;
  profile: any;
  wallet: { balance_usd: number } | null;
  refreshWallet: () => Promise<void>;
  proActive: Position[];
  proResolved: Position[];
  proActivity: ActivityItem[];
  sharePositions: any[];
  myActiveListings: any[];
  tradeHistory: any[];
  walletTxns: any[];
  transactions: any[];
  payouts: any[];
  walletPayouts: any[];
  isLoading: boolean;
}

const ProTradingTab = ({
  user, profile, wallet, refreshWallet,
  proActive, proResolved, proActivity,
  sharePositions, myActiveListings, tradeHistory,
  walletTxns, transactions, payouts, walletPayouts,
  isLoading,
}: ProTradingTabProps) => {
  const { toast } = useToast();

  // Expand/collapse states
  const [showAllActivity, setShowAllActivity] = useState(false);
  const [showAllActive, setShowAllActive] = useState(false);
  const [showAllClosed, setShowAllClosed] = useState(false);
  const [showAllWalletTxns, setShowAllWalletTxns] = useState(false);
  const [showAllTransactions, setShowAllTransactions] = useState(false);
  const [showAllPayouts, setShowAllPayouts] = useState(false);

  // Deposit/withdraw states
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

  // Stats
  const totalCommitted = proActive.reduce((s, p) => s + (p.stake_amount || 0), 0)
    + proResolved.reduce((s, p) => s + (p.stake_amount || 0), 0);
  const earningsFromPayouts = payouts?.reduce((s: number, p: any) => s + (p.amount || 0), 0) || 0;
  const earningsFromWallet = walletPayouts?.reduce((s: number, p: any) => s + Math.abs(p.amount || 0), 0) || 0;
  // Use payouts table first; fall back to wallet_transactions payout records if payouts table is empty
  const totalEarnings = earningsFromPayouts || earningsFromWallet;
  const wonCount = proResolved.filter(p => p.outcome === "won").length;
  const accuracy = proResolved.length > 0 ? Math.round((wonCount / proResolved.length) * 100) : null;

  useEffect(() => {
    if (withdrawOpen && profile?.phone && !withdrawPhone) {
      setWithdrawPhone(profile.phone);
    }
  }, [withdrawOpen, profile]);

  const handleDeposit = async (amount: number) => {
    if (!user) return;
    setDepositLoading(true);
    try {
      const callbackUrl = `${window.location.origin}/my-dashboard?deposit=success&tab=pro`;
      const { data, error } = await supabase.functions.invoke("paystack-checkout", {
        body: {
          email: user.email,
          amount,
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
      toast({ title: "✅ Withdrawal initiated", description: `$${amt.toFixed(2)} → ~KES ${data.amount_kes?.toFixed(0) || '—'}` });
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
    } catch { setBankList([]); }
    finally { setBanksLoading(false); }
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
        body: { amount: amt, method: "bank", bank_code: bankCode, account_number: bankAccountNumber, account_name: bankAccountName, currency: bankCurrency },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.detail || data.error);
      toast({ title: "✅ Bank transfer initiated", description: `$${amt.toFixed(2)} → ${bankCurrency} ${data.amount_local?.toFixed(0) || '—'}` });
      setWithdrawBankOpen(false);
      setBankAmount(""); setBankAccountNumber(""); setBankAccountName(""); setBankCode("");
      refreshWallet();
    } catch (err: any) {
      toast({ title: "Bank withdrawal failed", description: err.message, variant: "destructive" });
    } finally { setBankWithdrawLoading(false); }
  };

  // Activity feed badge config
  const kindConfig: Record<string, { badge: string; color: string }> = {
    vote: { badge: "Voted", color: "bg-blue-500/10 text-blue-600" },
    stake: { badge: "Committed", color: "bg-orange-500/10 text-orange-600" },
    deposit: { badge: "Deposit", color: "bg-green-500/10 text-green-600" },
    withdrawal: { badge: "Withdrawal", color: "bg-red-500/10 text-red-500" },
    payout: { badge: "Payout", color: "bg-emerald-500/10 text-emerald-600" },
    share_purchase: { badge: "Bought Shares", color: "bg-indigo-500/10 text-indigo-600" },
    share_sale: { badge: "Sold Shares", color: "bg-teal-500/10 text-teal-600" },
    position_won: { badge: "✓ Won", color: "bg-green-500/10 text-green-600" },
    position_lost: { badge: "✗ Lost", color: "bg-red-500/10 text-red-500" },
    payout_completed: { badge: "Payout", color: "bg-emerald-500/10 text-emerald-600" },
    withdrawal_completed: { badge: "Sent", color: "bg-green-500/10 text-green-600" },
    withdrawal_failed: { badge: "Failed", color: "bg-red-500/10 text-red-500" },
    comment_reply: { badge: "Reply", color: "bg-purple-500/10 text-purple-600" },
    listing_sold: { badge: "Listing Sold", color: "bg-amber-500/10 text-amber-600" },
  };

  return (
    <div>
      {/* Pro Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        {[
          { icon: Wallet, label: "Wallet Balance", value: <DualCurrency amount={wallet?.balance_usd || 0} /> },
          { icon: Activity, label: "Active Positions", value: proActive.length },
          { icon: DollarSign, label: "Capital Committed", value: <DualCurrency amount={totalCommitted} /> },
          { icon: TrendingUp, label: "Total Earnings", value: <DualCurrency amount={earningsFromPayouts} /> },
          { icon: CheckCircle, label: "Pro Accuracy", value: accuracy != null ? `${accuracy}%` : "—" },
        ].map((stat) => (
          <div key={stat.label} className="bg-card border border-border rounded-lg p-4">
            <stat.icon className="w-5 h-5 text-primary mb-2" />
            <p className="text-2xl font-bold font-mono text-foreground">{stat.value}</p>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2 mb-8">
        <div className="flex flex-wrap gap-2">
          {DEPOSIT_AMOUNTS.slice(0, 6).map(amount => (
            <Button key={amount} variant="outline" size="sm"
              onClick={() => handleDeposit(amount)} disabled={depositLoading}
              className="font-mono">
              <Plus className="w-3 h-3 mr-1" />${amount}
            </Button>
          ))}
        </div>
        <Button variant="outline" size="sm" disabled={(wallet?.balance_usd || 0) < 1} onClick={() => setWithdrawOpen(true)}>
          <ArrowDownToLine className="w-3 h-3 mr-1" /> Mobile Money
        </Button>
        <Button variant="outline" size="sm" disabled={(wallet?.balance_usd || 0) < 1}
          onClick={() => { setWithdrawBankOpen(true); fetchBanks(bankCurrency); }}>
          <ArrowDownToLine className="w-3 h-3 mr-1" /> Bank
        </Button>
        <Link to="/forecast-arena-pro">
          <Button variant="outline" size="sm" className="border-amber-500/40 text-amber-700 hover:bg-amber-50">
            Browse Pro Markets <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        </Link>
      </div>

      {/* Section Quick-Nav */}
      <div className="flex flex-wrap gap-2 mb-8">
        {[
          { label: "Activity", href: "#pro-activity", icon: Activity },
          { label: "Positions", href: "#pro-positions", icon: BarChart3 },
          { label: "Listings", href: "#pro-listings", icon: Tag },
          { label: "Share Positions", href: "#pro-shares", icon: TrendingUp },
          { label: "Closed", href: "#pro-closed", icon: History },
          { label: "Wallet", href: "#pro-wallet", icon: Wallet },
          { label: "Trades", href: "#pro-trades", icon: Receipt },
          { label: "Payouts", href: "#pro-payouts", icon: CreditCard },
        ].map(({ label, href, icon: Icon }) => (
          <a key={href} href={href} onClick={e => { e.preventDefault(); document.getElementById(href.slice(1))?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}>
            <Button variant="outline" size="sm" className="flex items-center gap-1.5 text-xs">
              <Icon className="w-3.5 h-3.5" />{label}
            </Button>
          </a>
        ))}
      </div>

      {/* Pro Activity Feed */}
      <div id="pro-activity" className="mb-8 scroll-mt-20">
        <h2 className="font-display text-xl font-bold text-foreground mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary" />
          Pro Activity
          {proActivity.length > 0 && <span className="text-sm font-normal text-muted-foreground ml-1">({proActivity.length})</span>}
        </h2>
        {proActivity.length === 0 ? (
          <div className="bg-card border border-border rounded-lg p-6 text-center">
            <p className="text-sm text-muted-foreground">No Pro activity yet. Commit capital on a forecast to start.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {(showAllActivity ? proActivity : proActivity.slice(0, 5)).map(item => {
              const cfg = kindConfig[item.kind] ?? { badge: item.kind, color: "bg-muted text-muted-foreground" };
              const inner = (
                <div className="bg-card border border-border rounded-lg p-3 flex items-center justify-between gap-3 hover:border-primary/40 transition-colors">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded shrink-0 ${cfg.color}`}>{cfg.badge}</span>
                    <div className="min-w-0">
                      <p className="text-xs text-foreground truncate">{item.label}</p>
                      {item.description && <p className="text-[10px] text-muted-foreground truncate">{item.description}</p>}
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
              return item.link ? <Link key={item.id} to={item.link}>{inner}</Link> : <div key={item.id}>{inner}</div>;
            })}
            {proActivity.length > 5 && (
              <button onClick={() => setShowAllActivity(v => !v)}
                className="w-full flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground py-2 border border-dashed border-border rounded-lg hover:border-primary/40 transition-colors">
                {showAllActivity ? <><ChevronUp className="w-3.5 h-3.5" /> Show less</> : <><ChevronDown className="w-3.5 h-3.5" /> Show {proActivity.length - 5} more</>}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Active Pro Positions */}
      <div id="pro-positions" className="mb-8 scroll-mt-20">
        <h2 className="font-display text-xl font-bold text-foreground mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary" />
          Active Pro Positions ({proActive.length})
        </h2>
        {isLoading ? (
          <p className="text-sm text-muted-foreground py-4">Loading...</p>
        ) : proActive.length === 0 ? (
          <div className="bg-card border border-border rounded-lg p-6 text-center">
            <p className="text-sm text-muted-foreground mb-3">No active Pro positions yet.</p>
            <Link to="/forecast-arena-pro"><Button variant="outline" size="sm">Browse Pro Markets <ArrowRight className="w-3.5 h-3.5 ml-1" /></Button></Link>
          </div>
        ) : (
          <div className="space-y-3">
            {(showAllActive ? proActive : proActive.slice(0, 5)).map((pos: any) => {
              const activeListing = myActiveListings.find((l: any) => l.poll_id === pos.poll_id);
              const capitalAmount = pos.stake_amount || (activeListing ? Number(activeListing.cost_basis) : 0);
              return (
                <Link key={pos.id} to={`/forecast-arena-pro/${pos.poll_slug}`} className="block">
                  <div className={`bg-card border rounded-lg p-4 hover:border-primary/40 transition-colors ${activeListing ? "border-amber-500/30" : "border-border"}`}>
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-sm font-semibold text-foreground leading-snug flex-1 mr-4">{pos.poll_title}</h3>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {activeListing && (
                          <span className="text-[10px] bg-amber-500/10 text-amber-700 border border-amber-500/20 px-1.5 py-0.5 rounded-full font-medium">Listed</span>
                        )}
                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${pos.option_label.toLowerCase() === "yes" ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-500"}`}>
                          {pos.option_label}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                      <span>Entry: ${pos.entry_price.toFixed(2)}</span>
                      <span className="text-primary font-semibold">Capital: ${Number(capitalAmount).toFixed(2)}</span>
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
            {proActive.length > 5 && (
              <button onClick={() => setShowAllActive(v => !v)}
                className="w-full flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground py-2 border border-dashed border-border rounded-lg hover:border-primary/40 transition-colors">
                {showAllActive ? <><ChevronUp className="w-3.5 h-3.5" /> Show less</> : <><ChevronDown className="w-3.5 h-3.5" /> Show {proActive.length - 5} more</>}
              </button>
            )}
          </div>
        )}
      </div>

      {/* My Active P2P Listings */}
      <div id="pro-listings" className="mb-8 scroll-mt-20">
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
            {myActiveListings.map((listing: any) => (
              <Link key={listing.id} to={`/forecast-arena-pro/${listing.polls?.slug}`} className="block">
                <div className="bg-card border border-amber-500/30 rounded-lg p-4 hover:border-amber-500/60 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 mr-4">
                      <h3 className="text-sm font-semibold text-foreground leading-snug">{listing.polls?.title}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Your forecast: <span className="font-semibold text-foreground">{listing.poll_options?.label}</span>
                      </p>
                    </div>
                    <span className="text-[10px] bg-amber-500/10 text-amber-700 border border-amber-500/20 px-2 py-0.5 rounded-full font-semibold shrink-0">Listed</span>
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

      {/* Share Positions (Trading) */}
      {sharePositions.length > 0 && (
        <div id="pro-shares" className="mb-8 scroll-mt-20">
          <h2 className="font-display text-xl font-bold text-foreground mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Share Positions ({sharePositions.length})
          </h2>
          <div className="space-y-2">
            {sharePositions.map((pos: any) => (
              <Link key={pos.id} to={pos.poll_slug ? `/forecast-arena-pro/${pos.poll_slug}` : "#"} className="block">
                <div className="bg-card border border-border rounded-lg p-4 hover:border-primary/40 transition-colors">
                  <h3 className="text-sm font-semibold text-foreground mb-1 leading-snug">{pos.poll_title}</h3>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="font-semibold text-foreground">{pos.option_label}</span>
                      <span>{Number(pos.shares).toFixed(4)} shares</span>
                      <span>avg ${Number(pos.avg_price).toFixed(2)}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-muted-foreground">Cost: </span>
                      <span className="font-mono text-sm font-bold">${Number(pos.total_cost).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Closed Pro Positions */}
      <div id="pro-closed" className="mb-8 scroll-mt-20">
        <h2 className="font-display text-xl font-bold text-foreground mb-4 flex items-center gap-2">
          <History className="w-5 h-5 text-primary" />
          Closed Pro Positions ({proResolved.length})
        </h2>
        {proResolved.length === 0 ? (
          <div className="bg-card border border-border rounded-lg p-6 text-center">
            <p className="text-sm text-muted-foreground">No closed Pro positions yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {(showAllClosed ? proResolved : proResolved.slice(0, 5)).map(pos => (
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
                  {pos.stake_amount && <span>Capital: ${pos.stake_amount.toFixed(2)}</span>}
                  {pos.outcome === "won" && pos.stake_amount && (
                    <span className="text-green-600 font-semibold">Earned: ${pos.potential_payout.toFixed(2)}</span>
                  )}
                  <span className="text-muted-foreground/60 ml-auto">{new Date(pos.created_at).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}</span>
                </div>
              </div>
            ))}
            {proResolved.length > 5 && (
              <button onClick={() => setShowAllClosed(v => !v)}
                className="w-full flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground py-2 border border-dashed border-border rounded-lg hover:border-primary/40 transition-colors">
                {showAllClosed ? <><ChevronUp className="w-3.5 h-3.5" /> Show less</> : <><ChevronDown className="w-3.5 h-3.5" /> Show {proResolved.length - 5} more</>}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Wallet Activity */}
      {walletTxns && walletTxns.length > 0 && (
        <div id="pro-wallet" className="mb-8 scroll-mt-20">
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
            <button onClick={() => setShowAllWalletTxns(v => !v)}
              className="w-full flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground py-2 border border-dashed border-border rounded-lg hover:border-primary/40 transition-colors mt-2">
              {showAllWalletTxns ? <><ChevronUp className="w-3.5 h-3.5" /> Show less</> : <><ChevronDown className="w-3.5 h-3.5" /> Show {walletTxns.length - 5} more</>}
            </button>
          )}
        </div>
      )}

      {/* Trade History */}
      {tradeHistory && tradeHistory.length > 0 && (
        <div id="pro-trades" className="mb-8 scroll-mt-20">
          <h2 className="font-display text-xl font-bold text-foreground mb-4 flex items-center gap-2">
            <Receipt className="w-5 h-5 text-primary" />
            Trade History ({tradeHistory.length})
          </h2>
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left px-4 py-2 font-medium text-muted-foreground">Date</th>
                    <th className="text-left px-4 py-2 font-medium text-muted-foreground">Poll</th>
                    <th className="text-left px-4 py-2 font-medium text-muted-foreground">Side</th>
                    <th className="text-left px-4 py-2 font-medium text-muted-foreground">Shares</th>
                    <th className="text-left px-4 py-2 font-medium text-muted-foreground">Price</th>
                    <th className="text-left px-4 py-2 font-medium text-muted-foreground">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {tradeHistory.map((t: any) => (
                    <tr key={t.id} className="border-t border-border">
                      <td className="px-4 py-2 text-foreground">{new Date(t.created_at).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}</td>
                      <td className="px-4 py-2 text-foreground max-w-[180px] truncate">
                        <Link to={`/forecast-arena-pro/${t.poll_slug}`} className="hover:underline">{t.poll_title}</Link>
                      </td>
                      <td className={`px-4 py-2 font-semibold capitalize ${t.side === 'buy' ? 'text-green-600' : 'text-red-500'}`}>{t.side}</td>
                      <td className="px-4 py-2 font-mono text-foreground">{Number(t.shares).toFixed(4)}</td>
                      <td className="px-4 py-2 font-mono text-foreground">${Number(t.price).toFixed(2)}</td>
                      <td className="px-4 py-2 font-mono font-semibold text-foreground">${Number(t.total_amount).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Paystack Transactions */}
      {transactions && transactions.length > 0 && (
        <div className="mb-8 scroll-mt-20">
          <h2 className="font-display text-xl font-bold text-foreground mb-4 flex items-center gap-2">
            <Receipt className="w-5 h-5 text-primary" />
            Payment Transactions ({transactions.length})
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
                          tx.status === "pending" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"
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
            <button onClick={() => setShowAllTransactions(v => !v)}
              className="w-full flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground py-2 border border-dashed border-border rounded-lg hover:border-primary/40 transition-colors mt-2">
              {showAllTransactions ? <><ChevronUp className="w-3.5 h-3.5" /> Show less</> : <><ChevronDown className="w-3.5 h-3.5" /> Show {transactions.length - 5} more</>}
            </button>
          )}
        </div>
      )}

      {/* Payouts */}
      <div id="pro-payouts" className="mb-8 scroll-mt-20">
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
                            p.status === "pending" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"
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
              <button onClick={() => setShowAllPayouts(v => !v)}
                className="w-full flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground py-2 border border-dashed border-border rounded-lg hover:border-primary/40 transition-colors mt-2">
                {showAllPayouts ? <><ChevronUp className="w-3.5 h-3.5" /> Show less</> : <><ChevronDown className="w-3.5 h-3.5" /> Show {payouts.length - 5} more</>}
              </button>
            )}
          </>
        )}
      </div>

      {/* Withdraw Modal */}
      <Dialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Withdraw to Mobile Money</DialogTitle>
            <DialogDescription>Send funds from your wallet to your mobile money account.</DialogDescription>
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
              <Input type="number" min="1" step="0.01" placeholder="Enter amount" value={withdrawAmount} onChange={e => setWithdrawAmount(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground mb-1 block">Mobile money phone number</label>
              <Input type="tel" placeholder="+254 7XX XXX XXX" value={withdrawPhone} onChange={e => setWithdrawPhone(e.target.value)} />
            </div>
            {withdrawAmount && parseFloat(withdrawAmount) > 0 && (
              <p className="text-sm text-muted-foreground">
                You will receive approximately <span className="font-semibold text-foreground">KES {(parseFloat(withdrawAmount) * 130).toFixed(0)}</span>
              </p>
            )}
            <p className="text-[10px] text-muted-foreground">Withdrawals are sent via mobile money and typically arrive within a few minutes.</p>
            <Button className="w-full" disabled={withdrawLoading || !withdrawAmount || parseFloat(withdrawAmount) < 1} onClick={handleWithdraw}>
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
            <DialogDescription>Send funds from your wallet directly to your bank account.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Available balance</p>
              <p className="text-2xl font-bold font-mono text-foreground">${(wallet?.balance_usd || 0).toFixed(2)}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-foreground mb-1 block">Currency</label>
              <select className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background text-foreground" value={bankCurrency}
                onChange={e => { setBankCurrency(e.target.value); fetchBanks(e.target.value); setBankCode(""); }}>
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
              <Input type="number" min="1" step="0.01" placeholder="Enter amount" value={bankAmount} onChange={e => setBankAmount(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground mb-1 block">Bank</label>
              {banksLoading ? <p className="text-xs text-muted-foreground">Loading banks…</p> : (
                <select className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background text-foreground" value={bankCode} onChange={e => setBankCode(e.target.value)}>
                  <option value="">Select a bank</option>
                  {bankList.map(b => <option key={b.code} value={b.code}>{b.name}</option>)}
                </select>
              )}
            </div>
            <div>
              <label className="text-xs font-medium text-foreground mb-1 block">Account Number</label>
              <Input type="text" placeholder="e.g. 1234567890" value={bankAccountNumber} onChange={e => setBankAccountNumber(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground mb-1 block">Account Name</label>
              <Input type="text" placeholder="Name on bank account" value={bankAccountName} onChange={e => setBankAccountName(e.target.value)} />
            </div>
            {bankAmount && parseFloat(bankAmount) > 0 && (
              <p className="text-sm text-muted-foreground">
                You will receive approximately <span className="font-semibold text-foreground">{bankCurrency} {(parseFloat(bankAmount) * (bankCurrency === 'KES' ? 130 : bankCurrency === 'NGN' ? 1600 : bankCurrency === 'GHS' ? 15 : bankCurrency === 'ZAR' ? 18 : bankCurrency === 'UGX' ? 3700 : 2700)).toFixed(0)}</span>
              </p>
            )}
            <p className="text-[10px] text-muted-foreground">Bank transfers typically arrive within 1–2 business days.</p>
            <Button className="w-full" disabled={bankWithdrawLoading || !bankAmount || parseFloat(bankAmount) < 1 || !bankCode || !bankAccountNumber || !bankAccountName} onClick={handleBankWithdraw}>
              {bankWithdrawLoading ? "Processing…" : `Withdraw $${parseFloat(bankAmount || "0").toFixed(2)} to Bank`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProTradingTab;
