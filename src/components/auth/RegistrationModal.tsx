import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { getFingerprint } from "@/lib/fingerprint";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, Eye, EyeOff } from "lucide-react";
import OTPVerificationModal from "./OTPVerificationModal";

interface RegistrationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  onSwitchToLogin?: () => void;
}

const RegistrationModal = ({ open, onOpenChange, onSuccess, onSwitchToLogin }: RegistrationModalProps) => {
  const { toast } = useToast();
  const [step, setStep] = useState<"form" | "otp">("form");
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");

  // Form fields (simplified)
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });

      if (result.error) {
        toast({ title: "Google sign-in failed", description: String(result.error), variant: "destructive" });
        setGoogleLoading(false);
        return;
      }

      if (result.redirected) {
        return; // Browser will redirect
      }

      // Session set — close modal
      onOpenChange(false);
      toast({ title: "🎉 Welcome to Forecast Arena!", description: "Your account is ready. Start making predictions!" });
      onSuccess?.();
    } catch (err: any) {
      toast({ title: "Google sign-in failed", description: err.message, variant: "destructive" });
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !username.trim() || !email.trim() || !password) {
      toast({ title: "Please fill in all required fields", variant: "destructive" });
      return;
    }
    if (password.length < 6) {
      toast({ title: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }
    if (!termsAccepted) {
      toast({ title: "Please accept the Terms of Use", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      // Check username uniqueness
      const { data: existing } = await supabase
        .from("user_profiles")
        .select("id")
        .eq("username", username.trim().toLowerCase())
        .maybeSingle();

      if (existing) {
        toast({ title: "Username already taken", description: "Please choose a different username.", variant: "destructive" });
        setSubmitting(false);
        return;
      }

      const fp = await getFingerprint();

      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: window.location.origin,
          data: {
            full_name: fullName.trim(),
            username: username.trim().toLowerCase(),
            voter_fingerprint: fp,
          },
        },
      });

      if (signUpError) throw signUpError;

      if (signUpData.user && signUpData.session) {
        await createProfile(signUpData.user.id, fp);
        handleSuccess();
      } else if (signUpData.user && !signUpData.session) {
        setRegisteredEmail(email.trim());
        setStep("otp");
        toast({ title: "Check your email!", description: "We've sent a verification link to your email. Click it to activate your account." });
      }
    } catch (err: any) {
      toast({ title: "Registration Error", description: err.message || "Registration failed.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const createProfile = async (userId: string, fp: string) => {
    await supabase.from("user_profiles").insert({
      user_id: userId,
      username: username.trim().toLowerCase(),
      full_name: fullName.trim(),
      voter_fingerprint: fp,
    });

    try {
      await supabase.from("voter_profiles").insert({
        voter_fingerprint: fp,
        email: email.trim(),
        full_name: fullName.trim(),
        phone_number: "",
        country_code: "+254",
      });
    } catch { /* Already exists */ }

    localStorage.setItem("forecast_participant", JSON.stringify({
      fullName: fullName.trim(), email: email.trim(), phone: "", countryCode: "+254",
    }));
  };

  const handleOTPVerified = async () => {
    try {
      const { data: { user: verifiedUser } } = await supabase.auth.getUser();
      if (verifiedUser) {
        const fp = await getFingerprint();
        await createProfile(verifiedUser.id, fp);
      }
      handleSuccess();
    } catch {
      handleSuccess();
    }
  };

  const handleSuccess = () => {
    setStep("form");
    onOpenChange(false);
    toast({ title: "🎉 Welcome to Forecast Arena!", description: "Your account is ready. Start making predictions!" });
    onSuccess?.();
  };

  const handleClose = () => {
    setStep("form");
    onOpenChange(false);
  };

  if (step === "otp") {
    return (
      <OTPVerificationModal
        open={open}
        onOpenChange={(v) => { if (!v) handleClose(); }}
        email={registeredEmail}
        onVerified={handleOTPVerified}
      />
    );
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); else onOpenChange(v); }}>
      <DialogContent className="sm:max-w-sm max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-primary" />
            Create Your Account
          </DialogTitle>
          <DialogDescription>
            Join Forecast Arena to submit predictions and track your accuracy.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-1">
          {/* Google Sign-In */}
          <Button
            type="button"
            variant="outline"
            className="w-full flex items-center gap-2 font-semibold"
            size="lg"
            onClick={handleGoogleSignIn}
            disabled={googleLoading}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 0 0 1 12c0 1.77.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            {googleLoading ? "Signing in..." : "Continue with Google"}
          </Button>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground">or</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Simplified form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-medium">Full Name *</Label>
                <Input placeholder="John Mwangi" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium">Username *</Label>
                <Input placeholder="john_m" value={username} onChange={(e) => setUsername(e.target.value)} required />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-medium">Email Address *</Label>
              <Input type="email" placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-medium">Password *</Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Min 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pr-10"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Terms */}
            <div className="flex items-start gap-2">
              <Checkbox id="reg-terms" checked={termsAccepted}
                onCheckedChange={(checked) => setTermsAccepted(checked === true)} className="mt-0.5" />
              <label htmlFor="reg-terms" className="text-xs text-muted-foreground leading-tight cursor-pointer">
                I agree to the{" "}
                <a href="/terms-of-use" target="_blank" className="text-primary underline hover:text-accent"
                  onClick={(e) => e.stopPropagation()}>Terms of Use</a>{" "}
                and confirm I am 18 years or older.
              </label>
            </div>

            <Button type="submit" className="w-full" disabled={submitting || !termsAccepted} size="lg">
              {submitting ? "Creating account..." : "Create Account"}
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              Already have an account?{" "}
              <button type="button" onClick={onSwitchToLogin} className="text-primary underline hover:text-accent">
                Sign in
              </button>
            </p>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RegistrationModal;
