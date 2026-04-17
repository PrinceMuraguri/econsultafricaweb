import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useToast } from "@/hooks/use-toast";
import { LogIn, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { getFingerprint } from "@/lib/fingerprint";

interface LoginModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  onSwitchToRegister?: () => void;
}

type Step = "email" | "auth";

const LoginModal = ({ open, onOpenChange, onSuccess, onSwitchToRegister }: LoginModalProps) => {
  const { toast } = useToast();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [providers, setProviders] = useState<string[]>([]);
  const [accountExists, setAccountExists] = useState(true);
  const [fallback, setFallback] = useState(false);

  const resetState = () => {
    setStep("email");
    setEmail("");
    setPassword("");
    setProviders([]);
    setAccountExists(true);
    setFallback(false);
  };

  const handleClose = (next: boolean) => {
    if (!next) resetState();
    onOpenChange(next);
  };

  const handleEmailContinue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) {
      toast({ title: "Enter a valid email", variant: "destructive" });
      return;
    }

    setChecking(true);
    try {
      const { data, error } = await supabase.functions.invoke("check-auth-method", {
        body: { email: email.trim() },
      });

      if (error) throw error;

      const provs: string[] = data?.providers || [];
      setProviders(provs);
      setAccountExists(!!data?.exists);
      setFallback(!!data?.fallback);
      setStep("auth");
    } catch (err: any) {
      // Fail-open: show both options
      setProviders(["email", "google"]);
      setAccountExists(false);
      setFallback(true);
      setStep("auth");
    } finally {
      setChecking(false);
    }
  };

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

      if (result.redirected) return;

      handleClose(false);
      toast({ title: "Welcome!", description: "You're now signed in with Google." });
      onSuccess?.();
    } catch (err: any) {
      toast({ title: "Google sign-in failed", description: err.message, variant: "destructive" });
      setGoogleLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      toast({ title: "Please fill in all fields", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) throw error;

      handleClose(false);
      toast({ title: "Welcome back!", description: "You're now signed in." });
      onSuccess?.();

      if (data.user) {
        const userId = data.user.id;
        const userEmail = data.user.email || "";
        const userMeta = data.user.user_metadata;

        (async () => {
          try {
            const fp = await getFingerprint();
            await supabase.from("user_profiles").update({ voter_fingerprint: fp }).eq("user_id", userId);
            try {
              await supabase.from("voter_profiles").insert({
                voter_fingerprint: fp, email: userEmail,
                full_name: userMeta?.full_name || "", phone_number: userMeta?.phone || "", country_code: "+254",
              });
            } catch { /* Already exists */ }
            await supabase.from("votes").update({ user_id: userId }).eq("voter_fingerprint", fp).is("user_id", null);
          } catch (syncErr) {
            console.error("Background fingerprint sync error:", syncErr);
          }
        })();

        localStorage.setItem("forecast_participant", JSON.stringify({
          fullName: userMeta?.full_name || "", email: userEmail,
          phone: userMeta?.phone || "", countryCode: "+254",
        }));
      }
    } catch (err: any) {
      toast({ title: "Login failed", description: err.message || "Invalid credentials.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const showGoogle = providers.includes("google") || fallback;
  const showEmail = providers.includes("email") || fallback;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <LogIn className="w-5 h-5 text-primary" />
            Sign In
          </DialogTitle>
          <DialogDescription>
            {step === "email"
              ? "Enter your email to continue."
              : accountExists
                ? "Choose how to sign in."
                : "We couldn't find that account."}
          </DialogDescription>
        </DialogHeader>

        {step === "email" && (
          <form onSubmit={handleEmailContinue} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Email Address</Label>
              <Input
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoFocus
                required
              />
            </div>
            <Button type="submit" className="w-full" size="lg" disabled={checking}>
              {checking ? "Checking..." : "Continue"}
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              Don't have an account?{" "}
              <button type="button" onClick={onSwitchToRegister} className="text-primary underline hover:text-accent">
                Create one
              </button>
            </p>
          </form>
        )}

        {step === "auth" && (
          <div className="space-y-4 pt-2">
            <button
              type="button"
              onClick={() => setStep("email")}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-3 h-3" /> {email}
            </button>

            {!accountExists && !fallback ? (
              <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-4 text-center">
                <p className="text-sm text-foreground">
                  No account found for <span className="font-medium">{email}</span>.
                </p>
                <Button
                  type="button"
                  className="w-full"
                  onClick={() => {
                    handleClose(false);
                    onSwitchToRegister?.();
                  }}
                >
                  Create an account
                </Button>
              </div>
            ) : (
              <>
                {showGoogle && (
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
                )}

                {showGoogle && showEmail && (
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-px bg-border" />
                    <span className="text-xs text-muted-foreground">or</span>
                    <div className="flex-1 h-px bg-border" />
                  </div>
                )}

                {showEmail && (
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">Password</Label>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter your password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          autoFocus
                          required
                          className="pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <Button type="submit" className="w-full" disabled={loading} size="lg">
                      {loading ? "Signing in..." : "Sign In"}
                    </Button>
                  </form>
                )}

                {fallback && (
                  <p className="text-xs text-muted-foreground text-center">
                    Couldn't verify sign-in method. Use the option you originally registered with.
                  </p>
                )}

                <p className="text-xs text-muted-foreground text-center">
                  Don't have an account?{" "}
                  <button type="button" onClick={onSwitchToRegister} className="text-primary underline hover:text-accent">
                    Create one
                  </button>
                </p>
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default LoginModal;
