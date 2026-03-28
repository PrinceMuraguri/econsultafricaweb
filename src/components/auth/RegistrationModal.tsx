import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
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

const OCCUPATIONS = [
  "Business Owner / Founder",
  "Corporate Professional",
  "Investor",
  "Development / NGO Professional",
  "Student",
  "Other",
];

const AGE_BRACKETS = ["<18", "18–24", "25–34", "35–44", "45–54", "55+"];

const COUNTRIES = [
  "Kenya", "Nigeria", "South Africa", "Uganda", "Tanzania", "Rwanda",
  "Ghana", "Ethiopia", "Egypt", "Morocco", "Senegal", "Botswana",
  "Zambia", "Zimbabwe", "Mozambique", "Other",
];

const INTEREST_OPTIONS = [
  { value: "forecast", label: "Forecast Arena" },
  { value: "reports", label: "Buy Reports" },
  { value: "insights", label: "Insights & Analysis" },
  { value: "other", label: "Other" },
];

const RegistrationModal = ({ open, onOpenChange, onSuccess, onSwitchToLogin }: RegistrationModalProps) => {
  const { toast } = useToast();
  const [step, setStep] = useState<"form" | "otp">("form");
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");

  // Form fields
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [sex, setSex] = useState("");
  const [ageBracket, setAgeBracket] = useState("");
  const [phone, setPhone] = useState("");
  const [countryCode, setCountryCode] = useState("+254");
  const [country, setCountry] = useState("Kenya");
  const [occupation, setOccupation] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const toggleInterest = (value: string) => {
    setInterests(prev => prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !username.trim() || !email.trim() || !password || !phone.trim()) {
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

      // Sign up with Supabase Auth
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            username: username.trim().toLowerCase(),
            phone: `${countryCode}${phone.trim()}`,
            country,
            sex,
            age_bracket: ageBracket,
            occupation,
            interests,
            voter_fingerprint: fp,
          },
        },
      });

      if (signUpError) throw signUpError;

      if (signUpData.user && !signUpData.session) {
        // Email confirmation required — show OTP entry
        setRegisteredEmail(email.trim());
        setStep("otp");
        toast({ title: "Check your email!", description: "We've sent a 6-digit verification code to your email." });
      } else if (signUpData.user && signUpData.session) {
        // Auto-confirmed (shouldn't happen with our config)
        await createProfile(signUpData.user.id, fp);
        handleSuccess();
      }
    } catch (err: any) {
      const msg = err.message || "Registration failed. Please try again.";
      toast({ title: "Registration Error", description: msg, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const createProfile = async (userId: string, fp: string) => {
    await supabase.from("user_profiles").insert({
      user_id: userId,
      username: username.trim().toLowerCase(),
      full_name: fullName.trim(),
      sex: sex || null,
      age_bracket: ageBracket || null,
      phone: `${countryCode}${phone.trim()}`,
      country,
      occupation: occupation || null,
      interests: interests,
      voter_fingerprint: fp,
    });

    // Also update legacy voter_profiles for backward compatibility
    await supabase.from("voter_profiles").upsert({
      voter_fingerprint: fp,
      email: email.trim(),
      full_name: fullName.trim(),
      phone_number: phone.trim(),
      country_code: countryCode,
      updated_at: new Date().toISOString(),
    }, { onConflict: "voter_fingerprint" });

    // Store in localStorage for backward compatibility
    localStorage.setItem("forecast_participant", JSON.stringify({
      fullName: fullName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      countryCode,
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
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-primary" />
            Create Your Account
          </DialogTitle>
          <DialogDescription>
            Join Forecast Arena to submit predictions, track your accuracy, and earn rewards.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3 pt-1">
          {/* Full Name & Username */}
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

          {/* Email */}
          <div className="space-y-1">
            <Label className="text-xs font-medium">Email Address *</Label>
            <Input type="email" placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>

          {/* Password */}
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

          {/* Sex & Age */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-medium">Sex</Label>
              <Select value={sex} onValueChange={setSex}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-medium">Age Bracket</Label>
              <Select value={ageBracket} onValueChange={setAgeBracket}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {AGE_BRACKETS.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Phone */}
          <div className="space-y-1">
            <Label className="text-xs font-medium">Phone Number *</Label>
            <div className="flex gap-2">
              <Input type="text" value={countryCode} onChange={(e) => setCountryCode(e.target.value)}
                className="w-20 font-mono text-center" placeholder="+254" />
              <Input type="tel" placeholder="712345678" value={phone}
                onChange={(e) => setPhone(e.target.value)} className="flex-1" required />
            </div>
          </div>

          {/* Country */}
          <div className="space-y-1">
            <Label className="text-xs font-medium">Country</Label>
            <Select value={country} onValueChange={setCountry}>
              <SelectTrigger><SelectValue placeholder="Select country" /></SelectTrigger>
              <SelectContent>
                {COUNTRIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Occupation */}
          <div className="space-y-1">
            <Label className="text-xs font-medium">Occupation</Label>
            <Select value={occupation} onValueChange={setOccupation}>
              <SelectTrigger><SelectValue placeholder="Select occupation" /></SelectTrigger>
              <SelectContent>
                {OCCUPATIONS.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Interests */}
          <div className="space-y-1">
            <Label className="text-xs font-medium">What interests you?</Label>
            <div className="flex flex-wrap gap-2">
              {INTEREST_OPTIONS.map((opt) => (
                <button key={opt.value} type="button"
                  onClick={() => toggleInterest(opt.value)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                    interests.includes(opt.value)
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card text-foreground border-border hover:border-primary/40"
                  }`}>
                  {opt.label}
                </button>
              ))}
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
              and understand that Forecast Arena is an economic intelligence platform for research purposes.
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
      </DialogContent>
    </Dialog>
  );
};

export default RegistrationModal;
