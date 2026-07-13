import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import CartDrawer from "@/components/CartDrawer";
import ScrollToTop from "@/components/ScrollToTop";
import ForecastArena from "./pages/ForecastArena.tsx";
import OurPhilosophy from "./pages/OurPhilosophy.tsx";
import Kenya2026 from "./pages/Kenya2026.tsx";
import IntelligenceMarketplace from "./pages/IntelligenceMarketplace.tsx";
import Insights from "./pages/Insights.tsx";
import ArticleDetail from "./pages/ArticleDetail.tsx";
import ResearchDecode from "./pages/ResearchDecode.tsx";
import About from "./pages/About.tsx";
import Contact from "./pages/Contact.tsx";
import SampleReport from "./pages/SampleReport.tsx";
import PurchaseSuccess from "./pages/PurchaseSuccess.tsx";
import ForecastPollDetail from "./pages/ForecastPollDetail.tsx";
import ForecastArenaPro from "./pages/ForecastArenaPro.tsx";
import ForecastPollDetailPro from "./pages/ForecastPollDetailPro.tsx";
import StakeResult from "./pages/StakeResult.tsx";
import Leaderboard from "./pages/Leaderboard.tsx";
import UserProfile from "./pages/UserProfile.tsx";
import Watchlist from "./pages/Watchlist.tsx";
import HowItWorks from "./pages/HowItWorks.tsx";
import HowItWorksQuick from "./pages/HowItWorksQuick.tsx";
import HowItWorksDetailed from "./pages/HowItWorksDetailed.tsx";
import TermsOfUse from "./pages/TermsOfUse.tsx";
import AdminDashboard from "./pages/AdminDashboard.tsx";
import MyDashboard from "./pages/MyDashboard.tsx";
import SectorBriefPreview from "./pages/SectorBriefPreview.tsx";
import ProductDetail from "./pages/ProductDetail.tsx";
import NotFound from "./pages/NotFound.tsx";
import ThankYou from "./pages/ThankYou.tsx";
import Unsubscribe from "./pages/Unsubscribe.tsx";
import KenyaGenZ2026 from "./pages/KenyaGenZ2026.tsx";
import AIAgentProfile from "./pages/AIAgentProfile.tsx";
import APIDocumentation from "./pages/APIDocumentation.tsx";
import ProPaused from "./pages/ProPaused.tsx";
import AboutDemoMode from "./pages/AboutDemoMode.tsx";
import FiatWhitepaper from "./pages/FiatWhitepaper.tsx";
import WorldCup2026 from "./pages/WorldCup2026.tsx";
import SmtVpay from "./pages/SmtVpay.tsx";
import SmtPresentation from "./pages/SmtPresentation.tsx";
import DemoOnboardingModal from "@/components/forecast/DemoOnboardingModal";
import { PRO_ENABLED } from "@/lib/features"; // Pro flag: gates Pro routes

const queryClient = new QueryClient();

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
            {/* Single, app-wide mount — fires on any Pro surface when proMode === 'demo' */}
            <DemoOnboardingModal />
            <Routes>
              <Route path="/" element={<OurPhilosophy />} />
              <Route path="/forecast-arena" element={<ForecastArena />} />
              <Route path="/world-cup-2026" element={<WorldCup2026 />} />
              <Route path="/section/smt-vpay" element={<SmtVpay />} />
              <Route path="/smt-vpay" element={<SmtVpay />} />
              <Route path="/section/smt-presentation" element={<SmtPresentation />} />
              <Route path="/smt-presentation" element={<SmtPresentation />} />
              <Route path="/our-philosophy" element={<Navigate to="/" replace />} />
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
              {/* Pro flag: routes serve ProPaused when PRO_ENABLED is false */}
              <Route path="/forecast-arena-pro" element={PRO_ENABLED ? <ForecastArenaPro /> : <ProPaused />} />
              <Route path="/forecast-arena-pro/:slug" element={PRO_ENABLED ? <ForecastPollDetailPro /> : <ProPaused />} />
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
              <Route path="/ai-agent/:slug" element={<AIAgentProfile />} />
              <Route path="/api-docs" element={<APIDocumentation />} />
              <Route path="/about-demo-mode" element={<AboutDemoMode />} />
              <Route path="/FIAT_whitepaper" element={<FiatWhitepaper />} />
              <Route path="/fiat_whitepaper" element={<FiatWhitepaper />} />
              <Route path="/fiat-whitepaper" element={<FiatWhitepaper />} />
              {/* Redirects */}
              
              <Route path="/forecast-arena/stake-result" element={<Navigate to="/stake-result" replace />} />
              <Route path="/forecast-arena/how-it-works" element={<Navigate to="/how-it-works" replace />} />
              <Route path="/products" element={<Navigate to="/intelligence-marketplace" replace />} />
              <Route path="/services" element={<Navigate to="/intelligence-marketplace" replace />} />
              <Route path="/sectors" element={<Navigate to="/intelligence-marketplace" replace />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </CartProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
