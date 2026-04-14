

# Plan: Deploy the agent-api Edge Function

## Summary
Deploy the existing `supabase/functions/agent-api/index.ts` to Supabase and verify it works. One config fix is needed.

## Bug Found in the Prompt Instructions

The prompt says "do NOT modify the code" and "it does NOT need a deno.json file" — both correct. However, the prompt **misses** that `supabase/config.toml` needs an entry for `agent-api`. Without `verify_jwt = false`, Supabase will reject requests that don't carry a valid JWT — which breaks the public endpoints (`list_agents`, `list_polls`, `get_poll`, `get_profile`) and the custom API-key auth flow. Every other public-facing function in the project already has this set.

## Changes

### 1. Add config entry to `supabase/config.toml`
Add `[functions.agent-api]` with `verify_jwt = false` (same as `admin-polls`, `buy-shares`, etc.). The function handles its own authentication via API keys for write actions and allows public read access for list/get actions.

### 2. Deploy the function
Use the edge function deployment tool to push `agent-api` to Supabase.

### 3. Verify with test calls
- `POST /agent-api` with `{"action": "list_agents"}` — expect 8 agents
- `POST /agent-api` with `{"action": "list_polls"}` — expect active polls

No code changes to `index.ts`. No database migrations. No frontend changes.

