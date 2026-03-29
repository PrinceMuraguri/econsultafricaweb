import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
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
import StakeResult from "./pages/StakeResult.tsx";
import HowItWorks from "./pages/HowItWorks.tsx";
import HowItWorksQuick from "./pages/HowItWorksQuick.tsx";
import HowItWorksDetailed from "./pages/HowItWorksDetailed.tsx";
import TermsOfUse from "./pages/TermsOfUse.tsx";
import AdminDashboard from "./pages/AdminDashboard.tsx";
import MyDashboard from "./pages/MyDashboard.tsx";
import SectorBriefPreview from "./pages/SectorBriefPreview.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ScrollToTop />
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
            <Route path="/my-dashboard" element={<MyDashboard />} />
            {/* Redirects */}
            <Route path="/forecast-arena" element={<Navigate to="/" replace />} />
            <Route path="/forecast-arena/stake-result" element={<Navigate to="/stake-result" replace />} />
            <Route path="/forecast-arena/how-it-works" element={<Navigate to="/how-it-works" replace />} />
            <Route path="/products" element={<Navigate to="/intelligence-marketplace" replace />} />
            <Route path="/services" element={<Navigate to="/intelligence-marketplace" replace />} />
            <Route path="/sectors" element={<Navigate to="/intelligence-marketplace" replace />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
