import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import Layout from "@/components/Layout";
import PollProbabilityChart from "@/components/forecast/PollProbabilityChart";
import PollDiscussionTabs from "@/components/forecast/PollDiscussionTabs";
import TradingPanel from "@/components/forecast/TradingPanel";
import { usePoll } from "@/hooks/use-polls";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Clock, BarChart3, Scale, MessageSquare, Users } from "lucide-react";
import BookmarkToggle from "@/components/forecast/BookmarkToggle";
import SharePopover from "@/components/forecast/SharePopover";

const ForecastPollDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: poll, isLoading, error } = usePoll(slug || "");

  const { data: commentCount = 0 } = useQuery({
    queryKey: ["poll-comment-count", poll?.id],
    queryFn: async () => {
      if (!poll?.id) return 0;
      const { count, error } = await supabase
        .from("poll_comments")
        .select("id", { count: "exact", head: true })
        .eq("poll_id", poll.id);
      if (error) return 0;
      return count || 0;
    },
    enabled: !!poll?.id,
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="container-page max-w-7xl pt-20 px-4">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-3/4" />
            <div className="h-64 bg-muted rounded" />
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !poll) {
    return (
      <Layout>
        <div className="container-page max-w-7xl pt-24 text-center">
          <h2 className="text-2xl font-bold text-foreground mb-4">Poll not found</h2>
          <Link to="/" className="text-primary hover:text-accent transition-colors">← Back to Forecast Arena</Link>
        </div>
      </Layout>
    );
  }

  const totalVotes = poll.poll_options.reduce((s, o) => s + o.total_votes_count, 0);
  const totalStaked = poll.poll_options.reduce((s, o) => s + o.total_stake_amount, 0);
  const leadingOption = [...poll.poll_options].sort((a, b) => b.total_votes_count - a.total_votes_count)[0];
  const leadingPct = totalVotes > 0 ? Math.round((leadingOption.total_votes_count / totalVotes) * 100) : 50;

  return (
    <Layout>
      {/* Compact top bar */}
      <div className="bg-card border-b border-border">
        <div className="container-page max-w-7xl py-2 flex items-center gap-3">
          <Link to="/" className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Back
          </Link>
          <span className="text-[10px] font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full">{poll.category}</span>
          <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <Clock className="w-3 h-3" />
            Closes {new Date(poll.close_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </span>
          <div className="flex items-center gap-1 ml-auto">
            <BookmarkToggle pollId={poll.id} size="md" />
            <SharePopover url={`/forecast-arena/${poll.slug}`} title={poll.title} size="md" />
          </div>
        </div>
      </div>

      {/* Main split layout — like Polymarket */}
      <div className="container-page max-w-7xl py-4">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
          {/* LEFT: Question + Chart + Context */}
          <div className="space-y-4">
            {/* Title + leading probability */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <h1 className="text-xl md:text-2xl font-bold text-foreground leading-snug mb-2">
                {poll.title}
              </h1>
              {poll.description && (
                <p className="text-sm text-muted-foreground leading-relaxed mb-2">{poll.description}</p>
              )}
              {/* Quick stats row */}
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Users className="w-3 h-3" />{totalVotes} forecasts</span>
                <span className="font-mono">${totalStaked.toFixed(2)} staked</span>
                <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" />{commentCount}</span>
              </div>
            </motion.div>

            {/* Options probability bars */}
            <div className="flex gap-2">
              {[...poll.poll_options].sort((a, b) => b.total_votes_count - a.total_votes_count).map((opt) => {
                const pct = totalVotes > 0 ? Math.round((opt.total_votes_count / totalVotes) * 100) : Math.round(100 / poll.poll_options.length);
                const isYes = opt.label.toLowerCase() === "yes";
                const isNo = opt.label.toLowerCase() === "no";
                return (
                  <div key={opt.id} className="flex-1 text-center">
                    <div className={`text-lg font-mono font-bold ${isYes ? "text-green-600" : isNo ? "text-red-500" : "text-primary"}`}>
                      {pct}%
                    </div>
                    <div className="text-xs text-muted-foreground">{opt.label}</div>
                    <div className="text-[9px] text-muted-foreground font-mono">${(Math.max(0.05, Math.min(0.95, pct / 100))).toFixed(2)}/share</div>
                  </div>
                );
              })}
            </div>

            {/* Probability Chart */}
            <div className="bg-card border border-border rounded-lg p-3">
              <PollProbabilityChart pollId={poll.id} options={poll.poll_options} />
            </div>

            {/* Economic Context */}
            {poll.context && (
              <div className="bg-muted/50 border border-border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 className="w-4 h-4 text-primary" />
                  <span className="text-xs font-semibold text-foreground">Economic Context</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{poll.context}</p>
              </div>
            )}

            {/* Resolution Criteria */}
            <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Scale className="w-4 h-4 text-amber-600" />
                <span className="text-xs font-semibold text-foreground">Resolution Criteria</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {(poll as any).resolution_criteria || "Resolved by Econsult Africa editorial team based on official data sources."}
              </p>
            </div>

            {/* Discussion Tabs */}
            <PollDiscussionTabs poll={poll} />
          </div>

          {/* RIGHT: Trading Panel (sticky) */}
          <div className="lg:sticky lg:top-20 lg:self-start space-y-4">
            <TradingPanel poll={poll} />

            {/* CTA Bridge */}
            <div className="bg-primary/5 border border-primary/10 rounded-lg p-4 text-center">
              <p className="font-semibold text-foreground text-sm mb-1">Want the full analysis?</p>
              <p className="text-[10px] text-muted-foreground mb-3">
                Go beyond predictions with our comprehensive reports.
              </p>
              <Link
                to="/intelligence-marketplace"
                className="inline-flex items-center justify-center rounded-md bg-accent text-accent-foreground px-4 py-2 text-xs font-semibold shadow hover:bg-accent/90 transition-colors"
              >
                Intelligence Marketplace →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ForecastPollDetail;
