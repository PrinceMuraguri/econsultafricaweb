import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { getFingerprint } from "@/lib/fingerprint";
import { useToast } from "@/hooks/use-toast";
import { UserCheck } from "lucide-react";

interface ParticipantLoginModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const ParticipantLoginModal = ({ open, onOpenChange, onSuccess }: ParticipantLoginModalProps) => {
  const { toast } = useToast();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [countryCode, setCountryCode] = useState("+254");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim() || !phoneNumber.trim()) {
      toast({ title: "Please fill in all fields", variant: "destructive" });
      return;
    }
    if (!termsAccepted) {
      toast({ title: "Please accept the Terms of Use", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const fp = await getFingerprint();
      await supabase
        .from("voter_profiles")
        .upsert({
          voter_fingerprint: fp,
          email: email.trim(),
          full_name: fullName.trim(),
          phone_number: phoneNumber.trim(),
          country_code: countryCode,
          updated_at: new Date().toISOString(),
        }, { onConflict: "voter_fingerprint" });

      // Store locally so we don't ask again
      localStorage.setItem("forecast_participant", JSON.stringify({
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phoneNumber.trim(),
        countryCode,
      }));

      toast({ title: "Welcome to Forecast Arena!", description: "You can now submit your forecasts." });
      onOpenChange(false);
      onSuccess();
    } catch {
      toast({ title: "Error", description: "Could not save your details. Please try again.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-primary" />
            Sign In to Participate
          </DialogTitle>
          <DialogDescription>
            Create your participant profile to submit forecasts and track your accuracy.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Full Name</Label>
            <Input
              placeholder="John Mwangi"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Email Address</Label>
            <Input
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Phone Number</Label>
            <div className="flex gap-2">
              <Input
                type="text"
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                className="w-20 font-mono text-center"
                placeholder="+254"
              />
              <Input
                type="tel"
                placeholder="712345678"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="flex-1"
                required
              />
            </div>
          </div>

          <div className="flex items-start gap-2">
            <Checkbox
              id="terms"
              checked={termsAccepted}
              onCheckedChange={(checked) => setTermsAccepted(checked === true)}
              className="mt-0.5"
            />
            <label htmlFor="terms" className="text-xs text-muted-foreground leading-tight cursor-pointer">
              I agree to the{" "}
              <a
                href="/documents/terms-of-use.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline hover:text-accent"
                onClick={(e) => e.stopPropagation()}
              >
                Terms of Use
              </a>{" "}
              and understand that Forecast Arena is an economic intelligence platform for research purposes.
            </label>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={submitting || !termsAccepted}
          >
            {submitting ? "Setting up..." : "Start Forecasting"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ParticipantLoginModal;
