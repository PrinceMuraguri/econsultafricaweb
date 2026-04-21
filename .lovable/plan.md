

## Feature-Flag Scaffold for Forecast Arena Pro

Create a clean kill-switch system so Pro can be disabled without affecting Free tier functionality.

### Changes

**File: `src/lib/features.ts` (new)**

Create the single source of truth for feature flags:

```typescript
// Feature flags. Single source of truth — every component imports from here.
// Flip VITE_PRO_ENABLED in the Lovable project env to toggle Pro.
// Default is OFF so any new environment starts with Pro disabled.

export const PRO_ENABLED =
  (import.meta.env.VITE_PRO_ENABLED ?? 'false').toString().toLowerCase() === 'true';
```

**File: `src/pages/ProPaused.tsx` (new)**

Create the placeholder page shown when Pro is disabled:

```typescript
import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Shield, ArrowRight } from "lucide-react";

const ProPaused = () => (
  <Layout>
    <div className="container-page py-16 md:py-24">
      <div className="max-w-xl mx-auto text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-6">
          <Shield className="w-8 h-8 text-muted-foreground" />
        </div>
        <h1 className="text-3xl font-bold font-display text-foreground mb-4">
          Forecast Arena Pro is paused
        </h1>
        <p className="text-muted-foreground mb-8">
          We're upgrading the staked-trading tier. While Pro is offline, the Free Forecast Arena remains fully open — every poll, the AI Forecast Council, and the leaderboard.
        </p>
        <p className="text-sm text-muted-foreground mb-8">
          Any balance in your Pro wallet is safe and will be restored when Pro returns.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild>
            <Link to="/">
              Go to Forecast Arena <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/contact">Questions? Get in touch</Link>
          </Button>
        </div>
      </div>
    </div>
  </Layout>
);

export default ProPaused;
```

**File: `src/App.tsx`**

Add imports and conditional routing:

- Add `import ProPaused from "./pages/ProPaused.tsx";`
- Add `import { PRO_ENABLED } from "@/lib/features";`
- Replace Pro routes with conditional versions:
  ```typescript
  <Route path="/forecast-arena-pro" element={PRO_ENABLED ? <ForecastArenaPro /> : <ProPaused />} />
  <Route path="/forecast-arena-pro/:slug" element={PRO_ENABLED ? <ForecastPollDetailPro /> : <ProPaused />} />
  ```

**File: `src/components/Navbar.tsx`**

Add feature flag import and conditional nav links:

- Add `import { PRO_ENABLED } from "@/lib/features";`
- Replace static `navLinks` array with conditional construction:
  ```typescript
  const baseNavLinks = [
    { label: "Forecast Arena", href: "/" },
    { label: "Leaderboard", href: "/leaderboard" },
    { label: "AI Council API", href: "/api-docs" },
    { label: "Shop", href: "/intelligence-marketplace" },
    { label: "Philosophy", href: "/our-philosophy" },
    { label: "Insights", href: "/insights" },
    { label: "About", href: "/about" },
    { label: "Contact", href: "/contact" },
  ];

  const navLinks = PRO_ENABLED
    ? [
        { label: "Forecast Arena", href: "/" },
        { label: "Forecast Arena", href: "/forecast-arena-pro", isPro: true },
        { label: "Leaderboard", href: "/leaderboard" },
        { label: "AI Council API", href: "/api-docs" },
        { label: "Shop", href: "/intelligence-marketplace" },
        { label: "Philosophy", href: "/our-philosophy" },
        { label: "Insights", href: "/insights" },
        { label: "About", href: "/about" },
        { label: "Contact", href: "/contact" },
      ]
    : baseNavLinks;
  ```

### Environment Configuration

Do NOT add `VITE_PRO_ENABLED` to any committed `.env` file. Developers set it in the Lovable project environment:
- Leave unset or `'false'` → Pro hidden
- Set to `'true'` → Pro enabled

