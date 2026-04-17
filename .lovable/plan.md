

## Understanding the issue

The user is concerned that legacy users (who signed up with email/password) see a "Continue with Google" button on the login modal. If they click it, Google OAuth creates a NEW auth.users entry tied to their Google identity — even if their Google email matches their existing account email — because Supabase treats email/password and Google OAuth as separate identity providers unless explicitly linked. This creates a duplicate/orphan account.

## Why this happens

Supabase Auth allows multiple identities per email, but only if "Link identities by email" is enabled. Even then, the user experience can be confusing. The cleanest fix is to **gate the Google button** so it only appears for users who originally signed up with Google.

## The challenge

The login modal doesn't know which provider a user used until AFTER they enter their email — because we have no way to look up `auth.users.identities` from the client (it's a privileged table). So we need a lightweight check.

## Proposed approach

**Two-step login UX in `LoginModal.tsx`:**

1. **Step 1 — Email entry only**: User types their email and clicks "Continue".
2. **Lookup**: Call a new lightweight edge function `check-auth-method` that takes an email and returns which provider(s) that user has (`email`, `google`, or `none`).
3. **Step 2 — Show the right method**:
   - If user has **google** identity → show "Continue with Google" button only.
   - If user has **email** identity → show password field only.
   - If user has **both** → show both options.
   - If user **doesn't exist** → show "No account found. [Create one]" link.

**Registration modal stays unchanged** — Google button remains prominent there since new users need both options.

## Technical Details

### New edge function: `check-auth-method`
- Public (no JWT required).
- Input: `{ email: string }`
- Uses service role key to query `auth.users` via Admin API: `supabase.auth.admin.listUsers()` filtered by email, then inspect the `identities` array.
- Returns: `{ providers: ["email" | "google" | ...], exists: boolean }`
- Rate-limit risk: minor — only called on login attempts. Can add a simple in-memory throttle later if abused.

### `LoginModal.tsx` changes
- Replace single-step form with two-step state (`step: "email" | "auth"`).
- After email entry, call edge function, then conditionally render password field and/or Google button.
- Keep "Forgot password?" / "Create account" links accessible.

### Files to edit/create
- **New**: `supabase/functions/check-auth-method/index.ts`
- **Edit**: `src/components/auth/LoginModal.tsx` — two-step flow
- **No changes**: `RegistrationModal.tsx` (Google button stays there for new users)

### Edge case handling
- If lookup fails (network, etc.), fall back to showing both options with a small notice — don't block the user.
- Email enumeration concern: returning `exists: false` could let attackers probe accounts. Mitigation: always return `providers: []` for non-existent users with same response shape, and the UI shows "Create an account" prompt regardless. We accept minor enumeration risk since the registration modal already discloses this on signup attempt.

