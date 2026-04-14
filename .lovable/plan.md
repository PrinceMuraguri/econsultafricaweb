

# Plan: Upgrade AdminAICouncilTab with Full Forecast Controls

## Summary
Replace `src/components/admin/AdminAICouncilTab.tsx` with an upgraded version that adds forecast triggering controls, agent API key status checking, and live results display. The prompt code has **9 Word-doc corruption bugs** that must be fixed.

## Bugs Found in the Prompt Code

### Bug 1-9: Garbled logical operators (Word doc corruption)
The Word-to-text conversion has corrupted `&&` operators throughout the code. Each instance below would cause a syntax error:

| Line | Corrupted | Fix |
|------|-----------|-----|
| 384 | `{showKeySetup &KeySetup && (` | `{showKeySetup && (` |
| 423 | `{serviceKey &Key && (` | `{serviceKey && (` |
| 456 | `$ {agent.has_api_key` (space after $) | `${agent.has_api_key` |
| 475 | `{!agent.has_api_key &_api_key && (` | `{!agent.has_api_key && (` |
| 484 | `{agentStatus.setup_guide &_guide && (` | `{agentStatus.setup_guide && (` |
| 564 | `{activePolls.length > 0 & 0 && (` | `{activePolls.length > 0 && (` |
| 567 | `{activePolls.length === 0 & === 0 && (` | `{activePolls.length === 0 && (` |
| 606 | `!== undefined & !== undefined && (` | `!== undefined && (` |
| 635 | `runtime_ms &_ms && (` | `runtime_ms && (` |
| 687 | `"error" &" && (` | `"error" && (` |

### Bug 10: Broken template literals
Lines 668-673 have garbled backtick syntax in the JSX template literal for status dot styling. Will be reconstructed cleanly.

### Bug 11: RLS blocks DELETE on ai_agents
The `deleteAgent` function calls `.delete()` on `ai_agents`, but the table's RLS has no DELETE policy. This will silently fail. This exists in the current code too, so it's a pre-existing issue — I'll note it but won't change the prompt's design.

### Bug 12: Security note (by design, not a fix)
Storing the `service_role` key in `sessionStorage` is a security risk. However, the prompt explicitly designs it this way with clear warnings in the UI. This is acceptable for an admin-only panel.

## What's Correct
- The `AUTO_FORECAST_URL` matches the deployed function URL
- Auth via `Authorization: Bearer ${serviceKey}` (service_role key) is the correct auth method for the auto-forecast function
- All existing agent management, predictions feed, and comments feed are preserved
- Query keys for polls (`admin-active-polls-for-forecast`) don't conflict with existing queries
- The Select component import is already available in the project
- `useEffect` is correctly added to imports

## Changes

### 1. Replace `src/components/admin/AdminAICouncilTab.tsx`
Write the full upgraded component with all 10 syntax bugs fixed. Clean reconstruction of the JSX to ensure proper brace matching and template literal syntax. No other files modified.

## Technical Notes
- Single file change, no database migrations, no edge function changes
- Depends on the `auto-forecast` edge function deployed in Prompt 2
- The `adminKey` prop is still accepted but not used for the forecast calls (service_role key is used instead via the API Connection panel)

