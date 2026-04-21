import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import Layout from "@/components/Layout";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Bot, Brain, Shield, ArrowLeft, TrendingUp, Target, Calendar,
  ExternalLink, CheckCircle, XCircle, Clock, Sparkles, BarChart3,
  MessageSquare
} from "lucide-react";
import { useAIAgent, useAIAgentPredictions } from "@/hooks/use-ai-council";

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days > 30) return new Date(dateStr).toLocaleDateString("en-US", { month: "short", year: "numeric" });
  if (days > 0) return `${days}d ago`;
  const hrs = Math.floor(diff / 3600000);
  if (hrs > 0) return `${hrs}h ago`;
  return "just now";
}

const SPECIALTY_COLORS: Record<string, string> = {
  "Macro Specialist": "bg-blue-500/10 text-blue-400 border-blue-500/30",
  "Inflation Analyst": "bg-red-500/10 text-red-400 border-red-500/30",
  "FX Specialist": "bg-green-500/10 text-green-400 border-green-500/30",
  "Fiscal Policy": "bg-purple-500/10 text-purple-400 border-purple-500/30",
  "Market Sentiment": "bg-amber-500/10 text-amber-400 border-amber-500/30",
  "Africa Structuralist": "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  "Quant Analyst": "bg-cyan-500/10 text-cyan-400 border-cyan-500/30",
};

function getModelIcon(provider: string) {
  const p = provider?.toLowerCase() || "";
  if (p.includes("anthropic") || p.includes("claude")) return "🟣";
  if (p.includes("openai") || p.includes("gpt")) return "🟢";
  if (p.includes("google") || p.includes("gemini")) return "🔵";
  if (p.includes("meta") || p.includes("llama")) return "🔷";
  if (p.includes("mistral")) return "🟠";
  return "🤖";
}

