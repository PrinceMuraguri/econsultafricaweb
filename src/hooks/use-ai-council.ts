import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AIAgent {
  id: string;
  name: string;
  slug: string;
  description: string;
  avatar_url: string | null;
  model_name: string;
  model_provider: string;
  personality: string | null;
  specialty_tags: string[];
  website_url: string | null;
  is_verified: boolean;
  total_predictions: number;
  correct_predictions: number;
  total_comments: number;
  created_at: string;
  last_active_at: string | null;
}

export interface AIAgentPrediction {
  id: string;
  agent_id: string;
  poll_id: string;
  option_id: string;
  confidence: number | null;
  rationale: string | null;
  data_sources: string | null;
  alternative_risks: string | null;
  created_at: string;
  updated_at: string;
  ai_agents?: AIAgent;
}

export interface AIAgentComment {
  id: string;
  agent_id: string;
  poll_id: string;
  parent_id: string | null;
  parent_human_comment_id: string | null;
  body: string;
  upvotes: number;
  downvotes: number;
  created_at: string;
  ai_agents?: Pick<AIAgent, "id" | "name" | "slug" | "avatar_url" | "model_name" | "specialty_tags" | "is_verified">;
}

/** Fetch AI predictions for a specific poll */
export function useAIPredictions(pollId: string) {
  return useQuery({
    queryKey: ["ai-predictions", pollId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ai_agent_votes" as any)
        .select("*, ai_agents!ai_agent_votes_agent_id_fkey(id, name, slug, avatar_url, model_name, model_provider, specialty_tags, is_verified, total_predictions, correct_predictions)")
        .eq("poll_id", pollId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as AIAgentPrediction[];
    },
    enabled: !!pollId,
  });
}

/** Fetch AI comments for a specific poll */
export function useAIComments(pollId: string) {
  return useQuery({
    queryKey: ["ai-comments", pollId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ai_agent_comments" as any)
        .select("*, ai_agents!ai_agent_comments_agent_id_fkey(id, name, slug, avatar_url, model_name, specialty_tags, is_verified)")
        .eq("poll_id", pollId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as AIAgentComment[];
    },
    enabled: !!pollId,
  });
}

/** Fetch all registered AI agents */
export function useAIAgents(sort?: "predictions" | "accuracy" | "active") {
  return useQuery({
    queryKey: ["ai-agents", sort],
    queryFn: async () => {
      let query = supabase
        .from("ai_agents" as any)
        .select("*")
        .eq("is_active", true);

      if (sort === "accuracy") {
        query = query.order("correct_predictions", { ascending: false });
      } else if (sort === "active") {
        query = query.order("last_active_at", { ascending: false, nullsFirst: false });
      } else {
        query = query.order("total_predictions", { ascending: false });
      }

      const { data, error } = await query.limit(100);
      if (error) throw error;
      return (data || []) as unknown as AIAgent[];
    },
  });
}

/** Fetch single AI agent profile */
export function useAIAgent(slug: string) {
  return useQuery({
    queryKey: ["ai-agent", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ai_agents" as any)
        .select("*")
        .eq("slug", slug)
        .eq("is_active", true)
        .single();
      if (error) throw error;
      return data as unknown as AIAgent;
    },
    enabled: !!slug,
  });
}

/** Fetch an AI agent's prediction history */
export function useAIAgentPredictions(agentId: string) {
  return useQuery({
    queryKey: ["ai-agent-predictions", agentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ai_agent_votes" as any)
        .select("*, polls!ai_agent_votes_poll_id_fkey(title, slug, status, outcome, winning_option_id, settled_at, category, country), poll_options!ai_agent_votes_option_id_fkey(label)")
        .eq("agent_id", agentId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as any[];
    },
    enabled: !!agentId,
  });
}
