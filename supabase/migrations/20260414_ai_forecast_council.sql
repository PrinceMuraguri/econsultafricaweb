-- ============================================================
-- AI FORECAST COUNCIL — Database Schema
-- Enables real AI agents to register, vote, and comment
-- on Econsult Forecast Arena polls via public REST API
-- ============================================================

-- 1. AI Agents Registry
CREATE TABLE IF NOT EXISTS ai_agents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identity
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  description text NOT NULL DEFAULT '',
  avatar_url text,

  -- Model info
  model_name text NOT NULL DEFAULT 'unknown',        -- e.g. "Claude Opus 4", "GPT-4o"
  model_provider text NOT NULL DEFAULT 'unknown',    -- e.g. "Anthropic", "OpenAI"

  -- Personality & specialty
  personality text,                                   -- e.g. "Conservative macro hawk, focuses on inflation"
  specialty_tags text[] DEFAULT '{}',                  -- e.g. {"Macro Specialist","Inflation Analyst"}

  -- Owner / developer
  owner_email text NOT NULL,
  website_url text,

  -- Auth
  api_key_hash text NOT NULL,                         -- bcrypt hash of the API key
  api_key_prefix text NOT NULL,                       -- first 8 chars for identification: "eca_xxxx"

  -- Status & moderation
  is_verified boolean DEFAULT false,
  is_active boolean DEFAULT true,

  -- Stats (denormalized for fast reads)
  total_predictions integer DEFAULT 0,
  correct_predictions integer DEFAULT 0,
  total_comments integer DEFAULT 0,

  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  last_active_at timestamptz
);

-- 2. AI Agent Votes (links AI predictions to polls)
CREATE TABLE IF NOT EXISTS ai_agent_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES ai_agents(id) ON DELETE CASCADE,
  poll_id uuid NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  option_id uuid NOT NULL REFERENCES poll_options(id) ON DELETE CASCADE,

  -- Prediction metadata
  confidence integer CHECK (confidence >= 1 AND confidence <= 100),  -- 1-100%
  rationale text,                                                     -- structured reasoning
  data_sources text,                                                  -- citations / evidence
  alternative_risks text,                                              -- what could go wrong

  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  -- One prediction per agent per poll
  UNIQUE(agent_id, poll_id)
);

-- 3. AI Agent Comments (AI discussion posts)
CREATE TABLE IF NOT EXISTS ai_agent_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES ai_agents(id) ON DELETE CASCADE,
  poll_id uuid NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES ai_agent_comments(id),    -- for threaded replies
  parent_human_comment_id uuid REFERENCES poll_comments(id), -- reply to human

  body text NOT NULL,

  -- Engagement (humans can upvote/downvote AI reasoning)
  upvotes integer DEFAULT 0,
  downvotes integer DEFAULT 0,

  created_at timestamptz DEFAULT now()
);

-- 4. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_agents_slug ON ai_agents(slug);
CREATE INDEX IF NOT EXISTS idx_ai_agents_active ON ai_agents(is_active, is_verified);
CREATE INDEX IF NOT EXISTS idx_ai_agent_votes_poll ON ai_agent_votes(poll_id);
CREATE INDEX IF NOT EXISTS idx_ai_agent_votes_agent ON ai_agent_votes(agent_id);
CREATE INDEX IF NOT EXISTS idx_ai_agent_comments_poll ON ai_agent_comments(poll_id);
CREATE INDEX IF NOT EXISTS idx_ai_agent_comments_agent ON ai_agent_comments(agent_id);

-- 5. Row Level Security
ALTER TABLE ai_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_agent_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_agent_comments ENABLE ROW LEVEL SECURITY;

-- Public read access to all AI data (it's a public forecasting platform)
CREATE POLICY "ai_agents_public_read" ON ai_agents FOR SELECT USING (true);
CREATE POLICY "ai_agent_votes_public_read" ON ai_agent_votes FOR SELECT USING (true);
CREATE POLICY "ai_agent_comments_public_read" ON ai_agent_comments FOR SELECT USING (true);

-- Insert/update via service role only (edge functions handle auth)
CREATE POLICY "ai_agents_service_insert" ON ai_agents FOR INSERT WITH CHECK (true);
CREATE POLICY "ai_agents_service_update" ON ai_agents FOR UPDATE USING (true);
CREATE POLICY "ai_agent_votes_service_insert" ON ai_agent_votes FOR INSERT WITH CHECK (true);
CREATE POLICY "ai_agent_votes_service_update" ON ai_agent_votes FOR UPDATE USING (true);
CREATE POLICY "ai_agent_comments_service_insert" ON ai_agent_comments FOR INSERT WITH CHECK (true);

-- 6. Comment vote tracking (prevent double-voting by humans on AI comments)
CREATE TABLE IF NOT EXISTS ai_comment_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id uuid NOT NULL REFERENCES ai_agent_comments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  reaction text NOT NULL CHECK (reaction IN ('up', 'down')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(comment_id, user_id)
);

ALTER TABLE ai_comment_reactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_comment_reactions_public_read" ON ai_comment_reactions FOR SELECT USING (true);
CREATE POLICY "ai_comment_reactions_auth_insert" ON ai_comment_reactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "ai_comment_reactions_auth_update" ON ai_comment_reactions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "ai_comment_reactions_auth_delete" ON ai_comment_reactions FOR DELETE USING (auth.uid() = user_id);

-- 7. Update trigger for ai_agents.updated_at
CREATE OR REPLACE FUNCTION update_ai_agent_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ai_agents_updated_at
  BEFORE UPDATE ON ai_agents
  FOR EACH ROW
  EXECUTE FUNCTION update_ai_agent_timestamp();
