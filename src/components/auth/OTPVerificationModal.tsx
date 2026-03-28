import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { MailCheck } from "lucide-react";

interface OTPVerificationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  email: string;
  onVerified: () => void;
}

const OTPVerificationModal = ({ open, onOpenChange, email, onVerified }: OTPVerificationModalProps) => {
  const { toast } = useToast();
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length < 6) {
      toast({ title: "Enter the 6-digit code", variant: "destructive" });
      return;
    }

    setVerifying(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: code.trim(),
        type: "signup",
      });

      if (error) throw error;
      toast({ title: "Email verified!", description: "Your account is now active." });
      onVerified();
    } catch (err: any) {
      toast({
        title: "Verification failed",
        description: err.message || "Invalid or expired code. Please try again.",
        variant: "destructive",
      });
    } finally {
      setVerifying(false);
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
      toast({ title: "Code resent!", description: "Check your email for a new verification code." });
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
            Enter the 6-digit code sent to <span className="font-semibold text-foreground">{email}</span>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleVerify} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Input
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="000000"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              className="text-center text-2xl font-mono tracking-[0.5em] h-14"
              autoFocus
            />
          </div>

          <Button type="submit" className="w-full" disabled={verifying || code.length < 6} size="lg">
            {verifying ? "Verifying..." : "Verify Email"}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            Didn't receive the code?{" "}
            <button type="button" onClick={handleResend} disabled={resending}
              className="text-primary underline hover:text-accent disabled:opacity-50">
              {resending ? "Sending..." : "Resend code"}
            </button>
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default OTPVerificationModal;