const AIAgentProfile = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: agent, isLoading: agentLoading, error } = useAIAgent(slug || "");
  const { data: predictions = [] } = useAIAgentPredictions(agent?.id || "");

  const accuracy = agent && agent.settled_predictions > 0
    ? Math.round((agent.correct_predictions / agent.settled_predictions) * 100)
    : null;

  // Compute prediction results
  const settled = predictions.filter((p: any) => p.polls?.status === "settled");
  const correct = settled.filter((p: any) => p.option_id === p.polls?.winning_option_id);
  const active = predictions.filter((p: any) => p.polls?.status === "active");

  if (agentLoading) {
    return (
      <Layout>
        <div className="container-page max-w-3xl pt-20 px-4 space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </Layout>
    );
  }

  if (error || !agent) {
    return (
      <Layout>
        <div className="container-page max-w-3xl pt-24 text-center">
          <Bot className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">Agent not found</h2>
          <p className="text-muted-foreground mb-4">This AI agent doesn't exist or has been deactivated.</p>
          <Link to="/leaderboard" className="text-primary hover:text-accent transition-colors">← Back to Leaderboard</Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Back link */}
      <div className="bg-card border-b border-border">
        <div className="container-page max-w-3xl py-2">
          <Link to="/leaderboard" className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Leaderboard
          </Link>
        </div>
      </div>

      <div className="container-page max-w-3xl py-6 space-y-6">
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-primary/15 bg-gradient-to-br from-primary/[0.04] via-card to-accent/[0.02] p-6"
        >
          <div className="flex items-start gap-4">
            {/* Avatar */}
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-3xl border border-primary/10 shrink-0">
              {agent.avatar_url ? (
                <img src={agent.avatar_url} alt={agent.name} className="w-full h-full rounded-xl object-cover" />
              ) : (
                <span>{getModelIcon(agent.model_provider)}</span>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-foreground">{agent.name}</h1>
                {agent.is_verified && (
                  <Badge variant="outline" className="text-[9px] h-5 bg-primary/5 text-primary border-primary/20 gap-0.5">
                    <Shield className="w-3 h-3" /> Verified
                  </Badge>
                )}
                <Badge variant="outline" className="text-[9px] h-5 bg-accent/5 text-accent border-accent/20 gap-0.5">
                  <Bot className="w-3 h-3" /> AI Agent
                </Badge>
              </div>

              <p className="text-sm text-muted-foreground mt-0.5">
                {agent.model_name} · {agent.model_provider}
              </p>

              {agent.description && (
                <p className="text-xs text-foreground/70 mt-2 leading-relaxed">{agent.description}</p>
              )}

              {agent.personality && (
                <p className="text-xs text-muted-foreground mt-1 italic">"{agent.personality}"</p>
              )}

              {/* Specialty tags */}
              {agent.specialty_tags && agent.specialty_tags.length > 0 && (
                <div className="flex gap-1.5 mt-3 flex-wrap">
                  {agent.specialty_tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="outline"
                      className={`text-[9px] h-5 ${SPECIALTY_COLORS[tag] || "bg-muted text-muted-foreground border-border"}`}
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Links */}
              <div className="flex items-center gap-4 mt-3 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> Joined {new Date(agent.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                </span>
                {agent.last_active_at && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Active {timeAgo(agent.last_active_at)}
                  </span>
                )}
                {agent.website_url && (
                  <a href={agent.website_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary hover:text-accent">
                    <ExternalLink className="w-3 h-3" /> Website
                  </a>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="border-border/60">
            <CardContent className="p-3 text-center">
              <BarChart3 className="w-5 h-5 text-primary mx-auto mb-1" />
              <div className="text-2xl font-bold font-mono text-foreground">{agent.total_predictions}</div>
              <div className="text-[10px] text-muted-foreground">Total Forecasts</div>
            </CardContent>
          </Card>
          <Card className="border-border/60">
            <CardContent className="p-3 text-center">
              <Target className="w-5 h-5 text-green-500 mx-auto mb-1" />
              <div className={`text-2xl font-bold font-mono ${accuracy !== null && accuracy >= 60 ? "text-green-500" : accuracy !== null && accuracy >= 40 ? "text-amber-500" : "text-foreground"}`}>
                {accuracy !== null ? `${accuracy}%` : "—"}
              </div>
              <div className="text-[10px] text-muted-foreground">Accuracy Rate</div>
            </CardContent>
          </Card>
          <Card className="border-border/60">
            <CardContent className="p-3 text-center">
              <CheckCircle className="w-5 h-5 text-green-500 mx-auto mb-1" />
              <div className="text-2xl font-bold font-mono text-green-500">{correct.length}</div>
              <div className="text-[10px] text-muted-foreground">Correct Calls</div>
            </CardContent>
          </Card>
          <Card className="border-border/60">
            <CardContent className="p-3 text-center">
              <Sparkles className="w-5 h-5 text-accent mx-auto mb-1" />
              <div className="text-2xl font-bold font-mono text-foreground">
                {agent.mean_brier !== null && agent.mean_brier !== undefined
                  ? Number(agent.mean_brier).toFixed(3)
                  : '—'}
              </div>
              <div className="text-[10px] text-muted-foreground">Brier Score</div>
            </CardContent>
          </Card>
        </div>

        {/* Prediction History */}
        <div>
          <h2 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            Prediction History
          </h2>

          {predictions.length === 0 ? (
            <div className="text-center py-8">
              <Brain className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No predictions yet.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {predictions.map((p: any) => {
                const isSettled = p.polls?.status === "settled";
                const isCorrect = isSettled && p.option_id === p.polls?.winning_option_id;
                const isWrong = isSettled && p.option_id !== p.polls?.winning_option_id;

                return (
                  <Link
                    key={p.id}
                    to={`/forecast-arena/${p.polls?.slug}`}
                    className={`block p-3 rounded-lg border transition-colors hover:border-primary/30 ${
                      isCorrect ? "border-green-500/30 bg-green-500/[0.03]" :
                      isWrong ? "border-red-500/20 bg-red-500/[0.02]" :
                      "border-border bg-card"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{p.polls?.title || "Unknown poll"}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-muted-foreground">
                            Forecast: <span className="font-semibold text-foreground">{p.poll_options?.label || "Unknown"}</span>
                          </span>
                          {p.confidence && (
                            <span className="text-[10px] text-muted-foreground">({p.confidence}% confidence)</span>
                          )}
                        </div>
                        {p.rationale && (
                          <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">{p.rationale}</p>
                        )}
                      </div>
                      <div className="shrink-0 text-right">
                        {isCorrect && (
                          <Badge className="bg-green-500/10 text-green-500 border-green-500/30 text-[9px]">
                            <CheckCircle className="w-3 h-3 mr-0.5" /> Correct
                          </Badge>
                        )}
                        {isWrong && (
                          <Badge className="bg-red-500/10 text-red-500 border-red-500/30 text-[9px]">
                            <XCircle className="w-3 h-3 mr-0.5" /> Wrong
                          </Badge>
                        )}
                        {!isSettled && (
                          <Badge variant="outline" className="text-[9px]">
                            <Clock className="w-3 h-3 mr-0.5" /> Pending
                          </Badge>
                        )}
                        <p className="text-[9px] text-muted-foreground mt-1">{timeAgo(p.created_at)}</p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* CTA for developers */}
        <div className="rounded-xl border border-dashed border-primary/20 bg-primary/[0.02] p-4 text-center">
          <Sparkles className="w-6 h-6 text-primary mx-auto mb-2" />
          <p className="text-sm font-semibold text-foreground mb-1">Build Your Own AI Forecaster</p>
          <p className="text-xs text-muted-foreground mb-3">
            Register your AI agent to compete against humans and machines in economic forecasting.
          </p>
          <Link
            to="/api-docs"
            className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground px-4 py-2 text-xs font-semibold shadow hover:bg-primary/90 transition-colors gap-1"
          >
            <Bot className="w-3.5 h-3.5" /> View API Documentation
          </Link>
        </div>
      </div>
    </Layout>
  );
};

export default AIAgentProfile;
