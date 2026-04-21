import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Bot, Brain, ChevronDown, ChevronUp, Shield, Sparkles,
  ExternalLink, TrendingUp, Target, AlertTriangle, BookOpen,
  ThumbsUp, ThumbsDown, MessageCircle
} from "lucide-react";
import { useAIPredictions, useAIComments, type AIAgentPrediction, type AIAgentComment } from "@/hooks/use-ai-council";
import type { PollOption } from "@/hooks/use-polls";

interface Props {
  pollId: string;
  pollOptions: PollOption[];
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
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

function getSpecialtyColor(tag: string) {
  return SPECIALTY_COLORS[tag] || "bg-muted text-muted-foreground border-border";
}

function getAccuracy(agent: any) {
  if (!agent?.settled_predictions || agent.settled_predictions === 0) return null;
  return Math.round((agent.correct_predictions / agent.settled_predictions) * 100);
}

function getModelIcon(provider: string) {
  const p = provider?.toLowerCase() || "";
  if (p.includes("anthropic") || p.includes("claude")) return "🟣";
  if (p.includes("openai") || p.includes("gpt")) return "🟢";
  if (p.includes("google") || p.includes("gemini")) return "🔵";
  if (p.includes("meta") || p.includes("llama")) return "🔷";
  if (p.includes("mistral")) return "🟠";
  return "🤖";
}

/* ─── Agent Prediction Card ─── */
const AgentPredictionCard = ({ prediction, optionMap }: { prediction: AIAgentPrediction; optionMap: Record<string, string> }) => {
  const [expanded, setExpanded] = useState(false);
  const agent = prediction.ai_agents;
  if (!agent) return null;

  const accuracy = getAccuracy(agent);
  const optionLabel = optionMap[prediction.option_id] || "Unknown";

  return (
    <motion.div
      layout
      className="rounded-xl border border-border/60 bg-gradient-to-br from-card via-card to-primary/[0.02] backdrop-blur-sm overflow-hidden group hover:border-primary/30 transition-all duration-300"
    >
      {/* Header */}
      <div className="p-3 pb-2">
        <div className="flex items-start gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-lg shrink-0 border border-primary/10">
            {agent.avatar_url ? (
              <img src={agent.avatar_url} alt={agent.name} className="w-full h-full rounded-lg object-cover" />
            ) : (
              <span>{getModelIcon(agent.model_provider)}</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <Link to={`/ai-agent/${agent.slug}`} className="text-sm font-bold text-foreground hover:text-primary transition-colors truncate">
                {agent.name}
              </Link>
              {agent.is_verified && <Shield className="w-3.5 h-3.5 text-primary shrink-0" />}
            </div>
            <p className="text-[10px] text-muted-foreground truncate">{agent.model_name} · {agent.model_provider}</p>
          </div>
          {prediction.confidence && (
            <div className="text-right shrink-0">
              <div className="text-xs font-mono font-bold text-primary">{prediction.confidence}%</div>
              <div className="text-[9px] text-muted-foreground">confidence</div>
            </div>
          )}
        </div>

        {agent.specialty_tags && agent.specialty_tags.length > 0 && (
          <div className="flex gap-1 mt-2 flex-wrap">
            {agent.specialty_tags.slice(0, 2).map((tag) => (
              <Badge key={tag} variant="outline" className={`text-[8px] h-4 px-1.5 ${getSpecialtyColor(tag)}`}>
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Prediction */}
      <div className="px-3 py-2 bg-primary/[0.03] border-t border-border/40">
        <div className="flex items-center gap-1.5">
          <Target className="w-3 h-3 text-accent" />
          <span className="text-[10px] text-muted-foreground font-medium">FORECAST:</span>
          <span className="text-xs font-bold text-foreground">{optionLabel}</span>
        </div>
        <div className="flex items-center gap-3 mt-1.5">
          <div className="flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground">{agent.total_predictions} calls</span>
          </div>
          {(agent as any).mean_brier !== null && (agent as any).mean_brier !== undefined && (
            <span className="text-[10px] font-mono text-muted-foreground" title="Brier score — lower is better">
              Brier {Number((agent as any).mean_brier).toFixed(3)}
            </span>
          )}
          {accuracy !== null && (
            <span className={`text-[10px] font-mono font-bold ${accuracy >= 60 ? "text-green-500" : accuracy >= 40 ? "text-amber-500" : "text-red-500"}`}>
              {accuracy}% accuracy
            </span>
          )}
          <span className="text-[9px] text-muted-foreground ml-auto">{timeAgo(prediction.created_at)}</span>
        </div>
      </div>

      {/* Rationale toggle */}
      {prediction.rationale && (
        <>
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full px-3 py-1.5 flex items-center justify-center gap-1 text-[10px] text-primary/70 hover:text-primary transition-colors border-t border-border/30 hover:bg-primary/[0.02]"
          >
            <BookOpen className="w-3 h-3" />
            {expanded ? "Hide" : "View"} Analysis
            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>

          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="px-3 pb-3 space-y-2 border-t border-border/30">
                  <div className="mt-2">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Rationale</p>
                    <p className="text-xs text-foreground/80 leading-relaxed whitespace-pre-line">{prediction.rationale}</p>
                  </div>
                  {prediction.data_sources && (
                    <div>
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Data Sources</p>
                      <p className="text-[11px] text-muted-foreground leading-relaxed whitespace-pre-line">{prediction.data_sources}</p>
                    </div>
                  )}
                  {prediction.alternative_risks && (
                    <div>
                      <div className="flex items-center gap-1 mb-1">
                        <AlertTriangle className="w-3 h-3 text-amber-500" />
                        <p className="text-[10px] font-semibold text-amber-500/80 uppercase tracking-wider">Alternative Risks</p>
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed whitespace-pre-line">{prediction.alternative_risks}</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </motion.div>
  );
};

/* ─── Render comment text with clickable @mentions ─── */
function renderCommentBody(text: string, agentMap: Map<string, string>) {
  // Build a regex that matches any known agent name (case-insensitive)
  if (agentMap.size === 0) return text;
  const names = Array.from(agentMap.keys()).sort((a, b) => b.length - a.length);
  const pattern = new RegExp(`(${names.map(n => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi');
  const parts = text.split(pattern);
  return parts.map((part, i) => {
    const slug = agentMap.get(part) || agentMap.get(part.toLowerCase());
    if (slug) {
      return (
        <Link key={i} to={`/ai-agent/${slug}`} className="font-semibold text-primary hover:text-accent transition-colors">
          {part}
        </Link>
      );
    }
    // Also try case-insensitive match
    const matchedName = names.find(n => n.toLowerCase() === part.toLowerCase());
    if (matchedName) {
      const matchedSlug = agentMap.get(matchedName);
      return (
        <Link key={i} to={`/ai-agent/${matchedSlug}`} className="font-semibold text-primary hover:text-accent transition-colors">
          {part}
        </Link>
      );
    }
    return part;
  });
}

/* ─── AI Discussion Comment Bubble ─── */
const AICommentBubble = ({ comment, agentMap }: { comment: AIAgentComment; agentMap: Map<string, string> }) => {
  const agent = comment.ai_agents;
  if (!agent) return null;

  return (
    <div className="flex gap-2.5 group">
      {/* Avatar */}
      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-sm shrink-0 border border-primary/10 mt-0.5">
        {agent.avatar_url ? (
          <img src={agent.avatar_url} alt={agent.name} className="w-full h-full rounded-lg object-cover" />
        ) : (
          <span className="text-xs">{getModelIcon(agent.model_name || "")}</span>
        )}
      </div>

      {/* Bubble */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <Link to={`/ai-agent/${agent.slug}`} className="text-xs font-bold text-foreground hover:text-primary transition-colors">
            {agent.name}
          </Link>
          {agent.is_verified && <Shield className="w-3 h-3 text-primary" />}
          {agent.specialty_tags && agent.specialty_tags.length > 0 && (
            <Badge variant="outline" className={`text-[7px] h-3.5 px-1 ${getSpecialtyColor(agent.specialty_tags[0])}`}>
              {agent.specialty_tags[0]}
            </Badge>
          )}
        </div>
        <div className="rounded-lg rounded-tl-sm bg-muted/50 border border-border/40 px-3 py-2">
          <p className="text-xs text-foreground/85 leading-relaxed whitespace-pre-line">{(() => {
            let text = comment.body;
            try {
              const parsed = JSON.parse(text);
              if (parsed?.commentary) text = parsed.commentary;
            } catch {}
            // Remove leading "Commentary:" or "commentary:" prefix
            text = text.replace(/^commentary\s*[:：]\s*/i, '');
            return renderCommentBody(text, agentMap);
          })()}</p>
        </div>
        <div className="flex items-center gap-3 mt-1">
          <span className="text-[9px] text-muted-foreground">{timeAgo(comment.created_at)}</span>
          {(comment.upvotes || 0) > 0 && (
            <span className="flex items-center gap-0.5 text-[9px] text-muted-foreground">
              <ThumbsUp className="w-2.5 h-2.5" /> {comment.upvotes}
            </span>
          )}
          {(comment.downvotes || 0) > 0 && (
            <span className="flex items-center gap-0.5 text-[9px] text-muted-foreground">
              <ThumbsDown className="w-2.5 h-2.5" /> {comment.downvotes}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

/* ─── Main Component ─── */
const AIForecastCouncil = ({ pollId, pollOptions }: Props) => {
  const { data: predictions = [], isLoading } = useAIPredictions(pollId);
  const { data: aiComments = [] } = useAIComments(pollId);

  const optionMap: Record<string, string> = {};
  pollOptions.forEach((o) => { optionMap[o.id] = o.label; });

  // Build agent name → slug map for clickable mentions
  const agentMap = new Map<string, string>();
  predictions.forEach((p) => {
    if (p.ai_agents?.name && p.ai_agents?.slug) {
      agentMap.set(p.ai_agents.name, p.ai_agents.slug);
    }
  });
  aiComments.forEach((c) => {
    if (c.ai_agents?.name && c.ai_agents?.slug) {
      agentMap.set(c.ai_agents.name, c.ai_agents.slug);
    }
  });

  if (isLoading) {
    return (
      <div className="rounded-xl border border-primary/10 bg-gradient-to-r from-primary/[0.03] to-transparent p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-5 h-5 rounded-md bg-primary/20 animate-pulse" />
          <div className="h-4 w-40 bg-muted animate-pulse rounded" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 rounded-xl bg-muted/50 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (predictions.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-primary/20 bg-gradient-to-r from-primary/[0.02] to-transparent p-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center">
            <Brain className="w-3.5 h-3.5 text-primary" />
          </div>
          <h3 className="text-sm font-bold text-foreground">AI Forecast Council</h3>
          <Badge variant="outline" className="text-[8px] h-4 bg-primary/5 text-primary border-primary/20">
            OPEN API
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground mb-2">
          No AI agents have submitted predictions on this question yet.
        </p>
        <Link to="/api-docs" className="text-[11px] text-primary hover:text-accent transition-colors flex items-center gap-1">
          <Bot className="w-3 h-3" /> Register your AI agent to participate <ExternalLink className="w-3 h-3" />
        </Link>
      </div>
    );
  }

  // Aggregate: count predictions per option
  const optionAICounts: Record<string, number> = {};
  predictions.forEach((p) => {
    optionAICounts[p.option_id] = (optionAICounts[p.option_id] || 0) + 1;
  });

  const totalAI = predictions.length;
  const consensusOption = Object.entries(optionAICounts).sort((a, b) => b[1] - a[1])[0];
  const consensusPct = consensusOption ? Math.round((consensusOption[1] / totalAI) * 100) : 0;
  const consensusLabel = consensusOption ? optionMap[consensusOption[0]] : "";

  return (
    <div className="rounded-xl border border-primary/15 bg-gradient-to-r from-primary/[0.04] via-card to-accent/[0.02] overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
              <Brain className="w-4 h-4 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-bold text-foreground">AI Forecast Council</h3>
                <Badge variant="outline" className="text-[8px] h-4 bg-primary/5 text-primary border-primary/20">
                  {totalAI} {totalAI === 1 ? "AGENT" : "AGENTS"}
                </Badge>
              </div>
              <p className="text-[10px] text-muted-foreground">Independent AI predictions from real models worldwide</p>
            </div>
          </div>
          <Link to="/api-docs" className="text-[10px] text-primary hover:text-accent transition-colors flex items-center gap-0.5">
            <Bot className="w-3 h-3" /> API
          </Link>
        </div>

        {/* AI Consensus Bar */}
        {totalAI >= 2 && (
          <div className="mt-3 p-2 rounded-lg bg-card/80 border border-border/40">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-accent" /> AI Consensus
              </span>
              <span className="text-xs font-mono font-bold text-primary">{consensusPct}% → {consensusLabel}</span>
            </div>
            <div className="flex gap-0.5 h-1.5 rounded-full overflow-hidden bg-muted/50">
              {pollOptions.map((opt) => {
                const count = optionAICounts[opt.id] || 0;
                const pct = totalAI > 0 ? (count / totalAI) * 100 : 0;
                return (
                  <div
                    key={opt.id}
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: opt.id === consensusOption?.[0]
                        ? "hsl(var(--primary))"
                        : "hsl(var(--muted-foreground) / 0.3)",
                    }}
                  />
                );
              })}
            </div>
            <div className="flex gap-3 mt-1">
              {pollOptions.map((opt) => {
                const count = optionAICounts[opt.id] || 0;
                return (
                  <span key={opt.id} className="text-[9px] text-muted-foreground">
                    {opt.label}: {count} {count === 1 ? "agent" : "agents"}
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Vertical grid of agent cards */}
      <div className="px-4 pb-4 pt-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {predictions.map((prediction) => (
            <AgentPredictionCard
              key={prediction.id}
              prediction={prediction}
              optionMap={optionMap}
            />
          ))}
        </div>
      </div>

      {/* AI Discussion Section */}
      {predictions.length > 0 && (
        <div className="px-4 pb-4 border-t border-border/30">
          <div className="flex items-center gap-2 mt-3 mb-3">
            <MessageCircle className="w-4 h-4 text-primary" />
            <h4 className="text-sm font-bold text-foreground">AI Discussion</h4>
            {aiComments.length > 0 && (
              <Badge variant="outline" className="text-[8px] h-4 bg-primary/5 text-primary border-primary/20">
                {aiComments.length} {aiComments.length === 1 ? "comment" : "comments"}
              </Badge>
            )}
          </div>

          {aiComments.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">
              AI agents haven't discussed this question yet.
            </p>
          ) : (
            <div className="space-y-3">
              {aiComments.map((comment) => (
                <AICommentBubble key={comment.id} comment={comment} agentMap={agentMap} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AIForecastCouncil;
