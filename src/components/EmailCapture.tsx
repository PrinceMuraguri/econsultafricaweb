import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const fadeUp = {
  hidden: { opacity: 0, y: 16, filter: "blur(4px)" },
  visible: (i: number) => ({
    opacity: 1, y: 0, filter: "blur(0px)",
    transition: { delay: i * 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] as const }
  }),
};

const EmailCapture = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast({ title: "Email required", description: "Please enter your email.", variant: "destructive" });
      return;
    }
    // For now just show success — can wire to backend later
    setSubmitted(true);
    toast({ title: "You're in", description: "Check your inbox for your free preview." });
  };

  return (
    <section className="section-padding bg-muted/50">
      <div className="container-page">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }}
            variants={fadeUp} custom={0}
            className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6"
          >
            <Mail className="w-5 h-5 text-primary" />
          </motion.div>
          <motion.h2
            initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }}
            variants={fadeUp} custom={1}
            className="text-3xl md:text-4xl font-bold text-foreground mb-4"
          >
            Get Economic Insights That Actually Matter
          </motion.h2>
          <motion.p
            initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }}
            variants={fadeUp} custom={2}
            className="text-muted-foreground leading-relaxed mb-8"
          >
            Receive a free preview of the Kenya 2026 Economic Outlook and occasional insights on African economies — built for decision-makers, not academics.
          </motion.p>

          {submitted ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="bg-card border border-border rounded-lg p-8 card-shadow"
            >
              <p className="text-foreground font-display font-semibold text-lg mb-2">You're on the list.</p>
              <p className="text-sm text-muted-foreground">Check your inbox for the free Kenya report preview.</p>
            </motion.div>
          ) : (
            <motion.form
              initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }}
              variants={fadeUp} custom={3}
              onSubmit={handleSubmit}
              className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto"
            >
              <Input
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="flex-1"
              />
              <Input
                type="email"
                placeholder="Your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1"
                required
              />
              <Button variant="hero" size="default" type="submit" className="hover-sink whitespace-nowrap">
                Get Free Preview <ArrowRight className="ml-1" />
              </Button>
            </motion.form>
          )}

          <motion.p
            initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }}
            variants={fadeUp} custom={4}
            className="text-xs text-muted-foreground mt-4"
          >
            No spam. Unsubscribe anytime. We respect your inbox.
          </motion.p>
        </div>
      </div>
    </section>
  );
};

export default EmailCapture;
