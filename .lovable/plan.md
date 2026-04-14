

# Plan: AI Council Layout + Comments + AI Voting Display

## Summary
Three enhancements: (1) vertical grid layout for agent cards, (2) AI Discussion section with backend comment generation, (3) "What AI Thinks" voting bars on PollCard.

## Changes

### 1. Vertical Layout — `src/components/forecast/AIForecastCouncil.tsx`
- Replace `flex gap-3 overflow-x-auto` container (line 328) with `grid grid-cols-1 md:grid-cols-2 gap-3`
- Remove `min-w-[280px] max-w-[340px] shrink-0` from AgentPredictionCard (line 70), make cards full-width
- Update loading skeleton to match grid layout

### 2. AI Discussion Section — `src/components/forecast/AIForecastCouncil.tsx`
- Import `useAIComments` from the existing hook (already defined in `use-ai-council.ts`)
- Add a discussion section below the prediction cards grid, only shown when `predictions.length > 0`
- Render comments as chat-style bubbles: agent avatar + name on left, body as speech bubble, timestamp + vote counts below
- Empty state: "AI agents haven't discussed this question yet."
- Import `useQuery` and `supabase` directly for the inline query approach (or reuse `useAIComments` — it already exists and fetches agent details)

### 3. Backend: Comment Generation — `supabase/functions/auto-forecast/index.ts`
- After `forecastPoll` completes and returns results, add a new `generateDiscussionComments` function
- This runs only when 2+ agents successfully predicted on the poll
- For each successful agent, call their LLM with a discussion prompt listing what other agents predicted
- System prompt: agent's existing personality + "React to other predictions in 2-3 sentences"
- Insert into `ai_agent_comments` table (agent_id, poll_id, body)
- Skip if agent already has a comment on this poll
- Called at the end of `forecast_poll` and inside the `forecast_all` loop (after each poll)
- Uses the same `PROVIDER_CALLERS` infrastructure — no new code needed for LLM calls
- Comment generation is fire-and-forget (errors logged but don't block the response)
- The response format for comments is plain text, not JSON — simpler prompt

### 4. "What AI Thinks" Display — `src/components/forecast/PollCard.tsx`
- Import `useAIPredictions` from `use-ai-council.ts`
- After the "What Others Think" section (line 451), add a new section: "What AI Thinks"
- Show Bot icon + count of AI predictions
- Render the same bar chart style but with purple/accent-toned bars
- Each option: label, agent count, percentage bar
- Small note: "Independent AI predictions from verified models"
- Only render when AI predictions exist (length > 0)
- Placed below "What Others Think" with a subtle divider

## Technical Notes
- No database migrations needed — `ai_agent_comments` table already exists with correct schema
- `useAIComments` hook already exists in `use-ai-council.ts` with the right query
- Comment generation adds ~2-5s per agent per poll to the forecast runtime — within the 50s safety margin for `forecast_all`
- The `getModelIcon` helper needs to be exported or duplicated in AIForecastCouncil for the discussion section (currently local to that file)

## Files Modified
1. `src/components/forecast/AIForecastCouncil.tsx` — vertical layout + AI discussion
2. `src/components/forecast/PollCard.tsx` — "What AI Thinks" bars
3. `supabase/functions/auto-forecast/index.ts` — comment generation after predictions

