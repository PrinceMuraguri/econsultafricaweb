import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import Layout from "@/components/Layout";
import PollCard from "@/components/forecast/PollCard";
import PollDiscussionTabs from "@/components/forecast/PollDiscussionTabs";
import TradingPanel from "@/components/forecast/TradingPanel";
import { usePoll } from "@/hooks/use-polls";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { getFingerprint } from "@/lib/fingerprint";
import { ArrowLeft, Scale, BarChart3 } from "lucide-react";

const ForecastPollDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: poll, isLoading, error } = usePoll(slug || "");
  const { user } = useAuth();
  const [hasVoted, setHasVoted] = useState(false);
  const [votedOptionId, setVotedOptionId] = useState<string | null>(null);

  // Check if user has voted on this poll
  useEffect(() => {
    if (!poll) return;
    (async () => {
      const fp = await getFingerprint();
      const { data } = await supabase
        .from("votes")
        .select("option_id")
        .eq("poll_id", poll.id)
        .eq("voter_fingerprint", fp)
        .maybeSingle();
      if (data) {
        setHasVoted(true);
        setVotedOptionId(data.option_id);
      }
    })();
  }, [poll?.id]);

  const isClosed = poll ? (poll.status !== "active" || new Date(poll.close_at) < new Date()) : true;
  const showTradingPanel = hasVoted && !!user && !isClosed;

  if (isLoading) {
    return (
      <Layout>
        <div className="container-page max-w-3xl pt-20 px-4">
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
        <div className="container-page max-w-3xl pt-24 text-center">
          <h2 className="text-2xl font-bold text-foreground mb-4">Poll not found</h2>
          <Link to="/" className="text-primary hover:text-accent transition-colors">← Back to Forecast Arena</Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Back link */}
      <div className="bg-card border-b border-border">
        <div className="container-page max-w-3xl py-2">
          <Link to="/" className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Back
          </Link>
        </div>
      </div>

      <div className="container-page max-w-3xl py-6 space-y-6">
        {/* The same PollCard from the homepage, centerstage */}
        <PollCard poll={poll} />

        {/* Stage 3: Position panel — only if voted + logged in + active */}
        {showTradingPanel && (
          <TradingPanel poll={poll} votedOptionId={votedOptionId} hasVoted={hasVoted} />
        )}

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

        {/* Discussion */}
        <PollDiscussionTabs poll={poll} />

        {/* CTA Bridge */}
        <div className="bg-primary/5 border border-primary/10 rounded-lg p-4 text-center">
          <p className="font-semibold text-foreground text-sm mb-1">Want the full analysis?</p>
          <p className="text-[10px] text-muted-foreground mb-3">
            Go beyond forecasts with our comprehensive reports.
          </p>
          <Link
            to="/intelligence-marketplace"
            className="inline-flex items-center justify-center rounded-md bg-accent text-accent-foreground px-4 py-2 text-xs font-semibold shadow hover:bg-accent/90 transition-colors"
          >
            Intelligence Marketplace →
          </Link>
        </div>
      </div>
    </Layout>
  );
};

export default ForecastPollDetail;
