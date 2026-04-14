

# Plan: Create and Deploy the `auto-forecast` Edge Function

## Summary
Create a new edge function that triggers house AI agents to forecast on polls using real LLM APIs. The prompt provides ~750 lines of code. I found **4 bugs** that need fixing before deployment.

## Bugs Found in the Prompt Code

### Bug 1 — CRITICAL: Wrong env var name for admin secret
The code uses `Deno.env.get('ADMIN_SECRET')` but every other function in this project uses `ADMIN_SECRET_KEY` (which is the actual configured secret name). Without this fix, admin auth via body `admin_secret` will never work.

**Fix:** Change `'ADMIN_SECRET'` to `'ADMIN_SECRET_KEY'`.

### Bug 2 — CRITICAL: Syntax error in auth check (Word doc corruption)
Line 807 in the parsed doc reads:
```
(adminSecret !== '' & !== '' && providedKey === adminSecret)
```
The `& !==` is garbled. This should be:
```
(adminSecret !== '' && providedKey === adminSecret)
```
This would cause the entire function to fail with a syntax error on every request.

### Bug 3 — Missing `supabase/config.toml` entry
Same issue as Prompt 1: `auto-forecast` needs `verify_jwt = false` in `config.toml`. The function does its own auth via service_role key / admin secret, so Supabase's default JWT gate must be disabled.

### Bug 4 — Closing brace mismatch in `map()` callback
The agent processing callback (the `.map(async (agent) => { ... })`) ends with `});` but there's a missing closing brace for the `try` block's catch. The parsed code shows:
```
} catch (err: any) {
  ...
  return { ... };
});  // <-- closes map callback but catch has no closing brace
```
**Fix:** Ensure the catch block returns properly and the braces match.

## What's Correct in the Prompt
- Agent definitions, system prompts, and provider-model mappings all match the `ai_agents` table
- The `upsert` with `onConflict: 'agent_id,poll_id'` matches the existing unique constraint
- The `poll_options!poll_options_poll_id_fkey` join syntax matches the actual foreign key name
- Provider API endpoints and request formats are correct
- The 50-second timeout safety for `forecast_all` is sensible
- RLS policies on `ai_agent_votes` and `ai_agents` already allow public inserts/updates (the service_role client bypasses RLS anyway)

## Changes

### 1. Create `supabase/functions/auto-forecast/index.ts`
Use the prompt's code with the 4 bug fixes applied. No `deno.json` file.

### 2. Update `supabase/config.toml`
Add:
```toml
[functions.auto-forecast]
  verify_jwt = false
```

### 3. Deploy and verify
- Deploy the function
- Call `{ "action": "status" }` to confirm it boots and reports agent readiness
- No API keys need to be added yet (the function gracefully skips agents with missing keys)

## Technical Notes
- The function uses `SUPABASE_SERVICE_ROLE_KEY` (auto-available) to write to `ai_agent_votes` and `ai_agents`
- LLM API keys (`GOOGLE_AI_API_KEY`, `GROQ_API_KEY`, etc.) will need to be added as secrets later for agents to actually make predictions
- No database migrations needed
- No frontend changes needed

