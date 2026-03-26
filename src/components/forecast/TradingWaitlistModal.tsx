import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { getFingerprint } from "@/lib/fingerprint";
import { useToast } from "@/hooks/use-toast";
import { Rocket, Check, Loader2 } from "lucide-react";

interface TradingWaitlistModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TradingWaitlistModal = ({ open, onOpenChange }: TradingWaitlistModalProps) => {
  const { toast } = useToast();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim() || !phone.trim()) {
      toast({ title: "All fields required", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const fp = await getFingerprint();
      const { error } = await supabase.from("trading_waitlist").insert({
        full_name: fullName.trim(),
        email: email.trim(),
        phone_number: phone.trim(),
        voter_fingerprint: fp,
      });
      if (error) throw error;
      setSubmitted(true);
    } catch {
      toast({ title: "Something went wrong", description: "Please try again.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = (val: boolean) => {
    if (!val) {
      setTimeout(() => {
        setSubmitted(false);
        setFullName("");
        setEmail("");
        setPhone("");
      }, 300);
    }
    onOpenChange(val);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        {submitted ? (
          <div className="text-center py-6">
            <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-accent" />
            </div>
            <DialogHeader>
              <DialogTitle className="text-xl mb-2">You're on the waitlist! 🎉</DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground leading-relaxed">
                You'll receive priority access when forecast participation with allocation launches.
                In the meantime, start submitting forecasts to build your track record.
              </DialogDescription>
            </DialogHeader>
            <Button onClick={() => handleClose(false)} className="mt-6">
              Start Forecasting
            </Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2 mb-1">
                <Rocket className="w-5 h-5 text-accent" />
                <DialogTitle className="text-lg">Get Priority Access</DialogTitle>
              </div>
              <DialogDescription className="text-sm text-muted-foreground leading-relaxed">
                Forecast participation with allocation is coming soon. Register now to be first in line
                when we launch this feature for Africa's economic forecasts.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-2">
              <div className="space-y-2">
                <Label htmlFor="wl-name">Full Name</Label>
                <Input
                  id="wl-name"
                  placeholder="Your name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  maxLength={100}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="wl-email">Email</Label>
                <Input
                  id="wl-email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  maxLength={255}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="wl-phone">Phone Number</Label>
                <Input
                  id="wl-phone"
                  type="tel"
                  placeholder="+254 7XX XXX XXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  maxLength={20}
                />
              </div>
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Joining...</>
                ) : (
                  "Join the Waitlist"
                )}
              </Button>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default TradingWaitlistModal;
