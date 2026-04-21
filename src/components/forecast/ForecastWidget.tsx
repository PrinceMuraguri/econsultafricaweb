import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, BarChart3, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { usePolls } from "@/hooks/use-polls";
import PollCard from "./PollCard";
import { PRO_ENABLED } from "@/lib/features"; // Pro flag: gates widget Pro footer

const widgetTexts = [
  "📊 Africa is forecasting — where do you stand?",
  "⚡ This week's economic question",
  "🧠 Contribute your economic insight",
];

const ForecastWidget = () => {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const { data: polls } = usePolls("active");

  useEffect(() => {
    if (dismissed) return;
    const timer = setTimeout(() => setVisible(true), 5000);
    return () => clearTimeout(timer);
  }, [dismissed]);

  const featuredPoll = polls?.find(p => p.title.toLowerCase().includes("pump price") && p.title.toLowerCase().includes("kenya")) || polls?.find(p => p.title.toLowerCase().includes("oil")) || polls?.[0];
  if (!featuredPoll || dismissed) return null;

  const randomText = widgetTexts[Math.floor(Math.random() * widgetTexts.length)];

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 60, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 60, scale: 0.95 }}
          transition={{ duration: 0.3 }}
          className="fixed bottom-4 right-4 z-40 w-[300px] max-w-[calc(100vw-2rem)]"
        >
          <div className="bg-card border border-border rounded-lg shadow-xl overflow-hidden max-h-[70vh] overflow-y-auto">
            <div className="flex items-center justify-between px-3 py-2 bg-primary/5 border-b border-border sticky top-0 z-10">
              <span className="flex items-center gap-2 text-xs font-semibold text-primary">
                <BarChart3 className="w-3.5 h-3.5" />
                Forecast Arena
              </span>
              <button
                onClick={() => { setVisible(false); setDismissed(true); }}
                className="p-1 rounded-full bg-muted hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                aria-label="Close forecast widget"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="px-3 py-1.5">
              <p className="text-[11px] text-muted-foreground">{randomText}</p>
            </div>
            <div className="px-2 pb-2">
              <PollCard poll={featuredPoll} compact />
            </div>
            {/* Pro flag: widget Pro footer hidden when Pro is paused */}
            {PRO_ENABLED && (
              <Link
                to="/forecast-arena-pro"
                className="flex items-center justify-center gap-1.5 px-3 py-2 text-[11px] font-semibold text-amber-700 bg-amber-50 border-t border-amber-200/50 hover:bg-amber-100 transition-colors"
              >
                💰 Try Pro — back forecasts with capital <ArrowRight className="w-3 h-3" />
              </Link>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ForecastWidget;
