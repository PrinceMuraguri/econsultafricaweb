import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { LogIn, Eye, EyeOff } from "lucide-react";
import { getFingerprint } from "@/lib/fingerprint";

interface LoginModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  onSwitchToRegister?: () => void;
}

const LoginModal = ({ open, onOpenChange, onSuccess, onSwitchToRegister }: LoginModalProps) => {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

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

      if (data.user) {
        const fp = await getFingerprint();

        // Update user_profiles with current device fingerprint
        await supabase
          .from("user_profiles")
          .update({ voter_fingerprint: fp })
          .eq("user_id", data.user.id);

        // Insert voter_profile for backward compat (ignore if already exists)
        try {
          await supabase
            .from("voter_profiles")
            .insert({
              voter_fingerprint: fp,
              email: data.user.email || "",
              full_name: data.user.user_metadata?.full_name || "",
              phone_number: data.user.user_metadata?.phone || "",
              country_code: "+254",
            });
        } catch {
          // Row already exists for this fingerprint — that's fine, skip
        }

        // Claim anonymous votes made on this device
        await supabase
          .from("votes")
          .update({ user_id: data.user.id })
          .eq("voter_fingerprint", fp)
          .is("user_id", null);

        // Legacy localStorage sync
        const meta = data.user.user_metadata;
        localStorage.setItem("forecast_participant", JSON.stringify({
          fullName: meta?.full_name || "",
          email: data.user.email || "",
          phone: meta?.phone || "",
          countryCode: "+254",
        }));
      }

      toast({ title: "Welcome back!", description: "You're now signed in." });
      onOpenChange(false);
      onSuccess?.();
    } catch (err: any) {
      toast({ title: "Login failed", description: err.message || "Invalid credentials.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <LogIn className="w-5 h-5 text-primary" />
            Sign In
          </DialogTitle>
          <DialogDescription>
            Sign in to your Forecast Arena account.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleLogin} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Email Address</Label>
            <Input type="email" placeholder="you@company.com" value={email}
              onChange={(e) => setEmail(e.target.value)} required />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Password</Label>
            <div className="relative">
              <Input type={showPassword ? "text" : "password"} placeholder="Enter your password"
                value={password} onChange={(e) => setPassword(e.target.value)} required className="pr-10" />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={loading} size="lg">
            {loading ? "Signing in..." : "Sign In"}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            Don't have an account?{" "}
            <button type="button" onClick={onSwitchToRegister} className="text-primary underline hover:text-accent">
              Create one
            </button>
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default LoginModal;
