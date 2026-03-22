import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, BarChart3 } from "lucide-react";
import { usePolls } from "@/hooks/use-polls";
import PollCard from "./PollCard";

const widgetTexts = [
  "📊 Africa is predicting — where do you stand?",
  "⚡ This week's economic call",
  "💰 Put your insight to the test",
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

  const featuredPoll = polls?.[0];
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
          className="fixed bottom-6 right-6 z-40 w-[340px] max-w-[calc(100vw-3rem)]"
        >
          <div className="bg-card border border-border rounded-lg shadow-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 bg-primary/5 border-b border-border">
              <span className="flex items-center gap-2 text-xs font-semibold text-primary">
                <BarChart3 className="w-3.5 h-3.5" />
                Forecast Arena
              </span>
              <button
                onClick={() => { setVisible(false); setDismissed(true); }}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="px-4 py-2">
              <p className="text-xs text-muted-foreground mb-2">{randomText}</p>
            </div>
            <div className="px-2 pb-3">
              <PollCard poll={featuredPoll} compact />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ForecastWidget;
