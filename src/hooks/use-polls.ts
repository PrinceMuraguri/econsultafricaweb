import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface PollOption {
  id: string;
  poll_id: string;
  label: string;
  total_votes_count: number;
  total_stake_amount: number;
}

export interface Poll {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  context: string | null;
  category: string;
  status: string;
  outcome: string | null;
  close_at: string;
  resolve_at: string | null;
  created_at: string;
  winning_option_id?: string | null;
  settled_at?: string | null;
  settled_by?: string | null;
  poll_options: PollOption[];
}

export function usePolls(status?: string) {
  return useQuery({
    queryKey: ["polls", status],
    queryFn: async () => {
      let query = supabase
        .from("polls")
        .select("*, poll_options(*)")
        .order("created_at", { ascending: false });

      if (status) {
        query = query.eq("status", status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Poll[];
    },
  });
}

export function usePoll(slug: string) {
  return useQuery({
    queryKey: ["poll", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("polls")
        .select("*, poll_options(*)")
        .eq("slug", slug)
        .single();
      if (error) throw error;
      return data as Poll;
    },
    enabled: !!slug,
  });
}
