import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import Kenya2026 from "./pages/Kenya2026.tsx";
import Services from "./pages/Services.tsx";
import Sectors from "./pages/Sectors.tsx";
import Insights from "./pages/Insights.tsx";
import ResearchDecode from "./pages/ResearchDecode.tsx";
import About from "./pages/About.tsx";
import Contact from "./pages/Contact.tsx";
import PurchaseSuccess from "./pages/PurchaseSuccess.tsx";
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
          <Route path="/sectors" element={<Sectors />} />
          <Route path="/insights" element={<Insights />} />
          <Route path="/research-decode" element={<ResearchDecode />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
