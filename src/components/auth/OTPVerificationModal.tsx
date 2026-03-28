import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { MailCheck, ExternalLink, Loader2 } from "lucide-react";

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
  const [verified, setVerified] = useState(false);

  // Listen for auth state changes (fires when user returns from verification link)
  useEffect(() => {
    if (!open || verified) return;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session?.user?.email_confirmed_at) {
        setVerified(true);
        toast({ title: "Email verified!", description: "Your account is now active." });
        onVerified();
      }
    });

    return () => subscription.unsubscribe();
  }, [open, verified, onVerified, toast]);

  // Also poll periodically as a fallback
  useEffect(() => {
    if (!open || verified) return;

    const interval = setInterval(async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.email_confirmed_at) {
        setVerified(true);
        clearInterval(interval);
        toast({ title: "Email verified!", description: "Your account is now active." });
        onVerified();
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [open, verified, onVerified, toast]);

  const handleCheckNow = async () => {
    setChecking(true);
    try {
      // Force refresh the session
      const { data: { session }, error } = await supabase.auth.getSession();
      if (session?.user?.email_confirmed_at) {
        setVerified(true);
        toast({ title: "Email verified!", description: "Your account is now active." });
        onVerified();
      } else {
        // Try signing in with stored credentials to check if verified
        toast({
          title: "Not verified yet",
          description: "Please click the verification link in your email first. It may take a moment to arrive.",
          variant: "destructive",
        });
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
            We've sent a verification email to <span className="font-semibold text-foreground">{email}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="bg-muted/50 rounded-lg p-4 text-center space-y-3">
            <ExternalLink className="w-8 h-8 text-primary mx-auto" />
            <p className="text-sm font-medium">Click the "Verify" button in the email we sent you</p>
            <p className="text-xs text-muted-foreground">
              Check your inbox and spam folder. The email may take up to 2 minutes to arrive.
            </p>
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground pt-1">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>Waiting for verification...</span>
            </div>
          </div>

          <Button onClick={handleCheckNow} className="w-full" disabled={checking} size="lg">
            {checking ? "Checking..." : "I've Clicked the Link — Continue"}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            Didn't receive the email?{" "}
            <button type="button" onClick={handleResend} disabled={resending}
              className="text-primary underline hover:text-accent disabled:opacity-50">
              {resending ? "Sending..." : "Resend verification email"}
            </button>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OTPVerificationModal;
