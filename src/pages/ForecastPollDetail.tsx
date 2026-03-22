import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import Layout from "@/components/Layout";
import PollCard from "@/components/forecast/PollCard";
import { usePoll } from "@/hooks/use-polls";
import { ArrowLeft, Clock, BarChart3 } from "lucide-react";

const ForecastPollDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: poll, isLoading, error } = usePoll(slug || "");

  if (isLoading) {
    return (
      <Layout>
        <section className="section-padding">
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
        <section className="section-padding">
          <div className="container-page max-w-3xl text-center">
            <h2 className="text-2xl font-bold text-foreground mb-4">Poll not found</h2>
            <Link to="/forecast-arena" className="text-primary hover:text-accent transition-colors">
              ← Back to Forecast Arena
            </Link>
          </div>
        </section>
      </Layout>
    );
  }

  const totalVotes = poll.poll_options.reduce((s, o) => s + o.total_votes_count, 0);

  return (
    <Layout>
      <section className="section-padding">
        <div className="container-page max-w-3xl">
          <Link
            to="/forecast-arena"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Forecast Arena
          </Link>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-xs font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-pill">
                {poll.category}
              </span>
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                Closes {new Date(poll.close_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </span>
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
              <div className="bg-muted/50 border border-border rounded-lg p-6 mb-8">
                <div className="flex items-center gap-2 mb-3">
                  <BarChart3 className="w-4 h-4 text-primary" />
                  <span className="text-sm font-semibold text-foreground">Economic Context</span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {poll.context}
                </p>
              </div>
            )}

            {/* Vote Card */}
            <PollCard poll={poll} />

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mt-8">
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
                <p className="font-mono text-2xl font-bold text-primary capitalize">
                  {poll.status}
                </p>
                <p className="text-xs text-muted-foreground">Status</p>
              </div>
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
