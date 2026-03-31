export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      admin_audit_log: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          entity_id: string | null
          entity_type: string
          id: string
          performed_by: string
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type: string
          id?: string
          performed_by?: string
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          performed_by?: string
        }
        Relationships: []
      }
      inquiries: {
        Row: {
          created_at: string
          email: string
          id: string
          inquiry_type: string
          message: string | null
          metadata: Json | null
          name: string | null
          phone: string | null
          poll_id: string | null
          poll_title: string | null
          source: string
          status: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          inquiry_type?: string
          message?: string | null
          metadata?: Json | null
          name?: string | null
          phone?: string | null
          poll_id?: string | null
          poll_title?: string | null
          source?: string
          status?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          inquiry_type?: string
          message?: string | null
          metadata?: Json | null
          name?: string | null
          phone?: string | null
          poll_id?: string | null
          poll_title?: string | null
          source?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "inquiries_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "polls"
            referencedColumns: ["id"]
          },
        ]
      }
      payout_transfers: {
        Row: {
          amount: number
          batch_id: string | null
          created_at: string
          currency: string
          error_message: string | null
          id: string
          payout_id: string
          paystack_reference: string | null
          reason: string | null
          recipient_code: string
          retries: number
          status: string
          transfer_code: string | null
          updated_at: string
          voter_fingerprint: string
        }
        Insert: {
          amount: number
          batch_id?: string | null
          created_at?: string
          currency?: string
          error_message?: string | null
          id?: string
          payout_id: string
          paystack_reference?: string | null
          reason?: string | null
          recipient_code: string
          retries?: number
          status?: string
          transfer_code?: string | null
          updated_at?: string
          voter_fingerprint: string
        }
        Update: {
          amount?: number
          batch_id?: string | null
          created_at?: string
          currency?: string
          error_message?: string | null
          id?: string
          payout_id?: string
          paystack_reference?: string | null
          reason?: string | null
          recipient_code?: string
          retries?: number
          status?: string
          transfer_code?: string | null
          updated_at?: string
          voter_fingerprint?: string
        }
        Relationships: [
          {
            foreignKeyName: "payout_transfers_payout_id_fkey"
            columns: ["payout_id"]
            isOneToOne: false
            referencedRelation: "payouts"
            referencedColumns: ["id"]
          },
        ]
      }
      payouts: {
        Row: {
          amount: number
          created_at: string
          id: string
          payout_method: string | null
          poll_id: string
          reference: string | null
          settled_at: string | null
          status: string
          transfer_code: string | null
          voter_fingerprint: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          payout_method?: string | null
          poll_id: string
          reference?: string | null
          settled_at?: string | null
          status?: string
          transfer_code?: string | null
          voter_fingerprint: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          payout_method?: string | null
          poll_id?: string
          reference?: string | null
          settled_at?: string | null
          status?: string
          transfer_code?: string | null
          voter_fingerprint?: string
        }
        Relationships: [
          {
            foreignKeyName: "payouts_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "polls"
            referencedColumns: ["id"]
          },
        ]
      }
      poll_options: {
        Row: {
          created_at: string
          id: string
          label: string
          poll_id: string
          total_stake_amount: number
          total_votes_count: number
        }
        Insert: {
          created_at?: string
          id?: string
          label: string
          poll_id: string
          total_stake_amount?: number
          total_votes_count?: number
        }
        Update: {
          created_at?: string
          id?: string
          label?: string
          poll_id?: string
          total_stake_amount?: number
          total_votes_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "poll_options_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "polls"
            referencedColumns: ["id"]
          },
        ]
      }
      polls: {
        Row: {
          category: string
          close_at: string
          context: string | null
          country: string | null
          created_at: string
          description: string | null
          expert_insight: string | null
          id: string
          index_number: number | null
          outcome: string | null
          question_type: string | null
          resolution_criteria: string | null
          resolve_at: string | null
          settled_at: string | null
          settled_by: string | null
          slug: string
          status: string
          title: string
          updated_at: string
          winning_option_id: string | null
        }
        Insert: {
          category?: string
          close_at: string
          context?: string | null
          country?: string | null
          created_at?: string
          description?: string | null
          expert_insight?: string | null
          id?: string
          index_number?: number | null
          outcome?: string | null
          question_type?: string | null
          resolution_criteria?: string | null
          resolve_at?: string | null
          settled_at?: string | null
          settled_by?: string | null
          slug: string
          status?: string
          title: string
          updated_at?: string
          winning_option_id?: string | null
        }
        Update: {
          category?: string
          close_at?: string
          context?: string | null
          country?: string | null
          created_at?: string
          description?: string | null
          expert_insight?: string | null
          id?: string
          index_number?: number | null
          outcome?: string | null
          question_type?: string | null
          resolution_criteria?: string | null
          resolve_at?: string | null
          settled_at?: string | null
          settled_by?: string | null
          slug?: string
          status?: string
          title?: string
          updated_at?: string
          winning_option_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "polls_winning_option_id_fkey"
            columns: ["winning_option_id"]
            isOneToOne: false
            referencedRelation: "poll_options"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_funnel_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          metadata: Json | null
          product_id: string | null
          product_title: string | null
          product_type: string | null
          user_email: string | null
          user_fingerprint: string | null
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          metadata?: Json | null
          product_id?: string | null
          product_title?: string | null
          product_type?: string | null
          user_email?: string | null
          user_fingerprint?: string | null
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          metadata?: Json | null
          product_id?: string | null
          product_title?: string | null
          product_type?: string | null
          user_email?: string | null
          user_fingerprint?: string | null
        }
        Relationships: []
      }
      sample_downloads: {
        Row: {
          downloaded_at: string
          fingerprint: string | null
          id: string
          ip_hint: string | null
          referrer: string | null
          source_page: string
          user_agent: string | null
        }
        Insert: {
          downloaded_at?: string
          fingerprint?: string | null
          id?: string
          ip_hint?: string | null
          referrer?: string | null
          source_page?: string
          user_agent?: string | null
        }
        Update: {
          downloaded_at?: string
          fingerprint?: string | null
          id?: string
          ip_hint?: string | null
          referrer?: string | null
          source_page?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      trading_waitlist: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          phone_number: string
          voter_fingerprint: string | null
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          id?: string
          phone_number: string
          voter_fingerprint?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          phone_number?: string
          voter_fingerprint?: string | null
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          channel: string
          created_at: string
          currency: string
          id: string
          option_id: string
          poll_id: string
          reference: string
          status: string
          voter_fingerprint: string
        }
        Insert: {
          amount: number
          channel?: string
          created_at?: string
          currency?: string
          id?: string
          option_id: string
          poll_id: string
          reference: string
          status?: string
          voter_fingerprint: string
        }
        Update: {
          amount?: number
          channel?: string
          created_at?: string
          currency?: string
          id?: string
          option_id?: string
          poll_id?: string
          reference?: string
          status?: string
          voter_fingerprint?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_option_id_fkey"
            columns: ["option_id"]
            isOneToOne: false
            referencedRelation: "poll_options"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "polls"
            referencedColumns: ["id"]
          },
        ]
      }
      transfer_recipients: {
        Row: {
          account_number: string | null
          bank_code: string | null
          created_at: string
          currency: string
          email: string | null
          id: string
          name: string
          phone: string | null
          recipient_code: string
          recipient_type: string
          updated_at: string
          voter_fingerprint: string
        }
        Insert: {
          account_number?: string | null
          bank_code?: string | null
          created_at?: string
          currency?: string
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          recipient_code: string
          recipient_type?: string
          updated_at?: string
          voter_fingerprint: string
        }
        Update: {
          account_number?: string | null
          bank_code?: string | null
          created_at?: string
          currency?: string
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          recipient_code?: string
          recipient_type?: string
          updated_at?: string
          voter_fingerprint?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          age_bracket: string | null
          country: string | null
          created_at: string | null
          full_name: string
          id: string
          interests: Json | null
          occupation: string | null
          organization: string | null
          phone: string | null
          sex: string | null
          updated_at: string | null
          user_id: string
          username: string
          voter_fingerprint: string | null
        }
        Insert: {
          age_bracket?: string | null
          country?: string | null
          created_at?: string | null
          full_name: string
          id?: string
          interests?: Json | null
          occupation?: string | null
          organization?: string | null
          phone?: string | null
          sex?: string | null
          updated_at?: string | null
          user_id: string
          username: string
          voter_fingerprint?: string | null
        }
        Update: {
          age_bracket?: string | null
          country?: string | null
          created_at?: string | null
          full_name?: string
          id?: string
          interests?: Json | null
          occupation?: string | null
          organization?: string | null
          phone?: string | null
          sex?: string | null
          updated_at?: string | null
          user_id?: string
          username?: string
          voter_fingerprint?: string | null
        }
        Relationships: []
      }
      voter_profiles: {
        Row: {
          country_code: string
          created_at: string
          email: string
          full_name: string
          id: string
          phone_number: string
          updated_at: string
          voter_fingerprint: string
        }
        Insert: {
          country_code?: string
          created_at?: string
          email: string
          full_name: string
          id?: string
          phone_number: string
          updated_at?: string
          voter_fingerprint: string
        }
        Update: {
          country_code?: string
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          phone_number?: string
          updated_at?: string
          voter_fingerprint?: string
        }
        Relationships: []
      }
      votes: {
        Row: {
          created_at: string
          id: string
          ip_address: string | null
          is_staked: boolean
          option_id: string
          payment_reference: string | null
          poll_id: string
          stake_amount: number | null
          voter_fingerprint: string
        }
        Insert: {
          created_at?: string
          id?: string
          ip_address?: string | null
          is_staked?: boolean
          option_id: string
          payment_reference?: string | null
          poll_id: string
          stake_amount?: number | null
          voter_fingerprint: string
        }
        Update: {
          created_at?: string
          id?: string
          ip_address?: string | null
          is_staked?: boolean
          option_id?: string
          payment_reference?: string | null
          poll_id?: string
          stake_amount?: number | null
          voter_fingerprint?: string
        }
        Relationships: [
          {
            foreignKeyName: "votes_option_id_fkey"
            columns: ["option_id"]
            isOneToOne: false
            referencedRelation: "poll_options"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "votes_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "polls"
            referencedColumns: ["id"]
          },
        ]
      }
      wallet_transactions: {
        Row: {
          amount: number
          created_at: string | null
          description: string | null
          id: string
          reference: string | null
          related_vote_id: string | null
          status: string | null
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          description?: string | null
          id?: string
          reference?: string | null
          related_vote_id?: string | null
          status?: string | null
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          description?: string | null
          id?: string
          reference?: string | null
          related_vote_id?: string | null
          status?: string | null
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      wallets: {
        Row: {
          balance_usd: number
          created_at: string | null
          id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          balance_usd?: number
          created_at?: string | null
          id?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          balance_usd?: number
          created_at?: string | null
          id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      payout_winners: {
        Row: {
          country_code: string | null
          email: string | null
          full_name: string | null
          is_staked: boolean | null
          outcome: string | null
          payout_amount: number | null
          payout_status: string | null
          phone_number: string | null
          poll_slug: string | null
          poll_title: string | null
          stake_amount: number | null
          vote_date: string | null
          voter_fingerprint: string | null
          winning_option: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      increment_stake_amount: {
        Args: { p_amount: number; p_option_id: string }
        Returns: undefined
      }
      increment_vote_count: {
        Args: { p_option_id: string }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
