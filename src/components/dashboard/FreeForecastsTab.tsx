import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  BarChart3, CheckCircle, XCircle, Activity, ArrowRight, Clock,
  ChevronDown, ChevronUp, History, TrendingUp,
} from "lucide-react";
import { useState } from "react";

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

interface FreeForecastsTabProps {
  freeActive: Position[];
  freeResolved: Position[];
  freeActivity: ActivityItem[];
  isLoading: boolean;
}

const FreeForecastsTab = ({ freeActive, freeResolved, freeActivity, isLoading }: FreeForecastsTabProps) => {
  const [showAllActivity, setShowAllActivity] = useState(false);
  const [showAllActive, setShowAllActive] = useState(false);
  const [showAllClosed, setShowAllClosed] = useState(false);

  const wonCount = freeResolved.filter(p => p.outcome === "won").length;
  const accuracy = freeResolved.length > 0 ? Math.round((wonCount / freeResolved.length) * 100) : null;

  return (
    <div>
      {/* Free Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { icon: Activity, label: "Active Forecasts", value: freeActive.length },
          { icon: History, label: "Resolved", value: freeResolved.length },
          { icon: CheckCircle, label: "Accuracy", value: accuracy != null ? `${accuracy}%` : "—" },
        ].map((stat) => (
          <div key={stat.label} className="bg-card border border-border rounded-lg p-4">
            <stat.icon className="w-5 h-5 text-primary mb-2" />
            <p className="text-2xl font-bold font-mono text-foreground">{stat.value}</p>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Pro Upsell Banner */}
      {accuracy != null && accuracy >= 50 && freeResolved.length >= 3 && (
        <div className="mb-8 border border-amber-500/30 bg-amber-50/50 dark:bg-amber-950/20 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-6 h-6 text-amber-600 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">Your accuracy is {accuracy}% — earn real returns on Pro</p>
              <p className="text-xs text-muted-foreground">Put capital behind your best forecasts and earn $1 per share when you're right.</p>
            </div>
            <Link to="/forecast-arena-pro">
              <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white shrink-0">
                Go Pro <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Free Activity Feed */}
      <div id="recent-activity" className="mb-8 scroll-mt-20">
        <h2 className="font-display text-xl font-bold text-foreground mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary" />
          Recent Activity
          {freeActivity.length > 0 && (
            <span className="text-sm font-normal text-muted-foreground ml-1">({freeActivity.length})</span>
          )}
        </h2>
        {freeActivity.length === 0 ? (
          <div className="bg-card border border-border rounded-lg p-6 text-center">
            <p className="text-sm text-muted-foreground">No activity yet. Make your first forecast to get started.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {(showAllActivity ? freeActivity : freeActivity.slice(0, 5)).map(item => {
              const kindConfig: Record<string, { badge: string; color: string }> = {
                vote: { badge: "Voted", color: "bg-blue-500/10 text-blue-600" },
                position_won: { badge: "✓ Won", color: "bg-green-500/10 text-green-600" },
                position_lost: { badge: "✗ Lost", color: "bg-red-500/10 text-red-500" },
                comment_reply: { badge: "Reply", color: "bg-purple-500/10 text-purple-600" },
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
                  <p className="text-[9px] text-muted-foreground shrink-0">
                    {new Date(item.timestamp).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}
                  </p>
                </div>
              );

              return item.link ? (
                <Link key={item.id} to={item.link}>{inner}</Link>
              ) : (
                <div key={item.id}>{inner}</div>
              );
            })}
            {freeActivity.length > 5 && (
              <button
                onClick={() => setShowAllActivity(v => !v)}
                className="w-full flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground py-2 border border-dashed border-border rounded-lg hover:border-primary/40 transition-colors"
              >
                {showAllActivity ? <><ChevronUp className="w-3.5 h-3.5" /> Show less</> : <><ChevronDown className="w-3.5 h-3.5" /> Show {freeActivity.length - 5} more</>}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Active Free Forecasts */}
      <div id="active-forecasts" className="mb-8 scroll-mt-20">
        <h2 className="font-display text-xl font-bold text-foreground mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary" />
          My Active Forecasts ({freeActive.length})
        </h2>
        {isLoading ? (
          <p className="text-sm text-muted-foreground py-4">Loading...</p>
        ) : freeActive.length === 0 ? (
          <div className="bg-card border border-border rounded-lg p-6 text-center">
            <p className="text-sm text-muted-foreground mb-3">No active free forecasts.</p>
            <Link to="/forecast-arena"><Button variant="outline" size="sm">Browse Forecast Arena <ArrowRight className="w-3.5 h-3.5 ml-1" /></Button></Link>
          </div>
        ) : (
          <div className="space-y-3">
            {(showAllActive ? freeActive : freeActive.slice(0, 5)).map((pos) => {
              const consensusPct = pos.total_votes > 0 ? Math.round((pos.option_votes / pos.total_votes) * 100) : 50;
              const isYes = pos.option_label.toLowerCase() === "yes";
              return (
                <div key={pos.id} className="bg-card border border-border rounded-lg p-4">
                  <Link to={`/forecast-arena/${pos.poll_slug}`} className="block">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-sm font-semibold text-foreground leading-snug flex-1 mr-4">{pos.poll_title}</h3>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded ${isYes ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-500"}`}>
                        {pos.option_label}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                      <span>Consensus: {consensusPct}%</span>
                      <span className="flex items-center gap-1 ml-auto">
                        <Clock className="w-3 h-3" />
                        {new Date(pos.close_at) > new Date() ? "Open" : "Closing..."}
                      </span>
                    </div>
                  </Link>
                  <div className="mt-2 pt-2 border-t border-border/50">
                    <Link to={`/forecast-arena-pro/${pos.poll_slug}`}>
                      <Button variant="outline" size="sm" className="text-xs border-amber-500/40 text-amber-700 hover:bg-amber-50 w-full">
                        💰 Commit Capital → Trade on Pro <ArrowRight className="w-3 h-3 ml-1" />
                      </Button>
                    </Link>
                  </div>
                </div>
              );
            })}
            {freeActive.length > 5 && (
              <button
                onClick={() => setShowAllActive(v => !v)}
                className="w-full flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground py-2 border border-dashed border-border rounded-lg hover:border-primary/40 transition-colors"
              >
                {showAllActive ? <><ChevronUp className="w-3.5 h-3.5" /> Show less</> : <><ChevronDown className="w-3.5 h-3.5" /> Show {freeActive.length - 5} more</>}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Resolved Free Forecasts */}
      <div id="closed-forecasts" className="mb-8 scroll-mt-20">
        <h2 className="font-display text-xl font-bold text-foreground mb-4 flex items-center gap-2">
          <History className="w-5 h-5 text-primary" />
          Resolved Forecasts ({freeResolved.length})
        </h2>
        {freeResolved.length === 0 ? (
          <div className="bg-card border border-border rounded-lg p-6 text-center">
            <p className="text-sm text-muted-foreground">No resolved forecasts yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {(showAllClosed ? freeResolved : freeResolved.slice(0, 5)).map(pos => (
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
                  <span>Your pick: {pos.option_label}</span>
                  <span className="text-muted-foreground/60 ml-auto">{new Date(pos.created_at).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}</span>
                </div>
                {pos.outcome === "won" && (
                  <div className="mt-2 pt-2 border-t border-border/50">
                    <Link to={`/forecast-arena-pro/${pos.poll_slug}`}>
                      <p className="text-xs text-amber-700">
                        🎯 You called this one right — next time, back it with capital on Pro and earn real returns.
                      </p>
                    </Link>
                  </div>
                )}
              </div>
            ))}
            {freeResolved.length > 5 && (
              <button
                onClick={() => setShowAllClosed(v => !v)}
                className="w-full flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground py-2 border border-dashed border-border rounded-lg hover:border-primary/40 transition-colors"
              >
                {showAllClosed ? <><ChevronUp className="w-3.5 h-3.5" /> Show less</> : <><ChevronDown className="w-3.5 h-3.5" /> Show {freeResolved.length - 5} more</>}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FreeForecastsTab;
