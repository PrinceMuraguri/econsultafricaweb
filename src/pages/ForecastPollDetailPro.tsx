import { useParams, Link, useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import PollCardPro from "@/components/forecast/PollCardPro";
import PollDiscussionTabs from "@/components/forecast/PollDiscussionTabs";
import PollPerformanceChart from "@/components/forecast/PollPerformanceChart";
import ListingsPanel from "@/components/forecast/ListingsPanel";
import UserPollActivity from "@/components/forecast/UserPollActivity";
import TradingPanel from "@/components/forecast/TradingPanel";
import { usePoll } from "@/hooks/use-polls";
import { ArrowLeft, Scale, BarChart3, DollarSign } from "lucide-react";

const ForecastPollDetailPro = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { data: poll, isLoading, error } = usePoll(slug || "");

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
          <h2 className="text-2xl font-bold text-foreground mb-4">Market not found</h2>
          <Link to="/forecast-arena-pro" className="text-amber-600 hover:text-amber-500 transition-colors">← Back to Forecast Arena Pro</Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Pro banner */}
      <div className="bg-amber-500/10 border-b border-amber-500/20">
        <div className="container-page max-w-3xl py-2 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="text-sm text-muted-foreground hover:text-amber-600 transition-colors flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Back
          </button>
          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-amber-900 bg-amber-400 px-2 py-0.5 rounded">
            <DollarSign className="w-3 h-3" /> Pro — Capital Markets
          </span>
        </div>
      </div>

      <div className="container-page max-w-3xl py-6 space-y-6">
        {/* PollCardPro — the main interactive card */}
        <PollCardPro poll={poll} />

        {/* Trading Panel — commit capital / adjust position */}
        <TradingPanel poll={poll} />

        {/* P2P marketplace */}
        <ListingsPanel poll={poll} />

        {/* Probability over time chart */}
        <PollPerformanceChart
          pollId={poll.id}
          options={(poll as any).poll_options?.map((o: any) => ({ id: o.id, label: o.label })) || []}
        />

        {/* Economic Context */}
        {poll.context && (
          <div className="bg-muted/50 border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="w-4 h-4 text-amber-600" />
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

        {/* Your Activity History */}
        <UserPollActivity pollId={poll.id} />

        {/* Discussion */}
        <PollDiscussionTabs poll={poll} basePath="/forecast-arena-pro" />

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

export default ForecastPollDetailPro;
