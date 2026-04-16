import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Phone } from "lucide-react";
import { ALL_COUNTRIES } from "@/data/countries";

interface PhoneCollectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const PhoneCollectionModal = ({ open, onOpenChange, onSuccess }: PhoneCollectionModalProps) => {
  const { toast } = useToast();
  const { user, profile, refreshProfile } = useAuth();
  const [countryCode, setCountryCode] = useState("+254");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState(profile?.country || "Kenya");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) {
      toast({ title: "Please enter your phone number", variant: "destructive" });
      return;
    }
    if (!country) {
      toast({ title: "Please select your country", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const fullPhone = `${countryCode}${phone.trim()}`;
      const { error } = await supabase
        .from("user_profiles")
        .update({ phone: fullPhone, country })
        .eq("user_id", user!.id);

      if (error) throw error;

      await refreshProfile();
      toast({ title: "Details saved!" });
      onOpenChange(false);
      onSuccess();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <Phone className="w-5 h-5 text-primary" />
            Complete Your Details
          </DialogTitle>
          <DialogDescription>
            We need your phone number and country for payouts when your forecasts are correct.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Country</Label>
            <Select value={country} onValueChange={setCountry}>
              <SelectTrigger><SelectValue placeholder="Select country" /></SelectTrigger>
              <SelectContent className="max-h-60">
                {ALL_COUNTRIES.map(c => (
                  <SelectItem key={c.name} value={c.name}>
                    {c.flag ? `${c.flag} ${c.name}` : c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="flex-1"
                required
              />
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={loading || !country} size="lg">
            {loading ? "Saving..." : "Save & Continue"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PhoneCollectionModal;
