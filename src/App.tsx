import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import ScrollToTop from "@/components/ScrollToTop";
import Index from "./pages/Index.tsx";
import Kenya2026 from "./pages/Kenya2026.tsx";
import Services from "./pages/Services.tsx";
import Products from "./pages/Products.tsx";
import Sectors from "./pages/Sectors.tsx";
import Insights from "./pages/Insights.tsx";
import ArticleDetail from "./pages/ArticleDetail.tsx";
import ResearchDecode from "./pages/ResearchDecode.tsx";
import About from "./pages/About.tsx";
import Contact from "./pages/Contact.tsx";
import SampleReport from "./pages/SampleReport.tsx";
import PurchaseSuccess from "./pages/PurchaseSuccess.tsx";
import ForecastArena from "./pages/ForecastArena.tsx";
import ForecastPollDetail from "./pages/ForecastPollDetail.tsx";
import StakeResult from "./pages/StakeResult.tsx";
import HowItWorks from "./pages/HowItWorks.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/kenya-2026" element={<Kenya2026 />} />
          <Route path="/services" element={<Services />} />
          <Route path="/products" element={<Products />} />
          <Route path="/sectors" element={<Sectors />} />
          <Route path="/insights" element={<Insights />} />
          <Route path="/insights/:slug" element={<ArticleDetail />} />
          <Route path="/research-decode" element={<ResearchDecode />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/sample-report" element={<SampleReport />} />
          <Route path="/purchase-success" element={<PurchaseSuccess />} />
          <Route path="/forecast-arena" element={<ForecastArena />} />
          <Route path="/forecast-arena/stake-result" element={<StakeResult />} />
          <Route path="/forecast-arena/how-it-works" element={<HowItWorks />} />
          <Route path="/forecast-arena/:slug" element={<ForecastPollDetail />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
