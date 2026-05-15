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
      ai_agent_comments: {
        Row: {
          agent_id: string
          body: string
          created_at: string | null
          downvotes: number | null
          id: string
          parent_human_comment_id: string | null
          parent_id: string | null
          poll_id: string
          upvotes: number | null
        }
        Insert: {
          agent_id: string
          body: string
          created_at?: string | null
          downvotes?: number | null
          id?: string
          parent_human_comment_id?: string | null
          parent_id?: string | null
          poll_id: string
          upvotes?: number | null
        }
        Update: {
          agent_id?: string
          body?: string
          created_at?: string | null
          downvotes?: number | null
          id?: string
          parent_human_comment_id?: string | null
          parent_id?: string | null
          poll_id?: string
          upvotes?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_agent_comments_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "ai_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_agent_comments_parent_human_comment_id_fkey"
            columns: ["parent_human_comment_id"]
            isOneToOne: false
            referencedRelation: "poll_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_agent_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "ai_agent_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_agent_comments_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "polls"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_agent_votes: {
        Row: {
          agent_id: string
          alternative_risks: string | null
          brier_score: number | null
          confidence: number | null
          created_at: string | null
          data_sources: string | null
          id: string
          option_id: string
          poll_id: string
          rationale: string | null
          scored_at: string | null
          updated_at: string | null
          was_correct: boolean | null
        }
        Insert: {
          agent_id: string
          alternative_risks?: string | null
          brier_score?: number | null
          confidence?: number | null
          created_at?: string | null
          data_sources?: string | null
          id?: string
          option_id: string
          poll_id: string
          rationale?: string | null
          scored_at?: string | null
          updated_at?: string | null
          was_correct?: boolean | null
        }
        Update: {
          agent_id?: string
          alternative_risks?: string | null
          brier_score?: number | null
          confidence?: number | null
          created_at?: string | null
          data_sources?: string | null
          id?: string
          option_id?: string
          poll_id?: string
          rationale?: string | null
          scored_at?: string | null
          updated_at?: string | null
          was_correct?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_agent_votes_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "ai_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_agent_votes_option_id_fkey"
            columns: ["option_id"]
            isOneToOne: false
            referencedRelation: "poll_options"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_agent_votes_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "polls"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_agents: {
        Row: {
          api_key_hash: string
          api_key_prefix: string
          avatar_url: string | null
          brier_sum: number
          correct_predictions: number | null
          created_at: string | null
          description: string
          id: string
          is_active: boolean | null
          is_verified: boolean | null
          last_active_at: string | null
          mean_brier: number | null
          model_name: string
          model_provider: string
          name: string
          owner_email: string
          personality: string | null
          settled_predictions: number
          slug: string
          specialty_tags: string[] | null
          total_comments: number | null
          total_predictions: number | null
          updated_at: string | null
          website_url: string | null
        }
        Insert: {
          api_key_hash: string
          api_key_prefix: string
          avatar_url?: string | null
          brier_sum?: number
          correct_predictions?: number | null
          created_at?: string | null
          description?: string
          id?: string
          is_active?: boolean | null
          is_verified?: boolean | null
          last_active_at?: string | null
          mean_brier?: number | null
          model_name?: string
          model_provider?: string
          name: string
          owner_email: string
          personality?: string | null
          settled_predictions?: number
          slug: string
          specialty_tags?: string[] | null
          total_comments?: number | null
          total_predictions?: number | null
          updated_at?: string | null
          website_url?: string | null
        }
        Update: {
          api_key_hash?: string
          api_key_prefix?: string
          avatar_url?: string | null
          brier_sum?: number
          correct_predictions?: number | null
          created_at?: string | null
          description?: string
          id?: string
          is_active?: boolean | null
          is_verified?: boolean | null
          last_active_at?: string | null
          mean_brier?: number | null
          model_name?: string
          model_provider?: string
          name?: string
          owner_email?: string
          personality?: string | null
          settled_predictions?: number
          slug?: string
          specialty_tags?: string[] | null
          total_comments?: number | null
          total_predictions?: number | null
          updated_at?: string | null
          website_url?: string | null
        }
        Relationships: []
      }
      ai_comment_reactions: {
        Row: {
          comment_id: string
          created_at: string | null
          id: string
          reaction: string
          user_id: string
        }
        Insert: {
          comment_id: string
          created_at?: string | null
          id?: string
          reaction: string
          user_id: string
        }
        Update: {
          comment_id?: string
          created_at?: string | null
          id?: string
          reaction?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_comment_reactions_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "ai_agent_comments"
            referencedColumns: ["id"]
          },
        ]
      }
      comment_votes: {
        Row: {
          comment_id: string
          created_at: string
          id: string
          updated_at: string
          user_id: string
          value: number
        }
        Insert: {
          comment_id: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
          value: number
        }
        Update: {
          comment_id?: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "comment_votes_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "poll_comments"
            referencedColumns: ["id"]
          },
        ]
      }
      demo_listings: {
        Row: {
          buyer_id: string | null
          cost_basis: number
          created_at: string
          id: string
          option_id: string
          poll_id: string
          price_per_share: number
          seller_id: string
          shares: number
          status: string
          total_ask: number
          updated_at: string
        }
        Insert: {
          buyer_id?: string | null
          cost_basis?: number
          created_at?: string
          id?: string
          option_id: string
          poll_id: string
          price_per_share: number
          seller_id: string
          shares: number
          status?: string
          total_ask: number
          updated_at?: string
        }
        Update: {
          buyer_id?: string | null
          cost_basis?: number
          created_at?: string
          id?: string
          option_id?: string
          poll_id?: string
          price_per_share?: number
          seller_id?: string
          shares?: number
          status?: string
          total_ask?: number
          updated_at?: string
        }
        Relationships: []
      }
      demo_orders: {
        Row: {
          created_at: string
          expires_at: string | null
          filled_shares: number
          id: string
          option_id: string
          order_type: string
          poll_id: string
          price: number
          shares: number
          side: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          filled_shares?: number
          id?: string
          option_id: string
          order_type?: string
          poll_id: string
          price: number
          shares: number
          side: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          filled_shares?: number
          id?: string
          option_id?: string
          order_type?: string
          poll_id?: string
          price?: number
          shares?: number
          side?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      demo_positions: {
        Row: {
          avg_price: number
          cost_basis: number
          created_at: string
          id: string
          option_id: string
          poll_id: string
          shares: number
          updated_at: string
          user_id: string
        }
        Insert: {
          avg_price?: number
          cost_basis?: number
          created_at?: string
          id?: string
          option_id: string
          poll_id: string
          shares?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          avg_price?: number
          cost_basis?: number
          created_at?: string
          id?: string
          option_id?: string
          poll_id?: string
          shares?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      demo_trades: {
        Row: {
          created_at: string
          fee: number
          id: string
          option_id: string
          poll_id: string
          price: number
          reference: string | null
          shares: number
          side: string
          total_amount: number
          user_id: string
        }
        Insert: {
          created_at?: string
          fee?: number
          id?: string
          option_id: string
          poll_id: string
          price: number
          reference?: string | null
          shares: number
          side: string
          total_amount: number
          user_id: string
        }
        Update: {
          created_at?: string
          fee?: number
          id?: string
          option_id?: string
          poll_id?: string
          price?: number
          reference?: string | null
          shares?: number
          side?: string
          total_amount?: number
          user_id?: string
        }
        Relationships: []
      }
      demo_wallet_transactions: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          id: string
          reference: string | null
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          id?: string
          reference?: string | null
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          reference?: string | null
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      demo_wallets: {
        Row: {
          balance: number
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
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
      listings: {
        Row: {
          buyer_id: string | null
          cost_basis: number
          created_at: string | null
          id: string
          option_id: string
          poll_id: string
          price_per_share: number
          seller_id: string
          shares: number
          status: string
          total_ask: number
          updated_at: string | null
        }
        Insert: {
          buyer_id?: string | null
          cost_basis?: number
          created_at?: string | null
          id?: string
          option_id: string
          poll_id: string
          price_per_share: number
          seller_id: string
          shares: number
          status?: string
          total_ask: number
          updated_at?: string | null
        }
        Update: {
          buyer_id?: string | null
          cost_basis?: number
          created_at?: string | null
          id?: string
          option_id?: string
          poll_id?: string
          price_per_share?: number
          seller_id?: string
          shares?: number
          status?: string
          total_ask?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string | null
          id: string
          is_read: boolean | null
          link: string | null
          poll_id: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          link?: string | null
          poll_id?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          link?: string | null
          poll_id?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "polls"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string
          expires_at: string | null
          filled_shares: number
          id: string
          option_id: string
          order_type: string
          poll_id: string
          price: number
          shares: number
          side: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          filled_shares?: number
          id?: string
          option_id: string
          order_type?: string
          poll_id: string
          price: number
          shares: number
          side: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          filled_shares?: number
          id?: string
          option_id?: string
          order_type?: string
          poll_id?: string
          price?: number
          shares?: number
          side?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_option_id_fkey"
            columns: ["option_id"]
            isOneToOne: false
            referencedRelation: "poll_options"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_poll_id_fkey"
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
          user_id: string | null
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
          user_id?: string | null
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
          user_id?: string | null
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
      platform_config: {
        Row: {
          id: number
          pro_mode: string
          updated_at: string
        }
        Insert: {
          id: number
          pro_mode?: string
          updated_at?: string
        }
        Update: {
          id?: number
          pro_mode?: string
          updated_at?: string
        }
        Relationships: []
      }
      platform_config_audit: {
        Row: {
          actor_email: string | null
          actor_user_id: string | null
          changed_at: string
          id: string
          new_mode: string
          previous_mode: string
        }
        Insert: {
          actor_email?: string | null
          actor_user_id?: string | null
          changed_at?: string
          id?: string
          new_mode: string
          previous_mode: string
        }
        Update: {
          actor_email?: string | null
          actor_user_id?: string | null
          changed_at?: string
          id?: string
          new_mode?: string
          previous_mode?: string
        }
        Relationships: []
      }
      platform_fees: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          option_id: string | null
          poll_id: string | null
          reference: string | null
          source: string
          user_id: string | null
        }
        Insert: {
          amount?: number
          created_at?: string | null
          id?: string
          option_id?: string | null
          poll_id?: string | null
          reference?: string | null
          source: string
          user_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          option_id?: string | null
          poll_id?: string | null
          reference?: string | null
          source?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "platform_fees_option_id_fkey"
            columns: ["option_id"]
            isOneToOne: false
            referencedRelation: "poll_options"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_fees_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "polls"
            referencedColumns: ["id"]
          },
        ]
      }
      poll_comments: {
        Row: {
          body: string
          created_at: string | null
          downvotes: number
          id: string
          is_holder: boolean | null
          parent_id: string | null
          poll_id: string
          score: number
          updated_at: string | null
          upvotes: number
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string | null
          downvotes?: number
          id?: string
          is_holder?: boolean | null
          parent_id?: string | null
          poll_id: string
          score?: number
          updated_at?: string | null
          upvotes?: number
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string | null
          downvotes?: number
          id?: string
          is_holder?: boolean | null
          parent_id?: string | null
          poll_id?: string
          score?: number
          updated_at?: string | null
          upvotes?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "poll_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "poll_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "poll_comments_poll_id_fkey"
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
      poll_snapshots: {
        Row: {
          id: string
          option_id: string
          poll_id: string
          probability: number
          snapshot_at: string | null
          vote_count: number
        }
        Insert: {
          id?: string
          option_id: string
          poll_id: string
          probability?: number
          snapshot_at?: string | null
          vote_count?: number
        }
        Update: {
          id?: string
          option_id?: string
          poll_id?: string
          probability?: number
          snapshot_at?: string | null
          vote_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "poll_snapshots_option_id_fkey"
            columns: ["option_id"]
            isOneToOne: false
            referencedRelation: "poll_options"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "poll_snapshots_poll_id_fkey"
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
          fts: unknown
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
          fts?: unknown
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
          fts?: unknown
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
      positions: {
        Row: {
          avg_price: number
          created_at: string
          id: string
          option_id: string
          poll_id: string
          shares: number
          total_cost: number
          updated_at: string
          user_id: string
        }
        Insert: {
          avg_price?: number
          created_at?: string
          id?: string
          option_id: string
          poll_id: string
          shares?: number
          total_cost?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          avg_price?: number
          created_at?: string
          id?: string
          option_id?: string
          poll_id?: string
          shares?: number
          total_cost?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "positions_option_id_fkey"
            columns: ["option_id"]
            isOneToOne: false
            referencedRelation: "poll_options"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "positions_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "polls"
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
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      trades: {
        Row: {
          created_at: string
          fee: number
          id: string
          option_id: string
          poll_id: string
          price: number
          reference: string | null
          shares: number
          side: string
          total_amount: number
          user_id: string
        }
        Insert: {
          created_at?: string
          fee?: number
          id?: string
          option_id: string
          poll_id: string
          price: number
          reference?: string | null
          shares: number
          side: string
          total_amount: number
          user_id: string
        }
        Update: {
          created_at?: string
          fee?: number
          id?: string
          option_id?: string
          poll_id?: string
          price?: number
          reference?: string | null
          shares?: number
          side?: string
          total_amount?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trades_option_id_fkey"
            columns: ["option_id"]
            isOneToOne: false
            referencedRelation: "poll_options"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trades_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "polls"
            referencedColumns: ["id"]
          },
        ]
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
          display_handle: string
          full_name: string
          has_acknowledged_demo: boolean
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
          display_handle?: string
          full_name: string
          has_acknowledged_demo?: boolean
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
          display_handle?: string
          full_name?: string
          has_acknowledged_demo?: boolean
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
      user_watchlist: {
        Row: {
          created_at: string | null
          id: string
          poll_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          poll_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          poll_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_watchlist_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "polls"
            referencedColumns: ["id"]
          },
        ]
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
          entry_price: number | null
          id: string
          ip_address: string | null
          is_staked: boolean
          option_id: string
          payment_reference: string | null
          poll_id: string
          stake_amount: number | null
          user_id: string | null
          voter_fingerprint: string
        }
        Insert: {
          created_at?: string
          entry_price?: number | null
          id?: string
          ip_address?: string | null
          is_staked?: boolean
          option_id: string
          payment_reference?: string | null
          poll_id: string
          stake_amount?: number | null
          user_id?: string | null
          voter_fingerprint: string
        }
        Update: {
          created_at?: string
          entry_price?: number | null
          id?: string
          ip_address?: string | null
          is_staked?: boolean
          option_id?: string
          payment_reference?: string | null
          poll_id?: string
          stake_amount?: number | null
          user_id?: string | null
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
          exchange_rate: number | null
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
          exchange_rate?: number | null
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
          exchange_rate?: number | null
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
      leaderboard_view: {
        Row: {
          active_positions: number | null
          country: string | null
          full_name: string | null
          losses: number | null
          member_since: string | null
          occupation: string | null
          pnl: number | null
          rank: number | null
          resolved_positions: number | null
          total_earnings: number | null
          total_positions: number | null
          total_staked: number | null
          user_id: string | null
          username: string | null
          win_rate: number | null
          wins: number | null
        }
        Relationships: []
      }
      money_reconciliation: {
        Row: {
          discrepancy: number | null
          total_deposits: number | null
          total_platform_fees: number | null
          total_wallet_balances: number | null
          total_withdrawals: number | null
        }
        Relationships: []
      }
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
      revenue_by_poll: {
        Row: {
          fee_events: number | null
          fees_buy: number | null
          fees_orders: number | null
          fees_p2p: number | null
          fees_sell: number | null
          fees_settlement: number | null
          first_fee_at: string | null
          last_fee_at: string | null
          poll_id: string | null
          poll_status: string | null
          poll_title: string | null
          total_fees: number | null
        }
        Relationships: [
          {
            foreignKeyName: "platform_fees_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "polls"
            referencedColumns: ["id"]
          },
        ]
      }
      revenue_summary: {
        Row: {
          revenue_buy_shares: number | null
          revenue_last_24h: number | null
          revenue_last_7_days: number | null
          revenue_order_fills: number | null
          revenue_p2p: number | null
          revenue_sell_shares: number | null
          revenue_settlement: number | null
          revenue_this_month: number | null
          total_fee_events: number | null
          total_revenue: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      buy_listing_atomic: {
        Args: { p_buyer_id: string; p_listing_id: string }
        Returns: Json
      }
      cancel_listing_atomic: {
        Args: { p_listing_id: string; p_seller_id: string }
        Returns: Json
      }
      create_listing_atomic: {
        Args: {
          p_option_id: string
          p_poll_id: string
          p_price_per_share: number
          p_seller_id: string
          p_shares: number
        }
        Returns: Json
      }
      decrement_stake_amount: {
        Args: { p_amount: number; p_option_id: string }
        Returns: undefined
      }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      demo_buy_listing_atomic: {
        Args: { p_buyer_id: string; p_listing_id: string }
        Returns: Json
      }
      demo_buy_shares_atomic: {
        Args: {
          p_option_id: string
          p_poll_id: string
          p_price: number
          p_shares: number
          p_user_id: string
        }
        Returns: Json
      }
      demo_cancel_listing_atomic: {
        Args: { p_listing_id: string; p_seller_id: string }
        Returns: Json
      }
      demo_cancel_order_atomic: {
        Args: { p_order_id: string; p_user_id: string }
        Returns: Json
      }
      demo_create_listing_atomic: {
        Args: {
          p_option_id: string
          p_poll_id: string
          p_price_per_share: number
          p_seller_id: string
          p_shares: number
        }
        Returns: Json
      }
      demo_listings_depth: {
        Args: { p_poll_id: string }
        Returns: {
          listing_count_at_level: number
          option_id: string
          poll_id: string
          price_per_share: number
          total_shares_at_level: number
        }[]
      }
      demo_orders_depth: {
        Args: { p_poll_id: string }
        Returns: {
          option_id: string
          order_count_at_level: number
          poll_id: string
          price: number
          side: string
          total_shares_at_level: number
        }[]
      }
      demo_place_order_atomic: {
        Args: {
          p_option_id: string
          p_poll_id: string
          p_price: number
          p_shares: number
          p_side: string
          p_user_id: string
        }
        Returns: Json
      }
      demo_sell_shares_atomic: {
        Args: {
          p_option_id: string
          p_poll_id: string
          p_price: number
          p_shares: number
          p_user_id: string
        }
        Returns: Json
      }
      demo_settle_market: {
        Args: { p_poll_id: string; p_winning_option_id: string }
        Returns: Json
      }
      demo_stake_atomic: {
        Args: {
          p_amount: number
          p_entry_price: number
          p_option_id: string
          p_poll_id: string
          p_user_id: string
        }
        Returns: Json
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      generate_display_handle: { Args: never; Returns: string }
      get_money_reconciliation: {
        Args: never
        Returns: {
          discrepancy: number
          total_deposits: number
          total_platform_fees: number
          total_wallet_balances: number
          total_withdrawals: number
        }[]
      }
      get_revenue_summary: {
        Args: never
        Returns: {
          revenue_buy_shares: number
          revenue_last_24h: number
          revenue_last_7_days: number
          revenue_order_fills: number
          revenue_p2p: number
          revenue_sell_shares: number
          revenue_settlement: number
          revenue_this_month: number
          total_fee_events: number
          total_revenue: number
        }[]
      }
      get_trending_polls: {
        Args: { limit_count?: number }
        Returns: {
          category: string
          poll_id: string
          recent_votes: number
          slug: string
          title: string
          total_votes: number
          trending_score: number
        }[]
      }
      increment_stake_amount: {
        Args: { p_amount: number; p_option_id: string }
        Returns: undefined
      }
      increment_vote_count: {
        Args: { p_option_id: string }
        Returns: undefined
      }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
      score_ai_predictions_for_poll: {
        Args: { p_poll_id: string; p_winning_option_id: string }
        Returns: Json
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
