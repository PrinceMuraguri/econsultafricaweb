import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import Layout from "@/components/Layout";
import PollCard from "@/components/forecast/PollCard";
import PollProbabilityChart from "@/components/forecast/PollProbabilityChart";
import PollDiscussionTabs from "@/components/forecast/PollDiscussionTabs";
import { usePoll } from "@/hooks/use-polls";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Clock, BarChart3, Scale, MessageSquare } from "lucide-react";
import BookmarkToggle from "@/components/forecast/BookmarkToggle";
import SharePopover from "@/components/forecast/SharePopover";

const ForecastPollDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: poll, isLoading, error } = usePoll(slug || "");

  // Comment count
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
        <section className="section-padding pt-24">
          <div className="container-page max-w-3xl">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-muted rounded w-3/4" />
              <div className="h-4 bg-muted rounded w-1/2" />
              <div className="h-64 bg-muted rounded" />
            </div>
          </div>
        </section>
      </Layout>
    );
  }

  if (error || !poll) {
    return (
      <Layout>
        <section className="section-padding pt-24">
          <div className="container-page max-w-3xl text-center">
            <h2 className="text-2xl font-bold text-foreground mb-4">Poll not found</h2>
            <Link to="/" className="text-primary hover:text-accent transition-colors">
              ← Back to Forecast Arena
            </Link>
          </div>
        </section>
      </Layout>
    );
  }

  const totalVotes = poll.poll_options.reduce((s, o) => s + o.total_votes_count, 0);
  const totalStaked = poll.poll_options.reduce((s, o) => s + o.total_stake_amount, 0);

  return (
    <Layout>
      <section className="section-padding pt-24">
        <div className="container-page max-w-3xl">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Forecast Arena
          </Link>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-xs font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                {poll.category}
              </span>
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                Closes {new Date(poll.close_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </span>
              <div className="flex items-center gap-1 ml-auto">
                <BookmarkToggle pollId={poll.id} size="md" />
                <SharePopover url={`/forecast-arena/${poll.slug}`} title={poll.title} size="md" />
              </div>
            </div>

            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
              {poll.title}
            </h1>

            {poll.description && (
              <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                {poll.description}
              </p>
            )}

            {/* Economic Context */}
            {poll.context && (
              <div className="bg-muted/50 border border-border rounded-lg p-6 mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <BarChart3 className="w-4 h-4 text-primary" />
                  <span className="text-sm font-semibold text-foreground">Economic Context</span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {poll.context}
                </p>
              </div>
            )}

            {/* Probability Chart */}
            <div className="mb-6">
              <PollProbabilityChart pollId={poll.id} options={poll.poll_options} />
            </div>

            {/* Vote Card */}
            <PollCard poll={poll} />

            {/* Resolution Criteria */}
            <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-6 mt-6">
              <div className="flex items-center gap-2 mb-3">
                <Scale className="w-4 h-4 text-amber-600" />
                <span className="text-sm font-semibold text-foreground">Resolution Criteria</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {(poll as any).resolution_criteria || "This market will be resolved by the Econsult Africa editorial team based on official data sources."}
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
              <div className="bg-card border border-border rounded-lg p-4 text-center">
                <p className="font-mono text-2xl font-bold text-foreground">{totalVotes}</p>
                <p className="text-xs text-muted-foreground">Total Forecasts</p>
              </div>
              <div className="bg-card border border-border rounded-lg p-4 text-center">
                <p className="font-mono text-2xl font-bold text-foreground">
                  {poll.poll_options.length}
                </p>
                <p className="text-xs text-muted-foreground">Options</p>
              </div>
              <div className="bg-card border border-border rounded-lg p-4 text-center">
                <p className="font-mono text-2xl font-bold text-primary">
                  ${totalStaked.toFixed(2)}
                </p>
                <p className="text-xs text-muted-foreground">Total Staked</p>
              </div>
              <div className="bg-card border border-border rounded-lg p-4 text-center">
                <div className="flex items-center justify-center gap-1">
                  <MessageSquare className="w-4 h-4 text-muted-foreground" />
                  <p className="font-mono text-2xl font-bold text-foreground">{commentCount}</p>
                </div>
                <p className="text-xs text-muted-foreground">Comments</p>
              </div>
            </div>

            {/* Discussion Tabs */}
            <div className="mt-8">
              <PollDiscussionTabs poll={poll} />
            </div>

            {/* CTA Bridge */}
            <div className="mt-12 bg-primary/5 border border-primary/10 rounded-lg p-8 text-center">
              <p className="font-display font-semibold text-foreground text-lg mb-2">
                Want the full analysis?
              </p>
              <p className="text-sm text-muted-foreground mb-6">
                Go beyond predictions with our comprehensive Kenya 2026 Economic Outlook report.
              </p>
              <Link
                to="/kenya-2026"
                className="inline-flex items-center justify-center rounded-md bg-accent text-accent-foreground px-6 py-3 font-display font-semibold shadow-md hover:bg-accent/90 transition-colors"
              >
                Buy Kenya Report — $495
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
};

export default ForecastPollDetail;
