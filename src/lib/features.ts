// Feature flags. Single source of truth — every component imports from here.
// Flip VITE_PRO_ENABLED in the Lovable project env to toggle Pro.
// Default is OFF so any new environment starts with Pro disabled.

export const PRO_ENABLED =
  (import.meta.env.VITE_PRO_ENABLED ?? 'false').toString().toLowerCase() === 'true';
