import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Rocket, Zap } from "lucide-react";

const LAUNCH_TIME = new Date("2025-03-25T19:00:00+03:00"); // 7PM EAT today

interface TimeLeft {
  hours: number;
  minutes: number;
  seconds: number;
}

const getTimeLeft = (): TimeLeft | null => {
  const diff = LAUNCH_TIME.getTime() - Date.now();
  if (diff <= 0) return null;
  return {
    hours: Math.floor(diff / (1000 * 60 * 60)),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
};

const CountdownUnit = ({ value, label }: { value: number; label: string }) => (
  <div className="flex flex-col items-center">
    <div className="bg-foreground text-background font-mono text-2xl sm:text-4xl font-bold w-14 sm:w-20 h-14 sm:h-20 rounded-lg flex items-center justify-center shadow-lg border border-primary/20">
      {String(value).padStart(2, "0")}
    </div>
    <span className="text-[10px] sm:text-xs uppercase tracking-widest text-muted-foreground mt-2 font-medium">
      {label}
    </span>
  </div>
);

const LaunchCountdown = () => {
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(getTimeLeft());
  const [launched, setLaunched] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      const tl = getTimeLeft();
      if (!tl) {
        setLaunched(true);
        clearInterval(interval);
      }
      setTimeLeft(tl);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary/90 to-accent">
      {/* Subtle animated grid */}
      <div className="absolute inset-0 opacity-10" style={{
        backgroundImage: "linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)",
        backgroundSize: "40px 40px"
      }} />

      <div className="container-page relative z-10 py-10 sm:py-14">
        <div className="text-center">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 bg-background/15 backdrop-blur-sm rounded-full px-4 py-1.5 mb-4"
          >
            <Rocket className="w-4 h-4 text-gold" />
            <span className="text-xs font-semibold text-primary-foreground uppercase tracking-wider">
              Official Launch
            </span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.6 }}
            className="text-2xl sm:text-4xl font-bold text-primary-foreground mb-2 font-display"
          >
            {launched ? "We Are Live! 🚀" : "Launching Today at 7:00 PM EAT"}
          </motion.h2>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-primary-foreground/70 text-sm sm:text-base mb-6 max-w-lg mx-auto"
          >
            {launched
              ? "Econsult Africa is officially live. Explore decision-grade economic intelligence for Africa."
              : "Africa's premier economic intelligence platform goes live. Be among the first to access decision-grade insights."}
          </motion.p>

          {!launched && timeLeft && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="flex items-center justify-center gap-3 sm:gap-5 mb-6"
            >
              <CountdownUnit value={timeLeft.hours} label="Hours" />
              <span className="text-primary-foreground/50 text-2xl sm:text-4xl font-mono font-bold mt-[-1.5rem]">:</span>
              <CountdownUnit value={timeLeft.minutes} label="Minutes" />
              <span className="text-primary-foreground/50 text-2xl sm:text-4xl font-mono font-bold mt-[-1.5rem]">:</span>
              <CountdownUnit value={timeLeft.seconds} label="Seconds" />
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="flex items-center justify-center gap-4 text-xs text-primary-foreground/60"
          >
            <span className="flex items-center gap-1">
              <Zap className="w-3 h-3 text-gold" />
              Economic Intelligence
            </span>
            <span>·</span>
            <span>Forecast Arena</span>
            <span>·</span>
            <span>Kenya 2026 Outlook</span>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default LaunchCountdown;
