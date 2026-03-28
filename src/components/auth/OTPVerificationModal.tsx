import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { MailCheck, ExternalLink } from "lucide-react";

interface OTPVerificationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  email: string;
  onVerified: () => void;
}

const OTPVerificationModal = ({ open, onOpenChange, email, onVerified }: OTPVerificationModalProps) => {
  const { toast } = useToast();
  const [resending, setResending] = useState(false);
  const [checking, setChecking] = useState(false);

  // Poll for session to detect when user clicks the verification link
  useEffect(() => {
    if (!open) return;

    const interval = setInterval(async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.email_confirmed_at) {
        clearInterval(interval);
        toast({ title: "Email verified!", description: "Your account is now active." });
        onVerified();
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [open, onVerified, toast]);

  const handleCheckNow = async () => {
    setChecking(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.email_confirmed_at) {
        toast({ title: "Email verified!", description: "Your account is now active." });
        onVerified();
      } else {
        toast({ title: "Not verified yet", description: "Please click the verification link in your email first.", variant: "destructive" });
      }
    } finally {
      setChecking(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
      });
      if (error) throw error;
      toast({ title: "Email resent!", description: "Check your inbox for a new verification link." });
    } catch (err: any) {
      toast({ title: "Could not resend", description: err.message, variant: "destructive" });
    } finally {
      setResending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <MailCheck className="w-5 h-5 text-primary" />
            Verify Your Email
          </DialogTitle>
          <DialogDescription>
            We've sent a verification link to <span className="font-semibold text-foreground">{email}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="bg-muted/50 rounded-lg p-4 text-center space-y-2">
            <ExternalLink className="w-8 h-8 text-primary mx-auto" />
            <p className="text-sm font-medium">Click the link in your email to verify your account</p>
            <p className="text-xs text-muted-foreground">
              Check your inbox (and spam folder) for an email from Forecast Arena
            </p>
          </div>

          <Button onClick={handleCheckNow} className="w-full" disabled={checking} size="lg">
            {checking ? "Checking..." : "I've Verified — Continue"}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            Didn't receive the email?{" "}
            <button type="button" onClick={handleResend} disabled={resending}
              className="text-primary underline hover:text-accent disabled:opacity-50">
              {resending ? "Sending..." : "Resend email"}
            </button>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OTPVerificationModal;
