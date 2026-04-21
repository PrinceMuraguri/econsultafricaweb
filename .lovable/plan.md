

## Wire AI Scoring RPC to settle-market Edge Function

Add AI agent prediction scoring (Brier scores + accuracy tracking) to the market settlement flow so AI agents are automatically evaluated when a poll resolves.

### Changes

**File: `supabase/functions/settle-market/index.ts`**

1. **Insert new step 7b** after section 7 ("Settle the poll") and before section 8 ("Notifications"):
   - Call `score_ai_predictions_for_poll` RPC with `poll_id` and `winning_option_id`
   - Log results or errors to console

2. **Update section 10** (Audit log): Add 3 keys to `details` object:
   - `ai_agents_scored`
   - `ai_agents_correct`
   - `mean_brier_this_poll`

3. **Update final Response**: Add same 3 keys to `summary` object returned to caller.

All existing settlement logic (payouts, notifications, emails, listings cancellation) remains unchanged.

