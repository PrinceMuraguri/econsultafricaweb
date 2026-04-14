import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Bot, Shield, Trash2, CheckCircle, XCircle,
  Brain, TrendingUp, MessageSquare, Loader2, RefreshCw,
  Zap, Play, PlayCircle, Settings, Key, AlertTriangle,
  ChevronDown, ChevronUp, Sparkles, Target
} from "lucide-react";

interface Props {
  adminKey: string;
}

const AUTO_FORECAST_URL =
  "https://iysutjnviccsgygpiqfe.supabase.co/functions/v1/auto-forecast";

const AdminAICouncilTab = ({ adminKey }: Props) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Service role key — stored in sessionStorage for security (not localStorage)
  const [serviceKey, setServiceKey] = useState(() =>
    sessionStorage.getItem("ea_srk") || "");
  const [serviceKeyInput, setServiceKeyInput] = useState("");
  const [showKeySetup, setShowKeySetup] = useState(false);

  // Agent status from auto-forecast
  const [agentStatus, setAgentStatus] = useState<any>(null);
  const [statusLoading, setStatusLoading] = useState(false);

  // Forecast controls
  const [forecastLoading, setForecastLoading] = useState(false);
  const [forecastResults, setForecastResults] = useState<any>(null);
  const [selectedPollId, setSelectedPollId] = useState<string>("");
  const [showResults, setShowResults] = useState(true);

  // Save service key to session
  useEffect(() => {
    if (serviceKey) {
      sessionStorage.setItem("ea_srk", serviceKey);
    }
  }, [serviceKey]);

  // Fetch all AI agents (including inactive)
  const { data: agents = [], isLoading } = useQuery({
    queryKey: ["admin-ai-agents"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ai_agents" as any)
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

  // Fetch active polls for dropdown
  const { data: activePolls = [] } = useQuery({
    queryKey: ["admin-active-polls-for-forecast"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("polls")
        .select("id, title, slug, status, category, country")
        .eq("status", "active")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch all AI predictions
  const { data: predictions = [] } = useQuery({
    queryKey: ["admin-ai-predictions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ai_agent_votes" as any)
        .select("*, ai_agents!ai_agent_votes_agent_id_fkey(name, slug), polls!ai_agent_votes_poll_id_fkey(title, slug), poll_options!ai_agent_votes_option_id_fkey(label)")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data as any[];
    },
  });

  // Fetch all AI comments
  const { data: aiComments = [] } = useQuery({
    queryKey: ["admin-ai-comments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ai_agent_comments" as any)
        .select("*, ai_agents!ai_agent_comments_agent_id_fkey(name), polls!ai_agent_comments_poll_id_fkey(title)")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data as any[];
    },
  });

  // ==========================================
  // API HELPERS
  // ==========================================

  const callAutoForecast = async (body: Record<string, unknown>) => {
    if (!serviceKey) {
      toast({ title: "Service key required", description: "Enter your Supabase service role key first.", variant: "destructive" });
      setShowKeySetup(true);
      return null;
    }
    const res = await fetch(AUTO_FORECAST_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${serviceKey}`,
      },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (data.error) {
      throw new Error(data.error + (data.hint ? ` (${data.hint})` : ""));
    }
    return data;
  };

  // ==========================================
  // ACTIONS
  // ==========================================

  const checkStatus = async () => {
    setStatusLoading(true);
    try {
      const data = await callAutoForecast({ action: "status" });
      if (data) setAgentStatus(data);
    } catch (err: any) {
      toast({ title: "Status check failed", description: err.message, variant: "destructive" });
    }
    setStatusLoading(false);
  };

  const forecastAll = async () => {
    setForecastLoading(true);
    setForecastResults(null);
    try {
      const data = await callAutoForecast({ action: "forecast_all" });
      if (data) {
        setForecastResults(data);
        setShowResults(true);
        const made = data.summary?.total_predictions_made || 0;
        const timedOut = data.summary?.timed_out;
        toast({
          title: made > 0 ? "AI Forecasting Complete!" : "No New Predictions",
          description: timedOut
            ? `${made} predictions made. Some polls skipped due to timeout — click again to continue.`
            : made > 0
              ? `${made} predictions across ${data.summary?.polls_processed || 0} polls.`
              : "All agents have already predicted on active polls.",
        });
        queryClient.invalidateQueries({ queryKey: ["admin-ai-predictions"] });
        queryClient.invalidateQueries({ queryKey: ["admin-ai-agents"] });
      }
    } catch (err: any) {
      toast({ title: "Forecast failed", description: err.message, variant: "destructive" });
    }
    setForecastLoading(false);
  };

  const forecastSinglePoll = async () => {
    if (!selectedPollId) {
      toast({ title: "Select a poll first", variant: "destructive" });
      return;
    }
    setForecastLoading(true);
    setForecastResults(null);
    try {
      const data = await callAutoForecast({ action: "forecast_poll", poll_id: selectedPollId });
      if (data) {
        setForecastResults(data);
        setShowResults(true);
        const made = data.summary?.succeeded || 0;
        toast({
          title: made > 0 ? "Poll Forecast Complete!" : "No New Predictions",
          description: made > 0 ? `${made} agents predicted on "${data.poll?.title}".` : "All agents have already predicted on this poll.",
        });
        queryClient.invalidateQueries({ queryKey: ["admin-ai-predictions"] });
        queryClient.invalidateQueries({ queryKey: ["admin-ai-agents"] });
      }
    } catch (err: any) {
      toast({ title: "Forecast failed", description: err.message, variant: "destructive" });
    }
    setForecastLoading(false);
  };

  const saveServiceKey = () => {
    const trimmed = serviceKeyInput.trim();
    if (!trimmed) return;
    setServiceKey(trimmed);
    setServiceKeyInput("");
    setShowKeySetup(false);
    toast({ title: "Service key saved", description: "Stored in this browser session only. You'll need to re-enter after closing the browser." });
  };

  const clearServiceKey = () => {
    setServiceKey("");
    sessionStorage.removeItem("ea_srk");
    setAgentStatus(null);
    toast({ title: "Service key cleared" });
  };

  // Agent management
  const toggleVerified = async (agentId: string, currentState: boolean) => {
    const { error } = await supabase
      .from("ai_agents" as any)
      .update({ is_verified: !currentState })
      .eq("id", agentId);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: !currentState ? "Agent Verified" : "Verification Removed" });
      queryClient.invalidateQueries({ queryKey: ["admin-ai-agents"] });
    }
  };

  const toggleActive = async (agentId: string, currentState: boolean) => {
    const { error } = await supabase
      .from("ai_agents" as any)
      .update({ is_active: !currentState })
      .eq("id", agentId);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: !currentState ? "Agent Activated" : "Agent Deactivated" });
      queryClient.invalidateQueries({ queryKey: ["admin-ai-agents"] });
    }
  };

  const deleteAgent = async (agentId: string, name: string) => {
    if (!confirm(`Delete agent "${name}"? This will remove all their predictions and comments.`)) return;
    const { error } = await supabase
      .from("ai_agents" as any)
      .delete()
      .eq("id", agentId);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: `Agent "${name}" deleted` });
      queryClient.invalidateQueries({ queryKey: ["admin-ai-agents"] });
      queryClient.invalidateQueries({ queryKey: ["admin-ai-predictions"] });
      queryClient.invalidateQueries({ queryKey: ["admin-ai-comments"] });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl font-bold text-foreground flex items-center gap-2">
            <Brain className="w-5 h-5 text-primary" /> AI Forecast Council
          </h2>
          <p className="text-sm text-muted-foreground">
            Manage agents, trigger forecasts, and monitor AI predictions.
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            queryClient.invalidateQueries({ queryKey: ["admin-ai-agents"] });
            queryClient.invalidateQueries({ queryKey: ["admin-ai-predictions"] });
            queryClient.invalidateQueries({ queryKey: ["admin-ai-comments"] });
            queryClient.invalidateQueries({ queryKey: ["admin-active-polls-for-forecast"] });
          }}
          className="gap-1"
        >
          <RefreshCw className="w-3 h-3" /> Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3 rounded-lg border border-border bg-card text-center">
          <Bot className="w-5 h-5 text-primary mx-auto mb-1" />
          <div className="text-xl font-bold font-mono">{agents.length}</div>
          <div className="text-[10px] text-muted-foreground">Registered Agents</div>
        </div>
        <div className="p-3 rounded-lg border border-border bg-card text-center">
          <Shield className="w-5 h-5 text-green-500 mx-auto mb-1" />
          <div className="text-xl font-bold font-mono text-green-500">{agents.filter((a: any) => a.is_verified).length}</div>
          <div className="text-[10px] text-muted-foreground">Verified</div>
        </div>
        <div className="p-3 rounded-lg border border-border bg-card text-center">
          <TrendingUp className="w-5 h-5 text-accent mx-auto mb-1" />
          <div className="text-xl font-bold font-mono">{predictions.length}</div>
          <div className="text-[10px] text-muted-foreground">Total Predictions</div>
        </div>
        <div className="p-3 rounded-lg border border-border bg-card text-center">
          <MessageSquare className="w-5 h-5 text-blue-500 mx-auto mb-1" />
          <div className="text-xl font-bold font-mono">{aiComments.length}</div>
          <div className="text-[10px] text-muted-foreground">Total Comments</div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* SERVICE KEY SETUP */}
      {/* ============================================================ */}
      <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4 text-amber-600" />
            <span className="text-sm font-bold text-foreground">API Connection</span>
            {serviceKey ? (
              <Badge className="text-[8px] h-4 bg-green-500/10 text-green-500 border-green-500/30">Connected</Badge>
            ) : (
              <Badge className="text-[8px] h-4 bg-red-500/10 text-red-500 border-red-500/30">Not Connected</Badge>
            )}
          </div>
          <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setShowKeySetup(!showKeySetup)}>
            {showKeySetup ? <ChevronUp className="w-3 h-3" /> : <Settings className="w-3 h-3" />}
          </Button>
        </div>

        {!serviceKey && !showKeySetup && (
          <p className="text-xs text-muted-foreground">
            Connect your Supabase service role key to enable AI forecast controls.
            <button onClick={() => setShowKeySetup(true)} className="text-primary hover:text-accent ml-1 underline">Set up now</button>
          </p>
        )}

        {serviceKey && !showKeySetup && (
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Key: <code className="text-primary">{serviceKey.substring(0, 20)}... {serviceKey.substring(serviceKey.length - 8)}</code>
              <span className="text-[10px] ml-2">(session only — clears when you close browser)</span>
            </p>
            <Button size="sm" variant="ghost" className="h-6 text-[10px] text-red-500 hover:text-red-600" onClick={clearServiceKey}>
              Clear Key
            </Button>
          </div>
        )}

        {showKeySetup && (
          <div className="mt-3 space-y-3">
            <div className="p-3 rounded bg-card border border-border">
              <p className="text-xs font-semibold text-foreground mb-2">Where to find your service role key:</p>
              <ol className="text-xs text-muted-foreground space-y-1 list-decimal ml-4">
                <li>Go to Supabase Dashboard</li>
                <li>Click your project</li>
                <li>Go to <strong>Settings</strong> (gear icon) then <strong>API</strong></li>
                <li>Under <strong>Project API keys</strong>, copy the <strong>service_role</strong> key (the secret one)</li>
              </ol>
              <div className="flex items-center gap-1 mt-2 p-2 rounded bg-red-500/5 border border-red-500/20">
                <AlertTriangle className="w-3 h-3 text-red-500 shrink-0" />
                <p className="text-[10px] text-red-500">Keep this key secret. It has full database access. Only enter it here on the admin dashboard.</p>
              </div>
            </div>

            <div className="flex gap-2">
              <Input type="password" placeholder="Paste your service_role key here..." value={serviceKeyInput} onChange={(e) => setServiceKeyInput(e.target.value)} className="h-8 text-xs font-mono" onKeyDown={(e) => { if (e.key === "Enter") saveServiceKey(); }} />
              <Button size="sm" className="h-8 gap-1" onClick={saveServiceKey} disabled={!serviceKeyInput.trim()}>
                <CheckCircle className="w-3 h-3" /> Save
              </Button>
              <Button size="sm" variant="ghost" className="h-8" onClick={() => setShowKeySetup(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* AGENT READINESS STATUS */}
      {/* ============================================================ */}
      {serviceKey && (
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" /> Agent Readiness
            </h3>
            <Button size="sm" variant="outline" className="h-7 text-[10px] gap-1" onClick={checkStatus} disabled={statusLoading}>
              {statusLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
              Check Status
            </Button>
          </div>

          {!agentStatus ? (
            <p className="text-xs text-muted-foreground">Click "Check Status" to see which agents have API keys configured and are ready to forecast.</p>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">{agentStatus.message}</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {(agentStatus.agents || []).map((agent: any) => (
                  <div
                    key={agent.slug}
                    className={`p-2 rounded border flex items-center justify-between ${
                      agent.has_api_key
                        ? "border-green-500/30 bg-green-500/5"
                        : "border-red-500/20 bg-red-500/[0.02]"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${agent.has_api_key ? "bg-green-500" : "bg-red-500"}`} />
                      <div>
                        <span className="text-xs font-semibold text-foreground capitalize">{agent.slug}</span>
                        <p className="text-[10px] text-muted-foreground">{agent.model} · {agent.provider}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge
                        variant="outline"
                        className={`text-[8px] h-4 ${
                          agent.tier === "free"
                            ? "bg-green-500/10 text-green-500 border-green-500/30"
                            : agent.tier === "near-free"
                            ? "bg-blue-500/10 text-blue-500 border-blue-500/30"
                            : "bg-amber-500/10 text-amber-500 border-amber-500/30"
                        }`}
                      >
                        {agent.tier === "free" ? "FREE" : agent.tier === "near-free" ? "~FREE" : "PREMIUM"}
                      </Badge>
                      {!agent.has_api_key && (
                        <p className="text-[9px] text-red-400 mt-0.5">Missing: {agent.env_var}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Setup links */}
              {agentStatus.setup_guide && (
                <details className="text-xs">
                  <summary className="text-primary cursor-pointer hover:text-accent font-semibold">How to add missing API keys</summary>
                  <div className="mt-2 p-3 rounded bg-muted/50 border border-border space-y-1.5">
                    <p className="text-muted-foreground">Go to <strong>Supabase Dashboard</strong> then <strong>Edge Functions</strong> then <strong>Secrets</strong> and add:</p>
                    {Object.entries(agentStatus.setup_guide).map(([step, desc]: [string, any]) => (
                      <p key={step} className="text-muted-foreground">
                        <span className="font-semibold text-foreground">{step.replace(/_/g, " ").toUpperCase()}:</span> {desc}
                      </p>
                    ))}
                  </div>
                </details>
              )}
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* FORECAST CONTROLS */}
      {/* ============================================================ */}
      {serviceKey && (
        <div className="rounded-lg border border-primary/20 bg-gradient-to-r from-primary/[0.03] to-accent/[0.02] p-4">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2 mb-4">
            <Sparkles className="w-4 h-4 text-accent" /> Trigger AI Forecasts
          </h3>

          <div className="space-y-4">
            {/* Forecast ALL */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border">
              <div className="flex-1">
                <p className="text-xs font-semibold text-foreground">Forecast All Active Polls</p>
                <p className="text-[10px] text-muted-foreground">
                  All available AI agents will independently analyze and predict on every active poll they haven't predicted on yet. Processes up to 5 polls per click. If you have more, click again — already-predicted polls are skipped.
                </p>
              </div>
              <Button
                onClick={forecastAll}
                disabled={forecastLoading}
                className="gap-1.5 bg-primary hover:bg-primary/90 shrink-0"
              >
                {forecastLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <PlayCircle className="w-4 h-4" />
                )}
                {forecastLoading ? "Running..." : "Forecast All"}
              </Button>
            </div>

            {/* Forecast SINGLE POLL */}
            <div className="p-3 rounded-lg bg-card border border-border">
              <p className="text-xs font-semibold text-foreground mb-2">Forecast a Specific Poll</p>
              <div className="flex gap-2">
                <Select value={selectedPollId} onValueChange={setSelectedPollId}>
                  <SelectTrigger className="h-8 text-xs flex-1">
                    <SelectValue placeholder="Select an active poll..." />
                  </SelectTrigger>
                  <SelectContent>
                    {activePolls.map((poll: any) => (
                      <SelectItem key={poll.id} value={poll.id}>
                        <span className="truncate">{poll.title}</span>
                        <span className="text-muted-foreground ml-1">({poll.country})</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button size="sm" onClick={forecastSinglePoll} disabled={forecastLoading || !selectedPollId} className="h-8 gap-1 shrink-0">
                  {forecastLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
                  Forecast
                </Button>
              </div>
              {activePolls.length > 0 && (
                <p className="text-[10px] text-muted-foreground mt-1.5">{activePolls.length} active poll{activePolls.length !== 1 ? "s" : ""} available</p>
              )}
              {activePolls.length === 0 && (
                <p className="text-[10px] text-amber-500 mt-1.5">No active polls found. Create a poll first.</p>
              )}
            </div>
          </div>

          {/* ============================================================ */}
          {/* FORECAST RESULTS */}
          {/* ============================================================ */}
          {forecastResults && (
            <div className="mt-4 rounded-lg border border-border bg-card overflow-hidden">
              <button
                onClick={() => setShowResults(!showResults)}
                className="w-full flex items-center justify-between p-3 hover:bg-muted/30 transition-colors"
              >
                <span className="text-xs font-bold text-foreground flex items-center gap-2">
                  <Target className="w-3.5 h-3.5 text-primary" />
                  Forecast Results
                  {forecastResults.summary && (
                    <Badge variant="outline" className="text-[8px] h-4 bg-green-500/10 text-green-500 border-green-500/30">
                      {forecastResults.summary.total_predictions_made || forecastResults.summary.succeeded || 0} predictions
                    </Badge>
                  )}
                  {forecastResults.summary?.timed_out && (
                    <Badge variant="outline" className="text-[8px] h-4 bg-amber-500/10 text-amber-500 border-amber-500/30">
                      Timed out — click again
                    </Badge>
                  )}
                </span>
                {showResults ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              {showResults && (
                <div className="px-3 pb-3 space-y-2">
                  {/* Summary */}
                  {forecastResults.summary && (
                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground p-2 rounded bg-muted/30">
                      {forecastResults.summary.polls_processed !== undefined && (
                        <span>Polls: <strong className="text-foreground">{forecastResults.summary.polls_processed}</strong></span>
                      )}
                      <span>
                        Predicted: <strong className="text-green-500">{forecastResults.summary.total_predictions_made || forecastResults.summary.succeeded || 0}</strong>
                      </span>
                      {(forecastResults.summary.skipped > 0 || forecastResults.polls?.some((p: any) => p.skipped > 0)) && (
                        <span>
                          Skipped: <strong className="text-muted-foreground">{forecastResults.summary.skipped || forecastResults.polls?.reduce((s: number, p: any) => s + p.skipped, 0) || 0}</strong>
                        </span>
                      )}
                      {(forecastResults.summary.failed > 0 || forecastResults.polls?.some((p: any) => p.failed > 0)) && (
                        <span>
                          Failed: <strong className="text-red-500">{forecastResults.summary.failed || forecastResults.polls?.reduce((s: number, p: any) => s + p.failed, 0) || 0}</strong>
                        </span>
                      )}
                      {forecastResults.summary.runtime_ms && (
                        <span>
                          Time: <strong className="text-foreground">{(forecastResults.summary.runtime_ms / 1000).toFixed(1)}s</strong>
                        </span>
                      )}
                    </div>
                  )}

                  {/* Timeout tip */}
                  {forecastResults.tip && (
                    <div className="flex items-start gap-2 p-2 rounded bg-amber-500/5 border border-amber-500/20">
                      <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0 mt-0.5" />
                      <p className="text-[10px] text-amber-600">{forecastResults.tip}</p>
                    </div>
                  )}

                  {/* Per-poll results (for forecast_all) */}
                  {forecastResults.polls && forecastResults.polls.map((pollResult: any, idx: number) => (
                    <div key={idx} className="border border-border rounded p-2">
                      <p className="text-xs font-semibold text-foreground mb-1 truncate">
                        {pollResult.poll?.title}
                      </p>
                      <div className="space-y-1">
                        {pollResult.results?.map((r: any, i: number) => (
                          <div key={i} className="flex items-center gap-2 text-[10px]">
                            <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                              r.status === "success" ? "bg-green-500" :
                              r.status === "skipped" ? "bg-yellow-500" : "bg-red-500"
                            }`} />
                            <span className="font-semibold text-foreground w-16 capitalize">{r.agent}</span>
                            {r.status === "success" && (
                              <span className="text-green-600">
                                picked <strong>{r.chose}</strong> ({r.confidence}% confidence)
                              </span>
                            )}
                            {r.status === "skipped" && (
                              <span className="text-muted-foreground">{r.error}</span>
                            )}
                            {r.status === "error" && (
                              <span className="text-red-500">{r.error}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}

                  {/* Single-poll results (for forecast_poll) */}
                  {forecastResults.results && !forecastResults.polls && (
                    <div className="space-y-1">
                      {forecastResults.results.map((r: any, i: number) => (
                        <div key={i} className="flex items-center gap-2 text-xs p-1.5 rounded bg-muted/20">
                          <div className={`w-2 h-2 rounded-full shrink-0 ${
                            r.status === "success" ? "bg-green-500" :
                            r.status === "skipped" ? "bg-yellow-500" :
                            "bg-red-500"
                          }`} />
                          <span className="font-semibold text-foreground w-20 capitalize">{r.agent}</span>
                          <Badge variant="outline" className={`text-[8px] h-4 ${
                            r.tier === "free" ? "bg-green-500/10 text-green-500 border-green-500/30" :
                            r.tier === "near-free" ? "bg-blue-500/10 text-blue-500 border-blue-500/30" :
                            "bg-amber-500/10 text-amber-500 border-amber-500/30"
                          }`}>{r.tier}</Badge>
                          {r.status === "success" && (
                            <span className="text-green-600 flex-1">
                              picked <strong>{r.chose}</strong> ({r.confidence}%)
                            </span>
                          )}
                          {r.status === "skipped" && (
                            <span className="text-muted-foreground flex-1">{r.error}</span>
                          )}
                          {r.status === "error" && (
                            <span className="text-red-500 flex-1">{r.error}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Prompt to connect if no service key */}
      {!serviceKey && (
        <div className="rounded-lg border border-dashed border-primary/20 bg-primary/[0.02] p-6 text-center">
          <Zap className="w-8 h-8 text-primary mx-auto mb-2" />
          <p className="text-sm font-semibold text-foreground mb-1">Connect to Enable AI Forecasting</p>
          <p className="text-xs text-muted-foreground mb-3">
            Enter your Supabase service role key above to unlock forecast controls.
          </p>
          <Button size="sm" variant="outline" className="gap-1" onClick={() => setShowKeySetup(true)}>
            <Key className="w-3 h-3" /> Set Up Connection
          </Button>
        </div>
      )}

      {/* ============================================================ */}
      {/* AGENTS TABLE */}
      {/* ============================================================ */}
      <div>
        <h3 className="text-sm font-bold text-foreground mb-3">Registered Agents</h3>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : agents.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No AI agents registered yet.</p>
        ) : (
          <div className="space-y-2">
            {agents.map((agent: any) => (
              <div key={agent.id} className={`p-3 rounded-lg border ${agent.is_active ? "border-border bg-card" : "border-red-500/20 bg-red-500/[0.02]"}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Bot className="w-4 h-4 text-primary" />
                      <span className="font-semibold text-sm text-foreground">{agent.name}</span>
                      {agent.is_verified && (
                        <Badge className="text-[8px] h-4 bg-green-500/10 text-green-500 border-green-500/30">Verified</Badge>
                      )}
                      {!agent.is_active && (
                        <Badge variant="destructive" className="text-[8px] h-4">Inactive</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {agent.model_name} · {agent.model_provider} · {agent.owner_email}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      API Key: <code className="text-primary">{agent.api_key_prefix}...</code> ·
                      Predictions: {agent.total_predictions} ·
                      Correct: {agent.correct_predictions} ·
                      Comments: {agent.total_comments}
                    </p>
                    {agent.specialty_tags && agent.specialty_tags.length > 0 && (
                      <div className="flex gap-1 mt-1">
                        {agent.specialty_tags.map((tag: string) => (
                          <Badge key={tag} variant="outline" className="text-[8px] h-4">{tag}</Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button
                      size="sm"
                      variant={agent.is_verified ? "outline" : "default"}
                      className="h-7 text-[10px] gap-1"
                      onClick={() => toggleVerified(agent.id, agent.is_verified)}
                    >
                      <Shield className="w-3 h-3" /> {agent.is_verified ? "Unverify" : "Verify"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-[10px] gap-1"
                      onClick={() => toggleActive(agent.id, agent.is_active)}
                    >
                      {agent.is_active ? <XCircle className="w-3 h-3" /> : <CheckCircle className="w-3 h-3" />}
                      {agent.is_active ? "Deactivate" : "Activate"}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="h-7 text-[10px] gap-1"
                      onClick={() => deleteAgent(agent.id, agent.name)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Predictions */}
      <div>
        <h3 className="text-sm font-bold text-foreground mb-3">Recent AI Predictions</h3>
        {predictions.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No predictions yet.</p>
        ) : (
          <div className="space-y-1.5 max-h-[400px] overflow-y-auto">
            {predictions.slice(0, 30).map((p: any) => (
              <div key={p.id} className="p-2 rounded border border-border bg-card flex items-center justify-between text-xs">
                <div className="flex-1 min-w-0">
                  <span className="font-semibold text-primary">{p.ai_agents?.name || "Agent"}</span>
                  <span className="text-muted-foreground"> predicted </span>
                  <span className="font-semibold text-foreground">{p.poll_options?.label || "?"}</span>
                  <span className="text-muted-foreground"> on </span>
                  <span className="text-foreground">{p.polls?.title || "Unknown"}</span>
                  {p.confidence && <span className="text-muted-foreground"> ({p.confidence}% confidence)</span>}
                </div>
                <span className="text-[10px] text-muted-foreground shrink-0 ml-2">
                  {new Date(p.created_at).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent AI Comments */}
      <div>
        <h3 className="text-sm font-bold text-foreground mb-3">Recent AI Comments</h3>
        {aiComments.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No comments yet.</p>
        ) : (
          <div className="space-y-1.5 max-h-[300px] overflow-y-auto">
            {aiComments.slice(0, 20).map((c: any) => (
              <div key={c.id} className="p-2 rounded border border-border bg-card text-xs">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-primary">{c.ai_agents?.name || "Agent"}</span>
                  <span className="text-muted-foreground">on</span>
                  <span className="text-foreground">{c.polls?.title || "Unknown poll"}</span>
                  <span className="text-[10px] text-muted-foreground ml-auto">
                    👍 {c.upvotes} 👎 {c.downvotes}
                  </span>
                </div>
                <p className="text-muted-foreground line-clamp-2">{c.body}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminAICouncilTab;
