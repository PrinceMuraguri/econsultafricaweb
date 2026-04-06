import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import CartDrawer from "@/components/CartDrawer";
import ScrollToTop from "@/components/ScrollToTop";

// Eagerly load the landing page for fastest first paint
import ForecastArena from "./pages/ForecastArena";

// Lazy-load everything else — only downloaded when the user navigates there
const OurPhilosophy = lazy(() => import("./pages/OurPhilosophy"));
const Kenya2026 = lazy(() => import("./pages/Kenya2026"));
const IntelligenceMarketplace = lazy(() => import("./pages/IntelligenceMarketplace"));
const Insights = lazy(() => import("./pages/Insights"));
const ArticleDetail = lazy(() => import("./pages/ArticleDetail"));
const ResearchDecode = lazy(() => import("./pages/ResearchDecode"));
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));
const SampleReport = lazy(() => import("./pages/SampleReport"));
const PurchaseSuccess = lazy(() => import("./pages/PurchaseSuccess"));
const ForecastPollDetail = lazy(() => import("./pages/ForecastPollDetail"));
const StakeResult = lazy(() => import("./pages/StakeResult"));
const Leaderboard = lazy(() => import("./pages/Leaderboard"));
const UserProfile = lazy(() => import("./pages/UserProfile"));
const Watchlist = lazy(() => import("./pages/Watchlist"));
const HowItWorks = lazy(() => import("./pages/HowItWorks"));
const HowItWorksQuick = lazy(() => import("./pages/HowItWorksQuick"));
const HowItWorksDetailed = lazy(() => import("./pages/HowItWorksDetailed"));
const TermsOfUse = lazy(() => import("./pages/TermsOfUse"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const MyDashboard = lazy(() => import("./pages/MyDashboard"));
const SectorBriefPreview = lazy(() => import("./pages/SectorBriefPreview"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const NotFound = lazy(() => import("./pages/NotFound"));
const ThankYou = lazy(() => import("./pages/ThankYou"));
const Unsubscribe = lazy(() => import("./pages/Unsubscribe"));
const KenyaGenZ2026 = lazy(() => import("./pages/KenyaGenZ2026"));

const queryClient = new QueryClient();

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-pulse text-muted-foreground text-sm">Loading…</div>
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <CartProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <CartDrawer />
          <BrowserRouter>
            <ScrollToTop />
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<ForecastArena />} />
                <Route path="/our-philosophy" element={<OurPhilosophy />} />
                <Route path="/intelligence-marketplace" element={<IntelligenceMarketplace />} />
                <Route path="/kenya-2026" element={<Kenya2026 />} />
                <Route path="/insights" element={<Insights />} />
                <Route path="/insights/:slug" element={<ArticleDetail />} />
                <Route path="/research-decode" element={<ResearchDecode />} />
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/sample-report" element={<SampleReport />} />
                <Route path="/purchase-success" element={<PurchaseSuccess />} />
                <Route path="/stake-result" element={<StakeResult />} />
                <Route path="/how-it-works" element={<HowItWorks />} />
                <Route path="/how-it-works-quick" element={<HowItWorksQuick />} />
                <Route path="/how-it-works-detailed" element={<HowItWorksDetailed />} />
                <Route path="/terms-of-use" element={<TermsOfUse />} />
                <Route path="/forecast-arena/:slug" element={<ForecastPollDetail />} />
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/sector-brief-preview/:filename" element={<SectorBriefPreview />} />
                <Route path="/product/:slug" element={<ProductDetail />} />
                <Route path="/my-dashboard" element={<MyDashboard />} />
                <Route path="/leaderboard" element={<Leaderboard />} />
                <Route path="/profile/:username" element={<UserProfile />} />
                <Route path="/watchlist" element={<Watchlist />} />
                <Route path="/thank-you" element={<ThankYou />} />
                <Route path="/unsubscribe" element={<Unsubscribe />} />
                <Route path="/kenya-genz-2026" element={<KenyaGenZ2026 />} />
                {/* Redirects */}
                <Route path="/forecast-arena" element={<Navigate to="/" replace />} />
                <Route path="/forecast-arena/stake-result" element={<Navigate to="/stake-result" replace />} />
                <Route path="/forecast-arena/how-it-works" element={<Navigate to="/how-it-works" replace />} />
                <Route path="/products" element={<Navigate to="/intelligence-marketplace" replace />} />
                <Route path="/services" element={<Navigate to="/intelligence-marketplace" replace />} />
                <Route path="/sectors" element={<Navigate to="/intelligence-marketplace" replace />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </TooltipProvider>
      </CartProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
