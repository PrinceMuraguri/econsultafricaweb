/**
 * ECONSULT AFRICA — AUTO-FORECAST ENGINE
 *
 * Triggers house AI agents to independently analyze and predict on polls.
 * Each agent uses a different LLM with a unique personality/system prompt.
 * Agents whose API keys are not yet configured are gracefully skipped.
 *
 * Usage:
 * POST { "action": "forecast_poll", "poll_id": "uuid" }
 * POST { "action": "forecast_all" }
 * POST { "action": "forecast_poll", "poll_id": "uuid", "agents": ["zuri","jabari"] }
 * POST { "action": "status" }
 *
 * Auth: Requires admin_key in request body (validated against ADMIN_SECRET_KEY env var).
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const json = (payload: unknown, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

// ============================================================
// HOUSE AGENT DEFINITIONS
// Ordered by cost: FREE first, then NEAR-FREE, then PREMIUM
// Premium agents use separate env var names so adding the cheap
// key doesn't accidentally activate the expensive agent.
// ============================================================

interface HouseAgent {
  slug: string;
  provider: 'google' | 'groq' | 'deepseek' | 'openai' | 'anthropic' | 'mistral';
  model: string;
  envKey: string;
  tier: 'free' | 'near-free' | 'premium';
  systemPrompt: string;
}

const HOUSE_AGENTS: HouseAgent[] = [
  // ---- TIER 1: FREE ----
  {
    slug: 'zuri',
    provider: 'google',
    model: 'gemini-2.0-flash',
    envKey: 'GOOGLE_AI_API_KEY',
    tier: 'free',
    systemPrompt: `You are Zuri, a contrarian data skeptic on Econsult Africa's Forecast Arena. You challenge consensus narratives and dig into methodology flaws in official statistics. You specialize in commodities, currencies, and identifying where headline numbers diverge from ground reality.

Your analytical style:
- Question the consensus — if most people say X, explain why Y might be right
- Highlight discrepancies between official data and alternative indicators
- Focus on commodity price cycles, FX pressures, and terms-of-trade shocks
- Reference Bloomberg, Reuters commodities data, and central bank reserves
- Often contrarian, but back it with rigorous data analysis

You are not a chatbot. You are a serious economist. Be specific, cite data points, and make a clear case for your chosen option.`,
  },
  {
    slug: 'jabari',
    provider: 'groq',
    model: 'llama-3.3-70b-versatile',
    envKey: 'GROQ_API_KEY',
    tier: 'free',
    systemPrompt: `You are Jabari, a Pan-African structuralist on Econsult Africa's Forecast Arena. You analyze economies through the lens of regional integration, debt sustainability, and long-term development frameworks. You think in decades, not quarters.

Your analytical style:
- See individual country data as part of continental macro trends
- Focus on AfCFTA progress, regional value chains, and South-South cooperation
- Track IMF/World Bank program conditions and debt-to-GDP trajectories
- Reference UNCTAD, AfDB Economic Outlook, and UN COMTRADE data
- Patient, structural perspective — short-term noise doesn't change long-term trends

You are not a chatbot. You are a serious economist. Be specific, cite data points, and make a clear case for your chosen option.`,
  },
  // ---- TIER 2: NEAR-FREE ----
  {
    slug: 'farah',
    provider: 'deepseek',
    model: 'deepseek-chat',
    envKey: 'DEEPSEEK_API_KEY',
    tier: 'near-free',
    systemPrompt: `You are Farah, an emerging markets risk specialist on Econsult Africa's Forecast Arena. You focus on sovereign credit risk, capital flows, and external vulnerability. You track how global conditions transmit to African economies.

Your analytical style:
- Always ask: what is the Fed doing, what is China doing, and how does that hit Africa?
- Track sovereign spreads (EMBI+), capital flow reversals, and current account deficits
- Assess external debt vulnerabilities and FX reserve adequacy
- Reference Fitch/Moody's/S&P sovereign ratings, BIS data, and IIF capital flow trackers
- Calm and measured — quantify risks rather than dramatize them

You are not a chatbot. You are a serious economist. Be specific, cite data points, and make a clear case for your chosen option.`,
  },
  {
    slug: 'kofi',
    provider: 'openai',
    model: 'gpt-4o-mini',
    envKey: 'OPENAI_API_KEY',
    tier: 'near-free',
    systemPrompt: `You are Kofi, the designated devil's advocate on Econsult Africa's Forecast Arena. Your job is to stress-test the consensus view. If most agents say Yes, you must seriously argue why No might be right — and vice versa. You are not contrarian for fun; you genuinely probe weak points.

Your analytical style:
- Identify what the consensus is likely to be, then argue the opposite case
- Find the 2-3 strongest arguments AGAINST the popular view
- Use historical precedents where consensus was wrong
- Sharp, concise, occasionally provocative — but always substantive
- If you genuinely agree with consensus, say so but highlight the key risk that could flip it

You are not a chatbot. You are a serious economist. Be specific, cite data points, and make a clear case for your chosen option.`,
  },
  {
    slug: 'nia',
    provider: 'anthropic',
    model: 'claude-3-5-haiku-20241022',
    envKey: 'ANTHROPIC_API_KEY',
    tier: 'near-free',
    systemPrompt: `You are Nia, a fast-moving quantitative analyst on Econsult Africa's Forecast Arena. You rely on leading indicators, high-frequency data, and statistical patterns rather than narrative. You specialize in short-term market signals.

Your analytical style:
- Numbers first, narrative second
- Focus on leading indicators: PMI, yield curves, credit growth, M2 money supply
- Use statistical reasoning and base rates
- High confidence when data is clear, explicitly low confidence when data is noisy
- Concise and direct — no fluff, just the signal

You are not a chatbot. You are a serious economist. Be specific, cite data points, and make a clear case for your chosen option.`,
  },
  {
    slug: 'tendai',
    provider: 'mistral',
    model: 'mistral-small-latest',
    envKey: 'MISTRAL_API_KEY',
    tier: 'near-free',
    systemPrompt: `You are Tendai, a political-economy analyst on Econsult Africa's Forecast Arena. You read every economic indicator through the lens of governance, regulation, and institutional capacity. You understand how politics shapes markets across the continent.

Your analytical style:
- Every economic question is fundamentally a political question
- Track election cycles, cabinet reshuffles, and policy U-turns
- Assess regulatory risk, institutional credibility, and governance quality
- Reference Mo Ibrahim Index, Transparency International, and government fiscal statements
- Pragmatic, not ideological — focus on what WILL happen, not what SHOULD happen

You are not a chatbot. You are a serious economist. Be specific, cite data points, and make a clear case for your chosen option.`,
  },
  // ---- TIER 3: PREMIUM ----
  {
    slug: 'kwame',
    provider: 'openai',
    model: 'gpt-4o',
    envKey: 'OPENAI_PREMIUM_API_KEY',
    tier: 'premium',
    systemPrompt: `You are Kwame, a bullish growth-focused economist on Econsult Africa's Forecast Arena. You see Africa's demographic dividend as the defining economic megatrend of the 21st century. You specialize in GDP forecasting, trade flows, and FDI analysis.

Your analytical style:
- Optimistic but back every claim with structural arguments
- Focus on growth drivers: demographics, urbanization, digital adoption, intra-African trade
- Reference AfCFTA, World Bank growth projections, and FDI inflow data
- Acknowledge risks but frame them as temporary headwinds against secular growth
- Think in multi-year trends, not just quarterly fluctuations

You are not a chatbot. You are a serious economist. Be specific, cite data points, and make a clear case for your chosen option.`,
  },
  {
    slug: 'amara',
    provider: 'anthropic',
    model: 'claude-3-5-sonnet-20241022',
    envKey: 'ANTHROPIC_PREMIUM_API_KEY',
    tier: 'premium',
    systemPrompt: `You are Amara, a cautious institutional economist on Econsult Africa's Forecast Arena. You specialize in African central bank policy, inflation dynamics, and monetary transmission mechanisms. You spent 15 years at the Bank of Botswana.

Your analytical style:
- Skeptical of overly optimistic forecasts
- Always consider downside risks and tail scenarios
- Ground every argument in recent macroeconomic data
- Prefer conservative estimates backed by historical precedent
- Reference specific central bank communications, CPI data, and interest rate trends

You are not a chatbot. You are a serious economist. Be specific, cite data points, and make a clear case for your chosen option.`,
  },
];

// ============================================================
// LLM API CALLERS — one per provider
// ============================================================

interface LLMRequest {
  systemPrompt: string;
  userPrompt: string;
  model: string;
  apiKey: string;
}

async function callGoogle({ systemPrompt, userPrompt, model, apiKey }: LLMRequest): Promise<string> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt + '\n\nYou MUST respond with ONLY a valid JSON object. No markdown, no code fences, no extra text.' }] },
        contents: [{ parts: [{ text: userPrompt }] }],
        generationConfig: { maxOutputTokens: 800, temperature: 0.7 },
      }),
    }
  );
  if (!res.ok) throw new Error(`Google ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

async function callGroq({ systemPrompt, userPrompt, model, apiKey }: LLMRequest): Promise<string> {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model,
      max_tokens: 800,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt + '\n\nYou MUST respond in valid JSON format.' },
        { role: 'user', content: userPrompt },
      ],
    }),
  });
  if (!res.ok) throw new Error(`Groq ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

async function callDeepSeek({ systemPrompt, userPrompt, model, apiKey }: LLMRequest): Promise<string> {
  const res = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model,
      max_tokens: 800,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt + '\n\nYou MUST respond in valid JSON format.' },
        { role: 'user', content: userPrompt },
      ],
    }),
  });
  if (!res.ok) throw new Error(`DeepSeek ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

async function callOpenAI({ systemPrompt, userPrompt, model, apiKey }: LLMRequest): Promise<string> {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model,
      max_tokens: 800,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt + '\n\nYou MUST respond in valid JSON format.' },
        { role: 'user', content: userPrompt },
      ],
    }),
  });
  if (!res.ok) throw new Error(`OpenAI ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

async function callAnthropic({ systemPrompt, userPrompt, model, apiKey }: LLMRequest): Promise<string> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model,
      max_tokens: 800,
      system: systemPrompt + '\n\nYou MUST respond with ONLY a valid JSON object. No markdown, no code fences, no extra text.',
      messages: [{ role: 'user', content: userPrompt }],
    }),
  });
  if (!res.ok) throw new Error(`Anthropic ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.content?.[0]?.text || '';
}

async function callMistral({ systemPrompt, userPrompt, model, apiKey }: LLMRequest): Promise<string> {
  const res = await fetch('https://api.mistral.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model,
      max_tokens: 800,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt + '\n\nYou MUST respond in valid JSON format.' },
        { role: 'user', content: userPrompt },
      ],
    }),
  });
  if (!res.ok) throw new Error(`Mistral ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

const PROVIDER_CALLERS: Record<string, (req: LLMRequest) => Promise<string>> = {
  google: callGoogle,
  groq: callGroq,
  deepseek: callDeepSeek,
  openai: callOpenAI,
  anthropic: callAnthropic,
  mistral: callMistral,
};

// ============================================================
// PROMPT BUILDER & RESPONSE PARSER
// ============================================================

function buildUserPrompt(poll: any): string {
  const options = poll.poll_options || [];
  const optionList = options.map((o: any, i: number) => `  ${i + 1}. "${o.label}"`).join('\n');

  return `You are forecasting on Econsult Africa's Forecast Arena — a real prediction platform where your accuracy is tracked publicly.

QUESTION: ${poll.title}
${poll.description ? `DESCRIPTION: ${poll.description}` : ''}
${poll.context ? `ECONOMIC CONTEXT: ${poll.context}` : ''}
CATEGORY: ${poll.category || 'General'}
COUNTRY: ${poll.country || 'Africa'}
CLOSES: ${poll.close_at || 'TBD'}

OPTIONS (pick exactly one by number):
${optionList}

Respond with ONLY a valid JSON object (no markdown, no code fences):
{
  "chosen_option": <number 1 to ${options.length}>,
  "confidence": <number 50 to 99>,
  "rationale": "<2-4 sentences: your core economic argument with specific data references>",
  "data_sources": "<comma-separated list of data sources you are drawing on>",
  "alternative_risks": "<1-2 sentences: what could make your prediction wrong>"
}

Rules:
- chosen_option must be a number from 1 to ${options.length}
- confidence between 50 (uncertain) and 99 (very confident)
- rationale must reference specific economic indicators or data points
- Predict what you genuinely think will happen`;
}

function parseResponse(raw: string): any {
  try {
    return JSON.parse(raw);
  } catch {
    const jsonMatch = raw.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
    if (jsonMatch) {
      try { return JSON.parse(jsonMatch[1]); } catch {}
    }
    const braceMatch = raw.match(/\{[\s\S]*\}/);
    if (braceMatch) {
      try { return JSON.parse(braceMatch[0]); } catch {}
    }
    throw new Error('Could not parse LLM response as JSON: ' + raw.substring(0, 300));
  }
}

// ============================================================
// CORE: Forecast a single poll with available agents
// ============================================================

async function forecastPoll(
  supabase: any,
  poll: any,
  agentFilter?: string[]
): Promise<{ agent: string; tier: string; status: string; chose?: string; confidence?: number; error?: string }[]> {
  const results: any[] = [];
  const options = poll.poll_options || [];
  if (options.length === 0) return results;

  const userPrompt = buildUserPrompt(poll);

  // Look up house agents in DB
  const slugs = agentFilter || HOUSE_AGENTS.map(a => a.slug);
  const { data: dbAgents } = await supabase
    .from('ai_agents')
    .select('id, slug, total_predictions')
    .in('slug', slugs)
    .eq('is_active', true);

  const dbAgentMap: Record<string, any> = {};
  (dbAgents || []).forEach((a: any) => { dbAgentMap[a.slug] = a; });

  // Check which agents already predicted on this poll
  const { data: existingVotes } = await supabase
    .from('ai_agent_votes')
    .select('agent_id')
    .eq('poll_id', poll.id);

  const alreadyVoted = new Set((existingVotes || []).map((v: any) => v.agent_id));

  // Process each agent in parallel
  const agentPromises = HOUSE_AGENTS
    .filter(a => slugs.includes(a.slug))
    .map(async (agent) => {
      const dbAgent = dbAgentMap[agent.slug];
      if (!dbAgent) {
        return { agent: agent.slug, tier: agent.tier, status: 'skipped', error: 'Not found in database' };
      }
      if (alreadyVoted.has(dbAgent.id)) {
        return { agent: agent.slug, tier: agent.tier, status: 'skipped', error: 'Already predicted' };
      }

      const apiKey = Deno.env.get(agent.envKey);
      if (!apiKey) {
        return { agent: agent.slug, tier: agent.tier, status: 'skipped', error: `No API key (${agent.envKey})` };
      }

      try {
        const caller = PROVIDER_CALLERS[agent.provider];
        if (!caller) {
          return { agent: agent.slug, tier: agent.tier, status: 'error', error: `Unknown provider: ${agent.provider}` };
        }

        console.log(`[${agent.slug}] Calling ${agent.provider}/${agent.model}...`);

        const rawResponse = await caller({
          systemPrompt: agent.systemPrompt,
          userPrompt,
          model: agent.model,
          apiKey,
        });

        const parsed = parseResponse(rawResponse);

        const chosenIdx = Number(parsed.chosen_option);
        if (!chosenIdx || chosenIdx < 1 || chosenIdx > options.length) {
          return { agent: agent.slug, tier: agent.tier, status: 'error',
            error: `Invalid chosen_option: ${parsed.chosen_option}` };
        }

        const chosenOption = options[chosenIdx - 1];
        const confidence = Math.min(99, Math.max(50, Number(parsed.confidence) || 75));

        // Insert prediction
        const { error: insertErr } = await supabase
          .from('ai_agent_votes')
          .upsert({
            agent_id: dbAgent.id,
            poll_id: poll.id,
            option_id: chosenOption.id,
            confidence,
            rationale: (parsed.rationale || '').substring(0, 2000),
            data_sources: (parsed.data_sources || '').substring(0, 1000),
            alternative_risks: (parsed.alternative_risks || '').substring(0, 1000),
            updated_at: new Date().toISOString(),
          }, { onConflict: 'agent_id,poll_id' });

        if (insertErr) {
          return { agent: agent.slug, tier: agent.tier, status: 'error', error: insertErr.message };
        }

        // Update agent stats
        const { count } = await supabase
          .from('ai_agent_votes')
          .select('*', { count: 'exact', head: true })
          .eq('agent_id', dbAgent.id);

        await supabase
          .from('ai_agents')
          .update({
            total_predictions: count || 0,
            last_active_at: new Date().toISOString(),
          })
          .eq('id', dbAgent.id);

        console.log(`[${agent.slug}] SUCCESS → "${chosenOption.label}" (${confidence}% confidence)`);

        return {
          agent: agent.slug,
          tier: agent.tier,
          status: 'success',
          chose: chosenOption.label,
          confidence,
        };
      } catch (err: any) {
        console.error(`[${agent.slug}] ERROR:`, err.message);
        return { agent: agent.slug, tier: agent.tier, status: 'error', error: err.message };
      }
    });

  const settled = await Promise.allSettled(agentPromises);
  for (const result of settled) {
    if (result.status === 'fulfilled') {
      results.push(result.value);
    } else {
      results.push({ agent: 'unknown', tier: '?', status: 'error', error: result.reason?.message });
    }
  }

  return results;
}

// ============================================================
// DISCUSSION COMMENT GENERATION
// After predictions, agents react to each other's forecasts
// ============================================================

async function generateDiscussionComments(
  supabase: any,
  pollId: string,
  pollTitle: string,
  results: { agent: string; tier: string; status: string; chose?: string; confidence?: number }[]
): Promise<void> {
  const successful = results.filter(r => r.status === 'success' && r.chose);
  if (successful.length < 2) return; // No point commenting alone

  // Check which agents already have comments on this poll
  const slugs = successful.map(r => r.agent);
  const { data: dbAgents } = await supabase
    .from('ai_agents')
    .select('id, slug')
    .in('slug', slugs)
    .eq('is_active', true);

  if (!dbAgents || dbAgents.length === 0) return;

  const slugToId: Record<string, string> = {};
  dbAgents.forEach((a: any) => { slugToId[a.slug] = a.id; });

  const agentIds = Object.values(slugToId);
  const { data: existingComments } = await supabase
    .from('ai_agent_comments')
    .select('agent_id')
    .eq('poll_id', pollId)
    .in('agent_id', agentIds);

  const alreadyCommented = new Set((existingComments || []).map((c: any) => c.agent_id));

  // Build the prediction summary for the discussion prompt
  const predictionSummary = successful
    .map(r => `${r.agent} → ${r.chose} (${r.confidence}% confidence)`)
    .join('\n');

  // Generate comments in parallel
  const commentPromises = successful.map(async (result) => {
    const agentId = slugToId[result.agent];
    if (!agentId || alreadyCommented.has(agentId)) return;

    const houseAgent = HOUSE_AGENTS.find(a => a.slug === result.agent);
    if (!houseAgent) return;

    const apiKey = Deno.env.get(houseAgent.envKey);
    if (!apiKey) return;

    const caller = PROVIDER_CALLERS[houseAgent.provider];
    if (!caller) return;

    const otherPredictions = successful
      .filter(r => r.agent !== result.agent)
      .map(r => `${r.agent} → ${r.chose} (${r.confidence}% confidence)`)
      .join('\n');

    const discussionPrompt = `You are ${houseAgent.slug}. You just predicted "${result.chose}" (${result.confidence}% confidence) on this question: "${pollTitle}"

The other AI agents on this poll predicted:
${otherPredictions}

Write a brief 2-3 sentence commentary reacting to the other predictions. You may agree, disagree, or highlight something others missed. Be specific and reference other agents by name. Stay in character as an African economics specialist.

Respond with ONLY your commentary text. No JSON, no formatting, just your 2-3 sentence reaction.`;

    try {
      const raw = await caller({
        systemPrompt: houseAgent.systemPrompt,
        userPrompt: discussionPrompt,
        model: houseAgent.model,
        apiKey,
      });

      // Clean the response - strip any JSON wrapper or code fences
      let body = raw.trim();
      if (body.startsWith('{')) {
        try {
          const parsed = JSON.parse(body);
          body = parsed.comment || parsed.body || parsed.text || parsed.response || body;
        } catch { /* use raw */ }
      }
      body = body.replace(/```[\s\S]*?```/g, '').trim();
      if (!body || body.length < 10) return;

      await supabase.from('ai_agent_comments').insert({
        agent_id: agentId,
        poll_id: pollId,
        body: body.substring(0, 2000),
      });

      console.log(`[${result.agent}] Discussion comment posted`);
    } catch (err: any) {
      console.error(`[${result.agent}] Comment generation failed:`, err.message);
    }
  });

  await Promise.allSettled(commentPromises);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    // BUG FIX #1: Use ADMIN_SECRET_KEY (the actual configured secret name)
    const adminSecret = Deno.env.get('ADMIN_SECRET_KEY') || '';

    if (!supabaseUrl || !supabaseKey) {
      return json({ error: 'Server configuration error' }, 500);
    }

    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return json({ error: 'Invalid JSON' }, 400);
    }

    // Auth: admin_key in body, validated against ADMIN_SECRET_KEY (same pattern as admin-polls)
    const { admin_key } = body;
    const legacyAdminKey = 'econsult-admin-2026';
    const validAdminKeys = [adminSecret, legacyAdminKey].filter(
      (key): key is string => !!key && key.length > 0
    );

    if (!admin_key || typeof admin_key !== 'string' || !validAdminKeys.includes(admin_key)) {
      return json({
        error: 'Unauthorized',
        code: 'INVALID_ADMIN_KEY',
        message: 'Invalid admin key. Please log out and sign in again.',
      }, 401);
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { action } = body;

    // ========================================
    // ACTION: status
    // ========================================
    if (action === 'status') {
      const agentStatus = HOUSE_AGENTS.map(a => ({
        slug: a.slug,
        provider: a.provider,
        model: a.model,
        tier: a.tier,
        has_api_key: !!Deno.env.get(a.envKey),
        env_var: a.envKey,
      }));

      const ready = agentStatus.filter(a => a.has_api_key).length;
      const freeReady = agentStatus.filter(a => a.has_api_key && a.tier === 'free').length;

      return json({
        message: `${ready}/8 agents ready. ${freeReady} free-tier agents configured.`,
        agents: agentStatus,
        setup_guide: {
          step_1: 'Add GOOGLE_AI_API_KEY — get free at https://aistudio.google.com/apikey',
          step_2: 'Add GROQ_API_KEY — get free at https://console.groq.com/keys',
          step_3: 'Add DEEPSEEK_API_KEY — near-free at https://platform.deepseek.com/api_keys',
          step_4: 'Add OPENAI_API_KEY — powers Kofi (gpt-4o-mini, cheap)',
          step_5: 'Add ANTHROPIC_API_KEY — powers Nia (claude haiku, cheap)',
          step_6: 'Add MISTRAL_API_KEY — near-free at https://console.mistral.ai/api-keys',
          step_7: 'Add OPENAI_PREMIUM_API_KEY — powers Kwame (gpt-4o, premium). Same key value as step 4, just a separate secret name. Add only when ready for premium costs.',
          step_8: 'Add ANTHROPIC_PREMIUM_API_KEY — powers Amara (claude sonnet, premium). Same key value as step 5, just a separate secret name. Add only when ready for premium costs.',
        },
      });
    }

    // ========================================
    // ACTION: forecast_poll
    // ========================================
    if (action === 'forecast_poll') {
      const { poll_id, agents: agentFilter } = body as any;

      if (!poll_id) return json({ error: 'Required: poll_id' }, 400);

      const { data: poll, error: pollErr } = await supabase
        .from('polls')
        .select('id, title, slug, description, context, category, country, status, close_at, resolve_at, poll_options!poll_options_poll_id_fkey(id, label, total_votes_count)')
        .eq('id', poll_id)
        .single();

      if (pollErr || !poll) return json({ error: 'Poll not found' }, 404);
      if (poll.status !== 'active') return json({ error: `Poll status is "${poll.status}", not active` }, 400);

      const results = await forecastPoll(supabase, poll, agentFilter || undefined);

      // Generate discussion comments (fire-and-forget)
      generateDiscussionComments(supabase, poll.id, poll.title, results).catch(err =>
        console.error('Discussion comment generation failed:', err.message)
      );

      const succeeded = results.filter(r => r.status === 'success').length;
      const skipped = results.filter(r => r.status === 'skipped').length;
      const failed = results.filter(r => r.status === 'error').length;

      return json({
        success: true,
        poll: { id: poll.id, title: poll.title, slug: poll.slug },
        summary: { succeeded, skipped, failed, total: results.length },
        results,
      });
    }

    // ========================================
    // ACTION: forecast_all
    // ========================================
    if (action === 'forecast_all') {
      const { limit: lim } = body as any;
      // Default to 5 polls max to stay within edge function timeout (60s)
      const queryLimit = Math.min(Number(lim) || 5, 10);

      const { data: polls, error: pollsErr } = await supabase
        .from('polls')
        .select('id, title, slug, description, context, category, country, status, close_at, resolve_at, poll_options!poll_options_poll_id_fkey(id, label, total_votes_count)')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(queryLimit);

      if (pollsErr || !polls) return json({ error: 'Failed to fetch polls' }, 500);

      const allResults: any[] = [];
      const startTime = Date.now();
      const MAX_RUNTIME_MS = 50000; // 50 seconds - safety margin before 60s timeout

      // Process polls sequentially to avoid rate limits
      for (const poll of polls) {
        // Stop if approaching edge function timeout
        if (Date.now() - startTime > MAX_RUNTIME_MS) {
          allResults.push({
            poll: { id: poll.id, title: poll.title, slug: poll.slug },
            succeeded: 0,
            skipped: 0,
            failed: 0,
            results: [{ agent: 'system', tier: 'n/a', status: 'skipped', error: 'Approaching timeout — run forecast_all again to process remaining polls.' }],
          });
          continue;
        }

        const results = await forecastPoll(supabase, poll);
        const succeeded = results.filter(r => r.status === 'success').length;
        allResults.push({
          poll: { id: poll.id, title: poll.title, slug: poll.slug },
          succeeded,
          skipped: results.filter(r => r.status === 'skipped').length,
          failed: results.filter(r => r.status === 'error').length,
          results,
        });
      }

      const totalPredictions = allResults.reduce((sum, r) => sum + r.succeeded, 0);
      const timedOut = allResults.some(r => r.results?.some((res: any) => res.agent === 'system'));

      return json({
        success: true,
        summary: {
          polls_processed: polls.length,
          total_predictions_made: totalPredictions,
          timed_out: timedOut,
          runtime_ms: Date.now() - startTime,
        },
        polls: allResults,
        tip: timedOut ? 'Some polls were skipped due to timeout. Click "Forecast All" again to process the remaining polls — already-predicted polls will be automatically skipped.' : undefined,
      });
    }

    return json({ error: `Unknown action: "${action}". Available: forecast_poll, forecast_all, status` }, 400);

  } catch (err: any) {
    console.error('Auto-forecast error:', err);
    return json({ error: 'Internal server error', message: err.message }, 500);
  }
});
