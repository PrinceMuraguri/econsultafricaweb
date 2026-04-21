/**
 * Feature flags — single source of truth. Every component that shows
 * Pro-tier content imports PRO_ENABLED from here.
 *
 * To toggle Pro: change the line below to `true` or `false`, commit,
 * and redeploy. This is a hardcoded constant rather than an env var
 * because Lovable Cloud Secrets blocks the VITE_ prefix.
 *
 * DO NOT REMOVE this file or the PRO_ENABLED imports without explicit
 * instruction. If this flag is deleted, every conditional guard in the
 * codebase marked "// Pro flag:" will break.
 */
export const PRO_ENABLED = false;   // Set to false to pause Pro across the site.
